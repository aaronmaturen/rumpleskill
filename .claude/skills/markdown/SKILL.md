---
name: markdown
description: This skill should be used when the user asks to 'generate Markdown', 'create documentation', 'structure content', or 'format skill definitions'. Covers Markdown generation and structured documentation patterns.
version: 1.0.0
metadata:
  internal: false
---

# Markdown Generation

Guides structured Markdown generation for skill definitions, documentation, and AI-optimized content following `rumpleskill` conventions.

## Capabilities

- **YAML Frontmatter**: Structured metadata for skill files with required fields
- **Skill Definition Format**: Standardized `.md` structure for AI consumption
- **Code Block Formatting**: Language-specific fenced code blocks with proper indentation
- **Structured Sections**: Consistent heading hierarchy and section organization
- **Token-Efficient Content**: Dense, high-signal documentation without verbose explanations

## Input Requirements

For skill generation:

- Skill name (kebab-case)
- Trigger phrases (action verbs users would say)
- Project-specific patterns from codebase analysis
- Technology stack context from `AGENTS.md`

## Patterns

### YAML Frontmatter (Required)

```yaml
---
name: my-skill-name
description: This skill should be used when the user asks to 'action one', 'action two', or 'action three'. Brief capability summary.
version: 1.0.0
metadata:
  internal: false
---
```

**Rules**:

- `name` MUST be kebab-case (lowercase with hyphens)
- `description` MUST start with "This skill should be used when the user asks to"
- Include quoted trigger phrases users would naturally say
- `metadata.internal` determines visibility (false = user-facing)

### Skill Section Structure

````markdown
# Skill Title

One-paragraph introduction.

## Capabilities

- **Feature**: Description
- **Feature**: Description

## Patterns

### Pattern Name

```language
// Actual project code
```
````

Explanation of when/how to use.

## Best Practices

1. Project-specific convention
2. Another convention

## Limitations

- Honest constraints
- Edge cases

````

**Keep under 200 lines** - remove empty sections, be concise.

### Code Blocks

```typescript
// GOOD: Project-specific, copy-paste ready
import { callClaude } from "../utils/claude.js";

export async function generateMySkill(): Promise<string> {
  const context = await gatherContext();
  return await callClaude(PROMPT, context);
}
````

**Rules**:

- Always specify language after opening fence
- Use actual file paths from the project when possible
- Show real patterns, not toy examples
- Include ESM `.js` extensions in TypeScript imports

### Table Formatting

```markdown
| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Value    | Value    | Value    |
```

Use tables for:

- Environment variables
- Command references
- Configuration options

### List Conventions

```markdown
## Unordered (Features/Capabilities)

- **Bold Label**: Description text
- **Bold Label**: Description text

## Ordered (Workflows/Steps)

1. **Action**: Explanation
2. **Action**: Explanation

## Nested (Complex Patterns)

- Top level
  - Sub-item with 2-space indent
  - Another sub-item
```

## Best Practices

1. **Token Efficiency**: Ask "Does Claude need this?" before adding explanations
2. **Project Context**: Reference actual files, functions, and patterns from the codebase
3. **Trigger Phrases**: Use verbs users would naturally say ("create a component", "fix types")
4. **No Generic Content**: Avoid explaining what React/TypeScript/Node is - Claude knows
5. **Code Over Prose**: Show patterns with code examples, not paragraphs
6. **Kebab-Case Names**: All skill names lowercase with hyphens (`tanstack-query`, not `TanStackQuery`)

## Common Pitfalls

- **Missing Trigger Phrases**: Description must include "when the user asks to [actions]"
- **Wrong Name Format**: Using camelCase or Title Case instead of kebab-case
- **Verbose Explanations**: Adding content Claude already knows wastes tokens
- **Generic Examples**: Showing toy code instead of project-specific patterns
- **Empty Sections**: Include only sections with meaningful content

## Limitations

- Markdown is for AI consumption - optimize for Claude, not human readability
- Cannot include interactive elements or dynamic content
- YAML frontmatter must be valid - syntax errors break parsing
- Code blocks cannot be nested within code blocks
- Table formatting requires consistent column alignment

## References

- GitHub Flavored Markdown (CommonMark spec)
- YAML 1.2 specification for frontmatter
- `src/prompts/skill-template.ts` - Template used by this project's generator
