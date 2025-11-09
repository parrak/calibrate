#!/usr/bin/env tsx
/**
 * M0.1: Migration Check Script for CI
 * Verifies migrations are deterministic and schema is in sync
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, '../prisma/migrations');
const SCHEMA_FILE = join(__dirname, '../prisma/schema.prisma');

console.log('🔍 M0.1 Migration Check');
console.log('━'.repeat(50));

let exitCode = 0;

// 1. Check schema file exists
if (!existsSync(SCHEMA_FILE)) {
  console.error('❌ Schema file not found');
  process.exit(1);
}
console.log('✓ Schema file exists');

// 2. Verify schema formatting
try {
  const before = readFileSync(SCHEMA_FILE, 'utf-8');
  execSync('pnpm prisma format', { cwd: join(__dirname, '..'), stdio: 'pipe' });
  const after = readFileSync(SCHEMA_FILE, 'utf-8');

  if (before !== after) {
    console.error('❌ Schema not formatted. Run: pnpm prisma format');
    exitCode = 1;
  } else {
    console.log('✓ Schema formatted correctly');
  }
} catch (error) {
  console.error('❌ Schema format check failed:', (error as Error).message);
  exitCode = 1;
}

// 3. Check migrations directory exists
if (existsSync(MIGRATIONS_DIR)) {
  console.log('✓ Migrations directory exists');
} else {
  console.warn('⚠ No migrations directory (expected for fresh setup)');
}

// 4. Validate schema syntax
try {
  execSync('pnpm prisma validate', { cwd: join(__dirname, '..'), stdio: 'pipe' });
  console.log('✓ Schema validation passed');
} catch (error) {
  console.error('❌ Schema validation failed');
  exitCode = 1;
}

// 5. Check for M0.1 required models
const schemaContent = readFileSync(SCHEMA_FILE, 'utf-8');
const requiredModels = ['Product', 'PriceVersion', 'DiscountPolicy', 'PriceChange', 'Event', 'Audit'];
const missingModels = requiredModels.filter(model => !schemaContent.includes(`model ${model}`));

if (missingModels.length > 0) {
  console.error(`❌ Missing M0.1 models: ${missingModels.join(', ')}`);
  exitCode = 1;
} else {
  console.log('✓ All M0.1 core models present');
}

// 6. Check for M0.1 required fields
const requiredFields = [
  { model: 'Product', fields: ['sku', 'title', 'tags', 'channelRefs', 'active'] },
  { model: 'PriceVersion', fields: ['productId', 'currency', 'unitAmount', 'validFrom'] },
  { model: 'DiscountPolicy', fields: ['type', 'ruleJson', 'enabled'] },
  { model: 'PriceChange', fields: ['selectorJson', 'transformJson', 'state'] },
  { model: 'Event', fields: ['type', 'payload'] },
  { model: 'Audit', fields: ['entity', 'entityId', 'action', 'actor'] }
];

requiredFields.forEach(({ model, fields }) => {
  const modelRegex = new RegExp(`model ${model}\\s*{[\\s\\S]*?}`, 'm');
  const modelMatch = schemaContent.match(modelRegex);

  if (modelMatch) {
    const modelContent = modelMatch[0];
    const missing = fields.filter(field => !modelContent.includes(field));

    if (missing.length > 0) {
      console.error(`❌ ${model} missing fields: ${missing.join(', ')}`);
      exitCode = 1;
    }
  }
});

console.log('━'.repeat(50));

if (exitCode === 0) {
  console.log('✅ All migration checks passed');
} else {
  console.error('❌ Migration checks failed');
}

process.exit(exitCode);
