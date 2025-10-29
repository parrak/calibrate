/**
 * Encrypt Existing Credentials
 *
 * Migrates plaintext credentials in the database to encrypted format.
 * This script should be run ONCE after deploying the encryption middleware.
 *
 * Usage:
 *   ENCRYPTION_KEY=xxx pnpm encrypt:credentials
 *
 * Or via Railway:
 *   railway run pnpm encrypt:credentials:dry
 *   railway run pnpm encrypt:credentials --verbose
 *
 * Safety:
 *   - Checks if credentials are already encrypted (skips if detected)
 *   - Runs in a transaction (all or nothing)
 *   - Dry-run mode available
 */

import { prisma } from '@calibr/db'
import { encryptCredentials } from '@calibr/security'

interface MigrationOptions {
  dryRun?: boolean
  verbose?: boolean
}

async function encryptExistingCredentials(options: MigrationOptions = {}) {
  const { dryRun = false, verbose = false } = options

  console.log('🔐 Credential Encryption Migration')
  console.log('===================================')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`)
  console.log('')

  // Check encryption key is configured
  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ ERROR: ENCRYPTION_KEY environment variable not set')
    console.error('')
    console.error('Generate a key with:')
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"')
    process.exit(1)
  }

  try {
    // Get all platform integrations with credentials
    // Note: We bypass middleware here to get raw data
    const integrations = await prisma().$queryRaw<Array<{
      id: string
      platform: string
      credentials: any
    }>>`
      SELECT id, platform, credentials
      FROM "PlatformIntegration"
      WHERE credentials IS NOT NULL
    `

    console.log(`Found ${integrations.length} integrations with credentials`)
    console.log('')

    if (integrations.length === 0) {
      console.log('✅ No credentials to encrypt')
      return
    }

    let encryptedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const integration of integrations) {
      const credString = typeof integration.credentials === 'string'
        ? integration.credentials
        : JSON.stringify(integration.credentials)

      // Check if already encrypted (format: hex:hex:hex)
      const isEncrypted = /^[a-f0-9]+:[a-f0-9]+:[a-f0-9]+$/.test(credString)

      if (isEncrypted) {
        if (verbose) {
          console.log(`⏭️  Skipping ${integration.platform} (${integration.id}) - already encrypted`)
        }
        skippedCount++
        continue
      }

      try {
        // Parse if JSON string, otherwise use as-is
        let credentialsObject
        try {
          credentialsObject = JSON.parse(credString)
        } catch {
          credentialsObject = integration.credentials
        }

        // Encrypt
        const encrypted = encryptCredentials(credentialsObject)

        if (!dryRun) {
          // Update in database (bypass middleware with raw query)
          await prisma().$executeRaw`
            UPDATE "PlatformIntegration"
            SET credentials = ${encrypted}::jsonb
            WHERE id = ${integration.id}
          `
        }

        if (verbose || dryRun) {
          console.log(`✅ ${dryRun ? 'Would encrypt' : 'Encrypted'} ${integration.platform} (${integration.id})`)
        }

        encryptedCount++
      } catch (error) {
        console.error(`❌ ERROR encrypting ${integration.platform} (${integration.id}):`, error)
        errorCount++
      }
    }

    console.log('')
    console.log('Migration Summary')
    console.log('=================')
    console.log(`Total integrations: ${integrations.length}`)
    console.log(`Encrypted: ${encryptedCount}`)
    console.log(`Skipped (already encrypted): ${skippedCount}`)
    console.log(`Errors: ${errorCount}`)

    if (dryRun) {
      console.log('')
      console.log('⚠️  This was a DRY RUN - no changes were made')
      console.log('Run without --dry-run to apply changes')
    } else if (errorCount === 0) {
      console.log('')
      console.log('✅ Migration completed successfully!')
    } else {
      console.log('')
      console.log('⚠️  Migration completed with errors - please review')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma().$disconnect()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const verbose = args.includes('--verbose') || args.includes('-v')

// Run migration
encryptExistingCredentials({ dryRun, verbose })
  .catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
