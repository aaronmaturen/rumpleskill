---
name: api-integration
description: This skill should be used when the user asks to 'integrate an API', 'handle streaming responses', 'add authentication', or 'manage API calls'. Covers Claude API integration and streaming patterns.
version: 1.0.0
---

# API Integration

Integration with Anthropic's Claude API using native fetch and streaming responses. Optimized for CLI tools with real-time output.

## Capabilities

- **Streaming API Calls**: Real-time message streaming with `stream: true`
- **Message Construction**: System prompts + user context patterns
- **Output Modes**: JSON vs. text content handling
- **Verbose Mode**: Stream-json output with inherited stdio
- **Error Handling**: API errors and network failures

## Input Requirements

- `ANTHROPIC_API_KEY` environment variable (required)
- System prompt defining AI behavior
- User message content (typically codebase context)

## Patterns

### Basic Streaming Call

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function callClaude(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 16000,
    temperature: 1,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    stream: true,
  });

  let fullResponse = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && 
        event.delta.type === 'text_delta') {
      process.stdout.write(event.delta.text);
      fullResponse += event.delta.text;
    }
  }
  
  return fullResponse;
}
```

Use this pattern when you want real-time output visible to users (default for CLI tools).

### Verbose Mode with Stream-JSON

```typescript
// In src/utils/claude.ts
if (verbose) {
  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    stream: true,
  });

  // Inherit stdio for stream-json output
  // Parent process sees raw events
  for await (const event of stream) {
    console.log(JSON.stringify(event));
  }
}
```

Use for debugging or when parent process needs structured events (src/index.ts handles with inherited stdio).

### Contextual Message Construction

```typescript
// src/generators/claude-md.ts pattern
import { scanDirectory, readFileContent } from '../utils/file-system.js';

export async function generateClaudeMd(): Promise<string> {
  const cwd = process.cwd();
  
  // Gather codebase context
  const files = await scanDirectory(cwd);
  const packageJson = await readFileContent(`${cwd}/package.json`);
  const readme = await readFileContent(`${cwd}/README.md`);
  
  // Construct user message
  const userMessage = `
## Project Files
${files.map(f => `- ${f}`).join('\n')}

## package.json
${packageJson}

## README.md
${readme}
`;

  return await callClaude(SYSTEM_PROMPT, userMessage);
}
```

Use this pattern for context-rich API calls where Claude needs project information.

### Environment Variable Validation

```typescript
// src/utils/claude.ts
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Let SDK handle missing key errors naturally
// User sees: "Error: ANTHROPIC_API_KEY is required"
```

Don't pre-validate - let SDK throw descriptive errors.

## Best Practices

1. **Always stream**: CLI tools should show progress immediately
2. **Separate prompts**: Store system prompts in `src/prompts/{skill}.ts`
3. **Use Sonnet 4.5**: Current model optimized for code generation
4. **Set max_tokens high**: 16000 for comprehensive outputs like AGENTS.md
5. **Temperature 1**: Default for creative/varied outputs
6. **Inherit stdio**: For verbose mode, use inherited stdio in CLI (src/index.ts:16)

## Common Pitfalls

- **Buffering output**: Writing to variables then printing loses real-time feedback. Stream to stdout immediately.
- **Hardcoded prompts**: Keep prompts in separate files for versioning and reuse
- **Sync API calls**: All Anthropic SDK methods are async - always use `await`
- **Missing error handling**: Wrap API calls in try/catch for network failures

## Limitations

- **Rate limits**: No built-in retry logic (add exponential backoff if needed)
- **Token limits**: 16k output max - larger docs may truncate
- **No caching**: Each call rescans codebase (future: add context caching)
- **Single model**: Hardcoded to Sonnet 4.5 (future: make configurable)

## References

- [Anthropic TypeScript SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Streaming Messages API](https://docs.anthropic.com/en/api/messages-streaming)
- Project implementation: `src/utils/claude.ts`