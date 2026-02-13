---
name: cli-development
description: This skill should be used when the user asks to 'add a command', 'parse arguments', 'improve CLI output', or 'add interactive features'. Covers command routing, argument parsing, and stdio handling.
version: 1.0.0
---

# CLI Development

Native Node.js CLI patterns for `rumpleskill` without external framework dependencies.

## Capabilities

- **Command Routing**: Simple argument parsing with `process.argv`
- **Flag Handling**: Boolean flags (e.g., `--verbose`)
- **Stream Output**: Inherited stdio for real-time feedback
- **Error Reporting**: Proper exit codes and stderr usage

## Input Requirements

Commands are invoked as:

```bash
rumpleskill <command> [--flags]
```

Entry point: `src/index.ts`

## Patterns

### Command Routing

```typescript
// src/index.ts
const args = process.argv.slice(2);
const command = args[0];
const flags = args.slice(1);

const isVerbose = flags.includes("--verbose");

if (command === "agents") {
  const content = await generateClaudeMd();
  await fs.writeFile("AGENTS.md", content);
  console.log("Generated AGENTS.md");
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
```

**When to use**: Primary CLI entry point. Keep flat—avoid nested routing for small CLIs.

### Verbose Mode with Stream-JSON

```typescript
// src/utils/claude.ts
if (isVerbose) {
  const process = spawn("claude", ["--stream-json"], {
    stdio: "inherit", // Pass through stdout/stderr
  });
  await new Promise((resolve) => process.on("close", resolve));
}
```

**When to use**: Real-time progress for long-running AI generation. User sees token streaming immediately.

### Error Handling

```typescript
try {
  const content = await generateClaudeMd();
  await fs.writeFile("AGENTS.md", content);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
```

**When to use**: Top-level error boundary. Always exit with non-zero code on failure for CI/CD compatibility.

### Output Conventions

```typescript
// Success messages to stdout
console.log("Generated AGENTS.md");

// Errors to stderr
console.error(`Unknown command: ${command}`);

// Progress updates (if not streaming)
console.log("Scanning codebase...");
console.log("Calling Claude API...");
```

**When to use**: Follow Unix conventions—stdout for data, stderr for diagnostics.

## Best Practices

1. **Keep argv parsing simple**: No regex, just `includes()` and `slice()`
2. **Inherited stdio for streaming**: Don't buffer large AI outputs
3. **Exit codes matter**: Use `process.exit(1)` for errors, `0` (implicit) for success
4. **Help text via error messages**: Show usage on invalid commands
5. **Environment-based config**: Use `process.env` for API keys, not CLI args

## Common Pitfalls

- **Buffering output**: Don't use `child_process.exec()`—it buffers. Use `spawn()` with `stdio: 'inherit'`
- **Forgetting `process.exit(1)`**: CI tools check exit codes. Silent failures are bugs.
- **Overengineering arg parsing**: For <5 commands, regex is overkill. Use array methods.
- **Logging to wrong stream**: Error messages must go to stderr, not stdout

## Adding a New Command

1. **Add routing** in `src/index.ts`:

```typescript
if (command === "my-command") {
  const result = await generateMySkill();
  console.log(result);
}
```

2. **Create generator** in `src/generators/my-skill.ts`:

```typescript
export async function generateMySkill(): Promise<string> {
  // Implementation
}
```

3. **Test with dev script**:

```bash
npm run dev -- my-command --verbose
```

## Limitations

- **No subcommands**: Flat structure only (`rumpleskill command`, not `rumpleskill group subcommand`)
- **No validation**: Arguments aren't type-checked or validated beyond existence checks
- **No help system**: No `-h` or `--help` flag implemented yet
- **No autocomplete**: Shell completion not configured

## References

- Node.js `process.argv` docs: https://nodejs.org/api/process.html#processargv
- `child_process` streaming: https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
- Exit codes: https://nodejs.org/api/process.html#processexitcode
