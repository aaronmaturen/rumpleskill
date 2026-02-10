import * as path from "path";
import { buildDetectSkillsPrompt } from "../prompts/detect-skills.js";
import { buildGenerateSkillPrompt } from "../prompts/generate-skill.js";
import { runClaudeWithFiles, ClaudeOptions } from "../utils/claude.js";
import { readFile, writeFile, ensureClaudeDir } from "../utils/fs.js";
import { createSpinner } from "../utils/spinner.js";

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
 * Generate a single skill file
 */
export async function generateSkillFile(
  projectRoot: string,
  skill: Skill,
  agentsMdContent: string,
  model: ClaudeOptions["model"] = "sonnet",
  verbose = false
): Promise<{ success: boolean; path?: string; error?: string }> {
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

  // Write skill file
  const claudeDir = await ensureClaudeDir(projectRoot);
  const skillDir = path.join(claudeDir, "skills", skill.name);
  const skillPath = path.join(skillDir, "SKILL.md");

  await writeFile(skillPath, content);

  return { success: true, path: skillPath };
}

/**
 * Generate all skills for a project
 */
export async function generateSkills(
  options: GenerateSkillsOptions
): Promise<GenerateSkillsResult> {
  const { projectRoot, model = "sonnet", verbose = false } = options;

  // Read AGENTS.md
  const agentsMdPath =
    options.agentsMdPath ||
    path.join(projectRoot, "AGENTS.md");

  const agentsMdContent = await readFile(agentsMdPath);

  if (!agentsMdContent) {
    return {
      success: false,
      error: `AGENTS.md not found at ${agentsMdPath}. Run 'rumpleskill claude-md' first.`
    };
  }

  const spinner = !verbose ? createSpinner() : null;

  if (!verbose) {
    spinner?.start("Detecting skills from AGENTS.md...");
  } else {
    console.log("\x1b[90m→ Detecting skills...\x1b[0m\n");
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
        console.log(`\n\x1b[32m✓\x1b[0m Detected ${skills.length} skills: ${skills.map(s => s.name).join(", ")}\n`);
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

  // Generate each skill
  const generated: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];

    if (!verbose) {
      spinner?.start(`Spinning skill ${i + 1}/${skills.length}: ${skill.name}...`);
    } else {
      console.log(`\x1b[90m→ Generating skill ${i + 1}/${skills.length}: ${skill.name}...\x1b[0m\n`);
    }

    const result = await generateSkillFile(
      projectRoot,
      skill,
      agentsMdContent,
      model,
      verbose
    );

    if (result.success && result.path) {
      generated.push(result.path);
      if (!verbose) {
        spinner?.succeed(`Created: ${skill.name}`);
      } else {
        console.log(`\n\x1b[32m✓\x1b[0m Created: ${skill.name}\n`);
      }
    } else {
      errors.push(`${skill.name}: ${result.error}`);
      if (!verbose) {
        spinner?.fail(`Failed: ${skill.name}`);
      } else {
        console.log(`\n\x1b[31m✗\x1b[0m Failed: ${skill.name}\n`);
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
