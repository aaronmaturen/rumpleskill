import type { AgentId, AgentConfig } from "../types/agents.js";

/**
 * Registry of supported AI coding agents and their skill directory paths
 */
export const AGENT_REGISTRY: Record<AgentId, AgentConfig> = {
  "claude-code": {
    id: "claude-code",
    displayName: "Claude Code",
    localPath: ".claude/skills",
    globalPath: ".claude/skills",
  },
  cursor: {
    id: "cursor",
    displayName: "Cursor",
    localPath: ".cursor/skills",
    globalPath: ".cursor/skills",
  },
  cline: {
    id: "cline",
    displayName: "Cline",
    localPath: ".cline/skills",
    globalPath: ".cline/skills",
  },
  windsurf: {
    id: "windsurf",
    displayName: "Windsurf",
    localPath: ".windsurf/skills",
    globalPath: ".windsurf/skills",
  },
  codex: {
    id: "codex",
    displayName: "Codex CLI",
    localPath: ".codex/skills",
    globalPath: ".codex/skills",
  },
  opencode: {
    id: "opencode",
    displayName: "OpenCode",
    localPath: ".opencode/skills",
    globalPath: ".opencode/skills",
  },
  "github-copilot": {
    id: "github-copilot",
    displayName: "GitHub Copilot",
    localPath: ".github/copilot/skills",
    globalPath: ".github/copilot/skills",
  },
  continue: {
    id: "continue",
    displayName: "Continue",
    localPath: ".continue/skills",
    globalPath: ".continue/skills",
  },
  roo: {
    id: "roo",
    displayName: "Roo",
    localPath: ".roo/skills",
    globalPath: ".roo/skills",
  },
  amp: {
    id: "amp",
    displayName: "Amp",
    localPath: ".amp/skills",
    globalPath: ".amp/skills",
  },
  "gemini-cli": {
    id: "gemini-cli",
    displayName: "Gemini CLI",
    localPath: ".gemini/skills",
    globalPath: ".gemini/skills",
  },
  goose: {
    id: "goose",
    displayName: "Goose",
    localPath: ".goose/skills",
    globalPath: ".goose/skills",
  },
};

/**
 * All supported agent IDs
 */
export const ALL_AGENT_IDS: AgentId[] = Object.keys(AGENT_REGISTRY) as AgentId[];

/**
 * Default agent when none specified
 */
export const DEFAULT_AGENT: AgentId = "claude-code";

/**
 * Get agent config by ID
 */
export function getAgentConfig(agentId: AgentId): AgentConfig {
  return AGENT_REGISTRY[agentId];
}

/**
 * Parse comma-separated agent IDs, validating each one
 */
export function parseAgentIds(input: string): AgentId[] {
  const ids = input.split(",").map((s) => s.trim().toLowerCase());
  const valid: AgentId[] = [];
  const invalid: string[] = [];

  for (const id of ids) {
    if (id in AGENT_REGISTRY) {
      valid.push(id as AgentId);
    } else {
      invalid.push(id);
    }
  }

  if (invalid.length > 0) {
    throw new Error(
      `Invalid agent IDs: ${invalid.join(", ")}. Valid agents: ${ALL_AGENT_IDS.join(", ")}`
    );
  }

  return valid;
}
