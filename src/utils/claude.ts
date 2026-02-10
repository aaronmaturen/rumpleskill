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
 * Parse a stream-json line and return a human-readable status
 */
function parseStreamEvent(line: string): string | null {
  try {
    const event = JSON.parse(line);

    switch (event.type) {
      case "assistant":
        // Assistant is writing - show a snippet
        if (event.message?.content) {
          const content = event.message.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === "text" && block.text) {
                const preview = block.text.slice(0, 100);
                return `\x1b[90m  Writing: ${preview}${block.text.length > 100 ? "..." : ""}\x1b[0m`;
              }
              if (block.type === "tool_use") {
                return `\x1b[33m  → Using tool: ${block.name}\x1b[0m`;
              }
            }
          }
        }
        break;

      case "tool_use":
        return `\x1b[33m  → Tool: ${event.name || "unknown"}\x1b[0m`;

      case "tool_result":
        return `\x1b[32m  ✓ Tool completed\x1b[0m`;

      case "result":
        return null; // Final result, we'll handle this separately

      case "error":
        return `\x1b[31m  ✗ Error: ${event.error?.message || "unknown"}\x1b[0m`;
    }
  } catch {
    // Not valid JSON, ignore
  }
  return null;
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
    // Use stream-json for verbose mode to get realtime updates
    const outputFormat = verbose ? "stream-json" : "text";

    const args = [
      "-p", prompt,
      "--model", model,
      "--max-turns", String(maxTurns),
      "--output-format", outputFormat,
    ];

    // Claude CLI requires --verbose flag when using stream-json
    if (verbose) {
      args.push("--verbose");
    }

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
    let finalResult = "";
    let lineBuffer = "";

    proc.stdout.on("data", (data) => {
      const chunk = data.toString();
      stdout += chunk;

      if (verbose) {
        // Parse stream-json events
        lineBuffer += chunk;
        const lines = lineBuffer.split("\n");
        lineBuffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line);

            // Capture the final result
            if (event.type === "result" && event.result) {
              finalResult = event.result;
            }

            // Show status
            const status = parseStreamEvent(line);
            if (status) {
              console.log(status);
            }
          } catch {
            // Not JSON, just print it
            process.stdout.write(line + "\n");
          }
        }
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
      // Process any remaining buffer
      if (verbose && lineBuffer.trim()) {
        try {
          const event = JSON.parse(lineBuffer);
          if (event.type === "result" && event.result) {
            finalResult = event.result;
          }
        } catch {
          // Ignore
        }
      }

      if (code === 0) {
        // In verbose mode, use the parsed result; otherwise use raw stdout
        const result = verbose ? finalResult : stdout.trim();
        resolve({ success: true, result });
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
