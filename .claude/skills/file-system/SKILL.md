---
name: file-system
description: This skill should be used when the user asks to 'scan directories', 'read files', 'parse JSON or Markdown', or 'traverse the file system'. Guides safe file I/O patterns and recursive directory operations.
version: 1.0.0
metadata:
  internal: false
---

# File System Operations

Safe, async file system patterns using Node.js native `fs/promises` API with ESM imports.

## Capabilities

- **Recursive Directory Scanning**: Traverse directories with intelligent ignore patterns
- **Safe File Reading**: Error-handled content retrieval for JSON, Markdown, and text files
- **Type-Safe Paths**: TypeScript-strict path handling with proper type guards
- **Memory Efficient**: Stream-based operations where appropriate

## Input Requirements

- Absolute or relative file paths (resolved via `path.resolve()`)
- Optional ignore patterns for directory traversal
- File encoding (defaults to `utf-8`)

## Patterns

### Import Statement

```typescript
import fs from "fs/promises";
import path from "path";
```

Always use `fs/promises` for async operations. Never use callback-based `fs` or synchronous `fs.*Sync()` methods.

### Recursive Directory Scanning

```typescript
async function scanDirectory(
  dir: string,
  ignorePatterns: string[] = ["node_modules", ".git", "dist"]
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip ignored patterns
    if (ignorePatterns.some((pattern) => entry.name.includes(pattern))) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await scanDirectory(fullPath, ignorePatterns)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}
```

**Key Points:**

- Use `withFileTypes: true` to avoid extra `stat()` calls
- Check `entry.isDirectory()` before recursion
- Always skip `node_modules/`, `.git/`, `dist/`, hidden files (`.dotfile`)

### Safe File Reading

```typescript
async function readFileContent(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error);
    return null;
  }
}
```

**Why:** File reads can fail (permissions, missing files). Return `null` on error instead of throwing to allow graceful degradation.

### JSON Parsing

```typescript
async function readJsonFile<T>(filePath: string): Promise<T | null> {
  const content = await readFileContent(filePath);
  if (!content) return null;

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Invalid JSON in ${filePath}:`, error);
    return null;
  }
}
```

**Usage:**

```typescript
interface PackageJson {
  name: string;
  dependencies?: Record<string, string>;
}

const pkg = await readJsonFile<PackageJson>("./package.json");
if (pkg?.dependencies) {
  // Type-safe access
}
```

### Writing Files

```typescript
async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}
```

**Always** create parent directories first with `{ recursive: true }`.

### File Existence Check

```typescript
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
```

**Don't** use `fs.existsSync()` - keep everything async.

## Best Practices

1. **Use path.join() and path.resolve()** - Never concatenate paths with strings
2. **Handle errors at read boundaries** - Don't let file errors crash the CLI
3. **Filter early** - Apply ignore patterns during traversal, not after
4. **Specify encoding** - Always pass `"utf-8"` explicitly to `readFile()`
5. **Type file contents** - Use generics for JSON parsing (`readJsonFile<T>()`)

## Common Pitfalls

- **Forgetting `.js` extensions in imports** - ESM requires explicit extensions: `"./file-system.js"`
- **Using sync methods** - `readFileSync()` blocks the event loop; use `await fs.readFile()`
- **Not creating parent dirs** - `writeFile()` fails if the directory doesn't exist
- **Throwing on missing files** - Return `null` instead for optional file reads

## Limitations

- **No streaming support** - Current implementation reads entire files into memory (fine for config/markdown, not for large datasets)
- **No glob patterns** - Uses simple string matching for ignore patterns, not full glob syntax
- **No symlink handling** - Follows symlinks by default; may cause infinite loops if not careful

## References

- [Node.js fs/promises API](https://nodejs.org/docs/latest-v20.x/api/fs.html#promises-api)
- [Node.js path module](https://nodejs.org/docs/latest-v20.x/api/path.html)
