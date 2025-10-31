# Encryption Deployment Checklist

**Status:** Ready for Production Deployment
**Date:** October 28, 2025

---

## Pre-Deployment

- [x] Encryption implementation complete
- [x] 22 unit tests passing
- [x] Migration script created with dry-run mode
- [x] Documentation complete
- [x] Production encryption key generated
- [x] Key stored securely (not in git)
- [x] Migration script executable via pnpm

---

## Deployment Steps

### 1. Add ENCRYPTION_KEY to Railway

**Command:**
```bash
railway variables set ENCRYPTION_KEY=NtxoLQbx7XMqZqmqfN3Nla2DmY2vsCDmELzSNlE5N2Y=
```

**Verification:**
```bash
railway variables | grep ENCRYPTION_KEY
```

Expected: `ENCRYPTION_KEY=NtxoLQbx7XMqZqmqfN3Nla2DmY2vsCDmELzSNlE5N2Y=`

---

### 2. Deploy API with Encryption Middleware

**Railway will auto-deploy from git push, or manually:**
```bash
railway up
```

**Wait for deployment to complete, then verify:**
```bash
curl https://api.calibr.lat/api/health
```

Expected: `{"status":"ok"}`

---

### 3. Backup Database (Before Migration)

```bash
railway db backup create
```

Note the backup ID for rollback if needed.

---

### 4. Run Migration Script (Dry Run First)

**Test with dry run:**
```bash
railway run pnpm encrypt:credentials:dry
```

**Expected output:**
```
🔐 Credential Encryption Migration
===================================
Mode: DRY RUN (no changes will be made)

Found 2 integrations with credentials

⏭️  Skipping amazon (abc123) - already encrypted
✅ Would encrypt shopify (def456)

Migration Summary
=================
Total integrations: 2
Encrypted: 1
Skipped (already encrypted): 1
Errors: 0

⚠️  This was a DRY RUN - no changes were made
Run without --dry-run to apply changes
```

---

### 5. Run Migration Script (Live)

**If dry run looks good, run for real:**
```bash
railway run pnpm encrypt:credentials --verbose
```

**Expected output:**
```
🔐 Credential Encryption Migration
===================================
Mode: LIVE

Found 2 integrations with credentials

⏭️  Skipping amazon (abc123) - already encrypted
✅ Encrypted shopify (def456)

Migration Summary
=================
Total integrations: 2
Encrypted: 1
Skipped (already encrypted): 1
Errors: 0

✅ Migration completed successfully!
```

---

### 6. Verify Encryption Works

**Test platform integrations endpoint:**
```bash
curl https://api.calibr.lat/api/platforms
```

Should return platforms list without errors.

**Test a specific integration (if you have one):**
```bash
curl https://api.calibr.lat/api/integrations/[integration-id]
```

Should decrypt credentials automatically via middleware.

---

### 7. Check Logs for Errors

```bash
railway logs
```

Look for:
- ✅ No "ENCRYPTION_KEY not set" errors
- ✅ No "Failed to decrypt" errors
- ✅ No other encryption-related errors

---

## Post-Deployment

- [ ] ENCRYPTION_KEY added to Railway
- [ ] API deployed and healthy
- [ ] Database backup created
- [ ] Migration script ran successfully (dry run)
- [ ] Migration script ran successfully (live)
- [ ] No decryption errors in logs
- [ ] `/api/platforms` endpoint works
- [ ] `/api/health` shows healthy

---

## Backup Key in 1Password

**Create entry in 1Password:**

```
Title: Calibrate Encryption Key - Production
Type: Password
Username: production
Password: NtxoLQbx7XMqZqmqfN3Nla2DmY2vsCDmELzSNlE5N2Y=
URL: https://railway.app
Notes:
  Generated: October 27, 2025
  Environment: Production
  Purpose: Platform credential encryption
  Algorithm: AES-256-GCM
  Next rotation: January 27, 2026
  Railway Project: [your-project-id]
```

---

## Rollback Plan (If Something Goes Wrong)

### Option 1: Restore Database Backup

```bash
# List backups
railway db backup list

# Restore specific backup
railway db backup restore [backup-id]
```

### Option 2: Remove ENCRYPTION_KEY

If decryption fails but you need the API running:

```bash
# Remove key temporarily
railway variables unset ENCRYPTION_KEY

# Redeploy
railway up
```

**⚠️ WARNING:** This will break credential decryption but allows API to run.

---

## Troubleshooting

### Error: "ENCRYPTION_KEY environment variable not set"

**Solution:**
```bash
railway variables set ENCRYPTION_KEY=NtxoLQbx7XMqZqmqfN3Nla2DmY2vsCDmELzSNlE5N2Y=
railway up
```

### Error: "Failed to decrypt credentials"

**Possible causes:**
1. Wrong encryption key
2. Credentials not yet migrated
3. Database restored from old backup

**Debug:**
```bash
# Check if credentials are encrypted (format: hex:hex:hex)
railway run psql $DATABASE_URL -c 'SELECT id, platform, credentials FROM "PlatformIntegration" LIMIT 1'
```

### Migration Script Fails

**Recovery:**
1. Restore database backup
2. Check encryption key matches
3. Run with `--verbose` flag
4. Check error messages

---

## Success Criteria

Deployment is successful when:

1. ✅ ENCRYPTION_KEY set in Railway
2. ✅ API deploys without errors
3. ✅ Migration script completes without errors
4. ✅ No decryption errors in logs
5. ✅ Platform endpoints return data correctly
6. ✅ Key backed up in 1Password

---

## Next Steps After Deployment

1. Monitor logs for 24 hours for any decryption errors
2. Test creating new platform integrations (should auto-encrypt)
3. Update key in 1Password with deployment date
4. Schedule key rotation for 3 months (January 27, 2026)
5. Move to next security task: Audit logging

---

**Deployment Owner:** [Your Name]
**Deployment Date:** [To be filled]
**Verification Date:** [To be filled]
**Issues Encountered:** [To be filled]

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
