---
name: api-integration
description: This skill should be used when the user asks to 'integrate an API', 'handle streaming responses', 'add authentication', or 'manage API calls'. Covers Claude API integration and streaming patterns.
version: 1.0.0
metadata:
  internal: false
---

# API Integration

Patterns for integrating with the Anthropic Claude API using native fetch and streaming responses.

## Capabilities

- **Streaming API Calls**: Real-time response streaming with stream-json format
- **Message Construction**: System prompts + user context message building
- **Output Modes**: Toggle between JSON stream and buffered text responses
- **Model Configuration**: Claude Sonnet 4.5 with configurable parameters

## Input Requirements

- `ANTHROPIC_API_KEY` environment variable (required)
- System prompt string defining AI behavior
- User context string with codebase/project data

## Patterns

### Basic API Call with Streaming

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function callClaude(
  systemPrompt: string,
  userContext: string,
  verbose: boolean = false
): Promise<string> {
  const stream = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16000,
    temperature: 1,
    system: systemPrompt,
    messages: [{ role: "user", content: userContext }],
    stream: true,
  });

  let fullResponse = "";

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullResponse += event.delta.text;
      if (!verbose) {
        process.stdout.write(event.delta.text);
      }
    }
  }

  return fullResponse;
}
```

### Verbose Mode with stream-json

When `--verbose` flag is used, output raw stream events:

```typescript
if (verbose) {
  // Inherit stdio for real-time stream-json output
  const result = await callClaude(PROMPT, context, true);
} else {
  // Buffer and return clean text
  const result = await callClaude(PROMPT, context, false);
}
```

### Message Construction Pattern

Separate system prompt from user context:

```typescript
// src/prompts/my-feature.ts
export const MY_FEATURE_PROMPT = `
You are a Senior Technical Writer generating...

## GUIDELINES
- Guideline 1
- Guideline 2
`;

// src/generators/my-feature.ts
import { callClaude } from "../utils/claude.js";
import { MY_FEATURE_PROMPT } from "../prompts/my-feature.js";

export async function generateMyFeature(): Promise<string> {
  const userContext = await gatherProjectContext();
  return await callClaude(MY_FEATURE_PROMPT, userContext);
}
```

### Authentication

Always use environment variable, never hardcode:

```typescript
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Required
});

// Validate before making calls
if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable required");
}
```

## Best Practices

1. **Stream by default**: Use `stream: true` for all generation tasks to provide real-time feedback
2. **Separate prompts**: Keep system prompts in `src/prompts/` as version-controlled constants
3. **High token limits**: Use `max_tokens: 16000` for documentation generation (adjust per use case)
4. **Temperature = 1**: Creative generation benefits from full randomness
5. **Handle events properly**: Only process `content_block_delta` with `text_delta` type
6. **Inherit stdio**: Let Node.js handle stdout directly in verbose mode rather than buffering

## Common Pitfalls

- **Buffering full response in verbose mode**: Write to stdout immediately per chunk
- **Forgetting to validate API key**: Check environment variable before instantiating client
- **Mixing output modes**: Choose either stream-json (verbose) or clean text, not both
- **Hardcoding model names**: Use latest model ID from Anthropic docs
- **Not handling async iteration**: Always use `for await` with stream events

## Limitations

- No retry logic implemented (fails fast on API errors)
- No rate limiting or backoff strategies
- Single message format only (no multi-turn conversations)
- Stream mode only (no non-streaming fallback)
- No request caching between runs

## References

- [Anthropic SDK Documentation](https://github.com/anthropics/anthropic-sdk-typescript)
- [Claude API Reference](https://docs.anthropic.com/en/api/messages)
- [Streaming Messages Guide](https://docs.anthropic.com/en/api/messages-streaming)
