export const DETECT_SKILLS_PROMPT = `You are a **Technology Detector** analyzing a codebase to identify which skills should be generated.

## TASK

Based on the CLAUDE.md context provided, identify ALL technologies that should have their own skill file.

## RULES

1. **One skill per technology** - Each library, framework, or tool gets its own skill
2. **Base Technology + Meta-Framework Rule** - When a foundational technology is used with a meta-framework, include BOTH:
   - React + Next.js → include "react" AND "nextjs"
   - Vue + Nuxt → include "vue" AND "nuxt"
   - Python + Django → include "python" AND "django"
3. **Include if actively used** - Only include technologies that are actually used in the codebase
4. **Frontend Design Rule** - When ANY frontend UI framework is detected, ALSO include "frontend-design"
5. **Composability** - Consider how skills work together (e.g., prisma + typescript, react + tanstack-query)

## COMMON TECHNOLOGIES TO LOOK FOR

- **Languages**: typescript, python, go, ruby, rust, csharp, java
- **UI Libraries**: react, vue, angular, svelte, solid, preact
- **Meta-Frameworks**: nextjs, nuxt, remix, astro, sveltekit
- **Backend Frameworks**: express, hono, fastify, nestjs, django, fastapi, flask, gin, echo
- **State Management**: tanstack-query, zustand, redux, jotai, pinia, mobx
- **Styling**: tailwind, styled-components, emotion, sass, css-modules
- **ORM/DB**: prisma, drizzle, typeorm, sequelize, sqlalchemy, mongoose, kysely
- **Testing**: vitest, jest, playwright, cypress, pytest, msw
- **Auth**: nextauth, clerk, auth0, better-auth, passport
- **API**: trpc, graphql, rest-api, openapi
- **Runtime**: bun, deno, node
- **DevOps**: docker, kubernetes, github-actions, terraform
- **Monitoring**: sentry, datadog, opentelemetry

## OUTPUT FORMAT

Return a JSON array of skills. Each skill has:
- **name**: lowercase, hyphenated (kebab-case) (e.g., "tanstack-query", "frontend-design")
- **description**: MUST use trigger phrase format per Claude Code spec

### Description Format (CRITICAL)

Descriptions MUST follow this pattern:
"This skill should be used when the user asks to [specific actions]. [Brief capability summary]."

**Action verbs to use**: 'create', 'add', 'fix', 'update', 'refactor', 'test', 'style', 'configure', 'deploy', 'debug'

### Examples

\`\`\`json
[
  {"name": "typescript", "description": "This skill should be used when the user asks to 'add types', 'fix type errors', 'create interfaces', or 'improve type safety'. Provides TypeScript patterns and strict mode guidelines."},
  {"name": "react", "description": "This skill should be used when the user asks to 'create a component', 'add a hook', 'manage state', or 'handle events'. Guides React component architecture and patterns."},
  {"name": "nextjs", "description": "This skill should be used when the user asks to 'add a page', 'create an API route', 'configure middleware', or 'optimize performance'. Covers Next.js App Router patterns."},
  {"name": "prisma", "description": "This skill should be used when the user asks to 'add a model', 'create a migration', 'write a query', or 'seed the database'. Defines Prisma schema and query patterns."},
  {"name": "tanstack-query", "description": "This skill should be used when the user asks to 'fetch data', 'cache responses', 'handle loading states', or 'invalidate queries'. Guides data fetching patterns."},
  {"name": "tailwind", "description": "This skill should be used when the user asks to 'style a component', 'add responsive design', 'create a layout', or 'use design tokens'. Provides Tailwind CSS patterns."},
  {"name": "frontend-design", "description": "This skill should be used when the user asks to 'improve the UI', 'add animations', 'fix accessibility', or 'create a design system'. Defines visual design standards."},
  {"name": "vitest", "description": "This skill should be used when the user asks to 'write tests', 'add test coverage', 'mock dependencies', or 'debug failing tests'. Covers testing patterns and strategies."},
  {"name": "docker", "description": "This skill should be used when the user asks to 'containerize the app', 'create a Dockerfile', 'configure docker-compose', or 'optimize builds'. Guides container best practices."}
]
\`\`\`

## ORDERING

Return skills in this priority order:
1. Primary language (typescript, python, etc.)
2. UI framework (react, vue, etc.)
3. Meta-framework (nextjs, nuxt, etc.)
4. State management (tanstack-query, zustand, etc.)
5. Styling (tailwind, etc.)
6. Database/ORM (prisma, etc.)
7. Testing (vitest, jest, etc.)
8. DevOps (docker, etc.)
9. frontend-design (always last if frontend is present)

Return ONLY the JSON array. No markdown, no explanation.
`;

export function buildDetectSkillsPrompt(claudeMdContent: string): string {
  return `${DETECT_SKILLS_PROMPT}

## CLAUDE.md CONTEXT

\`\`\`markdown
${claudeMdContent}
\`\`\`
`;
}
