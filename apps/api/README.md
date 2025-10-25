# Railway API Service

This directory contains the API service (`apps/api`) and includes deployment helpers for Railway.

See `DEPLOYMENT.md` for detailed Railway deployment instructions. The repo also contains `railway.json` which defines the Railway project configuration and a root `.railwayignore` to limit which apps are deployed from the monorepo.

Required runtime dependencies when deploying to Railway:

- Node.js 20+
- Postgres (managed by Railway)
- `pnpm` (recommended)

Quick start (summary):

```powershell
npm install -g @railway/cli
railway login
railway up
```
