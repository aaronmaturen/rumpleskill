#!/usr/bin/env node

import * as path from "path";
import pc from "picocolors";
import { checkClaudeInstalled, checkClaudeAuth } from "./utils/claude.js";
import { generateClaudeMd } from "./generators/claude-md.js";
import { generateSkills, detectSkills } from "./generators/skills.js";
import { readFile } from "./utils/fs.js";
import { createSpinner } from "./utils/spinner.js";
import { ALL_AGENT_IDS, parseAgentIds } from "./config/agents.js";
import type { AgentId, InstallMode } from "./types/agents.js";

const HELP = `
rumpleskill - Spin your codebase into golden Claude Code skills

USAGE:
  rumpleskill [command] [options]

COMMANDS:
  (none)        Generate everything (default)
  agents        Generate AGENTS.md + CLAUDE.md documentation only
  skills        Generate skill files based on AGENTS.md only
  detect        Detect skills without generating (dry run)

OPTIONS:
  --project, -p <path>   Project root (default: current directory)
  --model, -m <model>    Claude model: sonnet, haiku, opus (default: sonnet)
  --force, -f            Overwrite existing files
  --verbose, -v          Show Claude's output in real-time
  --agents, -a <list>    Target agents (comma-separated)
  --all-agents           Install to all 12 supported agents
  --copy                 Copy files instead of symlinking
  --help, -h             Show this help

SUPPORTED AGENTS:
  claude-code, cursor, cline, windsurf, codex, opencode,
  github-copilot, continue, roo, amp, gemini-cli, goose

EXAMPLES:
  rumpleskill                           Generate everything
  rumpleskill agents                    Generate AGENTS.md + CLAUDE.md only
  rumpleskill skills                    Generate skills for claude-code (default)
  rumpleskill skills -a cursor,cline    Generate skills for Cursor and Cline
  rumpleskill skills --all-agents       Generate skills for all 12 agents
  rumpleskill --all-agents              Generate everything + install to all agents
  rumpleskill skills --all-agents --copy  Copy instead of symlink
  rumpleskill -v                        Generate with verbose output
  rumpleskill detect                    Show which skills would be generated
`;

interface Options {
  command: string;
  projectRoot: string;
  model: "sonnet" | "haiku" | "opus";
  force: boolean;
  verbose: boolean;
  agents: AgentId[];
  allAgents: boolean;
  installMode: InstallMode;
}

function parseArgs(args: string[]): Options | null {
  const options: Options = {
    command: "",
    projectRoot: process.cwd(),
    model: "sonnet",
    force: false,
    verbose: false,
    agents: [],
    allAgents: false,
    installMode: "symlink",
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
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--agents" || arg === "-a") {
      const agentList = args[++i];
      if (!agentList) {
        console.error("--agents requires a comma-separated list of agent IDs");
        return null;
      }
      try {
        options.agents = parseAgentIds(agentList);
      } catch (err) {
        console.error((err as Error).message);
        return null;
      }
    } else if (arg === "--all-agents") {
      options.allAgents = true;
    } else if (arg === "--copy") {
      options.installMode = "copy";
    } else if (!arg.startsWith("-") && !options.command) {
      options.command = arg;
    }

    i++;
  }

  return options;
}

/**
 * Resolve target agents based on CLI options
 */
function resolveTargetAgents(options: Options): AgentId[] {
  if (options.allAgents) {
    return ALL_AGENT_IDS;
  }
  if (options.agents.length > 0) {
    return options.agents;
  }
  // Default to claude-code only
  return ["claude-code"];
}

async function main() {
  const args = process.argv.slice(2);

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

  const targetAgents = resolveTargetAgents(options);
  const agentDisplay = options.allAgents ? "all agents" : targetAgents.join(", ");

  console.log(`\n${pc.dim(`Project: ${options.projectRoot}`)}`);
  console.log(pc.dim(`Model: ${options.model}${options.verbose ? " (verbose)" : ""}`));
  if (options.command === "skills" || options.command === "") {
    console.log(pc.dim(`Agents: ${agentDisplay}${options.installMode === "copy" ? " (copy)" : ""}`));
  }
  console.log();

  switch (options.command) {
    // Default: run agents first, then skills (skills depend on AGENTS.md)
    case "": {
      console.log(`${pc.bold("=== Generating ===")}\n`);

      // Step 1: Generate AGENTS.md (skills depend on this)
      const agentsResult = await generateClaudeMd({
        projectRoot: options.projectRoot,
        model: options.model,
        force: options.force,
        verbose: options.verbose,
      });

      if (!agentsResult.success) {
        console.log(`${pc.red("✗")} agents failed: ${agentsResult.error}`);
        process.exit(1);
      }

      // Step 2: Generate skills (individual skills generated in parallel)
      const skillsResult = await generateSkills({
        projectRoot: options.projectRoot,
        model: options.model,
        verbose: options.verbose,
        agents: targetAgents,
        installMode: options.installMode,
      });

      if (skillsResult.success) {
        console.log(`\n${pc.green("✨ Done!")} Your codebase has been spun into gold.`);
        console.log(`   Generated AGENTS.md, CLAUDE.md, and ${skillsResult.generated?.length || 0} skills.`);
      } else {
        console.log(`${pc.red("✗")} skills failed: ${skillsResult.error}`);
        process.exit(1);
      }
      break;
    }

    case "agents": {
      const result = await generateClaudeMd({
        projectRoot: options.projectRoot,
        model: options.model,
        force: options.force,
        verbose: options.verbose,
      });

      if (!result.success) {
        console.error(`\n${pc.red("Error:")}`, result.error);
        process.exit(1);
      }

      console.log(`\n${pc.green("✨ Done!")} Straw successfully spun into gold.`);
      break;
    }

    case "skills": {
      const result = await generateSkills({
        projectRoot: options.projectRoot,
        model: options.model,
        verbose: options.verbose,
        agents: targetAgents,
        installMode: options.installMode,
      });

      if (!result.success) {
        console.error(`\n${pc.red("Error:")}`, result.error);
        process.exit(1);
      }

      console.log(`\n${pc.green("✨ Done!")} Generated ${result.generated?.length || 0} golden skills.`);
      break;
    }

    case "detect": {
      const agentsMdPath = path.join(options.projectRoot, "AGENTS.md");
      const content = await readFile(agentsMdPath);

      if (!content) {
        console.error(`${pc.red("Error:")} AGENTS.md not found at ${agentsMdPath}`);
        console.error("Run 'rumpleskill agents' first.");
        process.exit(1);
      }

      const detectSpinner = createSpinner();
      detectSpinner.start("Detecting skills...");

      const skills = await detectSkills(content, "haiku");

      if (skills.length === 0) {
        detectSpinner.fail("No skills detected");
      } else {
        detectSpinner.succeed(`Found ${skills.length} skills`);
        console.log(`\n${pc.bold("Skills that would be generated:")}\n`);
        for (const skill of skills) {
          console.log(`  ${pc.yellow("•")} ${pc.bold(skill.name)}`);
          console.log(`    ${pc.dim(skill.description)}\n`);
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
