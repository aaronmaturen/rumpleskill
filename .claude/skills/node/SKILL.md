---
name: node
description: This skill should be used when the user asks to 'create a CLI tool', 'handle file system operations', 'manage processes', or 'configure runtime behavior'. Guides Node.js 20.x patterns and native APIs.
version: 1.0.0
metadata:
  internal: false
---

# Node.js CLI Development

Node.js 20.x patterns for building CLI tools with native ESM, file system operations, and process management.

## Capabilities

- **Native ESM**: Top-level await, `.js` extension imports, ESM-only packages
- **File System**: Async operations with `fs/promises`, recursive traversal
- **Process Management**: Argument parsing, stdio handling, exit codes
- **Environment Variables**: Runtime configuration via `process.env`

## Input Requirements

- Node.js 20.x or higher installed
- TypeScript configured for ESM output (`"type": "module"` in package.json)
- Environment variables set via shell (no dotenv required)

## Patterns

### CLI Entry Point with Argument Parsing

```typescript
#!/usr/bin/env node
import { generateClaudeMd } from "./generators/claude-md.js";

const args = process.argv.slice(2);
const command = args[0];
const verbose = args.includes("--verbose");

if (command === "agents") {
  const result = await generateClaudeMd();
  console.log(result);
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
```

**Use when**: Building simple CLIs without framework dependencies. For complex argument parsing, consider `commander` or `yargs`.

### File System Operations with Promises

```typescript
import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";

export async function scanDirectory(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory() && !shouldIgnore(entry.name)) {
      const nested = await scanDirectory(fullPath);
      files.push(...nested);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function shouldIgnore(name: string): boolean {
  return name.startsWith(".") || name === "node_modules" || name === "dist";
}
```

**Use when**: Recursively traversing directories. Always use `fs/promises` for async operations, never synchronous `fs` methods in CLI tools.

### Reading File Content Safely

```typescript
import { readFile } from "fs/promises";

export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error);
    return "";
  }
}
```

**Use when**: Reading files that may not exist or have permission issues. Handle errors locally rather than crashing.

### Environment Variable Configuration

```typescript
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error("Error: ANTHROPIC_API_KEY environment variable not set");
  process.exit(1);
}
```

**Use when**: Requiring configuration at runtime. Validate environment variables early in the entry point, not deep in modules.

### ESM Import Paths

```typescript
// Always include .js extension (even for .ts source files)
import { callClaude } from "../utils/claude.js";
import { scanDirectory } from "../utils/file-system.js";

// TypeScript will resolve these correctly when transpiled
```

**Use when**: Using native ESM in Node.js 20.x. The `.js` extension is mandatory for ESM imports, even though source files are `.ts`.

### Streaming Output with Inherited Stdio

```typescript
import { spawn } from "child_process";

// Pass through stdout/stderr in real-time
const child = spawn("some-command", ["args"], {
  stdio: "inherit", // Use parent's stdin/stdout/stderr
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
```

**Use when**: Running subprocesses where you want immediate output visibility (like `--verbose` mode).

### Process Exit Codes

```typescript
try {
  await runGenerator();
  process.exit(0); // Success
} catch (error) {
  console.error("Generation failed:", error);
  process.exit(1); // Failure
}
```

**Use when**: Building CLI tools that integrate with shell scripts or CI/CD pipelines. Always exit with non-zero codes on errors.

## Best Practices

1. **Use native fs/promises**: Never use callbacks or synchronous fs methods
2. **Validate environment early**: Check required env vars at entry point, fail fast
3. **Include .js in imports**: ESM requires explicit file extensions, even for TypeScript
4. **Handle errors locally**: File operations should catch errors, not crash the process
5. **Inherited stdio for real-time output**: Use `stdio: 'inherit'` for long-running operations
6. **Top-level await**: Enabled by ESM, use it freely in entry points
7. **Exit codes matter**: Return 0 on success, non-zero on failure

## Common Pitfalls

- **Missing .js extensions**: TypeScript won't auto-add them in ESM mode - imports will fail at runtime
- **Synchronous fs calls**: `readFileSync` blocks the event loop - use `fs/promises` instead
- **Buffering output**: Don't collect all output before printing - stream it for UX
- **Ignoring exit codes**: CLI tools should always exit with proper codes for shell integration
- **Hardcoded paths**: Use `join()` and `resolve()` from `path` for cross-platform compatibility

## Limitations

- No built-in argument parsing (intentionally minimal - use native argv or add a library)
- No automatic .env file loading (requires explicit dotenv package if needed)
- ESM-only codebase (cannot `require()` CommonJS modules)

## References

- [Node.js 20.x fs/promises API](https://nodejs.org/docs/latest-v20.x/api/fs.html#promises-api)
- [Node.js ESM Documentation](https://nodejs.org/docs/latest-v20.x/api/esm.html)
- [TypeScript ESM Configuration](https://www.typescriptlang.org/docs/handbook/esm-node.html)
