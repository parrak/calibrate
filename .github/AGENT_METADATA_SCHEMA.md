# Agent Metadata Schema

Automated agents should include a small metadata block in PR bodies or commit footers so other agents and reviewers can trace the origin of changes.

Recommended JSON schema (informational):

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AgentMetadata",
  "type": "object",
  "properties": {
    "agent": { "type": "string", "description": "Agent name, e.g., gpt-4o, codex, claude" },
    "version": { "type": "string", "description": "Agent/tool version" },
    "contextId": { "type": "string", "description": "UUID or run id for traceability" },
    "promptSeed": { "type": "string", "description": "Short description or filename of the prompt used" },
    "timestamp": { "type": "string", "format": "date-time" },
    "filesTouched": { "type": "array", "items": { "type": "string" } },
    "decisionNotes": { "type": "string", "description": "Short notes on trade-offs/assumptions" }
  },
  "required": ["agent","contextId","timestamp"]
}
```

Example to paste into PR body (copy-paste JSON block):

```json
{
  "agent": "gpt-4o",
  "version": "2025-10-25",
  "contextId": "9f2b8d7a-1234-4abc-8d9f-0a1b2c3d4e5f",
  "promptSeed": "add-daily-budget-policy.md",
  "timestamp": "2025-10-25T12:34:56Z",
  "filesTouched": [
    "packages/pricing-engine/evaluatePolicy.ts",
    "packages/pricing-engine/evaluatePolicy.test.ts",
    "CHANGELOG.md"
  ],
  "decisionNotes": "Allowed any positive proposedAmount when currentAmount===0 to permit initial prices; added dailyBudgetPct enforcement"
}
```

Guidelines
- Include this metadata when an automated agent authored or substantially edited a PR.
- Keep `decisionNotes` short (one paragraph) and reference the PR/issue when applicable.
- Humans may include a similar block for traceability, but it is optional for manual PRs.
