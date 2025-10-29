# Key Management Guide

**Package:** @calibr/security
**Last Updated:** October 27, 2025

---

## Overview

This guide covers encryption key generation, storage, rotation, and emergency procedures for the Calibrate platform.

---

## Generating Encryption Keys

### Production Key Generation

```bash
# Generate a secure 32-byte (256-bit) key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Example output:
# k7Jm9XpL4zR2vN8qYwE5uT3hS6gF1aD0bC4xM7oP2nA=
```

### Key Requirements

- **Length:** 32 bytes (256 bits)
- **Encoding:** Base64
- **Randomness:** Cryptographically secure (uses Node.js `crypto.randomBytes`)
- **Uniqueness:** Generate separate keys for dev/staging/production

---

## Key Storage

### Development

Store in `.env.local` (NOT committed to git):

```bash
# .env.local
ENCRYPTION_KEY=your-development-key-here
```

### Staging

Railway environment variables:
1. Go to Railway project settings
2. Navigate to "Variables" tab
3. Add `ENCRYPTION_KEY` with staging key
4. Deploy to apply

### Production

Railway environment variables (same process, different key):
1. Use separate Railway project for production
2. Add `ENCRYPTION_KEY` with production key
3. **Never** use the same key as staging/development

### Backup Storage

**Critical:** Store keys in secure location for disaster recovery

Recommended: **1Password** (or similar password manager)

Entry template:
```
Title: Calibrate Encryption Key - Production
Username: production
Password: k7Jm9XpL4zR2vN8qYwE5uT3hS6gF1aD0bC4xM7oP2nA=
URL: https://railway.app/project/calibr-api
Notes:
  - Generated: 2025-10-27
  - Used for: Platform credential encryption
  - Last rotated: 2025-10-27
  - Next rotation: 2026-01-27 (quarterly)
```

---

## Key Rotation

### When to Rotate

- **Scheduled:** Every 3-6 months
- **Security Incident:** Immediately if key compromised
- **Employee Departure:** If person with key access leaves
- **Compliance:** As required by SOC 2 / ISO 27001

### Rotation Process

**⚠️ Warning:** This is a complex operation requiring downtime or dual-key support.

#### Option A: Simple Rotation (Requires Downtime)

1. **Backup Database**
   ```bash
   railway db backup create
   # Or: pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

2. **Generate New Key**
   ```bash
   NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
   echo $NEW_KEY  # Save this!
   ```

3. **Decrypt with Old Key, Re-encrypt with New Key**
   ```bash
   # Set old key
   export OLD_ENCRYPTION_KEY=old-key-here
   export ENCRYPTION_KEY=new-key-here

   # Run migration script (create custom version)
   pnpm tsx scripts/rotate-encryption-key.ts
   ```

4. **Update Environment Variables**
   - Railway: Update `ENCRYPTION_KEY` to new value
   - Restart API service

5. **Verify**
   ```bash
   # Test API can decrypt credentials
   curl https://api.calibr.lat/api/platforms
   ```

6. **Store New Key**
   - Update in 1Password
   - Document rotation date

#### Option B: Zero-Downtime Rotation (Future Enhancement)

Supports versioned keys (e.g., `v1:encrypted-data`, `v2:encrypted-data`):

1. Add new key as `ENCRYPTION_KEY_V2`
2. Update encryption service to write with V2, read V1 or V2
3. Background job re-encrypts all data to V2
4. Once complete, remove V1 key support
5. Rename V2 to default key

**Status:** Not implemented yet

---

## Emergency Procedures

### Key Compromised

**Immediate Actions:**

1. **Alert Team**
   - Notify all developers immediately
   - Assess scope of compromise

2. **Rotate Key ASAP**
   - Follow rotation process above
   - Prioritize speed over perfection

3. **Audit Access**
   ```sql
   -- Check which integrations accessed recently
   SELECT * FROM "PlatformIntegration"
   WHERE "updatedAt" > NOW() - INTERVAL '24 hours'
   ORDER BY "updatedAt" DESC
   ```

4. **Revoke Platform Tokens**
   - For Shopify: Regenerate access tokens via partner dashboard
   - For Amazon: Rotate SP-API credentials

5. **Postmortem**
   - Document how key was compromised
   - Update security procedures
   - Consider additional controls (e.g., Hashicorp Vault)

### Key Lost

**Recovery:**

1. **Check Backups**
   - 1Password / password manager
   - Team members' secure notes
   - Encrypted backup files

2. **If Unrecoverable**
   - Credentials encrypted with lost key are **permanently inaccessible**
   - Users must re-authenticate all platform integrations
   - Generate new key and update environment
   - Notify users of required re-connection

### Database Backup Restore

**Important:** Encrypted data in backup needs same encryption key!

```bash
# Before restoring backup, ensure ENCRYPTION_KEY matches the backup's era
export ENCRYPTION_KEY=key-from-backup-date

