/**
 * Supported AI coding agent identifiers
 */
export type AgentId =
  | "claude-code"
  | "cursor"
  | "cline"
  | "windsurf"
  | "codex"
  | "opencode"
  | "github-copilot"
  | "continue"
  | "roo"
  | "amp"
  | "gemini-cli"
  | "goose";

/**
 * Configuration for an AI coding agent
 */
export interface AgentConfig {
  /** Unique identifier for the agent */
  id: AgentId;
  /** Human-readable display name */
  displayName: string;
  /** Path to skills directory relative to project root (local install) */
  localPath: string;
  /** Path to skills directory relative to home (global install) */
  globalPath: string;
}

/**
 * How skills are installed to agent directories
 */
export type InstallMode = "symlink" | "copy";
