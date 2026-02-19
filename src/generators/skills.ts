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
  skills?: string[]; // Specific skills to generate, or detect automatically
  model?: ClaudeOptions["model"];
  verbose?: boolean;
  agents?: AgentId[]; // Target agents (default: claude-code)
  installMode?: InstallMode; // symlink or copy (default: symlink)
}

export interface GenerateSkillsResult {
  success: boolean;
  skills?: Skill[];
  generated?: string[];
  error?: string;
}

/**
 * Parse the ## Technologies section from AGENTS.md directly
 * Returns null if section not found or empty
 */
function parseTechnologiesSection(agentsMdContent: string): string[] | null {
  // Look for ## Technologies section
  const techMatch = agentsMdContent.match(/^## Technologies\s*\n([\s\S]*?)(?=^## |\n*$)/m);
  if (!techMatch) {
    return null;
  }

  const techSection = techMatch[1];
  const technologies: string[] = [];

  // Parse lines that start with "- "
  const lines = techSection.split("\n");
  for (const line of lines) {
    const match = line.match(/^- ([a-z0-9-]+)\s*$/);
    if (match) {
      technologies.push(match[1]);
    }
  }

  return technologies.length > 0 ? technologies : null;
}

/**
 * Generate a description for a technology name
 */
function generateSkillDescription(name: string): string {
  const descriptions: Record<string, string> = {
    typescript:
      "This skill should be used when the user asks to 'add types', 'fix type errors', 'create interfaces', 'improve type safety', or 'configure TypeScript'. Provides TypeScript strict mode patterns and ESM configuration for Node.js projects.",
    react:
      "This skill should be used when the user asks to 'create a component', 'add a hook', 'manage state', or 'handle events'. Guides React component architecture and patterns.",
    nextjs:
      "This skill should be used when the user asks to 'add a page', 'create an API route', 'configure middleware', or 'optimize performance'. Covers Next.js App Router patterns.",
    vue: "This skill should be used when the user asks to 'create a component', 'add composables', 'manage state', or 'handle events'. Guides Vue component architecture and Composition API patterns.",
    nuxt: "This skill should be used when the user asks to 'add a page', 'create an API route', 'configure middleware', or 'use Nuxt modules'. Covers Nuxt 3 patterns.",
    angular:
      "This skill should be used when the user asks to 'create a component', 'add a service', 'configure routing', or 'handle forms'. Guides Angular architecture and patterns.",
    svelte:
      "This skill should be used when the user asks to 'create a component', 'add stores', 'handle events', or 'manage state'. Guides Svelte component patterns.",
    sveltekit:
      "This skill should be used when the user asks to 'add a route', 'create endpoints', 'handle forms', or 'configure load functions'. Covers SvelteKit patterns.",
    prisma:
      "This skill should be used when the user asks to 'add a model', 'create a migration', 'write a query', or 'seed the database'. Defines Prisma schema and query patterns.",
    drizzle:
      "This skill should be used when the user asks to 'add a schema', 'create a migration', 'write a query', or 'configure the database'. Covers Drizzle ORM patterns.",
    "tanstack-query":
      "This skill should be used when the user asks to 'fetch data', 'cache responses', 'handle loading states', or 'invalidate queries'. Guides data fetching patterns.",
    zustand:
      "This skill should be used when the user asks to 'add global state', 'create a store', 'persist state', or 'manage client state'. Covers Zustand state management.",
    redux:
      "This skill should be used when the user asks to 'add state management', 'create slices', 'handle async actions', or 'configure the store'. Covers Redux Toolkit patterns.",
    tailwind:
      "This skill should be used when the user asks to 'style a component', 'add responsive design', 'create a layout', or 'use design tokens'. Provides Tailwind CSS patterns.",
    vitest:
      "This skill should be used when the user asks to 'write tests', 'add test coverage', 'mock dependencies', or 'debug failing tests'. Covers testing patterns and strategies.",
    jest: "This skill should be used when the user asks to 'write tests', 'add test coverage', 'mock modules', or 'configure Jest'. Covers Jest testing patterns.",
    playwright:
      "This skill should be used when the user asks to 'write E2E tests', 'test user flows', 'add browser tests', or 'debug test failures'. Covers Playwright testing patterns.",
    cypress:
      "This skill should be used when the user asks to 'write E2E tests', 'test user interactions', 'add component tests', or 'debug test failures'. Covers Cypress testing patterns.",
    docker:
      "This skill should be used when the user asks to 'containerize the app', 'create a Dockerfile', 'configure docker-compose', or 'optimize builds'. Guides container best practices.",
    express:
      "This skill should be used when the user asks to 'add a route', 'create middleware', 'handle requests', or 'configure the server'. Covers Express.js patterns.",
    fastify:
      "This skill should be used when the user asks to 'add a route', 'create plugins', 'handle requests', or 'configure schemas'. Covers Fastify patterns.",
    hono: "This skill should be used when the user asks to 'add a route', 'create middleware', 'handle requests', or 'deploy to edge'. Covers Hono patterns.",
    nestjs:
      "This skill should be used when the user asks to 'add a module', 'create a controller', 'add a service', or 'configure dependency injection'. Covers NestJS architecture.",
    trpc: "This skill should be used when the user asks to 'add a procedure', 'create a router', 'handle mutations', or 'configure the client'. Covers tRPC patterns.",
    graphql:
      "This skill should be used when the user asks to 'add a query', 'create a mutation', 'define types', or 'configure resolvers'. Covers GraphQL patterns.",
    zod: "This skill should be used when the user asks to 'add validation', 'create schemas', 'parse data', or 'infer types'. Covers Zod schema patterns.",
    python:
      "This skill should be used when the user asks to 'write Python code', 'add type hints', 'configure virtual environments', or 'manage dependencies'. Covers Python best practices.",
    django:
      "This skill should be used when the user asks to 'add a model', 'create a view', 'configure URLs', or 'handle forms'. Covers Django patterns.",
    fastapi:
      "This skill should be used when the user asks to 'add an endpoint', 'create schemas', 'handle authentication', or 'configure middleware'. Covers FastAPI patterns.",
    flask:
      "This skill should be used when the user asks to 'add a route', 'create blueprints', 'handle requests', or 'configure the app'. Covers Flask patterns.",
    go: "This skill should be used when the user asks to 'write Go code', 'add error handling', 'create packages', or 'configure modules'. Covers Go best practices.",
    rust: "This skill should be used when the user asks to 'write Rust code', 'handle ownership', 'create modules', or 'manage dependencies'. Covers Rust best practices.",
    "ai-sdk":
      "This skill should be used when the user asks to 'add AI features', 'stream LLM responses', 'create chat interfaces', or 'integrate language models'. Covers Vercel AI SDK patterns.",
    agents:
      "This skill should be used when the user asks to 'create an agent', 'add tool calling', 'build workflows', or 'orchestrate AI tasks'. Guides agentic AI patterns.",
    "frontend-design":
      "This skill should be used when the user asks to 'improve the UI', 'add animations', 'fix accessibility', or 'create a design system'. Defines visual design standards.",
  };

  return (
    descriptions[name] ||
    `This skill should be used when the user asks to work with ${name}. Provides ${name} patterns and best practices.`
  );
}

/**
 * Detect which skills should be generated based on AGENTS.md
 * First tries to parse the explicit ## Technologies section,
 * then falls back to AI detection if not found
 */
export async function detectSkills(
  agentsMdContent: string,
  model: ClaudeOptions["model"] = "haiku",
  verbose = false
): Promise<Skill[]> {
  // First, try to parse the explicit Technologies section
  const technologies = parseTechnologiesSection(agentsMdContent);

  if (technologies && technologies.length > 0) {
    if (verbose) {
      console.log(`Found explicit Technologies section with ${technologies.length} entries`);
    }
    return technologies.map((name) => ({
      name,
      description: generateSkillDescription(name),
    }));
  }

  // Fall back to AI detection
  if (verbose) {
    console.log("No Technologies section found, falling back to AI detection...");
  }

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

    jsonStr = jsonStr.trim();

    // Validate the response looks like JSON array before parsing
    if (!jsonStr.startsWith("[")) {
      // Model returned conversational text instead of JSON
      console.error(
        "Model returned non-JSON response. Expected JSON array but got:",
        jsonStr.slice(0, 100) + (jsonStr.length > 100 ? "..." : "")
      );
      return [];
    }

    const skills = JSON.parse(jsonStr);

    if (!Array.isArray(skills)) {
      console.error("Invalid skills response: not an array");
      return [];
    }

    return skills.filter(
      (s): s is Skill =>
        typeof s === "object" && typeof s.name === "string" && typeof s.description === "string"
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

  const prompt = buildGenerateSkillPrompt(skill.name, skill.description, agentsMdContent);

  const response = await runClaudeWithFiles(prompt, {
    model,
    cwd: projectRoot,
    maxTurns: 5,
    verbose,
  });

  if (!response.success || !response.result) {
    return {
      success: false,
      error: response.error || `Failed to generate skill: ${skill.name}`,
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
  const agentsMdPath = options.agentsMdPath || path.join(projectRoot, "AGENTS.md");

  const agentsMdContent = await readFile(agentsMdPath);

  if (!agentsMdContent) {
    return {
      success: false,
      error: `AGENTS.md not found at ${agentsMdPath}. Run 'rumpleskill agents' first.`,
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
    skills = options.skills.map((name) => ({
      name,
      description: `Skill for ${name}`,
    }));
    spinner?.succeed(`Using ${skills.length} specified skills`);
  } else {
    skills = await detectSkills(agentsMdContent, "haiku", verbose);
    if (skills.length > 0) {
      spinner?.succeed(`Detected ${skills.length} skills: ${skills.map((s) => s.name).join(", ")}`);
      if (verbose) {
        console.log(
          `\n${pc.green("✓")} Detected ${skills.length} skills: ${skills.map((s) => s.name).join(", ")}\n`
        );
      }
    }
  }

  if (skills.length === 0) {
    spinner?.fail("No skills detected");
    return {
      success: false,
      error: "No skills detected. Check your AGENTS.md content.",
    };
  }

  // Log target agents
  if (agents.length > 1) {
    const agentNames = agents.map((id) => AGENT_REGISTRY[id].displayName).join(", ");
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
    error: errors.length > 0 ? errors.join("\n") : undefined,
  };
}