# Restore
psql $DATABASE_URL < backup-20251027.sql

# Verify credentials decrypt correctly
pnpm tsx scripts/verify-encryption.ts
```

---

## Access Control

### Who Has Access

**Production Key:**
- DevOps lead (Railway access)
- CTO / Security officer
- On-call engineer (1Password emergency access)

**Staging Key:**
- All developers (via Railway team access)

**Development Key:**
- All developers (documented in onboarding)

### Granting Access

1. New team member joins
2. Add to Railway project (appropriate environment)
3. Share development key via secure channel (1Password share)
4. Document access in team roster

### Revoking Access

1. Team member leaves
2. Remove from Railway project
3. Remove from 1Password shared vaults
4. **Rotate key** within 24 hours (best practice)

---

## Compliance

### SOC 2 Requirements

- ✅ Encryption at rest (AES-256)
- ✅ Key storage (environment variables, not in code)
- ✅ Access control (Railway permissions)
- ⏳ Key rotation (quarterly, documented)
- ⏳ Audit logging (key access tracking)

### GDPR

- ✅ Data protection (encrypted credentials)
- ✅ Right to erasure (can delete encrypted data)
- ✅ Data breach notification (key compromise = notify users)

### PCI DSS (if applicable)

- ✅ Strong cryptography (AES-256-GCM)
- ✅ Key management procedures (this document)
- ⏳ Key rotation (implement quarterly schedule)

---

## Monitoring

### Key Health Checks

Add to monitoring system:

```typescript
// Check encryption is working
async function healthCheckEncryption() {
  try {
    const testData = { test: 'data' }
    const encrypted = encryptCredentials(testData)
    const decrypted = decryptCredentials(encrypted)

    if (JSON.stringify(decrypted) !== JSON.stringify(testData)) {
      throw new Error('Encryption/decryption mismatch')
    }

    return { status: 'healthy' }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}
```

### Alerts

- Encryption/decryption failures > 5 in 1 hour
- Missing `ENCRYPTION_KEY` environment variable
- Mismatched encryption key (decryption failures)

---

## Checklist

### Initial Setup
- [ ] Generate production encryption key
- [ ] Store key in Railway environment variables
- [ ] Store backup key in 1Password
- [ ] Run migration script to encrypt existing credentials
- [ ] Verify decryption works in production
- [ ] Document key generation date

### Quarterly Maintenance
- [ ] Review key rotation schedule
- [ ] Audit who has key access
- [ ] Check for failed decryption attempts
- [ ] Update key backup if rotated
- [ ] Review this document for updates

### Incident Response
- [ ] Assess scope of compromise
- [ ] Generate new encryption key
- [ ] Run key rotation procedure
- [ ] Revoke compromised platform tokens
- [ ] Notify affected users (if applicable)
- [ ] Document incident and learnings

---

## FAQ

**Q: Can I decrypt credentials without the key?**
A: No. AES-256 encryption is effectively unbreakable without the key.

**Q: What if I lose the encryption key?**
A: All encrypted credentials are permanently inaccessible. Users must re-authenticate.

**Q: How do I know if credentials are encrypted?**
A: Encrypted format: `hexstring:hexstring:hexstring` (iv:authTag:ciphertext)

**Q: Can I use the same key across environments?**
A: Technically yes, but **strongly discouraged**. Use separate keys for security isolation.

**Q: How often should I rotate keys?**
A: Quarterly (every 3 months) or immediately if compromised.

**Q: What happens during key rotation?**
A: Brief downtime while re-encrypting data, or zero-downtime with dual-key support (future).

---

## Support

**Questions:** See #security channel in Slack
**Emergencies:** Contact on-call engineer via PagerDuty
**Documentation:** See CREDENTIAL_ENCRYPTION_STRATEGY.md

---

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
