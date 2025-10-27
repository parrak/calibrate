# Claude Token Optimization Guidelines

## Core Principles
1. **Be concise** - Communicate efficiently without unnecessary elaboration
2. **Read selectively** - Only read files directly relevant to the task
3. **Use targeted searches** - Prefer specific patterns over broad searches
4. **Avoid redundancy** - Don't repeat information already in context

## File Operations

### Reading Files
- **ONLY read files that are directly necessary** for the current task
- Use `offset` and `limit` parameters for large files
- Avoid reading documentation/markdown files unless specifically requested
- Don't read node_modules or generated files
- Use Grep with `files_with_matches` first to identify relevant files before reading

### Searching
- Use specific patterns in Grep/Glob instead of broad wildcards
- Prefer `type` parameter in Grep (e.g., `type: "ts"`) over glob patterns
- Use `files_with_matches` mode first, only switch to `content` mode if needed
- Limit results with `head_limit` parameter
- Use Task tool with Explore agent for open-ended searches instead of multiple Grep calls

### Editing
- Make precise, targeted edits using Edit tool
- Batch related changes when possible
- Avoid reading entire files if you know the exact location to edit

## Communication

### Responses
- Keep responses brief and focused on the task
- Avoid unnecessary explanations or elaborations
- Don't repeat information the user already knows
- Skip pleasantries and get straight to the point

### Planning
- Use TodoWrite for complex tasks (3+ steps)
- Keep todo descriptions short and actionable
- Don't create todos for trivial single-step tasks

## Tool Usage

### Parallel Execution
- Always run independent tool calls in parallel
- Example: Run multiple Grep searches simultaneously if they don't depend on each other

### Task Tool
- Use Explore agent for codebase exploration instead of manual searches
- Delegate complex searches to avoid multiple rounds of tool calls

### Bash Commands
- Combine related commands with `&&` when they must run sequentially
- Use single Bash calls instead of multiple separate calls when possible

## Specific to This Project

### Monorepo Structure
- Focus on relevant packages: `apps/console`, `apps/api`, `packages/db`, `packages/shopify-connector`
- Avoid reading shared config files unless specifically needed
- Target specific workspace packages instead of searching across all

### Common Tasks
- **Type errors**: Use `pnpm typecheck` to identify files, then read only those files
- **Build issues**: Check build output first to identify failing packages
- **API changes**: Focus on apps/api and packages/db
- **UI changes**: Focus on apps/console
- **Connector work**: Focus on specific connector package

### Files to Avoid
- Don't read unless specifically needed:
  - `.md` documentation files (except when asked)
  - `node_modules/**`
  - Generated files in `dist/`, `build/`, `.next/`
  - Lock files (`pnpm-lock.yaml`, `package-lock.json`)
  - Configuration files unless debugging config issues

## Error Prevention
- When fixing type errors, read only the files with errors
- Use TypeScript error messages to identify exact locations
- Avoid exploratory reading - be surgical

## Token Budget Awareness
- Current budget: 200k tokens
- Aim to complete tasks in <50k tokens when possible
- If approaching 100k tokens, reassess strategy
- Large file reads can consume 5-20k tokens each - be selective

### Session Limit Checkpoint Protocol
**When approaching 150k tokens (75% of budget), IMMEDIATELY:**

1. **Commit Current Work**
   - Stage and commit all changes made so far with descriptive message
   - Include work-in-progress state if task is incomplete
   - Use git commit message format: `wip: [description] - checkpoint at 150k tokens`

2. **Document Remaining Work**
   - Create or update a TODO.md file listing:
     - Completed steps
     - In-progress work and its state
     - Remaining tasks with specific file locations
     - Any important context or decisions made
     - Known issues or blockers

3. **Inform User**
   - Alert user that session limit is approaching
   - Summarize what's been completed
   - Provide clear handoff instructions for next session
   - Recommend starting fresh session to continue

4. **Stop New Work**
   - Do NOT start new features or major refactors
   - Only complete critical in-progress edits
   - Prioritize checkpoint over new tasks

**Example Checkpoint Message:**
```
⚠️ Session approaching token limit (150k/200k used)

Completed:
- [x] Feature A implementation
- [x] Tests for Feature A

In Progress:
- [ ] Feature B - 60% complete, see TODO.md

Committed changes and created handoff doc. Ready for next session.
```

## Examples

### Good: Targeted Search
```
Grep for "nurturing" with type: "ts" and head_limit: 10
```

### Bad: Broad Search
```
Read all TypeScript files looking for "nurturing"
```

### Good: Parallel Operations
```
Run typecheck, run tests, and check git status in parallel
```

### Bad: Sequential When Not Needed
```
Run typecheck, wait, then run tests, wait, then check git status
```

### Good: Minimal Reading
```
User reports type error in pricing.ts -> Read only pricing.ts
```

### Bad: Exploratory Reading
```
User reports type error in pricing.ts -> Read pricing.ts, types.ts, utils.ts, index.ts
```
