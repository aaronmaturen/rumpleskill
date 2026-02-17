---
name: typescript
description: This skill should be used when the user asks to 'add types', 'fix type errors', 'create interfaces', 'improve type safety', or 'configure TypeScript'. Provides TypeScript strict mode patterns and ESM configuration for Node.js projects.
version: 1.0.0
metadata:
  internal: false
---

# TypeScript

TypeScript 5.x configuration for Node.js ESM projects with strict mode enabled.

## Capabilities

- **Strict Type Safety**: Enforce strict mode for maximum type safety
- **ESM Configuration**: Native ES modules for Node.js 20.x
- **Module Patterns**: Type-safe exports and imports across project modules
- **Async/Await Types**: Promise-based file I/O with proper typing

## TypeScript Configuration

This project uses strict mode with ESM targets:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Module Patterns

### File Extensions in Imports

ESM requires `.js` extensions even when importing `.ts` files:

```typescript
// CORRECT
import { callClaude } from "../utils/claude.js";
import { scanDirectory } from "../utils/file-system.js";

// WRONG
import { callClaude } from "../utils/claude";
```

### Export Patterns

**Generators** - Export async functions:

```typescript
// src/generators/claude-md.ts
export async function generateClaudeMd(): Promise<string> {
  const context = await gatherContext();
  return await callClaude(CLAUDE_MD_PROMPT, context);
}
```

**Prompts** - Export string constants:

```typescript
// src/prompts/claude-md.ts
export const CLAUDE_MD_PROMPT = `
You are a technical writer...
`;
```

**Utilities** - Export typed functions:

```typescript
// src/utils/file-system.ts
export async function scanDirectory(dir: string, ignorePatterns: string[] = []): Promise<string[]> {
  // Implementation
}
```

## Async/Await Typing

All file operations return properly typed Promises:

```typescript
import { readFile } from "fs/promises";

// Async function with explicit return type
async function readFileContent(path: string): Promise<string> {
  try {
    const content = await readFile(path, "utf-8");
    return content;
  } catch (error) {
    throw new Error(`Failed to read ${path}: ${error}`);
  }
}
```

## Error Handling Types

Type narrow errors in catch blocks:

```typescript
try {
  await someOperation();
} catch (error) {
  // Type narrow to Error
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Operation failed: ${message}`);
}
```

## Interface Patterns

Define interfaces for structured data:

```typescript
interface FileSystemEntry {
  path: string;
  type: "file" | "directory";
  content?: string;
}

interface GeneratorOptions {
  verbose?: boolean;
  outputPath?: string;
}
```

## Type Imports

Import types explicitly when needed:

```typescript
import type { Message } from "@anthropic-ai/sdk/resources/messages";

async function callClaude(prompt: string, context: string): Promise<Message> {
  // Implementation
}
```

## Best Practices

1. **Always enable strict mode** - Catches null/undefined errors at compile time
2. **Use `.js` extensions** - Required for Node.js ESM imports
3. **Explicit return types** - Document function contracts, especially for async functions
4. **No `any` types** - Use `unknown` and type guards instead
5. **Top-level await** - Enabled via `module: "NodeNext"` for CLI scripts

## Common Pitfalls

- **Missing `.js` extension**: ESM imports fail at runtime without explicit extensions
- **Relative imports without `./`**: Use `"./utils/file.js"` not `"utils/file.js"`
- **Mixed CJS/ESM**: Stick to pure ESM - no `require()` or `module.exports`
- **Untyped catch blocks**: Always type narrow `error` to `Error` or `unknown`

## Limitations

- **No decorators**: Not used in this project (experimental feature)
- **No namespaces**: Use ES modules instead
- **No triple-slash directives**: Not needed with modern TypeScript

## References

- [TypeScript Handbook - Modules](https://www.typescriptlang.org/docs/handbook/modules.html)
- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)
