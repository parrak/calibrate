import crypto from 'node:crypto'

export interface EncryptionDetails {
  key: string // base64
  initializationVector: string // base64
  standard?: string // 'AES' | 'AES/GCM' etc (from SP-API)
}

export function encryptWithAes256Gcm(xmlUtf8: string, details: EncryptionDetails): Buffer {
  const key = Buffer.from(details.key, 'base64')
  const iv = Buffer.from(details.initializationVector, 'base64')
  if (key.length !== 32) {
    throw new Error(`Invalid AES-256 key length: ${key.length}`)
  }
  if (iv.length !== 16) {
    throw new Error(`Invalid IV length (expected 16): ${iv.length}`)
  }
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(Buffer.from(xmlUtf8, 'utf8')), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([enc, tag])
}

