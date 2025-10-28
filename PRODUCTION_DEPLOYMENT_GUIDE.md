# Production Deployment Guide

**Owner:** Agent C
**Last Updated:** October 27, 2025
**Status:** Living Document

---

## Overview

This guide covers all requirements and procedures for deploying Calibrate to production environments.

---

## System Architecture

```
                    Internet
                       |
        ┌──────────────┼──────────────┐
        │              │              │
    Marketing       Console         API
    calibr.lat   console.calibr.lat api.calibr.lat
    (Vercel)        (Vercel)       (Railway)
                                      │
                                  PostgreSQL
                                  (Railway)
```

---

## Current Production Environment

### Services

| Service | URL | Platform | Status |
|---------|-----|----------|--------|
| API | https://api.calibr.lat | Railway | ✅ Operational |
| Console | https://console.calibr.lat | Vercel | ✅ Operational |
| Marketing Site | https://calibr.lat | Vercel | ✅ Operational |
| Docs | https://docs.calibr.lat | Vercel | ✅ Operational |

### Infrastructure

**Database:**
- PostgreSQL 15+ on Railway
- Managed backups (daily)
- Connection pooling enabled

**Runtime:**
- Node.js 20 LTS
- pnpm 9.0 package manager
- Turborepo for monorepo builds

---

## Environment Variables

### API Service (Railway)

#### Required
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Application
NODE_ENV=production
PORT=8080

# Authentication
CONSOLE_INTERNAL_TOKEN=random-secure-token-32-chars

# Security (NEW - see CREDENTIAL_ENCRYPTION_STRATEGY.md)
ENCRYPTION_KEY=base64-encoded-32-byte-key
```

#### Optional
```bash
# Webhook Configuration
WEBHOOK_SECRET=webhook-hmac-secret

# External Services
SHOPIFY_API_KEY=xxx
SHOPIFY_API_SECRET=xxx
AMAZON_SP_API_CLIENT_ID=xxx
AMAZON_SP_API_CLIENT_SECRET=xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
LOG_LEVEL=info
```

### Console Application (Vercel)

#### Required
```bash
# Next.js
NEXT_PUBLIC_API_BASE=https://api.calibr.lat
API_BASE_URL=https://api.calibr.lat

# NextAuth
AUTH_SECRET=random-secure-secret-64-chars
NEXTAUTH_SECRET=same-as-auth-secret
NEXTAUTH_URL=https://console.calibr.lat

# Console → API Authentication
CONSOLE_INTERNAL_TOKEN=same-as-api-token

# Database (for NextAuth sessions)
DATABASE_URL=postgresql://user:pass@host:port/db
```

#### Optional
```bash
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
```

### Marketing Site (Vercel)

```bash
NEXT_PUBLIC_API_BASE=https://api.calibr.lat
NEXT_PUBLIC_CONSOLE_URL=https://console.calibr.lat
NEXT_PUBLIC_DOCS_URL=https://docs.calibr.lat
```

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compiles without errors
- [ ] Linting passes (`pnpm lint`)
- [ ] No console.logs or debug code

### Security
- [ ] Environment secrets rotated
- [ ] No hardcoded credentials
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] SQL injection protections in place

### Database
- [ ] Migrations tested in staging
- [ ] Backup created before migration
- [ ] Rollback plan documented
- [ ] Seed data validated

### Documentation
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Breaking changes noted
- [ ] Changelog updated

---

## Deployment Procedures

### 1. API Deployment (Railway)

#### Automatic Deployment
Railway auto-deploys from `master` branch on push.

```bash
# Push to trigger deployment
git push origin master

# Railway detects changes and:
# 1. Runs `pnpm build`
# 2. Starts server with `pnpm start`
# 3. Health check on /api/health
# 4. Switches traffic to new instance
```

#### Manual Deployment
```bash
# Via Railway CLI
railway up

# Or via Dashboard
# 1. Go to https://railway.app
# 2. Select calibr-api project
# 3. Click "Deploy" → "Deploy Now"
```

#### Post-Deployment Verification
```bash
# Health check
curl https://api.calibr.lat/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2025-10-27T...",
  "database": { "status": "connected" },
  "memory": { "used": 50, "total": 512 }
}

# Test authenticated endpoint
curl https://api.calibr.lat/api/platforms \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Console Deployment (Vercel)

#### Automatic Deployment
Vercel auto-deploys from `master` branch.

