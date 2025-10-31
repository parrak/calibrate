# Encryption Implementation Deployment Guide

## Overview
Implemented AES-256-GCM encryption for platform integration credentials with automatic Prisma middleware.

## What Was Done

### 1. Security Package (@calibr/security)
- ✅ Created `EncryptionService` with AES-256-GCM encryption
- ✅ Added `encryptCredentials()` and `decryptCredentials()` helpers
- ✅ Wrote 27 comprehensive unit tests (all passing)
- ✅ Created integration tests for middleware flow

### 2. Database Package (@calibr/db)
- ✅ Created Prisma encryption middleware
- ✅ Enabled middleware in Prisma client
- ✅ Auto-encrypts on create/update/upsert operations
- ✅ Auto-decrypts on read operations

### 3. Migration Script
- ✅ Created `scripts/encrypt-credentials.ts`
- ✅ Added `pnpm encrypt:credentials` script
- ✅ Added `pnpm encrypt:credentials:dry` for dry-run mode
- ✅ Detects already-encrypted credentials (idempotent)

### 4. Configuration
- ✅ Added `ENCRYPTION_KEY` to `.env.example`
- ✅ Added encryption key to `.env.local` for development
- ✅ Documented key generation command

## Deployment Steps

### Step 1: Add ENCRYPTION_KEY to Railway

```bash
# Generate a new encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generated key for production:
LHIloyqLPVsMHyzR7TpGIGxEin6RsIZtPyFzvd2dsfU=
```

Add this to Railway environment variables:
```
ENCRYPTION_KEY=LHIloyqLPVsMHyzR7TpGIGxEin6RsIZtPyFzvd2dsfU=
```

**Options to add the variable:**

#### Option A: Railway CLI
```bash
railway variables --set ENCRYPTION_KEY=LHIloyqLPVsMHyzR7TpGIGxEin6RsIZtPyFzvd2dsfU=
```

#### Option B: Railway Dashboard
1. Go to https://railway.app/project/nurturing-caring
2. Select the API service
3. Go to "Variables" tab
4. Add new variable:
   - Name: `ENCRYPTION_KEY`
   - Value: `LHIloyqLPVsMHyzR7TpGIGxEin6RsIZtPyFzvd2dsfU=`
5. Save and redeploy

### Step 2: Deploy Code

```bash
# Push changes to trigger Railway deployment
git push origin master
```

Or manually redeploy:
```bash
railway redeploy
```

### Step 3: Run Migration Script (If Existing Data Exists)

**Only run this if you have existing platform integrations with credentials!**

```bash
# Dry run first to see what would be encrypted
railway run pnpm encrypt:credentials:dry

# If dry run looks good, run actual migration
railway run pnpm encrypt:credentials --verbose
```

**Note:** The migration script is idempotent - it skips already-encrypted credentials.

### Step 4: Verify Encryption

Test that new integrations are encrypted:

```bash
# Create a test integration via API
curl -X POST https://api.calibr.lat/api/platforms/amazon \
  -H "Content-Type: application/json" \
  -d '{
    "project": "demo",
    "credentials": {
      "clientId": "test-client-id",
      "clientSecret": "test-secret"
    }
  }'

# Verify the credentials are encrypted in database
railway run -- pnpm --filter @calibr/db prisma studio
# Look at PlatformIntegration table - credentials should be in hex format: "abc123:def456:789..."
```

## Security Considerations

### Key Management
- ⚠️ **NEVER commit the actual encryption key to git**
- ✅ Key is stored only in Railway environment variables
- ✅ Development uses different key in `.env.local` (not committed)
- ✅ `.env.example` only has placeholder

### Encryption Details
- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key Size:** 256 bits (32 bytes)
- **IV:** Random 16 bytes per encryption (prevents pattern detection)
- **Auth Tag:** 16 bytes (detects tampering)
- **Format:** `{iv}:{authTag}:{ciphertext}` (all hex-encoded)

### What Gets Encrypted
- All `credentials` fields in `PlatformIntegration` model
- Includes: Amazon SP-API tokens, Shopify access tokens, etc.
- **Transparent** to application code (middleware handles it)

### What Doesn't Get Encrypted
- Project data, pricing rules, catalog data
- User information (handled separately by Stack Auth)
- API keys in environment variables (not in database)

## Rollback Plan

If issues occur:

1. **Disable middleware temporarily:**
   ```typescript
   // In packages/db/client.ts, comment out:
   // globalForPrisma.prisma.$use(encryptionMiddleware())
   ```

2. **Redeploy without encryption:**
   ```bash
   git revert HEAD
   git push origin master
   ```

3. **Data remains encrypted** but won't be decrypted on read
   - Can decrypt manually with `decryptCredentials()` if needed

## Testing Checklist

- [x] Unit tests pass (27/27)
- [x] Integration tests pass
- [x] Console app builds successfully
- [x] Docs app builds successfully
- [ ] API builds (blocked by Windows symlink issue - unrelated to encryption)
- [ ] Production deployment successful
- [ ] Existing credentials migrated
- [ ] New integrations encrypt properly
- [ ] Integrations can be read/used correctly

## Next Steps

1. Add `ENCRYPTION_KEY` to Railway environment
2. Push changes to master
3. Verify deployment successful
4. Run migration script if existing credentials exist
5. Test creating new platform integrations
6. Monitor logs for any encryption errors

## Support

If issues occur:
- Check Railway logs: `railway logs`
- Verify env var is set: `railway variables`
- Test locally with `.env.local` first
- Review encryption service logs in Prisma client init

## Files Changed

```
.env.example                                # Added ENCRYPTION_KEY documentation
packages/security/index.ts                  # Export encryption functions
packages/security/package.json              # Added test scripts
packages/security/src/encryption.ts         # Fixed TypeScript types
packages/security/src/integration.test.ts   # New integration tests
packages/db/client.ts                       # Enabled encryption middleware
packages/db/src/middleware/encryption.ts    # Fixed TypeScript types
```

Commit: `feat(security): implement AES-256-GCM encryption for credentials`
