# AGENTS.md (apps/site)

Scope: `calibrate/apps/site` — Marketing/docs Next.js site.

## When Editing
- Keep components simple and static where possible; avoid server-side data fetching.
- Follow existing Tailwind and component structure under `components/`.
- Maintain accessibility (semantic tags, alt text, focus order).

## Validation Before Finishing
- Lint: `pnpm --filter @calibr/site lint`
- Build: `pnpm --filter @calibr/site build`

