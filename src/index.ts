#!/usr/bin/env node

import * as path from "path";
import { checkClaudeInstalled, checkClaudeAuth } from "./utils/claude.js";
import { generateClaudeMd } from "./generators/claude-md.js";
import { generateSkills, detectSkills } from "./generators/skills.js";
import { readFile } from "./utils/fs.js";

const HELP = `
rumpleskill - Spin your codebase into golden Claude Code skills

USAGE:
  rumpleskill <command> [options]

COMMANDS:
  claude-md     Generate AGENTS.md + CLAUDE.md documentation
  skills        Generate skill files based on AGENTS.md
  all           Generate AGENTS.md, CLAUDE.md, and skills
  detect        Detect skills without generating (dry run)

OPTIONS:
  --project, -p <path>   Project root (default: current directory)
  --model, -m <model>    Claude model: sonnet, haiku, opus (default: sonnet)
  --force, -f            Overwrite existing files
  --help, -h             Show this help

EXAMPLES:
  rumpleskill claude-md                 Generate AGENTS.md + CLAUDE.md
  rumpleskill skills -p ./my-project    Generate skills for my-project
  rumpleskill all --model haiku         Generate everything using haiku model
  rumpleskill detect                    Show which skills would be generated
`;

interface Options {
  command: string;
  projectRoot: string;
  model: "sonnet" | "haiku" | "opus";
  force: boolean;
}

function parseArgs(args: string[]): Options | null {
  const options: Options = {
    command: "",
    projectRoot: process.cwd(),
    model: "sonnet",
    force: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      console.log(HELP);
      process.exit(0);
    }

    if (arg === "--project" || arg === "-p") {
      options.projectRoot = path.resolve(args[++i] || ".");
    } else if (arg === "--model" || arg === "-m") {
      const model = args[++i];
      if (model === "sonnet" || model === "haiku" || model === "opus") {
        options.model = model;
      } else {
        console.error(`Invalid model: ${model}. Use sonnet, haiku, or opus.`);
        return null;
      }
    } else if (arg === "--force" || arg === "-f") {
      options.force = true;
    } else if (!arg.startsWith("-") && !options.command) {
      options.command = arg;
    }

    i++;
  }

  return options;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(HELP);
    process.exit(0);
  }

  const options = parseArgs(args);
  if (!options) {
    process.exit(1);
  }

  // Check Claude CLI
  console.log("Checking Claude Code CLI...");

  const installed = await checkClaudeInstalled();
  if (!installed) {
    console.error("Error: Claude Code CLI not found.");
    console.error("Install it from: https://claude.ai/code");
    process.exit(1);
  }

  const authenticated = await checkClaudeAuth();
  if (!authenticated) {
    console.error("Error: Claude Code CLI not authenticated.");
    console.error("Run: claude login");
    process.exit(1);
  }

  console.log(`Project: ${options.projectRoot}`);
  console.log(`Model: ${options.model}`);
  console.log("");

  switch (options.command) {
    case "claude-md": {
      const result = await generateClaudeMd({
        projectRoot: options.projectRoot,
        model: options.model,
        force: options.force,
      });

      if (!result.success) {
        console.error("Error:", result.error);
        process.exit(1);
      }

      console.log("\nDone! AGENTS.md + CLAUDE.md generated successfully.");
      break;
    }

    case "skills": {
      const result = await generateSkills({
        projectRoot: options.projectRoot,
        model: options.model,
      });

      if (!result.success) {
        console.error("Error:", result.error);
        process.exit(1);
      }

      console.log(`\nDone! Generated ${result.generated?.length || 0} skills.`);
      break;
    }

    case "all": {
      // Generate AGENTS.md + CLAUDE.md first
      console.log("=== Step 1: Generating AGENTS.md + CLAUDE.md ===\n");

      const claudeMdResult = await generateClaudeMd({
        projectRoot: options.projectRoot,
        model: options.model,
        force: options.force,
      });

      if (!claudeMdResult.success) {
        console.error("Error:", claudeMdResult.error);
        process.exit(1);
      }

      // Then generate skills
      console.log("\n=== Step 2: Generating Skills ===\n");

      const skillsResult = await generateSkills({
        projectRoot: options.projectRoot,
        model: options.model,
      });

      if (!skillsResult.success) {
        console.error("Warning:", skillsResult.error);
      }

      console.log("\nDone! Generated AGENTS.md, CLAUDE.md, and skills.");
      break;
    }

    case "detect": {
      const agentsMdPath = path.join(options.projectRoot, "AGENTS.md");
      const content = await readFile(agentsMdPath);

      if (!content) {
        console.error(`AGENTS.md not found at ${agentsMdPath}`);
        console.error("Run 'rumpleskill claude-md' first.");
        process.exit(1);
      }

      console.log("Detecting skills...\n");

      const skills = await detectSkills(content, "haiku");

      if (skills.length === 0) {
        console.log("No skills detected.");
      } else {
        console.log("Skills that would be generated:\n");
        for (const skill of skills) {
          console.log(`  - ${skill.name}: ${skill.description}`);
        }
        console.log(`\nTotal: ${skills.length} skills`);
      }
      break;
    }

    default:
      console.error(`Unknown command: ${options.command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
