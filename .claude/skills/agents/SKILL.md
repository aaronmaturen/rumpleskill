---
name: agents
description: This skill should be used when the user asks to 'create an agent', 'add tool calling', 'build workflows', or 'orchestrate AI tasks'. Guides agentic AI patterns and multi-step reasoning.
version: 1.0.0
metadata:
  internal: false
---

# Agents

Patterns for building AI agents with tool calling, streaming responses, and multi-step reasoning workflows.

## Capabilities

- **Claude API Integration**: Streaming message API with system prompts and user context
- **Tool Calling**: Define tools, handle function calls, and orchestrate complex workflows
- **Prompt Engineering**: Structure system prompts for specialized agent behaviors
- **Stream Processing**: Real-time output with JSON vs text modes

## Input Requirements

- **ANTHROPIC_API_KEY**: Environment variable for API authentication
- **System Prompt**: Defines agent role, capabilities, and output format
- **User Context**: File contents, codebase structure, or task-specific data

## Patterns

### Basic Claude API Call

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const stream = await client.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 16000,
  system: systemPrompt,
  messages: [{ role: "user", content: userContext }],
  stream: true,
});
```

Use Sonnet 4.5 as default. Adjust `max_tokens` based on expected output length.

### Streaming with Progress Feedback

```typescript
// src/utils/claude.ts pattern
export async function callClaude(
  systemPrompt: string,
  userContext: string,
  verbose = false
): Promise<string> {
  const stream = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userContext }],
    stream: true,
  });

  let fullResponse = "";

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      const text = event.delta.text;
      fullResponse += text;

      if (verbose) {
        process.stderr.write(text); // Real-time feedback
      }
    }
  }

  return fullResponse;
}
```

Verbose mode writes to stderr so stdout remains clean for piping.

### Prompt Engineering for Generators

```typescript
// src/prompts/claude-md.ts pattern
export const CLAUDE_MD_PROMPT = `
You are a **Senior Technical Writer** generating a focused skill file.

## OUTPUT FORMAT
\`\`\`markdown
---
name: {skill-name}
description: This skill should be used when the user asks to {actions}.
version: 1.0.0
---

# {Title}
...
\`\`\`

## GUIDELINES
- Be concise, Claude is already smart
- Use trigger phrases in description
- Include copy-paste ready code examples
`;
```

Structure prompts with:

1. **Role definition** at the top
2. **Output format** with examples
3. **Guidelines** and constraints
4. **Validation checklist** if needed

### Generator Pattern

```typescript
// src/generators/my-skill.ts
import { callClaude } from "../utils/claude.js";
import { MY_SKILL_PROMPT } from "../prompts/my-skill.js";
import { scanDirectory, readFileContent } from "../utils/file-system.js";

export async function generateMySkill(verbose = false): Promise<string> {
  // 1. Gather context from codebase
  const files = await scanDirectory(".");
  const packageJson = await readFileContent("package.json");

  const context = `
## Project Files
${files.map((f) => `- ${f}`).join("\n")}

## Dependencies
${packageJson}
  `;

  // 2. Call Claude with prompt + context
  return await callClaude(MY_SKILL_PROMPT, context, verbose);
}
```

Generators are pure async functions that return markdown strings.

### CLI Integration

```typescript
// src/index.ts - Adding new agent command
const command = process.argv[2];
const isVerbose = process.argv.includes("--verbose");

if (command === "my-skill") {
  const result = await generateMySkill(isVerbose);
  console.log(result);
  process.exit(0);
}
```

Use direct `process.argv` parsing. Keep CLI logic minimal.

### File Context Gathering

```typescript
// src/utils/file-system.ts patterns
import { readdir, readFile } from "fs/promises";
import { join } from "path";

export async function scanDirectory(
  dir: string,
  ignored = ["node_modules", ".git", "dist"]
): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (ignored.includes(entry.name) || entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await scanDirectory(fullPath, ignored)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}
```

Always exclude build artifacts and hidden files.

## Best Practices

1. **Separate prompts from generators**: Keep `src/prompts/` and `src/generators/` distinct for versioning
2. **Stream by default**: Use `stream: true` for all user-facing outputs to show progress
3. **Verbose mode for debugging**: Write intermediate steps to stderr, final output to stdout
4. **Context over tokens**: Include relevant file contents, but be selective—quality over quantity
5. **Direct function calls**: Import and call generators directly; avoid subprocess spawning overhead
6. **ESM-first**: Use `.js` extensions in imports, top-level await, and native Node.js APIs

## Common Pitfalls

- **Mixing stdout/stderr**: Only write final output to stdout; use stderr for progress/logs
- **Hardcoding model names**: Extract to constants if using multiple models
- **Ignoring stream errors**: Wrap stream consumption in try/catch
- **Over-contextualizing**: Don't send entire codebases—filter to relevant files only
- **Blocking calls**: Always use async/await with fs/promises, never sync fs methods

## Tool Calling (Future Enhancement)

This project doesn't yet implement Claude's tool use API, but the pattern would be:

```typescript
const response = await client.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 4096,
  tools: [
    {
      name: "scan_directory",
      description: "Recursively scans a directory",
      input_schema: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
      },
    },
  ],
  messages: [{ role: "user", content: "Analyze the src/ directory" }],
});

// Check for tool_use blocks in response.content
```

Consider adding tool calling for interactive agents that need file system access.

## Limitations

- No conversation history: Each API call is stateless
- No caching: File scanning repeats on every run
- Single model: Hardcoded to Sonnet 4.5 (good default, but not configurable)
- No retries: API failures are not handled with exponential backoff

## References

- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages)
- [Streaming Messages](https://docs.anthropic.com/en/api/messages-streaming)
- [Tool Use Guide](https://docs.anthropic.com/en/docs/tool-use)
- [Prompt Engineering](https://docs.anthropic.com/en/docs/prompt-engineering)
