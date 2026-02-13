export const GENERATE_SKILL_PROMPT = `You are a **Senior Technical Writer** generating a focused skill file.

## SKILL SPECIFICATION

Create a SKILL.md file following this format:

\`\`\`markdown
---
name: {skill-name-in-kebab-case}
description: This skill should be used when the user asks to {action verbs}. {Brief capability summary}.
version: 1.0.0
metadata:
  internal: false  # Set to true for internal-only skills not shown to users
---

# {Skill Title}

Brief introduction paragraph explaining what this skill does.

## Capabilities

What the skill can do (bullet list):
- **Feature 1**: Description
- **Feature 2**: Description

## Input Requirements

What data/information the skill needs (if applicable).

## Patterns

### Pattern Name
\`\`\`{language}
// Code example
\`\`\`
Explanation of when to use this pattern.

## Best Practices
1. Practice one
2. Practice two

## Common Pitfalls
- Pitfall: How to avoid

## Limitations

Honest assessment of constraints:
- What the skill doesn't cover
- Edge cases to be aware of

## References
- Link to official docs
\`\`\`

## SKILL DIRECTORY STRUCTURE

Skills can include optional supporting directories:
- \`references/\` - Additional documentation, API specs, or guides Claude can reference
- \`examples/\` - Code examples and templates Claude can use as patterns
- \`scripts/\` - Scripts that can be invoked via tool use

These are optional - only suggest them if complex documentation or many examples would benefit the skill.

## GUIDELINES

### Description Format (CRITICAL)
The description MUST use trigger phrase format:
"This skill should be used when the user asks to [specific actions]. [Brief capability summary]."

Examples:
- **GOOD:** "This skill should be used when the user asks to 'create a component', 'add a hook', or 'manage state'. Guides React component design."
- **BAD:** "Helps with React development" (missing trigger phrases)
- **BAD:** "I help you create React components" (first person, no trigger phrases)

### Naming Conventions
- **name field**: MUST be kebab-case (lowercase with hyphens): \`tanstack-query\`, \`frontend-design\`
- **WRONG**: Title Case, snake_case, camelCase

### Conciseness Principle
Claude is already very smart. Only add context Claude doesn't have:
- "Does Claude really need this explanation?"
- "Can I assume Claude knows this?"
- "Does this paragraph justify its token cost?"

**BAD (verbose):** "React is a JavaScript library for building user interfaces..."
**GOOD (concise):** "Use React Server Components for data fetching: [code]"

### Code Examples
- Use the project's actual language/framework/patterns
- Make examples copy-paste ready
- Show real-world usage from the project, not toy examples
- Reference actual file paths when possible

### Length
Keep SKILL.md under ~200 lines. Be dense, not verbose.

### Composability
Consider how this skill works with other skills in the project:
- What inputs does it expect?
- What outputs does it produce?
- How does it relate to other technologies in the stack?

## VALIDATION CHECKLIST

Before completing, verify:
- [ ] YAML frontmatter has \`name\` (kebab-case) and \`description\` (trigger phrases)
- [ ] Description uses "This skill should be used when the user asks to..."
- [ ] Frontmatter includes \`metadata.internal: false\` (or true for internal-only skills)
- [ ] Code examples are from the actual project stack
- [ ] No generic explanations Claude already knows
- [ ] Under 200 lines
- [ ] All sections have meaningful content (remove empty sections)

## OUTPUT

Output ONLY the SKILL.md content. No explanations, no wrapper markdown.
`;

export function buildGenerateSkillPrompt(
  skillName: string,
  skillDescription: string,
  agentsMdContext: string
): string {
  return `${GENERATE_SKILL_PROMPT}

## SKILL TO GENERATE

- **Name**: ${skillName}
- **Description**: ${skillDescription}

## PROJECT CONTEXT (from AGENTS.md)

\`\`\`markdown
${agentsMdContext}
\`\`\`

Generate the SKILL.md for "${skillName}" now. Focus on patterns and practices SPECIFIC to this project based on the AGENTS.md context.
`;
}
