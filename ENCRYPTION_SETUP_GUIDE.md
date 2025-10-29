# Encryption Setup Guide

**Date:** October 27, 2025
**Status:** Ready to Deploy

---

## Encryption Key

**⚠️ SECURITY WARNING:**
- Production key should ONLY be stored in:
  - Railway environment variables
  - 1Password (encrypted backup)
  - NEVER in code, documentation, or git
- Use different keys for dev/staging/production
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

---

## Deployment Steps

### 1. Railway (Production API)

Add environment variable:

```bash
# Via Railway Dashboard:
1. Go to https://railway.app/project/[your-project]
2. Click "Variables" tab
3. Add new variable:
   Name:  ENCRYPTION_KEY
   Value: [paste production key from 1Password]
4. Click "Deploy"
```

Or via CLI:
```bash
railway variables set ENCRYPTION_KEY=[paste-key-here]
```

### 2. Migrate Existing Credentials

**⚠️ IMPORTANT:** Run on staging first!

```bash
# Connect to database
railway link

# Dry run (no changes)
railway run pnpm tsx scripts/encrypt-credentials.ts --dry-run --verbose

# Review output, then run for real
railway run pnpm tsx scripts/encrypt-credentials.ts --verbose
```

**Expected Output:**
```
🔐 Credential Encryption Migration
===================================
Mode: LIVE

Found 2 integrations with credentials

✅ Encrypted shopify (abc123)
✅ Encrypted amazon (def456)

Migration Summary
=================
Total integrations: 2
Encrypted: 2
Skipped (already encrypted): 0
Errors: 0

✅ Migration completed successfully!
```

### 3. Verify Encryption Works

Test API can decrypt:

```bash
# Health check
curl https://api.calibr.lat/api/health

# List platforms (requires decryption)
curl https://api.calibr.lat/api/platforms
```

Should return platforms list without errors.

### 4. Development Setup

For local development:

```bash
# RECOMMENDED: Use separate key for development
DEV_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
echo "ENCRYPTION_KEY=$DEV_KEY" >> .env.local

# Then migrate dev database with dev key
ENCRYPTION_KEY=$DEV_KEY pnpm tsx scripts/encrypt-credentials.ts
```

**Recommendation:** Use separate dev key, migrate dev database separately.

### 5. Staging Setup

Same process as production but with staging key:

```bash
# Generate staging key
STAGING_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")

# Add to Railway staging project
railway variables set ENCRYPTION_KEY=$STAGING_KEY

# Migrate staging database
railway run pnpm tsx scripts/encrypt-credentials.ts
```

---

## Backup & Recovery

### Backup Key

**Store in 1Password:**

```
Title: Calibrate Encryption Key - Production
Type: Password
Username: production
Password: [paste generated key here]
URL: https://railway.app
Notes:
  Generated: [date]
  Environment: Production
  Purpose: Platform credential encryption
  Algorithm: AES-256-GCM
  Next rotation: [3 months from generation]
```

### Database Backup

Before migration:

```bash
# Railway
railway db backup create

# Or manual
pg_dump $DATABASE_URL > backup-encryption-$(date +%Y%m%d).sql
```

### Restore If Needed

```bash
# Set encryption key to match backup date
# (retrieve from 1Password for that date)
export ENCRYPTION_KEY=[key-from-backup-date]

# Restore
psql $DATABASE_URL < backup-encryption-20251027.sql
```

---

## Verification Checklist

After deployment:

- [ ] `ENCRYPTION_KEY` added to Railway
- [ ] API service restarted
- [ ] Migration script ran successfully
- [ ] No decryption errors in logs
- [ ] `/api/platforms` endpoint works
- [ ] `/api/health` shows healthy
- [ ] Key backed up in 1Password
- [ ] Team notified of deployment

---

## Troubleshooting

### Error: "ENCRYPTION_KEY environment variable not set"

**Solution:** Add `ENCRYPTION_KEY` to Railway variables and restart.

### Error: "Encryption key must be 32 bytes"

**Solution:** Key must be exactly 32 bytes when base64-decoded. Regenerate:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Error: "Failed to decrypt credentials"

**Possible causes:**
1. Wrong encryption key (check it matches what was used to encrypt)
2. Credentials not yet migrated (run migration script)
3. Database restored from backup (ensure key matches backup era)

**Debug:**
```bash
# Check if credentials are encrypted (format: hex:hex:hex)
railway run psql $DATABASE_URL -c "SELECT id, platform, credentials FROM \"PlatformIntegration\" LIMIT 1"
```

### Migration Failed

**Recovery:**
1. Restore from backup
2. Check encryption key is correct
3. Run migration with `--verbose` flag
4. Review error messages
5. Contact team if needed

---

## Next Steps

After encryption is deployed:

1. ✅ Credential encryption at rest - **COMPLETE**
2. ⏳ Implement audit logging
3. ⏳ Add rate limiting middleware
4. ⏳ Set up monitoring (Phase 1)
5. ⏳ Configure alerts

---

## Security Notes

### Key Rotation Schedule

- **Production:** Rotate every 3 months (next: January 27, 2026)
- **Staging:** Rotate when production rotates
- **Development:** Rotate on team member changes

### Access Control

**Who has access to production key:**
- DevOps lead (Railway admin)
- CTO/Security officer (1Password)
- On-call engineer (1Password emergency access)

**Grant access:** Add to Railway project team
**Revoke access:** Remove from Railway + rotate key

### Compliance

- ✅ **GDPR:** Credentials encrypted at rest
- ✅ **SOC 2:** AES-256 encryption, key management documented
- ✅ **PCI DSS:** Strong cryptography (256-bit keys)
- ⏳ **Audit:** Log key access (future enhancement)

---

**Document Generated:** October 27, 2025
**Key Generated:** October 27, 2025
**First Use:** Production deployment
**Next Review:** January 27, 2026 (key rotation)

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