```bash
# Push to trigger deployment
git push origin master

# Vercel builds:
# 1. Runs `pnpm build` for console
# 2. Optimizes static assets
# 3. Deploys to edge network
# 4. Updates https://console.calibr.lat
```

#### Manual Deployment
```bash
# Via Vercel CLI
cd apps/console
vercel --prod

# Or via Dashboard
# 1. Go to https://vercel.com/dashboard
# 2. Select calibr-console project
# 3. Go to Deployments tab
# 4. Click "Redeploy"
```

#### Post-Deployment Verification
```bash
# Check homepage loads
curl -I https://console.calibr.lat

# Check login page
curl -I https://console.calibr.lat/login

# Test in browser
# 1. Navigate to https://console.calibr.lat
# 2. Login with test account
# 3. Verify dashboard loads
# 4. Check /p/demo project page
```

---

### 3. Database Migrations

#### Before Migration
```bash
# Create backup
railway db backup create

# Or via Postgres
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

#### Run Migration
```bash
# Development/Staging first
DATABASE_URL=staging_url pnpm prisma migrate deploy

# Verify in staging
curl https://staging-api.calibr.lat/api/health

# Then production
railway run pnpm prisma migrate deploy
```

#### Rollback Plan
```bash
# Revert migration (if needed)
railway run pnpm prisma migrate resolve --rolled-back <migration_name>

# Restore from backup
psql $DATABASE_URL < backup-20251027.sql
```

---

## Monitoring & Health Checks

### API Health Endpoints

**Basic Health**
```bash
GET /api/health
Response: { status: "healthy" | "degraded" | "down" }
```

**Detailed Health**
```bash
GET /api/health?detailed=true
Response: {
  status: "healthy",
  database: { status: "connected", latency: 5 },
  memory: { used: 50, total: 512, percentage: 10 },
  uptime: 3600
}
```

**Database Check**
```bash
GET /api/healthz
Response: 200 OK (simple check)
```

### Monitoring Tools

**Current:**
- Railway built-in metrics (CPU, memory, network)
- Vercel analytics (bandwidth, functions, edge)
- Application logs via Railway/Vercel dashboards

**Recommended (Future):**
- Sentry for error tracking
- DataDog/New Relic for APM
- LogRocket for user session replay
- PagerDuty for alerting

---

## Performance Targets

### API Response Times (p95)
- Health checks: < 100ms
- Database queries: < 500ms
- API endpoints: < 2s
- Complex operations: < 5s

### Console Load Times
- First contentful paint: < 1.5s
- Time to interactive: < 3s
- Largest contentful paint: < 2.5s

### Database
- Connection pool: 10-20 connections
- Query timeout: 30s
- Idle timeout: 300s

---

## Security Hardening

### HTTPS/TLS
- ✅ All services use HTTPS
- ✅ TLS 1.2+ only
- ✅ HSTS headers enabled
- ✅ Certificates auto-renewed (Vercel/Railway)

### API Security
- ✅ CORS configured for console.calibr.lat
- ✅ Rate limiting (100 req/min per IP)
- ✅ Input validation on all endpoints
- ✅ SQL injection protection (Prisma ORM)
- ⏳ Credential encryption (in progress)

### Authentication
- ✅ NextAuth v5 for console
- ✅ JWT tokens (httpOnly cookies)
- ✅ Session expiry (24 hours)
- ⏳ API key rotation system (planned)

### Data Protection
- ✅ Database backups (daily)
- ✅ Encrypted connections (SSL)
- ⏳ Encryption at rest (planned)
- ⏳ Audit logging (planned)

---

## Incident Response

### Severity Levels

**P0 - Critical (15min response)**
- Complete service outage
- Data breach
- Security vulnerability

**P1 - High (1hr response)**
- Major feature broken
- Performance degradation >50%
- Elevated error rates

**P2 - Medium (4hr response)**
- Minor feature broken
- Performance degradation <50%
- Non-critical bugs

**P3 - Low (24hr response)**
- UI issues
- Documentation errors
- Enhancement requests

### Escalation

1. **Detect:** Monitoring alerts or user report
2. **Triage:** Assess severity and impact
3. **Investigate:** Check logs, metrics, recent deployments
4. **Mitigate:** Rollback, hotfix, or workaround
5. **Resolve:** Deploy fix and verify
6. **Postmortem:** Document root cause and prevention

### Rollback Procedure

```bash
# API (Railway)
# 1. Go to Deployments tab
# 2. Find last working deployment
# 3. Click "Redeploy"

# Console (Vercel)
vercel rollback <deployment-url>

