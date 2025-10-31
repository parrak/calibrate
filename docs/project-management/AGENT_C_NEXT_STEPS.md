# Agent C - Next Steps: Credential Encryption

**Date:** October 28, 2025
**Status:** ✅ Priority 1 Complete → 🔒 Priority 4 (Security)
**Timeline:** 1-2 days
**Impact:** 🔴 HIGH - Critical security requirement

---

## 🎯 Current Objective: Encrypt Platform Credentials

**Problem:** Integration credentials (access tokens, refresh tokens) are currently stored in **plaintext** in the database.

**Risk:** If database is compromised, all platform access tokens are exposed.

**Solution:** Implement AES-256-GCM encryption with Prisma middleware for transparent encryption/decryption.

---

## ✅ What's Complete (Priority 1)

- POST /api/platforms/[platform] - Save integrations
- DELETE /api/platforms/[platform] - Disconnect integrations
- Agent A and Agent B unblocked
- Production deployment working

---

## 📋 Implementation Tasks

### 1. Create Encryption Utilities (2 hrs)

**File:** `packages/security/src/encryption.ts` (NEW)

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY not set');

  const keyBuffer = Buffer.from(key, 'base64');
  if (keyBuffer.length !== 32) throw new Error('Key must be 32 bytes');

  return keyBuffer;
}

export function encryptCredentials(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptCredentials(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

export function isEncrypted(value: string): boolean {
  return value && value.split(':').length === 3;
}
```

---

### 2. Update Prisma Middleware (2 hrs)

**File:** `packages/db/src/middleware/encryption.ts`

```typescript
import { Prisma } from '@prisma/client';
import { encryptCredentials, decryptCredentials, isEncrypted } from '@calibr/security';

const ENCRYPTED_FIELDS: Record<string, string[]> = {
  ShopifyIntegration: ['accessToken'],
  AmazonIntegration: ['refreshToken', 'accessToken'],
};

export const encryptionMiddleware: Prisma.Middleware = async (params, next) => {
  const model = params.model;
  if (!model || !ENCRYPTED_FIELDS[model]) return next(params);

  const fields = ENCRYPTED_FIELDS[model];

  // Encrypt on write
  if (params.action === 'create' || params.action === 'update') {
    const data = params.args.data;
    if (data) {
      for (const field of fields) {
        if (data[field] && !isEncrypted(data[field])) {
          data[field] = encryptCredentials(data[field]);
        }
      }
    }
  }

  const result = await next(params);

  // Decrypt on read
  if (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'findMany') {
    const decrypt = (record: any) => {
      if (!record) return record;
      for (const field of fields) {
        if (record[field] && isEncrypted(record[field])) {
          record[field] = decryptCredentials(record[field]);
        }
      }
      return record;
    };

    return Array.isArray(result) ? result.map(decrypt) : decrypt(result);
  }

  return result;
};
```

---

### 3. Enable in Prisma Client (30 mins)

**File:** `packages/db/client.ts`

```typescript
import { encryptionMiddleware } from './src/middleware/encryption';

export function prisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({...});
    globalForPrisma.prisma.$use(encryptionMiddleware); // Add this
  }
  return globalForPrisma.prisma;
}
```

---

### 4. Generate Encryption Key (15 mins)

```bash
# Generate key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add to Railway
railway variables set ENCRYPTION_KEY=<generated-key>

# Add to .env.local (development)
ENCRYPTION_KEY=<generated-key>

# Add to .env.example
ENCRYPTION_KEY=base64-encoded-32-byte-key
```

---

### 5. Migrate Existing Data (1 hr)

**File:** `scripts/encrypt-existing-credentials.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { encryptCredentials, isEncrypted } from '@calibr/security';

const prisma = new PrismaClient();

async function migrate() {
  // Shopify
  const shopify = await prisma.shopifyIntegration.findMany();
  for (const item of shopify) {
    if (item.accessToken && !isEncrypted(item.accessToken)) {
      await prisma.shopifyIntegration.update({
        where: { id: item.id },
        data: { accessToken: encryptCredentials(item.accessToken) }
      });
    }
  }

  // Amazon
  const amazon = await prisma.amazonIntegration.findMany();
  for (const item of amazon) {
    const updates: any = {};
    if (item.refreshToken && !isEncrypted(item.refreshToken)) {
      updates.refreshToken = encryptCredentials(item.refreshToken);
    }
    if (item.accessToken && !isEncrypted(item.accessToken)) {
      updates.accessToken = encryptCredentials(item.accessToken);
    }
    if (Object.keys(updates).length > 0) {
      await prisma.amazonIntegration.update({
        where: { id: item.id },
        data: updates
      });
    }
  }
}

migrate().then(() => console.log('Done'));
```

Run: `ENCRYPTION_KEY=<key> pnpm tsx scripts/encrypt-existing-credentials.ts`

---

## 🧪 Testing

1. **Unit tests:**
   ```bash
   cd packages/security
   pnpm test
   ```

2. **Integration test:**
   ```bash
   # Create integration
   POST /api/platforms/shopify

   # Check database - should be encrypted (hex:hex:hex format)

   # Read integration
   GET /api/platforms/shopify?project=demo

   # Should be decrypted transparently
   ```

3. **Verify connectors still work**

---

## ✅ Success Criteria

- [ ] Encryption key generated and set in Railway
- [ ] Unit tests pass
- [ ] New credentials encrypted on save
- [ ] Existing credentials decrypted on read
- [ ] Application code unchanged (transparent)
- [ ] Connectors work without modification
- [ ] No plaintext credentials in database
- [ ] Migration script tested

---

## 🚨 Security Notes

**DO:**
- Generate key with crypto.randomBytes(32)
- Store in environment variables only
- Back up key securely
- Rotate annually

**DON'T:**
- Commit key to git
- Share via chat/email
- Use weak keys
- Store in code

---

## 📁 Files

**Create:**
- `packages/security/src/encryption.ts`
- `packages/security/tests/encryption.test.ts`
- `scripts/encrypt-existing-credentials.ts`

**Modify:**
- `packages/db/src/middleware/encryption.ts` (uncomment imports)
- `packages/db/client.ts` (enable middleware)
- `packages/db/.env.example` (add ENCRYPTION_KEY)

---

## 🎯 After This

Agent C priorities:
1. ✅ Platform integration endpoints (DONE)
2. ✅ Agent A/B handoff docs (DONE)
3. 🔒 Credential encryption (CURRENT)
4. ⏸️ Optional: Token refresh for Amazon
5. ⏸️ Optional: Health checks
6. ⏸️ Code reviews for Agent A/B

---

**Estimated Time:** 1-2 days
**Complexity:** Medium
**Impact:** 🔴 HIGH - Critical for production

Start with Task 1 (encryption utilities) and work through sequentially.

---

**Generated with Claude Code**
**Co-Authored-By:** Claude <noreply@anthropic.com>
