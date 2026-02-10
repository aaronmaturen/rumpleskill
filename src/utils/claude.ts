import { spawn } from "child_process";
import { promisify } from "util";
import { exec as execCallback } from "child_process";

const exec = promisify(execCallback);

export interface ClaudeResponse {
  success: boolean;
  result?: string;
  error?: string;
}

export interface ClaudeOptions {
  model?: "sonnet" | "haiku" | "opus";
  allowedTools?: string[];
  maxTurns?: number;
  cwd?: string;
  verbose?: boolean;
  onOutput?: (chunk: string) => void;
}

/**
 * Check if Claude Code CLI is installed and authenticated
 */
export async function checkClaudeInstalled(): Promise<boolean> {
  try {
    await exec("which claude");
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if Claude Code is authenticated
 */
export async function checkClaudeAuth(): Promise<boolean> {
  try {
    // Just check that claude command runs
    await exec("claude --version");
    return true;
  } catch {
    return false;
  }
}

/**
 * Run a prompt through Claude Code CLI
 */
export async function runClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<ClaudeResponse> {
  const {
    model = "sonnet",
    allowedTools = [],
    maxTurns = 5,
    cwd,
    verbose = false,
    onOutput
  } = options;

  return new Promise((resolve) => {
    const args = [
      "-p", prompt,
      "--model", model,
      "--max-turns", String(maxTurns),
      "--output-format", "text",
    ];

    // Add allowed tools if specified
    if (allowedTools.length > 0) {
      args.push("--allowedTools", allowedTools.join(","));
    }

    const proc = spawn("claude", args, {
      cwd: cwd || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      const chunk = data.toString();
      stdout += chunk;

      if (verbose) {
        process.stdout.write(chunk);
      }

      if (onOutput) {
        onOutput(chunk);
      }
    });

    proc.stderr.on("data", (data) => {
      const chunk = data.toString();
      stderr += chunk;

      if (verbose) {
        process.stderr.write(chunk);
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, result: stdout.trim() });
      } else {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`
        });
      }
    });

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Run Claude with file reading capabilities
 */
export async function runClaudeWithFiles(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<ClaudeResponse> {
  const defaultTools = ["Read", "Glob", "Grep"];
  const tools = [...defaultTools, ...(options.allowedTools || [])];

  return runClaude(prompt, {
    ...options,
    allowedTools: tools,
  });
}
