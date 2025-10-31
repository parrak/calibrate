/**
 * Integration test for encryption middleware
 *
 * Tests the full encryption flow without requiring a database connection
 */

import { describe, it, expect } from 'vitest'
import { EncryptionService, encryptCredentials, decryptCredentials } from './encryption'

describe('Encryption Integration', () => {
  it('encrypts and decrypts Amazon credentials', () => {
    // Set up encryption key
    process.env.ENCRYPTION_KEY = EncryptionService.generateKey()

    const amazonCreds = {
      sellerId: 'A1234567890ABC',
      clientId: 'amzn1.application-oa2-client.1234567890',
      clientSecret: 'amzn1.oa2-cs.v1.1234567890abcdef',
      refreshToken: 'Atzr|IwEBIJ1234567890abcdef',
      marketplaceId: 'ATVPDKIKX0DER'
    }

    // Simulate what Prisma middleware does
    const encrypted = encryptCredentials(amazonCreds)

    // Verify it's encrypted (hex format)
    expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/)

    // Simulate reading from database
    const decrypted = decryptCredentials(encrypted)

    expect(decrypted).toEqual(amazonCreds)
  })

  it('encrypts and decrypts Shopify credentials', () => {
    process.env.ENCRYPTION_KEY = EncryptionService.generateKey()

    const shopifyCreds = {
      accessToken: 'shpat_1234567890abcdef',
      shop: 'mystore.myshopify.com',
      scope: 'read_products,write_products'
    }

    const encrypted = encryptCredentials(shopifyCreds)
    expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/)

    const decrypted = decryptCredentials(encrypted)
    expect(decrypted).toEqual(shopifyCreds)
  })

  it('handles empty credentials gracefully', () => {
    process.env.ENCRYPTION_KEY = EncryptionService.generateKey()

    const encrypted = encryptCredentials({})
    expect(encrypted).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/)

    const decrypted = decryptCredentials(encrypted)
    expect(decrypted).toEqual({})
  })

  it('simulates full middleware flow', () => {
    process.env.ENCRYPTION_KEY = EncryptionService.generateKey()

    // Simulate creating a platform integration
    const inputData = {
      platform: 'amazon',
      projectSlug: 'demo',
      credentials: {
        accessToken: 'secret-token-123',
        refreshToken: 'refresh-token-456'
      }
    }

    // Middleware encrypts before save
    const encryptedCreds = encryptCredentials(inputData.credentials)
    const savedData = {
      ...inputData,
      credentials: encryptedCreds
    }

    // Verify encrypted
    expect(typeof savedData.credentials).toBe('string')
    expect(savedData.credentials).toMatch(/^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/)

    // Middleware decrypts on read
    const readData = {
      ...savedData,
      credentials: decryptCredentials(savedData.credentials)
    }

    // Verify decrypted matches original
    expect(readData.credentials).toEqual(inputData.credentials)
  })

  it('different encryptions of same data produce different ciphertext', () => {
    process.env.ENCRYPTION_KEY = EncryptionService.generateKey()

    const creds = { apiKey: 'test-key' }

    const encrypted1 = encryptCredentials(creds)
    const encrypted2 = encryptCredentials(creds)

    // Different due to random IV
    expect(encrypted1).not.toBe(encrypted2)

    // But both decrypt to same value
    expect(decryptCredentials(encrypted1)).toEqual(creds)
    expect(decryptCredentials(encrypted2)).toEqual(creds)
  })
})
