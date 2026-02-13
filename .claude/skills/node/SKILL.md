---
name: node
description: This skill should be used when the user asks to 'create a CLI tool', 'handle file system operations', 'manage processes', or 'configure runtime behavior'. Guides Node.js 20.x patterns and native APIs.
version: 1.0.0
---

# Node.js 20.x Patterns

Conventions for Node.js runtime features, CLI development, and file system operations in this project.

## Capabilities

- **Native ESM**: Full ES module support with top-level await
- **File System**: Async operations using `fs/promises` API
- **CLI Argument Parsing**: Native `process.argv` handling without frameworks
- **Process Management**: Environment variables, stdio inheritance, exit codes
- **Stream Control**: Verbose mode with inherited stdio for real-time output

## Module System

### ESM Configuration

Package.json must specify:

```json
{
  "type": "module",
  "exports": {
    ".": "./dist/index.js"
  }
}
```

### Import Extensions

Always include `.js` extension for relative imports (even from `.ts` files):

```typescript
// Correct
import { callClaude } from "../utils/claude.js";
import { scanDirectory } from "../utils/file-system.js";

// Wrong - will fail at runtime
import { callClaude } from "../utils/claude";
```

### Top-Level Await

```typescript
// src/index.ts
const context = await scanDirectory(process.cwd());
const result = await generateClaudeMd();
```

## File System Operations

### Use fs/promises API

```typescript
import { readFile, writeFile, readdir, stat } from "fs/promises";
import { join } from "path";

// Read files
const content = await readFile(filePath, "utf-8");

// Write output
await writeFile("AGENTS.md", generated, "utf-8");

// Recursive directory scan
async function scanDirectory(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && !shouldIgnore(entry.name)) {
      await scanDirectory(join(dir, entry.name));
    }
  }
}
```

### Ignore Patterns

Standard exclusions in `src/utils/file-system.ts`:

```typescript
const IGNORE_PATTERNS = ["node_modules", ".git", "dist", ".next", "build"];

function shouldIgnore(name: string): boolean {
  return name.startsWith(".") || IGNORE_PATTERNS.includes(name);
}
```

## CLI Patterns

### Argument Parsing (Native)

```typescript
// src/index.ts
const args = process.argv.slice(2);
const command = args[0];
const flags = args.slice(1);

const isVerbose = flags.includes("--verbose");

if (command === "agents") {
  await generateClaudeMd();
}
```

### Standard Output

```typescript
// Normal output
console.log(result);

// Errors to stderr
console.error("Error:", error.message);
process.exit(1);
```

### Inherited Stdio for Streaming

For real-time API streaming output:

```typescript
// src/utils/claude.ts
const stream = anthropic.messages.stream({
  // ... config
});

// When --verbose flag present, inherit stdio shows stream-json
stream.on("streamEvent", (event) => {
  if (isVerbose) {
    console.log(JSON.stringify(event));
  }
});
```

## Environment Variables

### Required Setup

```typescript
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error("Error: ANTHROPIC_API_KEY environment variable required");
  process.exit(1);
}
```

### No .env File Support

This project uses shell environment variables only:

```bash
# User must set in shell
export ANTHROPIC_API_KEY=sk-ant-xxx

# Or inline
ANTHROPIC_API_KEY=sk-ant-xxx npm start
```

## Process Management

### Exit Codes

```typescript
// Success
process.exit(0);

// Generic error
process.exit(1);

// Specific error codes
process.exit(2); // Configuration error
```

### Working Directory

```typescript
// Always use process.cwd() as base
const projectRoot = process.cwd();
const outputPath = join(projectRoot, "AGENTS.md");
```

## TypeScript Integration

### tsconfig.json Requirements

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

### Development with tsx

```bash
# Watch mode during development
tsx watch src/index.ts

# Single run
tsx src/index.ts agents
```

## Error Handling

### File Operations

```typescript
try {
  const content = await readFile(path, "utf-8");
} catch (error) {
  console.error(`Failed to read ${path}:`, error.message);
  process.exit(1);
}
```

### API Calls

```typescript
try {
  const response = await callClaude(prompt, context);
  return response;
} catch (error) {
  console.error("Claude API error:", error);
  throw error; // Propagate to CLI level
}
```

## Best Practices

1. **Always use async/await** - No callbacks or `.then()` chains
2. **Include .js extensions** in imports for ESM compatibility
3. **Validate environment** before executing commands
4. **Use inherited stdio** for streaming/interactive commands
5. **Exit with appropriate codes** for scripting integration

## Common Pitfalls

- **Missing .js extension**: ESM requires explicit extensions in imports
- **Forgetting `"type": "module"`**: Package.json must declare ESM mode
- **Using \_\_dirname**: Not available in ESM, use `import.meta.url` with `fileURLToPath()`
- **Buffering stdio**: Use inherited stdio for real-time output, not captured streams

## References

- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [fs/promises API](https://nodejs.org/api/fs.html#promises-api)
- Project file: `src/utils/file-system.ts` for scanning patterns
- Project file: `src/index.ts` for CLI argument handling
