import * as path from "path";
import { buildDetectSkillsPrompt } from "../prompts/detect-skills.js";
import { buildGenerateSkillPrompt } from "../prompts/generate-skill.js";
import { runClaudeWithFiles, ClaudeOptions } from "../utils/claude.js";
import { readFile, writeFile, ensureClaudeDir } from "../utils/fs.js";

export interface Skill {
  name: string;
  description: string;
}

export interface GenerateSkillsOptions {
  projectRoot: string;
  agentsMdPath?: string;
  skills?: string[];  // Specific skills to generate, or detect automatically
  model?: ClaudeOptions["model"];
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
  model: ClaudeOptions["model"] = "haiku"
): Promise<Skill[]> {
  const prompt = buildDetectSkillsPrompt(agentsMdContent);

  const response = await runClaudeWithFiles(prompt, {
    model,
    maxTurns: 3,
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
  model: ClaudeOptions["model"] = "sonnet"
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
  const { projectRoot, model = "sonnet" } = options;

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

  console.log("Detecting skills from AGENTS.md...");

  // Detect or use provided skills
  let skills: Skill[];
  if (options.skills && options.skills.length > 0) {
    skills = options.skills.map(name => ({
      name,
      description: `Skill for ${name}`
    }));
  } else {
    skills = await detectSkills(agentsMdContent, "haiku");
  }

  if (skills.length === 0) {
    return {
      success: false,
      error: "No skills detected. Check your AGENTS.md content."
    };
  }

  console.log(`Detected ${skills.length} skills: ${skills.map(s => s.name).join(", ")}`);

  // Generate each skill
  const generated: string[] = [];
  const errors: string[] = [];

  for (const skill of skills) {
    console.log(`Generating skill: ${skill.name}...`);

    const result = await generateSkillFile(
      projectRoot,
      skill,
      agentsMdContent,
      model
    );

    if (result.success && result.path) {
      generated.push(result.path);
      console.log(`  Created: ${result.path}`);
    } else {
      errors.push(`${skill.name}: ${result.error}`);
      console.error(`  Failed: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    skills,
    generated,
    error: errors.length > 0 ? errors.join("\n") : undefined
  };
}
