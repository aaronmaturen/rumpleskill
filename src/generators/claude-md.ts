import * as path from "path";
import { buildClaudeMdPrompt } from "../prompts/claude-md.js";
import { runClaudeWithFiles, ClaudeOptions } from "../utils/claude.js";
import { getProjectContext, writeFile, exists } from "../utils/fs.js";

export interface GenerateClaudeMdOptions {
  projectRoot: string;
  outputPath?: string;
  model?: ClaudeOptions["model"];
  force?: boolean;
}

export interface GenerateResult {
  success: boolean;
  outputPath?: string;
  content?: string;
  error?: string;
}

/**
 * Generate CLAUDE.md for a project
 */
export async function generateClaudeMd(
  options: GenerateClaudeMdOptions
): Promise<GenerateResult> {
  const { projectRoot, model = "sonnet", force = false } = options;

  // Default output path
  const outputPath = options.outputPath || path.join(projectRoot, "CLAUDE.md");

  // Check if file already exists
  if (!force && await exists(outputPath)) {
    return {
      success: false,
      error: `CLAUDE.md already exists at ${outputPath}. Use --force to overwrite.`
    };
  }

  console.log("Scanning project...");

  // Get project context
  const projectContext = await getProjectContext(projectRoot);

  console.log("Generating CLAUDE.md with Claude...");

  // Build prompt
  const prompt = buildClaudeMdPrompt(projectContext);

  // Run Claude
  const response = await runClaudeWithFiles(prompt, {
    model,
    cwd: projectRoot,
    maxTurns: 10,
  });

  if (!response.success || !response.result) {
    return {
      success: false,
      error: response.error || "Failed to generate CLAUDE.md"
    };
  }

  // Clean up the response (remove any markdown code block wrappers)
  let content = response.result;
  if (content.startsWith("```markdown")) {
    content = content.slice(11);
  }
  if (content.startsWith("```")) {
    content = content.slice(3);
  }
  if (content.endsWith("```")) {
    content = content.slice(0, -3);
  }
  content = content.trim();

  // Write the file
  await writeFile(outputPath, content);

  console.log(`Generated: ${outputPath}`);

  return {
    success: true,
    outputPath,
    content
  };
}
