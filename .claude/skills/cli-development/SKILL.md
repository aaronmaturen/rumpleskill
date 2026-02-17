---
name: cli-development
description: This skill should be used when the user asks to 'add a command', 'parse arguments', 'improve CLI output', or 'add interactive features'. Covers command routing, argument parsing, and stdio handling.
version: 1.0.0
metadata:
  internal: false
---

# CLI Development

Command-line interface patterns for `rumpleskill`, built on native Node.js without external CLI frameworks.

## Capabilities

- **Command Routing**: Parse `process.argv` and dispatch to generator functions
- **Argument Parsing**: Handle flags like `--verbose` manually
- **Streaming Output**: Use inherited stdio for real-time Claude API responses
- **Error Handling**: Surface errors to stderr with proper exit codes

## Input Requirements

- Command name (e.g., `agents`)
- Optional flags (e.g., `--verbose`)
- Environment variables (`ANTHROPIC_API_KEY`)

## Patterns

### Command Router Pattern

```typescript
// src/index.ts
const args = process.argv.slice(2);
const command = args[0];
const flags = args.slice(1);

if (command === "agents") {
  await generateClaudeMd();
} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}
```

**When to use**: Entry point for all CLI commands. Keep routing logic in `src/index.ts`.

### Flag Parsing

```typescript
const verbose = args.includes("--verbose");

if (verbose) {
  // Enable stream-json output with inherited stdio
  await callClaude(prompt, context, { stream: true });
} else {
  // Buffer and return complete response
  const result = await callClaude(prompt, context);
  console.log(result);
}
```

**When to use**: For boolean flags. Extract before passing to generators.

### Streaming Output with Inherited Stdio

```typescript
// src/utils/claude.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const stream = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 16000,
  messages: [{ role: "user", content: prompt }],
  stream: true,
});

for await (const chunk of stream) {
  if (chunk.type === "content_block_delta") {
    process.stdout.write(chunk.delta.text);
  }
}
```

**When to use**: For real-time feedback during long-running API calls. Users see progress immediately.

### Error Handling

```typescript
try {
  const result = await generateClaudeMd();
  console.log(result);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
```

**When to use**: Wrap all command execution. Always exit with code 1 on failure.

## Best Practices

1. **Keep `src/index.ts` minimal** - Only routing logic, delegate to generators
2. **Parse flags early** - Extract `--verbose` before calling generators
3. **Use inherited stdio for streaming** - Don't buffer large outputs
4. **Validate environment** - Check `ANTHROPIC_API_KEY` exists before API calls
5. **Exit codes matter** - Use `process.exit(1)` for errors, `0` for success

## Common Pitfalls

- **Forgetting `.slice(2)`**: `process.argv` includes `node` and script path - always slice
- **Buffering streaming output**: Don't use `console.log()` inside stream loops, use `process.stdout.write()`
- **Silent failures**: Always propagate errors to stderr with clear messages

## Adding a New Command

1. **Add command to router** in `src/index.ts`:

   ```typescript
   if (command === "my-command") {
     await generateMyCommand();
   }
   ```

2. **Create generator** in `src/generators/my-command.ts`:

   ```typescript
   export async function generateMyCommand(): Promise<string> {
     const context = await scanDirectory(process.cwd());
     return await callClaude(MY_COMMAND_PROMPT, context);
   }
   ```

3. **Test with dev script**:
   ```bash
   npm run dev -- my-command
   ```

## Limitations

- No autocomplete or help text generation (manual documentation required)
- No interactive prompts (prompting library not included)
- Flag parsing is manual (no validation framework)

## References

- Node.js `process.argv` docs: https://nodejs.org/api/process.html#processargv
- Anthropic SDK streaming: https://github.com/anthropics/anthropic-sdk-typescript