# Database (if migration issue)
railway run pnpm prisma migrate resolve --rolled-back <name>
psql $DATABASE_URL < backup.sql
```

---

## Backup & Recovery

### Database Backups

**Automated (Railway):**
- Daily backups (retained 7 days)
- Point-in-time recovery (7 days)

**Manual Backups:**
```bash
# Before major changes
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M).sql

# Restore
psql $DATABASE_URL < backup-20251027-1430.sql
```

### Code Backups
- Git repository (primary source of truth)
- GitHub (remote backup)
- Local clones (team members)

### Environment Variables
- Documented in this file
- Stored in 1Password (encrypted)
- Backed up in Railway/Vercel dashboards

---

## Scaling Considerations

### Vertical Scaling (Current)
- Railway: Increase memory/CPU as needed
- Vercel: Automatic edge scaling

### Horizontal Scaling (Future)
- **API:** Multiple Railway instances with load balancer
- **Database:** Read replicas for query offloading
- **Console:** Vercel handles automatically
- **Background Jobs:** BullMQ with Redis cluster

### Bottlenecks to Watch
- Database connections (pool exhaustion)
- API rate limits to external services
- Memory leaks in long-running processes
- File upload sizes

---

## Compliance & Governance

### Data Retention
- **User Data:** Indefinite (until account deletion)
- **Logs:** 30 days
- **Backups:** 7 days (database), 14 days (Railway)
- **Metrics:** 90 days

### GDPR Compliance
- ⏳ User data export (to implement)
- ⏳ Account deletion flow (to implement)
- ⏳ Cookie consent (to implement)
- ✅ Privacy policy (documented)

### SOC 2 Preparation
- ⏳ Audit logging (to implement)
- ⏳ Access controls (to enhance)
- ✅ Encryption in transit
- ⏳ Encryption at rest (in progress)

---

## Deployment Workflow

### Development → Staging → Production

```mermaid
Feature Branch
     ↓
  (PR Review)
     ↓
   Merge to Master
     ↓
  ┌──────────────────┐
  │ Auto-Deploy      │
  │ • Staging API    │
  │ • Staging Console│
  └──────────────────┘
     ↓
  (QA Testing)
     ↓
  ┌──────────────────┐
  │ Manual Promote   │
  │ • Production API │
  │ • Production Console
  └──────────────────┘
```

**Current:** Auto-deploy to production (master branch)
**Recommended:** Add staging promotion step

---

## Cost Optimization

### Current Costs (Estimated)
- Railway API: $20/month
- Railway PostgreSQL: $10/month
- Vercel (Hobby): $0/month (or Pro $20/month)
- **Total:** ~$30-50/month

### Optimization Strategies
- Monitor usage metrics
- Optimize database queries (N+1 problems)
- Cache frequently accessed data
- Use CDN for static assets (Vercel provides)
- Cleanup unused resources

---

## Troubleshooting Common Issues

### API Not Responding
```bash
# Check Railway status
railway status

# Check logs
railway logs

# Check database connection
railway run pnpm prisma db push --skip-generate
```

### Console 404 Errors
```bash
# Check Vercel deployment
vercel inspect https://console.calibr.lat

# Check environment variables
vercel env pull
```

### Database Connection Errors
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check pool status
# Add to API: /api/health?pool=true

# Restart if needed
railway restart
```

### Build Failures
```bash
# Check build logs in Railway/Vercel dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Dependency installation failures
# - Out of memory (increase limits)
```

---

## Contact & Support

### Team Roles
- **Agent A:** Shopify integration, API development
- **Agent B:** Amazon integration, automation
- **Agent C:** Platform management, deployment, security

### Escalation Path
1. Check this documentation
2. Review logs in Railway/Vercel
3. Check recent deployments for breaking changes
4. Rollback if necessary
5. Document issue for postmortem

---

## Next Steps

### Immediate (This Week)
- [ ] Implement credential encryption
- [ ] Set up staging promotion workflow
- [ ] Add monitoring alerts
- [ ] Document all environment variables

### Short-term (This Month)
- [ ] Implement audit logging
- [ ] Add Sentry error tracking
- [ ] Create runbook for common incidents
- [ ] Performance testing and optimization

### Long-term (Next Quarter)
- [ ] SOC 2 compliance audit
- [ ] Implement automatic scaling
- [ ] Add blue-green deployments
- [ ] Multi-region deployment

---

**Document Status:** Complete
**Last Updated:** October 27, 2025
**Next Review:** Monthly or after major changes

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
