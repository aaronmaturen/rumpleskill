import * as path from "path";
import { buildClaudeMdPrompt } from "../prompts/claude-md.js";
import { runClaudeWithFiles, ClaudeOptions } from "../utils/claude.js";
import { getProjectContext, writeFile, exists } from "../utils/fs.js";
import { createSpinner } from "../utils/spinner.js";

export interface GenerateClaudeMdOptions {
  projectRoot: string;
  outputPath?: string;
  model?: ClaudeOptions["model"];
  force?: boolean;
  verbose?: boolean;
}

export interface GenerateResult {
  success: boolean;
  outputPath?: string;
  content?: string;
  error?: string;
}

const CLAUDE_MD_REFERENCE = `# CLAUDE.md

See [AGENTS.md](AGENTS.md) for project documentation and conventions.
`;

/**
 * Generate AGENTS.md (primary) and CLAUDE.md (reference) for a project
 */
export async function generateClaudeMd(
  options: GenerateClaudeMdOptions
): Promise<GenerateResult> {
  const { projectRoot, model = "sonnet", force = false, verbose = false } = options;

  // Output paths
  const agentsMdPath = path.join(projectRoot, "AGENTS.md");
  const claudeMdPath = path.join(projectRoot, "CLAUDE.md");

  // Check if AGENTS.md already exists
  if (!force && await exists(agentsMdPath)) {
    return {
      success: false,
      error: `AGENTS.md already exists at ${agentsMdPath}. Use --force to overwrite.`
    };
  }

  const spinner = createSpinner();

  if (!verbose) {
    spinner.start("Scanning project...");
  } else {
    console.log("\x1b[90m→ Scanning project...\x1b[0m\n");
  }

  // Get project context
  const projectContext = await getProjectContext(projectRoot);

  if (!verbose) {
    spinner.update("Weaving golden threads of documentation...");
  } else {
    console.log("\x1b[90m→ Running Claude...\x1b[0m\n");
  }

  // Build prompt
  const prompt = buildClaudeMdPrompt(projectContext);

  // Run Claude
  const response = await runClaudeWithFiles(prompt, {
    model,
    cwd: projectRoot,
    maxTurns: 10,
    verbose,
  });

  if (!response.success) {
    if (!verbose) {
      spinner?.fail("Failed to generate AGENTS.md");
    }
    return {
      success: false,
      error: response.error || "Failed to generate AGENTS.md"
    };
  }

  // In verbose mode with inherited stdio, we need to read the result differently
  // For now, we'll need the user to pipe the output or we need a different approach
  let content = response.result || "";

  // If no content captured (verbose mode), we can't write the file
  if (!content && verbose) {
    console.log("\n\x1b[33mNote: In verbose mode, output is shown but not captured.\x1b[0m");
    console.log("\x1b[33mRun without -v to generate files.\x1b[0m");
    return {
      success: true,
      outputPath: agentsMdPath,
      content: ""
    };
  }

  if (!content) {
    return {
      success: false,
      error: "No content generated"
    };
  }
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

  // Write AGENTS.md (primary documentation)
  await writeFile(agentsMdPath, content);
  if (!verbose) {
    spinner.succeed(`Generated: ${agentsMdPath}`);
  } else {
    console.log(`\n\x1b[32m✓\x1b[0m Generated: ${agentsMdPath}`);
  }

  // Write CLAUDE.md (reference to AGENTS.md)
  await writeFile(claudeMdPath, CLAUDE_MD_REFERENCE);
  console.log(`\x1b[32m✓\x1b[0m Generated: ${claudeMdPath} (references AGENTS.md)`);

  return {
    success: true,
    outputPath: agentsMdPath,
    content
  };
}
