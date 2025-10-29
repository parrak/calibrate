/**
 * Encryption Service
 *
 * Provides AES-256-GCM encryption for sensitive data at rest.
 * Used primarily for encrypting platform integration credentials.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

export class EncryptionService {
  private algorithm = 'aes-256-gcm'
  private key: Buffer

  /**
   * Create encryption service with base64-encoded key
   * @param keyBase64 - 32-byte key encoded as base64
   */
  constructor(keyBase64: string) {
    if (!keyBase64) {
      throw new Error('Encryption key is required')
    }

    this.key = Buffer.from(keyBase64, 'base64')

    if (this.key.length !== 32) {
      throw new Error('Encryption key must be 32 bytes (256 bits)')
    }
  }

  /**
   * Encrypt plaintext string
   * @param plaintext - String to encrypt
   * @returns Encrypted string in format: iv:authTag:encrypted
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      throw new Error('Plaintext is required for encryption')
    }

    // Generate random IV (initialization vector) - 16 bytes for GCM
    const iv = randomBytes(16)

    // Create cipher
    const cipher = createCipheriv(this.algorithm, this.key, iv)

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    // Return format: iv:authTag:encrypted
    // This allows us to decrypt later and verify integrity
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  /**
   * Decrypt ciphertext string
   * @param ciphertext - Encrypted string in format: iv:authTag:encrypted
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string): string {
    if (!ciphertext) {
      throw new Error('Ciphertext is required for decryption')
    }

    // Parse the ciphertext format
    const parts = ciphertext.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format. Expected: iv:authTag:encrypted')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    // Create decipher
    const decipher = createDecipheriv(this.algorithm, this.key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Encrypt JSON object
   * @param data - Object to encrypt
   * @returns Encrypted string
   */
  encryptJSON(data: any): string {
    const json = JSON.stringify(data)
    return this.encrypt(json)
  }

  /**
   * Decrypt to JSON object
   * @param ciphertext - Encrypted string
   * @returns Decrypted object
   */
  decryptJSON<T = any>(ciphertext: string): T {
    const json = this.decrypt(ciphertext)
    return JSON.parse(json)
  }

  /**
   * Generate a new random encryption key
   * @returns Base64-encoded 32-byte key
   */
  static generateKey(): string {
    return randomBytes(32).toString('base64')
  }
}

/**
 * Create singleton instance for credential encryption
 */
let encryptionService: EncryptionService | null = null

export function getEncryptionService(): EncryptionService {
  if (!encryptionService) {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
      throw new Error(
        'ENCRYPTION_KEY environment variable is required. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"'
      )
    }
    encryptionService = new EncryptionService(key)
  }
  return encryptionService
}

/**
 * Helper: Encrypt credentials for storage
 */
export function encryptCredentials(credentials: any): string {
  if (!credentials) return ''
  return getEncryptionService().encryptJSON(credentials)
}

/**
 * Helper: Decrypt credentials from storage
 */
export function decryptCredentials<T = any>(encrypted: string): T | null {
  if (!encrypted) return null
  try {
    return getEncryptionService().decryptJSON<T>(encrypted)
  } catch (error) {
    console.error('Failed to decrypt credentials:', error)
    return null
  }
}
