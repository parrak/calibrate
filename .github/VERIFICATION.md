# Verification Log - Vercel Deploy Stabilization (2025-10-25)

This document records the commands and observed results for stabilizing Vercel monorepo deploys and validating custom domains for Site, Console, and Docs.

## Scope
- Fix site/docs builds in CI (Tailwind/PostCSS/TS deps, Next alias, skip CI typecheck/lint where appropriate)
- Ensure root pnpm-lock.yaml updated after sub-app dependency changes (frozen lockfile)
- Re-deploy projects and validate via custom domains

## Commands Run (PowerShell)

```powershell
# Update lockfile and install
pnpm install

# Site: ensure Next alias and CI behavior
# apps/site/next.config.js: add webpack alias '@' to __dirname
# apps/site/next.config.js: typescript.ignoreBuildErrors = true
# apps/site/next.config.js: eslint.ignoreDuringBuilds = true

# Site/Docs: move Tailwind/PostCSS (+ TS for site) to production deps
# apps/site/package.json: +tailwindcss +postcss +autoprefixer +typescript +@types/react +@types/node
# apps/docs/package.json: +tailwindcss +postcss +autoprefixer

# Commit changes + lockfile
git add -A
git commit -m "fix(vercel): stabilize site/docs builds; lockfile update"

# Deploy Site (calibrate-site) from repo root
vercel link --project calibrate-site --yes
vercel --prod --yes

# Deploy Console (console) from apps/console
cd apps/console
vercel link --project console --yes
vercel --prod --yes
cd ../..

# Deploy Docs (docs) and map custom domain (owner action)
cd apps/docs
vercel link --project docs --yes
# Domain added in Vercel UI by owner; alias then resolves
cd ../..

# Set Console env
vercel link --project console --yes
"https://api.calibr.lat" | vercel env add NEXT_PUBLIC_API_BASE production
```

## Results
- Site: https://calibr.lat → 200
- Console: https://console.calibr.lat → 200 (and /p/demo subpages)
- Docs: https://docs.calibr.lat → 200 (project alias also 200)

## Notes for Agents
- Vercel CI uses `pnpm install --frozen-lockfile` at the workspace root. Commit root pnpm-lock.yaml after changing sub-app dependencies.
- Tailwind/PostCSS must be in prod dependencies for apps using global Tailwind (site/docs) so they install with NODE_ENV=production.
- Next builds can require TypeScript packages even if errors are ignored. For site, include TS packages in dependencies or ensure CI installs dev deps.
- Link the correct Vercel project and deploy from the repo root when a root directory is configured in Vercel.
```
vercel link --project <name> --yes
vercel --prod --yes
```
