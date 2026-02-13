import { spawn } from "child_process";
import { promisify } from "util";
import { exec as execCallback } from "child_process";
import pc from "picocolors";

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
    onOutput,
  } = options;

  return new Promise((resolve) => {
    const args = ["-p", prompt, "--model", model, "--max-turns", String(maxTurns)];

    // In verbose mode, use stream-json with partial messages for realtime output
    if (verbose) {
      args.push("--output-format", "stream-json");
      args.push("--include-partial-messages");
      args.push("--verbose");
    } else {
      args.push("--output-format", "text");
    }

    // Add allowed tools if specified
    if (allowedTools.length > 0) {
      args.push("--allowedTools", allowedTools.join(","));
    }

    const proc = spawn("claude", args, {
      cwd: cwd || process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Close stdin so Claude knows there's no more input coming
    proc.stdin.end();

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
        lineBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line);

            switch (event.type) {
              case "system":
                if (event.subtype === "init") {
                  console.log(pc.dim(`  Model: ${event.model}`));
                }
                break;

              case "assistant":
                // Show content being generated
                if (event.message?.content) {
                  for (const block of event.message.content) {
                    if (block.type === "text" && block.text) {
                      const preview = block.text.slice(0, 100).replace(/\n/g, " ");
                      process.stdout.write(
                        `\r\x1b[K${pc.dim(`  ${preview}${block.text.length > 100 ? "..." : ""}`)}`
                      );
                    }
                    if (block.type === "tool_use") {
                      console.log(`\n${pc.yellow(`  → ${block.name}`)}`);
                    }
                  }
                }
                break;

              case "result":
                if (event.result) {
                  finalResult = event.result;
                }
                console.log(
                  `\n${pc.green(`  ✓ Done (${event.num_turns} turns, ${event.duration_ms}ms)`)}`
                );
                break;
            }
          } catch {
            // Not valid JSON
          }
        }
      }

      if (onOutput) {
        onOutput(chunk);
      }
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      // Process remaining buffer
      if (verbose && lineBuffer.trim()) {
        try {
          const event = JSON.parse(lineBuffer);
          if (event.type === "result" && event.result) {
            finalResult = event.result;
          }
        } catch {
          // Ignore JSON parse errors for incomplete buffer
        }
      }

      if (code === 0) {
        const result = verbose ? finalResult : stdout.trim();
        resolve({ success: true, result });
      } else {
        resolve({
          success: false,
          error: stderr || `Process exited with code ${code}`,
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
