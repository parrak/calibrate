/**
 * Prisma Encryption Middleware
 *
 * Automatically encrypts/decrypts credentials field in PlatformIntegration model
 */

import { Prisma } from '@prisma/client'
import { encryptCredentials, decryptCredentials } from '@calibr/security'

export function encryptionMiddleware(): Prisma.Middleware {
  return async (params, next) => {
    // Encrypt before create/update
    if (
      params.model === 'PlatformIntegration' as any &&
      (params.action === 'create' || params.action === 'update' || params.action === 'upsert')
    ) {
      if (params.action === 'upsert') {
        // Handle upsert - both create and update branches
        if (params.args.create?.credentials) {
          params.args.create.credentials = encryptCredentials(params.args.create.credentials)
        }
        if (params.args.update?.credentials) {
          params.args.update.credentials = encryptCredentials(params.args.update.credentials)
        }
      } else {
        // Handle create/update
        if (params.args.data?.credentials) {
          params.args.data.credentials = encryptCredentials(params.args.data.credentials)
        }
      }
    }

    // Execute query
    const result = await next(params)

    // Decrypt after find queries
    if (params.model === 'PlatformIntegration' as any && result) {
      if (Array.isArray(result)) {
        // findMany
        result.forEach((item: any) => {
          if (item.credentials && typeof item.credentials === 'string') {
            item.credentials = decryptCredentials(item.credentials)
          }
        })
      } else if (result.credentials && typeof result.credentials === 'string') {
        // findUnique, findFirst
        result.credentials = decryptCredentials(result.credentials)
      }
    }

    return result
  }
}
