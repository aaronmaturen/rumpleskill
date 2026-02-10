---
name: typescript
description: This skill should be used when the user asks to 'add types', 'fix type errors', 'create interfaces', 'improve type safety', or 'configure TypeScript'. Provides TypeScript strict mode patterns and ESM configuration for Node.js projects.
version: 1.0.0
---

# TypeScript

Guides TypeScript usage in Node.js ESM projects with strict mode enabled.

## Capabilities

- **Strict Mode Types**: Full `strict: true` compliance with no implicit any
- **ESM Configuration**: Native ES modules with proper extensions and imports
- **Type-Safe File Operations**: Strongly typed async/await patterns for fs/promises
- **API Integration Types**: Type definitions for external APIs (Claude, etc.)
- **Build Configuration**: Proper tsconfig.json for Node.js 20+ with ESM output

## Input Requirements

When adding types, provide:
- The function/module being typed
- Expected input/output shapes
- Any external API schemas involved

## Patterns

### ESM Import Extensions
```typescript
// REQUIRED: Always use .js extensions in imports (not .ts)
import { callClaude } from '../utils/claude.js';
import { scanDirectory } from '../utils/file-system.js';

// TypeScript compiles .ts to .js, so imports reference the OUTPUT
```

### File System Types
```typescript
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';

async function scanDirectory(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...await scanDirectory(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  
  return files;
}
```

### API Response Types
```typescript
// Define response shapes explicitly
interface ClaudeStreamEvent {
  type: 'content_block_delta' | 'message_stop';
  delta?: {
    type: 'text_delta';
    text: string;
  };
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  verbose: boolean = false
): Promise<string> {
  // Implementation with typed responses
}
```

### Generator Function Signatures
```typescript
// Generators return Promise<string> of markdown content
export async function generateClaudeMd(): Promise<string> {
  const context = await gatherContext();
  return await callClaude(CLAUDE_MD_PROMPT, context);
}

// Utility functions use specific return types
export async function readFileContent(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}
```

### CLI Argument Parsing
```typescript
// Type command-line args explicitly
interface CliArgs {
  command: 'agents' | string;
  flags: Set<string>;
}

function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const flags = new Set(args.filter(a => a.startsWith('--')));
  const command = args.find(a => !a.startsWith('--')) ?? '';
  
  return { command, flags };
}
```

## Configuration

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### package.json Type Module
```json
{
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "dev:watch": "tsx watch src/index.ts"
  }
}
```

## Best Practices

1. **Always use `.js` extensions in imports** - TypeScript doesn't rewrite them for ESM
2. **Enable all strict flags** - Catch errors at compile time, not runtime
3. **Type external API responses** - Don't trust `any` from HTTP calls
4. **Use `Promise<T>` return types** - Be explicit about async boundaries
5. **Prefer `interface` over `type`** for object shapes - Better error messages
6. **Use `readonly` for immutable data** - Prevent accidental mutations
7. **Avoid `as` type assertions** - Fix the types, don't silence them

## Common Pitfalls

- **Missing `.js` in imports**: TypeScript compiler doesn't add them automatically in ESM mode
- **Relative paths without extensions**: `import { x } from './util'` fails at runtime, use `'./util.js'`
- **Mixing CJS and ESM**: Don't use `require()` or `module.exports` in type: "module" projects
- **Incorrect `moduleResolution`**: Must be `"node"` or `"node16"` for Node.js projects
- **Forgetting top-level `await`**: Requires both ESM and `target: "ES2022"` or higher

## Limitations

- No runtime type checking - use Zod/io-ts if needed for external data validation
- Type definitions for npm packages may be missing - install `@types/*` packages when needed
- `.d.ts` files not automatically generated for `dist/` - add `"declaration": true` to tsconfig if publishing types

## References

- [TypeScript ESM Node Docs](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- Project tsconfig: `tsconfig.json`