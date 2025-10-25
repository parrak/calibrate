# Deployment Status

**Last Updated:** October 24, 2025
**Status:** ✅ All Services Operational

## Production Deployments

### API Service (Railway)
- **URL:** https://api.calibr.lat
- **Status:** ✅ Live and healthy
- **Platform:** Railway
- **Runtime:** Node.js 20 (Debian Slim)
- **Database:** PostgreSQL (Railway managed)
- **Latest Commit:** `1a0532c`
- **Health Check:** https://api.calibr.lat/api/health

**Environment Variables:**
- `DATABASE_URL`: Provided by Railway PostgreSQL service
- `WEBHOOK_SECRET`: Configured
- `NODE_ENV`: production
- `PORT`: 8080 (Railway managed)

**Database Status:**
- Schema: Up to date
- Migrations: All applied
- Seed Data: Loaded (demo project, products, SKUs)

### Console (Vercel)
- **URL:** https://console.calibr.lat
- **Status:** ✅ Live
- **Platform:** Vercel
- **Latest Deployment:** Successful
- **Branch:** master

**Features Deployed:**
- Dashboard view
- Price Changes management
- Catalog browser
- Competitor monitoring

**Known Issues:**
- None

### Site (Vercel)
- **URL:** https://calibr.lat
- **Status:** ✅ Live
- **Platform:** Vercel

### Docs (Vercel)
- **URL:** https://docs.calibr.lat
- **Status:** ✅ Live
- **Platform:** Vercel

## Recent Deployment History

### October 24, 2025 - Phase 2: API & Backend Deployment

**Commits:**
- `1a0532c` - Fix Prisma binary targets for Debian (node:20-slim)
- `3d9398e` - Fix OpenSSL compatibility and body double-read issue
- `d1288e1` - Implement Next.js standalone output for Docker
- `34d5552` - Fix pnpm workspace command for Railway
- `7750504` - Remove channel filtering from competitor rules
- `918bb94` - Fix webhook verifyHmac signature

**Issues Resolved:**
1. ✅ Prisma OpenSSL compatibility (Alpine → Debian)
2. ✅ Request body double-read in webhook verification
3. ✅ Prisma binary targets (linux-musl → debian-openssl-3.0.x)
4. ✅ Container startup with pnpm monorepo
5. ✅ Next.js standalone output for optimal Docker builds
6. ✅ TypeScript errors in competitor monitoring
7. ✅ verifyHmac function signature mismatches

**Database Migrations:**
- All migrations applied successfully
- Demo data seeded

**Testing:**
- ✅ Health check endpoint responding
- ✅ API routes accessible
- ✅ Database connections working
- ✅ Webhook HMAC verification functional

## Deployment Configuration

### Docker Configuration (Railway)

**Dockerfile:**
- Base Image: `node:20-slim` (both builder and runner)
- OpenSSL: Installed in both stages
- Build: Multi-stage with standalone Next.js output
- Runtime: Node.js with standalone server
- User: Non-root (nextjs:nodejs)

**Key Docker Decisions:**
- Switched from Alpine to Debian Slim for Prisma compatibility
- Implemented Next.js standalone output to bundle all dependencies
- Simplified CMD to `node apps/api/server.js` for reliability

### Prisma Configuration

**Binary Targets:**
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

**Important:** Must use `debian-openssl-3.0.x` when deploying with `node:20-slim`

### Railway Service Configuration

**File:** `railway.toml` (root)
```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"
watchPaths = ["apps/api/**", "packages/**", "Dockerfile"]

[deploy]
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**Note:** No custom `startCommand` - uses Dockerfile CMD

## Monitoring & Health

### Health Checks
- **API:** https://api.calibr.lat/api/health
- **Response:** `{"status":"ok","timestamp":"...","service":"calibr-api"}`
- **Interval:** Railway checks every 30s

### Logs
Access via Railway CLI:
```bash
railway logs --service @calibr/api
```

Or via Railway dashboard: Deployments → Deploy Logs

## Troubleshooting

### Common Issues

**1. Prisma Client Errors**
- **Symptom:** `libssl.so.1.1: No such file or directory`
- **Solution:** Ensure `debian-openssl-3.0.x` in schema.prisma and using `node:20-slim`

**2. Body Already Read**
- **Symptom:** `TypeError: Body is unusable: Body has already been read`
- **Solution:** verifyHmac now returns body in result - use `authResult.body`

**3. Node Modules Missing**
- **Symptom:** `sh: next: not found` or `node_modules missing`
- **Solution:** Use Next.js standalone output - bundles all dependencies

**4. Railway Build Fails**
- **Symptom:** Build errors during `prisma generate`
- **Solution:** Check binary targets match Docker base image

### Deployment Checklist

Before deploying:
- [ ] All tests passing locally
- [ ] Database migrations tested locally
- [ ] Environment variables configured in Railway/Vercel
- [ ] Docker build succeeds locally
- [ ] Health check endpoint accessible

After deploying:
- [ ] Health check returns 200 OK
- [ ] Database migrations applied
- [ ] API endpoints responding
- [ ] Logs show no errors
- [ ] Custom domains resolving correctly

## Rollback Procedure

If deployment fails:

```bash
# Via Railway dashboard
# Go to Deployments → Find last working deployment → Click "Redeploy"

# Or via CLI
railway status  # Get deployment ID
railway rollback <deployment-id>
```

## Next Steps

**Planned Improvements:**
- [ ] Add seed data script to Railway deployment
- [ ] Set up CI/CD with GitHub Actions
- [ ] Add monitoring and alerting
- [ ] Implement rate limiting
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up staging environment

## Contact

For deployment issues or questions, refer to:
- API Deployment Guide: `apps/api/DEPLOYMENT.md`
- Main README: `README.md`
- Architecture Docs: `docs/architecture.md`
