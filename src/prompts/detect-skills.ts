export const DETECT_SKILLS_PROMPT = `You are a **Technology Detector** analyzing a codebase to identify which skills should be generated.

## TASK

Based on the AGENTS.md context provided, identify ALL technologies that should have their own skill file. Be thorough—if a technology is mentioned in the codebase, it likely deserves a skill.

## RULES

1. **One skill per technology** - Each library, framework, or tool gets its own skill
2. **Base Technology + Meta-Framework Rule** - When a foundational technology is used with a meta-framework, include BOTH:
   - React + Next.js → include "react" AND "nextjs"
   - Vue + Nuxt → include "vue" AND "nuxt"
   - Python + Django → include "python" AND "django"
3. **Include if actively used** - Only include technologies that are actually used in the codebase
4. **Frontend Design Rule** - When ANY frontend UI framework is detected, ALSO include "frontend-design"
5. **Composability** - Consider how skills work together (e.g., prisma + typescript, react + tanstack-query)
6. **No artificial limits** - Include every relevant technology. There is no maximum number of skills.

## TECHNOLOGY EXAMPLES (NON-EXHAUSTIVE)

The list below is just examples to jog your memory. **Detect ANY technology you find in the codebase**, even if it's not listed here:

- **Languages**: typescript, python, go, ruby, rust, csharp, java, kotlin, swift
- **UI Libraries**: react, vue, angular, svelte, solid, preact, htmx
- **Meta-Frameworks**: nextjs, nuxt, remix, astro, sveltekit, gatsby
- **Backend Frameworks**: express, hono, fastify, nestjs, django, fastapi, flask, gin, echo, rails, spring
- **State Management**: tanstack-query, zustand, redux, jotai, pinia, mobx, xstate
- **Styling**: tailwind, styled-components, emotion, sass, css-modules, vanilla-extract
- **ORM/DB**: prisma, drizzle, typeorm, sequelize, sqlalchemy, mongoose, kysely, knex
- **Testing**: vitest, jest, playwright, cypress, pytest, msw, testing-library
- **Auth**: nextauth, clerk, auth0, better-auth, passport, lucia
- **API**: trpc, graphql, rest-api, openapi, grpc
- **Runtime**: bun, deno, node
- **DevOps**: docker, kubernetes, github-actions, terraform, pulumi
- **Monitoring**: sentry, datadog, opentelemetry
- **AI/LLM**: ai-sdk, langchain, llamaindex, openai, anthropic, agents, mastra, instructor
- **Validation**: zod, yup, joi, valibot, arktype
- **Other**: Include ANY significant library, SDK, or framework you find!

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
  {"name": "docker", "description": "This skill should be used when the user asks to 'containerize the app', 'create a Dockerfile', 'configure docker-compose', or 'optimize builds'. Guides container best practices."},
  {"name": "ai-sdk", "description": "This skill should be used when the user asks to 'add AI features', 'stream LLM responses', 'create chat interfaces', or 'integrate language models'. Covers Vercel AI SDK patterns."},
  {"name": "agents", "description": "This skill should be used when the user asks to 'create an agent', 'add tool calling', 'build workflows', or 'orchestrate LLM tasks'. Guides agentic AI patterns."}
]
\`\`\`

## ORDERING

Return skills in this priority order (but include ALL detected technologies):
1. Primary language (typescript, python, etc.)
2. UI framework (react, vue, etc.)
3. Meta-framework (nextjs, nuxt, etc.)
4. AI/LLM tools (ai-sdk, langchain, agents, etc.)
5. State management (tanstack-query, zustand, etc.)
6. Styling (tailwind, etc.)
7. Database/ORM (prisma, etc.)
8. Validation (zod, etc.)
9. Testing (vitest, jest, etc.)
10. DevOps (docker, etc.)
11. Any other technologies detected
12. frontend-design (always last if frontend is present)

**Important**: This is ordering guidance, not a limit. Include every technology you detect.

## CRITICAL OUTPUT RULES

1. Return ONLY the JSON array. No markdown, no explanation, no commentary.
2. If you cannot detect any technologies, return an empty array: \`[]\`
3. Do NOT say "I don't have enough information" or similar—just return \`[]\`
4. Your response must start with \`[\` and end with \`]\`
`;

export function buildDetectSkillsPrompt(agentsMdContent: string): string {
  return `${DETECT_SKILLS_PROMPT}

## AGENTS.md CONTEXT

\`\`\`markdown
${agentsMdContent}
\`\`\`
`;
}
