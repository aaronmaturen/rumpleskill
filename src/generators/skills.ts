import * as path from "path";
import pc from "picocolors";
import { buildDetectSkillsPrompt } from "../prompts/detect-skills.js";
import { buildGenerateSkillPrompt } from "../prompts/generate-skill.js";
import { runClaudeWithFiles, ClaudeOptions } from "../utils/claude.js";
import { readFile, writeFile, ensureCanonicalDir, createSymlink } from "../utils/fs.js";
import { createSpinner } from "../utils/spinner.js";
import { AGENT_REGISTRY, DEFAULT_AGENT } from "../config/agents.js";
import type { AgentId, InstallMode } from "../types/agents.js";

export interface Skill {
  name: string;
  description: string;
}

export interface GenerateSkillsOptions {
  projectRoot: string;
  agentsMdPath?: string;
  skills?: string[];  // Specific skills to generate, or detect automatically
  model?: ClaudeOptions["model"];
  verbose?: boolean;
  agents?: AgentId[];  // Target agents (default: claude-code)
  installMode?: InstallMode;  // symlink or copy (default: symlink)
}

export interface GenerateSkillsResult {
  success: boolean;
  skills?: Skill[];
  generated?: string[];
  error?: string;
}

/**
 * Detect which skills should be generated based on AGENTS.md
 */
export async function detectSkills(
  agentsMdContent: string,
  model: ClaudeOptions["model"] = "haiku",
  verbose = false
): Promise<Skill[]> {
  const prompt = buildDetectSkillsPrompt(agentsMdContent);

  const response = await runClaudeWithFiles(prompt, {
    model,
    maxTurns: 3,
    verbose,
  });

  if (!response.success || !response.result) {
    console.error("Failed to detect skills:", response.error);
    return [];
  }

  // Parse JSON response
  try {
    let jsonStr = response.result.trim();

    // Handle markdown code blocks
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }

    const skills = JSON.parse(jsonStr.trim());

    if (!Array.isArray(skills)) {
      console.error("Invalid skills response: not an array");
      return [];
    }

    return skills.filter(
      (s): s is Skill =>
        typeof s === "object" &&
        typeof s.name === "string" &&
        typeof s.description === "string"
    );
  } catch (e) {
    console.error("Failed to parse skills JSON:", e);
    return [];
  }
}

/**
 * Install a skill to multiple agent directories
 */
export async function installSkillToAgents(
  projectRoot: string,
  skillName: string,
  canonicalPath: string,
  agents: AgentId[],
  installMode: InstallMode
): Promise<void> {
  for (const agentId of agents) {
    const config = AGENT_REGISTRY[agentId];
    const agentSkillDir = path.join(projectRoot, config.localPath, skillName);

    // Skip if this is the canonical directory
    if (agentSkillDir === canonicalPath) {
      continue;
    }

    await createSymlink(canonicalPath, agentSkillDir, installMode);
  }
}

/**
 * Generate a single skill file
 */
export async function generateSkillFile(
  projectRoot: string,
  skill: Skill,
  agentsMdContent: string,
  options: {
    model?: ClaudeOptions["model"];
    verbose?: boolean;
    agents?: AgentId[];
    installMode?: InstallMode;
  } = {}
): Promise<{ success: boolean; path?: string; error?: string }> {
  const {
    model = "sonnet",
    verbose = false,
    agents = [DEFAULT_AGENT],
    installMode = "symlink",
  } = options;

  const prompt = buildGenerateSkillPrompt(
    skill.name,
    skill.description,
    agentsMdContent
  );

  const response = await runClaudeWithFiles(prompt, {
    model,
    cwd: projectRoot,
    maxTurns: 5,
    verbose,
  });

  if (!response.success || !response.result) {
    return {
      success: false,
      error: response.error || `Failed to generate skill: ${skill.name}`
    };
  }

  // Clean up response
  let content = response.result.trim();
  if (content.startsWith("```markdown") || content.startsWith("```yaml")) {
    content = content.slice(content.indexOf("\n") + 1);
  }
  if (content.startsWith("```")) {
    content = content.slice(3);
  }
  if (content.endsWith("```")) {
    content = content.slice(0, -3);
  }
  content = content.trim();

  // Determine if we need canonical directory (multi-agent)
  const useCanonical = agents.length > 1;

  let canonicalPath: string;
  let skillPath: string;

  if (useCanonical) {
    // Write to canonical .agents/skills/ directory
    const canonicalDir = await ensureCanonicalDir(projectRoot);
    canonicalPath = path.join(canonicalDir, skill.name);
    skillPath = path.join(canonicalPath, "SKILL.md");

    await writeFile(skillPath, content);

    // Install symlinks/copies to all agent directories
    await installSkillToAgents(projectRoot, skill.name, canonicalPath, agents, installMode);
  } else {
    // Single agent: write directly to that agent's directory
    const agentId = agents[0];
    const config = AGENT_REGISTRY[agentId];
    const agentDir = path.join(projectRoot, config.localPath);

    canonicalPath = path.join(agentDir, skill.name);
    skillPath = path.join(canonicalPath, "SKILL.md");

    await writeFile(skillPath, content);
  }

  return { success: true, path: skillPath };
}

