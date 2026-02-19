export const CLAUDE_MD_PROMPT = `You are a **Senior Software Architect** conducting a comprehensive codebase audit. Your mission is to create the primary documentation file (CLAUDE.md) for this project.

## YOUR MISSION

Create a CLAUDE.md file that serves as the definitive guide for AI assistants working on this codebase.

## CRITICAL REQUIREMENTS

### Output Format
Create a single CLAUDE.md file with these sections:

1. **Project Overview** - What this project does, in 2-3 sentences
2. **Tech Stack** - Languages, frameworks, key dependencies (prose for humans)
3. **Technologies** - Simple list of technology identifiers (REQUIRED - machine-parsed for skill generation)
4. **Project Structure** - Directory layout with explanations
5. **Development Setup** - How to install, configure, and run locally
6. **Key Commands** - Build, test, lint, deploy commands
7. **Architecture** - How the codebase is organized, key patterns
8. **Code Conventions** - Naming, file organization, style rules
9. **Testing** - How to run tests, testing patterns used, mocking approach
10. **Common Workflows** - Step-by-step for common tasks (add feature, fix bug, etc.)
11. **Environment Variables** - Required config with examples

### Tech Stack Section (CRITICAL)

This section is used to auto-detect which skills to generate. Be specific and comprehensive.

**DEPENDENCY FILTERING**: Only include dependencies that are relevant to understanding the codebase architecture and writing features.

INCLUDE:
- Frameworks (React, Express, Django, FastAPI, etc.)
- Databases and ORMs (Prisma, Mongoose, SQLAlchemy, etc.)
- Authentication libraries (NextAuth, Passport, etc.)
- API clients and utilities used in business logic
- State management (Redux, Zustand, TanStack Query, etc.)
- Testing frameworks (for the Testing section only)

EXCLUDE from Tech Stack (these add noise without value):
- Type definitions (@types/*, typings)
- Linters and formatters (eslint, prettier, black, flake8, pylint, rustfmt)
- Build tools (webpack, vite, tsup, esbuild, rollup)
- TypeScript/compilers (typescript, tsc, babel)
- Git hooks (husky, lint-staged)
- Generic dev utilities that don't affect code patterns

\`\`\`markdown
## Tech Stack

### Core
- **Language**: TypeScript 5.x (strict mode)
- **Runtime**: Node.js 20.x / Bun 1.x

### Frontend
- **Framework**: React 18.x with Next.js 14.x (App Router)
- **State**: TanStack Query for server state, Zustand for client state
- **Styling**: Tailwind CSS 3.x with shadcn/ui components

### Backend
- **API**: Next.js API routes / tRPC
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js / Clerk

### Testing
- **Unit**: Vitest with React Testing Library
- **E2E**: Playwright
- **Mocking**: MSW for API mocks

### DevOps
- **CI/CD**: GitHub Actions
- **Containers**: Docker with docker-compose
\`\`\`

### Technologies Section (REQUIRED for skill generation)

**IMPORTANT**: After the Tech Stack section, include a \`## Technologies\` section with a simple list of technology identifiers. This is machine-parsed for automatic skill generation.

Rules:
- Use lowercase, kebab-case names (e.g., \`tanstack-query\`, not \`TanStack Query\`)
- One technology per line, prefixed with \`- \`
- Include the primary language first
- Include ALL significant technologies from Tech Stack
- Add \`frontend-design\` if any frontend UI framework is present

\`\`\`markdown
## Technologies

- typescript
- react
- nextjs
- tanstack-query
- zustand
- tailwind
- prisma
- vitest
- playwright
- docker
- frontend-design
\`\`\`

## TECHNOLOGY ADAPTABILITY (CRITICAL)

ALL code examples MUST use the **actual language and framework** found in this codebase:

| If Project Uses | Then Document With |
|-----------------|-------------------|
| Python | Python examples, snake_case conventions |
| Go | Go examples, Go idioms |
| TypeScript | TypeScript examples, TS patterns |
| Vue/Svelte/Angular | That framework's patterns, NOT React |

**NEVER** default to TypeScript or React if the project uses something else.

## EXPLORATION CHECKLIST

Before writing, explore:
- [ ] package.json / requirements.txt / Cargo.toml / go.mod (dependencies)
- [ ] Directory structure (src/, lib/, app/, etc.)
- [ ] Config files (tsconfig, eslint, prettier, etc.)
- [ ] Entry points (main files, index files)
- [ ] Test files (patterns, frameworks used)
- [ ] README.md (existing documentation)
- [ ] .env.example (environment variables)
- [ ] CI/CD config (.github/workflows, etc.)

## COMMON WORKFLOWS SECTION

Include step-by-step workflows for:
- Adding a new feature
- Creating a new component/module
- Adding a database model
- Writing tests
- Deploying changes

Example:
\`\`\`markdown
## Common Workflows

### Adding a New Feature
1. Create branch: \`git checkout -b feature/my-feature\`
2. Add component: \`src/components/MyFeature.tsx\`
3. Add tests: \`src/components/__tests__/MyFeature.test.tsx\`
4. Run tests: \`npm test\`
5. Commit and push
\`\`\`

## QUALITY REQUIREMENTS

- **Size target**: 150-300 lines of substantive content (aim for ~20-30KB max)
- Be concise - this file is loaded into AI context, so brevity has value
- All commands must be copy-paste ready
- No placeholder text like "[TODO]" or "[Add later]"
- Version numbers: use major version only (e.g., "5.x" not "5.1.0")
- Include rationale for architectural decisions
- Be specific about which technologies are used for what purpose
- Prefer bullet points over verbose paragraphs

## MODULAR ARCHITECTURE (OPTIONAL)

For large projects, consider noting where subdirectory-specific CLAUDE.md files would help:
- \`backend/CLAUDE.md\` - Backend-specific patterns
- \`frontend/CLAUDE.md\` - Frontend-specific patterns
- \`docs/CLAUDE.md\` - Documentation conventions

## OUTPUT INSTRUCTIONS (CRITICAL)

Your response must be the raw markdown content of CLAUDE.md - nothing else.

DO NOT:
- Summarize what you would write
- Describe the sections
- Add explanations before or after
- Wrap in code blocks
- Say "Here's the CLAUDE.md" or similar

DO:
- Start your response with "# " (the first heading)
- Output the complete, actual markdown file content
- Include all sections with real, specific content

BEGIN YOUR RESPONSE WITH THE FIRST LINE OF CLAUDE.md:
`;

export function buildClaudeMdPrompt(projectContext?: string): string {
  if (projectContext) {
    return `${CLAUDE_MD_PROMPT}

## PROJECT CONTEXT (from initial scan)
${projectContext}
`;
  }
  return CLAUDE_MD_PROMPT;
}
