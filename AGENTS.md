# rumpleskill

A CLI tool for generating AI agent skill definitions from codebases. Scans your project's tech stack, dependencies, and conventions to create structured markdown files that improve AI assistant performance.

## Project Overview

`rumpleskill` analyzes your codebase and generates specialized skill definitions (`.md` files) that AI assistants like Claude can use to better understand your project's patterns, conventions, and workflows. It automatically detects your tech stack and creates context-aware documentation.

## Tech Stack

### Core

- **Language**: TypeScript 5.x (strict mode enabled)
- **Runtime**: Node.js 20.x with native ESM
- **Build Tool**: `tsc` (TypeScript compiler)
- **Process Management**: `tsx` for development

### CLI Framework

- Native Node.js with `process.argv` parsing
- No external CLI framework dependencies

### File System Operations

- Native Node.js `fs/promises` API
- Recursive directory traversal
- JSON and Markdown file parsing

### Development

- **Type System**: TypeScript strict mode with ESM targets
- **Watch Mode**: `tsx watch` for hot reload during development

## Project Structure

```
rumpleskill/
├── src/                      # Source TypeScript files
│   ├── generators/           # Skill file generators
│   │   └── claude-md.ts     # CLAUDE.md generator logic
│   ├── prompts/              # AI prompts for generation
│   │   └── claude-md.ts     # System prompt for CLAUDE.md
│   ├── utils/                # Utility modules
│   │   ├── claude.ts        # Claude API integration
│   │   └── file-system.ts   # File scanning and reading
│   └── index.ts              # CLI entry point
├── dist/                     # Compiled JavaScript (gitignored)
├── AGENTS.md                 # Generated skills documentation
├── CLAUDE.md                 # This file
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- `ANTHROPIC_API_KEY` environment variable set

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file or export:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### Running Locally

```bash
# Development mode with watch
npm run dev:watch

# One-time development run
npm run dev

# Production build and run
npm run build
npm start
```

## Key Commands

| Command              | Purpose                               |
| -------------------- | ------------------------------------- |
| `npm run build`      | Compile TypeScript to `dist/`         |
| `npm start`          | Run compiled CLI from `dist/index.js` |
| `npm run dev`        | Run TypeScript directly with `tsx`    |
| `npm run dev:watch`  | Auto-reload on file changes           |
| `rumpleskill agents` | Generate AGENTS.md file (via CLI)     |

## Architecture

### CLI Entry Point (`src/index.ts`)

Parses command-line arguments and routes to appropriate generator:

- `agents` command → calls `generateClaudeMd()` from generators
- Handles `--verbose` flag for stream-json output with inherited stdio

### Generators Pattern

Each generator is a module in `src/generators/` that:

1. Exports a `generate*()` function
2. Calls Claude API with specialized prompts
3. Returns generated markdown content

### Prompt System

System prompts are stored in `src/prompts/` as separate modules:

- Allows versioning of prompts independently
- Each prompt defines the AI's role and output requirements
- Prompts include technology adaptability instructions

### File System Utilities

`src/utils/file-system.ts` provides:

- `scanDirectory()` - Recursive directory traversal with ignore patterns
- `readFileContent()` - Safe file reading with error handling
- Excludes: `node_modules/`, `.git/`, `dist/`, hidden files

### Claude API Integration

`src/utils/claude.ts` handles:

- Streaming API calls to Claude (Sonnet 4.5)
- JSON vs. text output modes
- Verbose mode with stream-json for real-time progress
- Message construction with system prompts + user context

## Code Conventions

### File Naming

- `kebab-case.ts` for all files
- Generators: `src/generators/{skill-name}.ts`
- Prompts: `src/prompts/{skill-name}.ts`

### Module Pattern

```typescript
// Generators export main generation function
export async function generateClaudeMd(): Promise<string> {
  // Implementation
}

// Prompts export constant strings
export const CLAUDE_MD_PROMPT = `...`;
```

### Error Handling

- Use `try/catch` blocks around file I/O
- Propagate errors to CLI level for user-facing messages
- Log errors to stderr

### Async/Await

- All file operations use `async/await`
- No callbacks or `.then()` chains
- Top-level await enabled via ESM

## Testing

**Current Status**: No test suite implemented yet.

### Planned Testing Approach

- **Unit Tests**: Vitest for generator logic
- **Integration Tests**: Test full CLI commands with fixtures
- **Mocking**: Mock Claude API responses for deterministic tests

### Manual Testing

```bash
# Test AGENTS.md generation in this repo
npm run dev:watch

# Test in another project
cd /path/to/other/project
node /path/to/rumpleskill/dist/index.js agents
```

## Common Workflows

### Adding a New Skill Generator

1. **Create prompt file**:

   ```bash
   touch src/prompts/my-skill.ts
   ```

   ```typescript
   export const MY_SKILL_PROMPT = `
   You are an expert at generating...
   `;
   ```

2. **Create generator**:

   ```bash
   touch src/generators/my-skill.ts
   ```

   ```typescript
   import { callClaude } from "../utils/claude.js";
   import { MY_SKILL_PROMPT } from "../prompts/my-skill.js";

   export async function generateMySkill(): Promise<string> {
     const context = await gatherContext();
     return await callClaude(MY_SKILL_PROMPT, context);
   }
   ```

3. **Add CLI command**:
   Edit `src/index.ts` to add new command routing

4. **Test**:
   ```bash
   npm run dev -- my-skill
   ```

### Modifying the Claude API Integration

1. **Edit** `src/utils/claude.ts`
2. **Update** model parameters, streaming logic, or message construction
3. **Test** with verbose flag:
   ```bash
   npm run dev -- agents --verbose
   ```

### Releasing a New Version

1. **Build**: `npm run build`
2. **Test**: `npm start` to verify compiled output
3. **Version**: Update `package.json` version
4. **Commit**: `git commit -am "Release v1.x.x"`
5. **Tag**: `git tag v1.x.x`
6. **Publish**: `npm publish` (if publishing to npm)

## Environment Variables

| Variable            | Required | Description        | Example            |
| ------------------- | -------- | ------------------ | ------------------ |
| `ANTHROPIC_API_KEY` | Yes      | API key for Claude | `sk-ant-api03-xxx` |

### Setting Up

```bash
# Option 1: Export in shell
export ANTHROPIC_API_KEY=sk-ant-api03-xxx

# Option 2: Add to ~/.bashrc or ~/.zshrc
echo 'export ANTHROPIC_API_KEY=sk-ant-api03-xxx' >> ~/.bashrc

# Option 3: Use .env file (requires dotenv loader)
# Currently NOT supported - must use shell environment
```

## Development Philosophy

### Minimal Dependencies

This project intentionally avoids frameworks to:

- Keep the tool lightweight and fast
- Reduce supply chain security risks
- Make the codebase easy to audit and understand

### AI-First Documentation

The primary output (AGENTS.md, CLAUDE.md) is optimized for AI consumption:

- Structured markdown with clear sections
- Technology-agnostic prompts that adapt to any stack
- Includes "why" not just "what" in generated docs

### Streaming by Default

CLI uses inherited stdio for real-time feedback:

- Users see generation progress immediately
- No buffering delays for large outputs
- Verbose mode shows stream-json for debugging

## Future Enhancements

Potential additions (not yet implemented):

- Multiple skill types beyond CLAUDE.md
- Custom prompt templates via config files
- Interactive CLI with prompts (using inquirer or similar)
- Caching of scanned codebase context
- Plugin system for custom generators
