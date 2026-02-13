<p align="center">
  <img src="logo.png" alt="rumpleskill logo">
</p>

# rumpleskill

_Spin your codebase into golden Claude Code skills._

A local tool that automatically detects your tech stack and generates Claude Code skills for your projects. Uses Claude Code CLI directly - no external API required.

## Prerequisites

- Node.js 18+
- [Claude Code CLI](https://claude.ai/code) installed and authenticated

## Installation

```bash
# Clone or copy the project
cd rumpleskill

# Install dependencies
npm install

# Build
npm run build

# Link globally (optional)
npm link
```

## Usage

```bash
# Generate everything (AGENTS.md, CLAUDE.md, and skills)
rumpleskill -p /path/to/project

# Generate AGENTS.md + CLAUDE.md only
rumpleskill agents -p /path/to/project

# Generate skill files only (requires AGENTS.md to exist)
rumpleskill skills -p /path/to/project

# Preview which skills would be generated (dry run)
rumpleskill detect -p /path/to/project

# Use a different model
rumpleskill -p /path/to/project --model haiku

# Generate skills for multiple agents
rumpleskill --all-agents
rumpleskill -a cursor,cline
```

## Commands

| Command  | Description                            |
| -------- | -------------------------------------- |
| _(none)_ | Generate everything (default)          |
| `agents` | Generate AGENTS.md + CLAUDE.md only    |
| `skills` | Generate skill files only              |
| `detect` | Preview skills that would be generated |

## Options

| Option                 | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `-p, --project <path>` | Project root directory (default: current dir)             |
| `-m, --model <model>`  | Claude model: `sonnet`, `haiku`, `opus` (default: sonnet) |
| `-f, --force`          | Overwrite existing files                                  |
| `-v, --verbose`        | Show Claude's output in real-time                         |
| `-a, --agents <list>`  | Target agents (comma-separated)                           |
| `--all-agents`         | Install to all 12 supported agents                        |
| `--copy`               | Copy files instead of symlinking                          |
| `-h, --help`           | Show help                                                 |

## How It Works

1. **agents**: Scans your project and generates `AGENTS.md` (comprehensive project docs) + `CLAUDE.md` (simple reference to AGENTS.md)
2. **detect**: Analyzes AGENTS.md to identify which technologies should have skills
3. **skills**: Generates individual SKILL.md files for each detected technology

This approach lets you maintain one source of truth (AGENTS.md) that works with both OpenAI Codex CLI and Claude Code.

All AI generation happens locally through Claude Code CLI - your code never leaves your machine (beyond normal Claude Code operation).

## Output Structure

```
your-project/
├── AGENTS.md              # Primary project documentation
├── CLAUDE.md              # References AGENTS.md
└── .claude/
    └── skills/
        ├── typescript/
        │   └── SKILL.md
        ├── react/
        │   └── SKILL.md
        └── frontend-design/
            └── SKILL.md
```

## Using Skills in Claude Code

Once generated, skills are automatically available in Claude Code. Here's how to use them:

### Invoke with Slash Commands

Type `/<skill-name>` to invoke a skill directly:

```
/typescript
/react
/cli-development
```

### Pass Arguments

Skills can accept arguments for context:

```
/typescript add types to src/utils/helpers.ts
/fix-issue 123
```

### Automatic Invocation

Claude Code can automatically invoke skills based on their descriptions. When you ask Claude to do something that matches a skill's description, it may use that skill to guide its response.

To prevent automatic invocation, skills can include `disable-model-invocation: true` in their frontmatter.

### Discover Available Skills

- Type `/` to see skill suggestions
- Run `/help` to list all available skills

### Learn More

For comprehensive documentation on Claude Code skills, see the [official skills documentation](https://docs.anthropic.com/en/docs/claude-code/skills).

## Supported Agents

rumpleskill can generate skills for multiple AI coding assistants:

| Agent          | Directory                 |
| -------------- | ------------------------- |
| Claude Code    | `.claude/skills/`         |
| Cursor         | `.cursor/skills/`         |
| Cline          | `.cline/skills/`          |
| Windsurf       | `.windsurf/skills/`       |
| GitHub Copilot | `.github/copilot/skills/` |
| Continue       | `.continue/skills/`       |
| Codex CLI      | `.codex/skills/`          |
| OpenCode       | `.opencode/skills/`       |
| Roo            | `.roo/skills/`            |
| Amp            | `.amp/skills/`            |
| Gemini CLI     | `.gemini/skills/`         |
| Goose          | `.goose/skills/`          |

Use `--all-agents` to generate for all, or `-a cursor,cline` for specific agents.

## Why "rumpleskill"?

Like Rumpelstiltskin spinning straw into gold, this tool spins your codebase into valuable Claude Code skills - automatically detecting your tech stack and generating skill files that help Claude understand your project's patterns and conventions.

## License

MIT
