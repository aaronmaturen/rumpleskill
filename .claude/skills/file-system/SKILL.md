---
name: file-system
description: This skill should be used when the user asks to 'scan directories', 'read files', 'parse JSON or Markdown', or 'traverse the file system'. Guides safe file I/O patterns and recursive directory operations.
version: 1.0.0
---

# File System Operations

Handles recursive directory traversal, file reading, and parsing operations using Node.js native APIs.

## Capabilities

- **Recursive Directory Scanning**: Traverse directories with ignore patterns
- **Safe File Reading**: Handle encoding and error cases gracefully
- **Content Parsing**: Extract meaningful data from JSON and Markdown files
- **Pattern Exclusion**: Skip `node_modules/`, `.git/`, `dist/`, and hidden files

## Core Patterns

### Directory Scanning with Ignore Patterns

```typescript
import { readdir, stat } from "fs/promises";
import { join } from "path";

const IGNORE_PATTERNS = ["node_modules", ".git", "dist", "build", ".next", "coverage"];

export async function scanDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentPath: string): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden files and ignored directories
      if (entry.name.startsWith(".")) continue;
      if (IGNORE_PATTERNS.includes(entry.name)) continue;

      const fullPath = join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }

  await traverse(dir);
  return files;
}
```

### Safe File Content Reading

```typescript
import { readFile } from "fs/promises";

export async function readFileContent(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch (error) {
    console.error(`Failed to read ${path}:`, error);
    return null;
  }
}
```

Use `utf-8` encoding explicitly. Return `null` on errors rather than throwing to allow partial results in batch operations.

### Filtering by Extension

```typescript
const markdownFiles = allFiles.filter((f) => f.endsWith(".md") || f.endsWith(".markdown"));

const packageJsons = allFiles.filter((f) => f.endsWith("package.json"));
```

Use `.endsWith()` rather than regex for simple extension checks.

### Parsing JSON Files

```typescript
async function readPackageJson(path: string): Promise<Record<string, any> | null> {
  const content = await readFileContent(path);
  if (!content) return null;

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(`Invalid JSON in ${path}`);
    return null;
  }
}
```

Always wrap `JSON.parse()` in try-catch when reading untrusted files.

### Gathering Codebase Context

```typescript
async function gatherCodebaseContext(): Promise<string> {
  const rootDir = process.cwd();

  // Scan for relevant files
  const allFiles = await scanDirectory(rootDir);
  const markdownFiles = allFiles.filter((f) => f.endsWith(".md"));
  const configFiles = allFiles.filter(
    (f) => f.endsWith("package.json") || f.endsWith("tsconfig.json")
  );

  // Read and combine content
  let context = "";

  for (const file of markdownFiles) {
    const content = await readFileContent(file);
    if (content) {
      context += `\n## ${file}\n\n${content}\n`;
    }
  }

  return context;
}
```

Build context strings by accumulating file contents with clear section headers.

## Best Practices

1. **Always exclude generated directories**: `dist/`, `build/`, `.next/`, `coverage/`
2. **Use `fs/promises` API**: Avoid callback-style `fs` methods
3. **Handle partial failures gracefully**: Don't fail entire operation if one file errors
4. **Skip hidden files by default**: Start with `.` check before accessing file system
5. **Use `path.join()`**: Never concatenate paths with string operations
6. **Specify encoding explicitly**: Always use `'utf-8'` for text files

## Common Pitfalls

- **Circular symlinks**: `scanDirectory()` doesn't detect circular links - can cause infinite loops
- **Large binary files**: Reading everything as UTF-8 will corrupt binaries - filter by extension first
- **Nested node_modules**: Ignore pattern only checks directory name, not full path - can miss nested modules
- **File system race conditions**: Files can be deleted between `readdir()` and `readFile()` - always catch errors

## Integration Points

### With Claude API

Pass scanned context as user message content:

```typescript
const context = await gatherCodebaseContext();
await callClaude(systemPrompt, context);
```

### With Generators

Each generator uses file system utilities to build specialized context:

```typescript
// src/generators/claude-md.ts
import { scanDirectory, readFileContent } from "../utils/file-system.js";

export async function generateClaudeMd(): Promise<string> {
  const files = await scanDirectory(process.cwd());
  // ... filter and process files
}
```

## Performance Considerations

- **Parallel reading**: Use `Promise.all()` for independent file reads
- **Lazy loading**: Only read files needed for current command
- **Stream large files**: For files >10MB, consider `createReadStream()` instead of `readFile()`

```typescript
// Parallel read example
const contents = await Promise.all(files.map((f) => readFileContent(f)));
```

## Limitations

- No symlink cycle detection
- No file watching/change detection
- No atomic write operations
- No memory-efficient streaming for large directories
- Ignore patterns are exact matches only (no glob support)
