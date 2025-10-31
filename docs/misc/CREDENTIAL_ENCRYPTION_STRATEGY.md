# Credential Encryption Strategy

**Owner:** Agent C
**Priority:** HIGH - Security Critical
**Status:** Planning → Implementation Required

---

## Overview

Platform integration credentials (OAuth tokens, API keys, secrets) must be encrypted at rest in the database to prevent unauthorized access. This document outlines the encryption strategy for Calibrate.

---

## Current State

### Database Schema
```prisma
model PlatformIntegration {
  id           String   @id @default(cuid())
  projectId    String
  platform     String
  credentials  Json?    // ⚠️ UNENCRYPTED JSON
  status       String
  // ...
}
```

**Risk:** Credentials currently stored as plaintext JSON in PostgreSQL.

**Exposure Scenarios:**
- Database backup leaks
- SQL injection vulnerabilities
- Unauthorized database access
- Log file exposure
- Memory dumps

---

## Encryption Strategy

### Approach: Field-Level Encryption

Encrypt the `credentials` field at the application layer before storing in the database.

**Why Field-Level?**
- ✅ Granular control over sensitive data
- ✅ No database engine changes required
- ✅ Works with existing PostgreSQL setup
- ✅ Can use different keys per tenant/project
- ❌ Requires key management
- ❌ Cannot query encrypted values

**Alternative Considered:** Database-level encryption (TDE)
- Rejected: Requires PostgreSQL extension setup on Railway
- Less granular control

---

## Implementation Plan

### 1. Encryption Library

**Choice:** Node.js built-in `crypto` module

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// AES-256-GCM (Galois/Counter Mode)
// - 256-bit key strength
// - Authenticated encryption (prevents tampering)
// - Industry standard
```

**Why AES-256-GCM?**
- Strong encryption (256-bit keys)
- Authentication prevents tampering
- Fast performance
- NIST approved
- Built into Node.js

---

### 2. Key Management

#### Development
```bash
# .env.local
ENCRYPTION_KEY=base64-encoded-32-byte-key
```

Generate key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Production
**Option A: Environment Variable (Current Recommendation)**
```bash
# Railway/Vercel
ENCRYPTION_KEY=base64-encoded-key
```

Pros:
- ✅ Simple to implement
- ✅ Works on all platforms
- ✅ No external dependencies

Cons:
- ❌ Key rotation requires deployment
- ❌ Single key for all data

**Option B: KMS (Future)**
- AWS KMS / GCP Cloud KMS
- Automatic key rotation
- Audit logging
- Higher complexity

**Decision:** Start with Option A, migrate to Option B post-launch

---

### 3. Encryption Service

**Location:** `packages/security/src/encryption.ts`

```typescript
export class EncryptionService {
  private algorithm = 'aes-256-gcm'
  private key: Buffer