/**
 * Generate all skills for a project
 */
export async function generateSkills(
  options: GenerateSkillsOptions
): Promise<GenerateSkillsResult> {
  const {
    projectRoot,
    model = "sonnet",
    verbose = false,
    agents = [DEFAULT_AGENT],
    installMode = "symlink",
  } = options;

  // Read AGENTS.md
  const agentsMdPath =
    options.agentsMdPath ||
    path.join(projectRoot, "AGENTS.md");

  const agentsMdContent = await readFile(agentsMdPath);

  if (!agentsMdContent) {
    return {
      success: false,
      error: `AGENTS.md not found at ${agentsMdPath}. Run 'rumpleskill agents' first.`
    };
  }

  const spinner = !verbose ? createSpinner() : null;

  if (!verbose) {
    spinner?.start("Detecting skills from AGENTS.md...");
  } else {
    console.log(pc.dim("→ Detecting skills...\n"));
  }

  // Detect or use provided skills
  let skills: Skill[];
  if (options.skills && options.skills.length > 0) {
    skills = options.skills.map(name => ({
      name,
      description: `Skill for ${name}`
    }));
    spinner?.succeed(`Using ${skills.length} specified skills`);
  } else {
    skills = await detectSkills(agentsMdContent, "haiku", verbose);
    if (skills.length > 0) {
      spinner?.succeed(`Detected ${skills.length} skills: ${skills.map(s => s.name).join(", ")}`);
      if (verbose) {
        console.log(`\n${pc.green("✓")} Detected ${skills.length} skills: ${skills.map(s => s.name).join(", ")}\n`);
      }
    }
  }

  if (skills.length === 0) {
    spinner?.fail("No skills detected");
    return {
      success: false,
      error: "No skills detected. Check your AGENTS.md content."
    };
  }

  // Log target agents
  if (agents.length > 1) {
    const agentNames = agents.map(id => AGENT_REGISTRY[id].displayName).join(", ");
    if (!verbose) {
      spinner?.succeed(`Target agents: ${agentNames}`);
    } else {
      console.log(pc.dim(`→ Target agents: ${agentNames}\n`));
    }
  }

  // Generate all skills in parallel
  if (!verbose) {
    spinner?.start(`Spinning ${skills.length} skills in parallel...`);
  } else {
    console.log(pc.dim(`→ Generating ${skills.length} skills in parallel...\n`));
  }

  const results = await Promise.all(
    skills.map((skill) =>
      generateSkillFile(projectRoot, skill, agentsMdContent, {
        model,
        verbose,
        agents,
        installMode,
      }).then((result) => ({ skill, result }))
    )
  );

  const generated: string[] = [];
  const errors: string[] = [];

  for (const { skill, result } of results) {
    if (result.success && result.path) {
      generated.push(result.path);
      const installInfo = agents.length > 1 ? ` (installed to ${agents.length} agents)` : "";
      if (!verbose) {
        spinner?.succeed(`Created: ${skill.name}${installInfo}`);
      } else {
        console.log(`${pc.green("✓")} Created: ${skill.name}${installInfo}`);
      }
    } else {
      errors.push(`${skill.name}: ${result.error}`);
      if (!verbose) {
        spinner?.fail(`Failed: ${skill.name}`);
      } else {
        console.log(`${pc.red("✗")} Failed: ${skill.name}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    skills,
    generated,
    error: errors.length > 0 ? errors.join("\n") : undefined
  };
}
