# AGENTS.md (apps/console)

Scope: `calibrate/apps/console` — Next.js app for the console UI.

## When Editing
- Use and extend shared UI from `@calibr/ui` where possible.
- Keep server/client component boundaries explicit; prefer server components unless interactivity is needed.
- Co-locate styles with components; Tailwind is preferred for styling.
- Keep route structure and layouts consistent with existing pages under `app/`.

## Integration
- API access via existing helpers in `lib/` and `api-client.ts`.
- Auth uses NextAuth; do not introduce custom session handling.

## Validation Before Finishing
- Lint: `pnpm --filter @calibr/console lint`
- Build: `pnpm --filter @calibr/console build`

