# @calibr/security

Security utilities for the Calibrate platform.

## Features

- **AES-256-GCM Encryption**: Industry-standard authenticated encryption
- **Credential Protection**: Encrypt platform credentials at rest
- **Automatic Key Management**: Singleton pattern with environment variable config

## Installation

```bash
pnpm add @calibr/security
```

## Usage

### Environment Setup

Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to `.env`:

```bash
ENCRYPTION_KEY=your-generated-key-here
```

### Basic Encryption

```typescript
import { EncryptionService } from '@calibr/security'

const service = new EncryptionService(process.env.ENCRYPTION_KEY!)

// Encrypt
const encrypted = service.encrypt('secret-api-key')
console.log(encrypted) // "a1b2c3...:d4e5f6...:g7h8i9..."

// Decrypt
const decrypted = service.decrypt(encrypted)
console.log(decrypted) // "secret-api-key"
```

### JSON Encryption

```typescript
import { encryptCredentials, decryptCredentials } from '@calibr/security'

// Encrypt credentials object
const credentials = {
  accessToken: 'secret-token',
  refreshToken: 'refresh-token',
  shopUrl: 'mystore.myshopify.com'
}

const encrypted = encryptCredentials(credentials)

// Decrypt back to object
const decrypted = decryptCredentials(encrypted)
console.log(decrypted.accessToken) // "secret-token"
```

### With Prisma

See `packages/db/src/middleware/encryption.ts` for automatic encryption/decryption middleware.

## Security Considerations

### Key Management

- ✅ Store keys in environment variables
- ✅ Never commit keys to git
- ✅ Use different keys for dev/staging/prod
- ✅ Rotate keys periodically

### Encryption Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Size**: 256 bits (32 bytes)
- **IV Size**: 128 bits (16 bytes, randomly generated per encryption)
- **Authentication**: Built-in with GCM mode (prevents tampering)

### Format

Encrypted data is stored as: `iv:authTag:ciphertext`

- `iv`: Initialization vector (hex)
- `authTag`: Authentication tag (hex)
- `ciphertext`: Encrypted data (hex)

## Testing

```bash
pnpm test
```

## API Reference

### `EncryptionService`

#### Constructor

```typescript
new EncryptionService(keyBase64: string)
```

#### Methods

- `encrypt(plaintext: string): string` - Encrypt string
- `decrypt(ciphertext: string): string` - Decrypt string
- `encryptJSON(data: any): string` - Encrypt JSON object
- `decryptJSON<T>(ciphertext: string): T` - Decrypt to JSON object
- `static generateKey(): string` - Generate new encryption key

### Helper Functions

- `getEncryptionService(): EncryptionService` - Get singleton instance
- `encryptCredentials(credentials: any): string` - Encrypt credentials
- `decryptCredentials<T>(encrypted: string): T | null` - Decrypt credentials

## License

Private - Calibrate Platform
