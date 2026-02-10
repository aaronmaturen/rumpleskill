#!/usr/bin/env node

import * as path from "path";
import { checkClaudeInstalled, checkClaudeAuth } from "./utils/claude.js";
import { generateClaudeMd } from "./generators/claude-md.js";
import { generateSkills, detectSkills } from "./generators/skills.js";
import { readFile } from "./utils/fs.js";
import { createSpinner } from "./utils/spinner.js";

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
  const spinner = createSpinner();
  spinner.start("Checking Claude Code CLI...");

  const installed = await checkClaudeInstalled();
  if (!installed) {
    spinner.fail("Claude Code CLI not found");
    console.error("Install it from: https://claude.ai/code");
    process.exit(1);
  }

  const authenticated = await checkClaudeAuth();
  if (!authenticated) {
    spinner.fail("Claude Code CLI not authenticated");
    console.error("Run: claude login");
    process.exit(1);
  }

  spinner.succeed("Claude Code CLI ready");
  console.log(`\n\x1b[90mProject: ${options.projectRoot}\x1b[0m`);
  console.log(`\x1b[90mModel: ${options.model}\x1b[0m\n`);

  switch (options.command) {
    case "claude-md": {
      const result = await generateClaudeMd({
        projectRoot: options.projectRoot,
        model: options.model,
        force: options.force,
      });

      if (!result.success) {
        console.error("\n\x1b[31mError:\x1b[0m", result.error);
        process.exit(1);
      }

      console.log("\n\x1b[32m✨ Done!\x1b[0m Straw successfully spun into gold.");
      break;
    }

    case "skills": {
      const result = await generateSkills({
        projectRoot: options.projectRoot,
        model: options.model,
      });

      if (!result.success) {
        console.error("\n\x1b[31mError:\x1b[0m", result.error);
        process.exit(1);
      }

      console.log(`\n\x1b[32m✨ Done!\x1b[0m Generated ${result.generated?.length || 0} golden skills.`);
      break;
    }

    case "all": {
      console.log("\x1b[1m=== Step 1: Spinning Documentation ===\x1b[0m\n");

      const claudeMdResult = await generateClaudeMd({
        projectRoot: options.projectRoot,
        model: options.model,
        force: options.force,
      });

      if (!claudeMdResult.success) {
        console.error("\n\x1b[31mError:\x1b[0m", claudeMdResult.error);
        process.exit(1);
      }

      console.log("\n\x1b[1m=== Step 2: Spinning Skills ===\x1b[0m\n");

      const skillsResult = await generateSkills({
        projectRoot: options.projectRoot,
        model: options.model,
      });

      if (!skillsResult.success) {
        console.error("\n\x1b[33mWarning:\x1b[0m", skillsResult.error);
      }

      console.log("\n\x1b[32m✨ Done!\x1b[0m Your codebase has been spun into gold.");
      console.log(`   Generated AGENTS.md, CLAUDE.md, and ${skillsResult.generated?.length || 0} skills.`);
      break;
    }

    case "detect": {
      const agentsMdPath = path.join(options.projectRoot, "AGENTS.md");
      const content = await readFile(agentsMdPath);

      if (!content) {
        console.error(`\x1b[31mError:\x1b[0m AGENTS.md not found at ${agentsMdPath}`);
        console.error("Run 'rumpleskill claude-md' first.");
        process.exit(1);
      }

      const detectSpinner = createSpinner();
      detectSpinner.start("Detecting skills...");

      const skills = await detectSkills(content, "haiku");

      if (skills.length === 0) {
        detectSpinner.fail("No skills detected");
      } else {
        detectSpinner.succeed(`Found ${skills.length} skills`);
        console.log("\n\x1b[1mSkills that would be generated:\x1b[0m\n");
        for (const skill of skills) {
          console.log(`  \x1b[33m•\x1b[0m \x1b[1m${skill.name}\x1b[0m`);
          console.log(`    \x1b[90m${skill.description}\x1b[0m\n`);
        }
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
