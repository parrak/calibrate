import { describe, it, expect, beforeEach } from 'vitest'
import { EncryptionService } from './encryption'

describe('EncryptionService', () => {
  let service: EncryptionService
  let testKey: string

  beforeEach(() => {
    // Generate a test key
    testKey = EncryptionService.generateKey()
    service = new EncryptionService(testKey)
  })

  describe('constructor', () => {
    it('throws error if key is empty', () => {
      expect(() => new EncryptionService('')).toThrow('Encryption key is required')
    })

    it('throws error if key is not 32 bytes', () => {
      const shortKey = Buffer.from('short').toString('base64')
      expect(() => new EncryptionService(shortKey)).toThrow('Encryption key must be 32 bytes')
    })

    it('accepts valid 32-byte key', () => {
      expect(() => new EncryptionService(testKey)).not.toThrow()
    })
  })

  describe('encrypt/decrypt', () => {
    it('encrypts and decrypts strings correctly', () => {
      const plaintext = 'secret-api-key'
      const encrypted = service.encrypt(plaintext)
      const decrypted = service.decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('produces different ciphertext for same plaintext', () => {
      const plaintext = 'test-data'
      const encrypted1 = service.encrypt(plaintext)
      const encrypted2 = service.encrypt(plaintext)

      // Different IVs should produce different ciphertext
      expect(encrypted1).not.toBe(encrypted2)

      // But both should decrypt to same value
      expect(service.decrypt(encrypted1)).toBe(plaintext)
      expect(service.decrypt(encrypted2)).toBe(plaintext)
    })

    it('throws error when encrypting empty string', () => {
      expect(() => service.encrypt('')).toThrow('Plaintext is required')
    })

    it('throws error when decrypting invalid format', () => {
      expect(() => service.decrypt('invalid-format')).toThrow('Invalid ciphertext format')
    })

    it('throws error when decrypting with wrong key', () => {
      const encrypted = service.encrypt('test')
      const wrongKeyService = new EncryptionService(EncryptionService.generateKey())

      expect(() => wrongKeyService.decrypt(encrypted)).toThrow()
    })

    it('detects tampering via authentication tag', () => {
      const encrypted = service.encrypt('test-data')

      // Tamper with the ciphertext
      const parts = encrypted.split(':')
      parts[2] = parts[2].replace(/.$/, '0') // Change last character
      const tampered = parts.join(':')

      expect(() => service.decrypt(tampered)).toThrow()
    })

    it('encrypts unicode characters correctly', () => {
      const plaintext = '你好世界 🌍 مرحبا'
      const encrypted = service.encrypt(plaintext)
      const decrypted = service.decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })

    it('handles long strings', () => {
      const plaintext = 'a'.repeat(10000)
      const encrypted = service.encrypt(plaintext)
      const decrypted = service.decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })
  })

  describe('encryptJSON/decryptJSON', () => {
    it('encrypts and decrypts objects correctly', () => {
      const data = {
        apiKey: 'secret-key',
        token: 'access-token',
        nested: {
          value: 123,
          flag: true
        }
      }

      const encrypted = service.encryptJSON(data)
      const decrypted = service.decryptJSON(encrypted)

      expect(decrypted).toEqual(data)
    })

    it('handles arrays', () => {
      const data = [1, 2, 3, 'test', { key: 'value' }]
      const encrypted = service.encryptJSON(data)
      const decrypted = service.decryptJSON(encrypted)

      expect(decrypted).toEqual(data)
    })

    it('handles null and undefined in objects', () => {
      const data = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0
      }

      const encrypted = service.encryptJSON(data)
      const decrypted = service.decryptJSON(encrypted)

      // Note: JSON.stringify removes undefined
      expect(decrypted).toEqual({
        nullValue: null,
        emptyString: '',
        zero: 0
      })
    })

    it('preserves data types', () => {
      const data = {
        string: 'test',
        number: 42,
        boolean: true,
        nullValue: null,
        array: [1, 2, 3],
        object: { nested: 'value' }
      }

      const encrypted = service.encryptJSON(data)
      const decrypted = service.decryptJSON(encrypted)

      expect(typeof decrypted.string).toBe('string')
      expect(typeof decrypted.number).toBe('number')
      expect(typeof decrypted.boolean).toBe('boolean')
      expect(decrypted.nullValue).toBe(null)
      expect(Array.isArray(decrypted.array)).toBe(true)
      expect(typeof decrypted.object).toBe('object')
    })
  })

  describe('generateKey', () => {
    it('generates valid 32-byte key', () => {
      const key = EncryptionService.generateKey()
      const keyBuffer = Buffer.from(key, 'base64')

      expect(keyBuffer.length).toBe(32)
    })

    it('generates different keys each time', () => {
      const key1 = EncryptionService.generateKey()
      const key2 = EncryptionService.generateKey()

      expect(key1).not.toBe(key2)
    })

    it('generated keys work with encryption', () => {
      const key = EncryptionService.generateKey()
      const service = new EncryptionService(key)
      const plaintext = 'test-data'

      const encrypted = service.encrypt(plaintext)
      const decrypted = service.decrypt(encrypted)

      expect(decrypted).toBe(plaintext)
    })
  })

  describe('ciphertext format', () => {
    it('produces ciphertext in correct format', () => {
      const encrypted = service.encrypt('test')
      const parts = encrypted.split(':')

      expect(parts.length).toBe(3)

      // IV should be 32 hex chars (16 bytes)
      expect(parts[0].length).toBe(32)
      expect(/^[0-9a-f]+$/.test(parts[0])).toBe(true)

      // Auth tag should be 32 hex chars (16 bytes)
      expect(parts[1].length).toBe(32)
      expect(/^[0-9a-f]+$/.test(parts[1])).toBe(true)

      // Ciphertext should be hex
      expect(/^[0-9a-f]+$/.test(parts[2])).toBe(true)
    })
  })

  describe('real-world scenarios', () => {
    it('encrypts Shopify credentials', () => {
      const credentials = {
        accessToken: 'shpat_1234567890abcdef',
        shop: 'mystore.myshopify.com',
        scope: 'read_products,write_products'
      }

      const encrypted = service.encryptJSON(credentials)
      const decrypted = service.decryptJSON(encrypted)

      expect(decrypted).toEqual(credentials)
    })

    it('encrypts Amazon SP-API credentials', () => {
      const credentials = {
        sellerId: 'A1234567890ABC',
        clientId: 'amzn1.application-oa2-client.1234567890',
        clientSecret: 'amzn1.oa2-cs.v1.1234567890abcdef',
        refreshToken: 'Atzr|IwEBIJ1234567890abcdef',
        marketplaceId: 'ATVPDKIKX0DER'
      }

      const encrypted = service.encryptJSON(credentials)
      const decrypted = service.decryptJSON(encrypted)

      expect(decrypted).toEqual(credentials)
    })

    it('handles empty credentials object', () => {
      const credentials = {}
      const encrypted = service.encryptJSON(credentials)
      const decrypted = service.decryptJSON(encrypted)

      expect(decrypted).toEqual({})
    })
  })
})
