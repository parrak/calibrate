# Current Status

**Date:** October 25, 2025
**Last Agent:** Codex CLI
**Summary:** Vercel monorepo deploys stabilized; Console UX merged; all custom domains live.

## Today’s Outcomes
- Console UX: sidebar layout, breadcrumbs, loading skeletons, and accessibility updates merged to master.
- Site (calibr.lat) and Console (console.calibr.lat) return 200 after deploy fixes.
- Docs custom domain (docs.calibr.lat) mapped and returns 200; project alias remains available.
- Console Vercel env set: `NEXT_PUBLIC_API_BASE=https://api.calibr.lat`.
- Root lockfile updated to satisfy Vercel frozen-lockfile across sub-app changes.

## Learnings (Monorepo + Vercel)
- Always commit the root `pnpm-lock.yaml` after changing any sub-app’s package.json.
- Tailwind/PostCSS must be production deps for apps using Tailwind (site/docs).
- Next builds may require TypeScript packages even if type errors are ignored (include `typescript`, `@types/react`, `@types/node`).
- If Vercel mis-detects a sub-app as static, add a per-app `vercel.json` to force Next.js framework and monorepo commands.

## Known Issues
- Catalog API lists only by `productCode`; console expects a list view. Consider adding a list endpoint or adapting UI.
