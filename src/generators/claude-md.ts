import * as path from "path";
import pc from "picocolors";
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
export async function generateClaudeMd(options: GenerateClaudeMdOptions): Promise<GenerateResult> {
  const { projectRoot, model = "sonnet", force = false, verbose = false } = options;

  // Output paths
  const agentsMdPath = path.join(projectRoot, "AGENTS.md");
  const claudeMdPath = path.join(projectRoot, "CLAUDE.md");

  // Check if AGENTS.md already exists
  if (!force && (await exists(agentsMdPath))) {
    return {
      success: false,
      error: `AGENTS.md already exists at ${agentsMdPath}. Use --force to overwrite.`,
    };
  }

  const spinner = createSpinner();

  if (!verbose) {
    spinner.start("Scanning project...");
  } else {
    console.log(pc.dim("→ Scanning project...\n"));
  }

  // Get project context
  const projectContext = await getProjectContext(projectRoot);

  if (!verbose) {
    spinner.update("Weaving golden threads of documentation...");
  } else {
    console.log(pc.dim("→ Running Claude...\n"));
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

  if (!response.success || !response.result) {
    if (!verbose) {
      spinner?.fail("Failed to generate AGENTS.md");
    }
    return {
      success: false,
      error: response.error || "Failed to generate AGENTS.md",
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

  // Write AGENTS.md (primary documentation)
  await writeFile(agentsMdPath, content);
  if (!verbose) {
    spinner.succeed(`Generated: ${agentsMdPath}`);
  } else {
    console.log(`\n${pc.green("✓")} Generated: ${agentsMdPath}`);
  }

  // Write CLAUDE.md (reference to AGENTS.md)
  await writeFile(claudeMdPath, CLAUDE_MD_REFERENCE);
  console.log(`${pc.green("✓")} Generated: ${claudeMdPath} (references AGENTS.md)`);

  return {
    success: true,
    outputPath: agentsMdPath,
    content,
  };
}