  constructor(keyBase64: string) {
    this.key = Buffer.from(keyBase64, 'base64')
    if (this.key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes')
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(16) // 128-bit IV
    const cipher = createCipheriv(this.algorithm, this.key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = createDecipheriv(this.algorithm, this.key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  encryptJSON(data: any): string {
    const json = JSON.stringify(data)
    return this.encrypt(json)
  }

  decryptJSON<T>(ciphertext: string): T {
    const json = this.decrypt(ciphertext)
    return JSON.parse(json)
  }
}
```

---

### 4. Database Integration

#### Helper Functions

```typescript
// packages/security/src/credentials.ts

import { EncryptionService } from './encryption'

const encryptionService = new EncryptionService(
  process.env.ENCRYPTION_KEY || ''
)

export function encryptCredentials(credentials: any): string {
  if (!credentials) return ''
  return encryptionService.encryptJSON(credentials)
}

export function decryptCredentials<T = any>(encrypted: string): T | null {
  if (!encrypted) return null
  try {
    return encryptionService.decryptJSON<T>(encrypted)
  } catch (error) {
    console.error('Failed to decrypt credentials:', error)
    return null
  }
}
```

#### Prisma Middleware

```typescript
// packages/db/src/middleware/encryption.ts

import { Prisma } from '@prisma/client'
import { encryptCredentials, decryptCredentials } from '@calibr/security'

export function encryptionMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    // Encrypt before create/update
    if (
      params.model === 'PlatformIntegration' &&
      (params.action === 'create' || params.action === 'update')
    ) {
      if (params.args.data.credentials) {
        params.args.data.credentials = encryptCredentials(
          params.args.data.credentials
        )
      }
    }

    const result = await next(params)

    // Decrypt after find queries
    if (
      params.model === 'PlatformIntegration' &&
      (params.action === 'findUnique' ||
       params.action === 'findFirst' ||
       params.action === 'findMany')
    ) {
      if (result) {
        if (Array.isArray(result)) {
          result.forEach((item: any) => {
            if (item.credentials) {
              item.credentials = decryptCredentials(item.credentials)
            }
          })
        } else if (result.credentials) {
          result.credentials = decryptCredentials(result.credentials)
        }
      }
    }

    return result
  }
}
```

#### Apply Middleware

```typescript
// packages/db/src/index.ts

import { encryptionMiddleware } from './middleware/encryption'

const prismaClient = new PrismaClient()
prismaClient.$use(encryptionMiddleware())

export function prisma() {
  return prismaClient
}
```

---

### 5. Migration Strategy

**Challenge:** Existing plaintext credentials must be encrypted.

#### Migration Script

```typescript
// scripts/encrypt-credentials.ts

import { prisma } from '@calibr/db'
import { encryptCredentials } from '@calibr/security'

async function migrateCredentials() {
  const integrations = await prisma().platformIntegration.findMany({
    where: {
      credentials: { not: null }
    }
  })

  console.log(`Found ${integrations.length} integrations to encrypt`)

  for (const integration of integrations) {
    // Check if already encrypted (starts with hex IV)
    const creds = integration.credentials as any
    if (typeof creds === 'string' && creds.includes(':')) {
      console.log(`Skipping ${integration.id} - already encrypted`)
      continue
    }

    // Encrypt plaintext credentials
    const encrypted = encryptCredentials(creds)

    await prisma().platformIntegration.update({
      where: { id: integration.id },
      data: { credentials: encrypted as any }
    })

    console.log(`Encrypted credentials for ${integration.id}`)
  }

  console.log('Migration complete')
}

migrateCredentials()
  .catch(console.error)
  .finally(() => prisma().$disconnect())
```

**Run:**
```bash
ENCRYPTION_KEY=xxx pnpm tsx scripts/encrypt-credentials.ts
```

---

## Security Considerations

### Key Storage
- ✅ NEVER commit keys to git
- ✅ Use `.env.local` for development
- ✅ Use platform secrets for production (Railway Variables)
- ✅ Rotate keys periodically (manual for now)

### Key Rotation
**Future Enhancement:** Support multiple keys with version ID

```typescript
// credentials format: v1:iv:tag:encrypted
// v2:iv:tag:encrypted (new key)

// Decryption checks version and uses appropriate key
```

### Access Control
- Encryption key only accessible to API server
- Console cannot decrypt (must call API)
- Database admins see encrypted blobs

### Audit Logging
Log credential access (future):
```typescript
{
  event: 'CREDENTIALS_ACCESSED',
  integrationId: 'xxx',
  userId: 'xxx',
  timestamp: '2025-01-15T10:00:00Z',
  action: 'decrypt'
}
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('EncryptionService', () => {
  it('encrypts and decrypts data correctly', () => {
    const service = new EncryptionService(testKey)
    const plaintext = 'secret-api-key'
    const encrypted = service.encrypt(plaintext)
    const decrypted = service.decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('throws on tampered ciphertext', () => {
    const service = new EncryptionService(testKey)
    const encrypted = service.encrypt('test')
    const tampered = encrypted.replace(/.$/, '0') // change last char
    expect(() => service.decrypt(tampered)).toThrow()
  })

  it('encrypts JSON objects', () => {
    const service = new EncryptionService(testKey)
    const data = { apiKey: 'secret', token: 'abc123' }
    const encrypted = service.encryptJSON(data)
    const decrypted = service.decryptJSON(encrypted)
    expect(decrypted).toEqual(data)
  })
})
```

### Integration Tests
```typescript
describe('PlatformIntegration Encryption', () => {
  it('stores encrypted credentials in database', async () => {
    const integration = await prisma().platformIntegration.create({
      data: {
        projectId: 'test',
        platform: 'shopify',
        credentials: { accessToken: 'secret' }
      }
    })

    // Read raw from DB (bypassing middleware)
    const raw = await prisma().$queryRaw`
      SELECT credentials FROM "PlatformIntegration"
      WHERE id = ${integration.id}
    `

    // Should be encrypted (hex string with colons)
    expect(raw[0].credentials).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/)
  })

  it('decrypts credentials when fetched', async () => {
    const integration = await prisma().platformIntegration.findUnique({
      where: { id: testId }
    })

    // Should be decrypted object
    expect(integration.credentials).toHaveProperty('accessToken')
    expect(integration.credentials.accessToken).toBe('secret')
  })
})
```

---

## Rollout Plan

### Phase 1: Package Setup (Day 1)
- [ ] Create `packages/security` package
- [ ] Implement `EncryptionService`
- [ ] Write unit tests
- [ ] Add to monorepo

### Phase 2: Database Integration (Day 2)
- [ ] Add Prisma middleware
- [ ] Update db package exports
- [ ] Test encryption/decryption flow
- [ ] Document usage

### Phase 3: Migration (Day 3)
- [ ] Create migration script
- [ ] Test on development database
- [ ] Run on staging
- [ ] Verify no regressions
- [ ] Run on production

### Phase 4: Monitoring (Day 4)
- [ ] Add error logging for decryption failures
- [ ] Monitor performance impact
- [ ] Document key rotation process
- [ ] Create runbook for incidents

---

## Performance Impact

### Benchmarks (Expected)
- Encryption: ~0.1ms per credential set
- Decryption: ~0.1ms per credential set
- Negligible impact on API response times

### Caching Strategy
- Decrypt once per request
- Cache in memory for request lifecycle
- Never cache in Redis/persistent storage

---

## Compliance

### GDPR
- ✅ Encryption at rest
- ✅ Access controls
- ✅ Data minimization (only store needed credentials)
- Future: Key deletion = data deletion

### SOC 2 / ISO 27001
- ✅ AES-256 encryption (industry standard)
- ✅ Authenticated encryption (prevents tampering)
- ✅ Audit logging (to implement)
- ✅ Key rotation process (to implement)

---

## Alternatives Considered

### 1. Hashicorp Vault
**Pros:** Centralized secrets management, automatic rotation
**Cons:** Additional infrastructure, cost, complexity
**Decision:** Deferred to post-launch

### 2. Database-Level Encryption (TDE)
**Pros:** Transparent, no code changes
**Cons:** All-or-nothing, requires PostgreSQL extensions
**Decision:** Rejected for Railway compatibility

### 3. Client-Side Encryption
**Pros:** Server never sees plaintext
**Cons:** Can't use credentials on server for API calls
**Decision:** Not applicable for our use case

---

## Open Questions

- [ ] Key rotation schedule? (Recommend: Quarterly)
- [ ] Multi-tenant key isolation? (Different keys per tenant)
- [ ] Backup encryption keys? (Store in password manager)
- [ ] Incident response plan? (Key compromise procedure)

---

## Next Steps

1. **Immediate:** Create `packages/security` with EncryptionService
2. **This Week:** Implement Prisma middleware
3. **This Week:** Run migration on development
4. **Next Week:** Deploy to staging, then production
5. **Future:** Implement audit logging and key rotation

---

**Document Status:** Planning Complete - Ready for Implementation
**Estimated Effort:** 3-4 days
**Priority:** HIGH - Security Critical
**Dependencies:** None (can implement immediately)

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
