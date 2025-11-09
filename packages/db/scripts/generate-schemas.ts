#!/usr/bin/env tsx
/**
 * M0.1: JSON Schema Generator with Semver Registry
 * Generates JSON Schemas from Prisma models and maintains version registry
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMA_VERSION = '0.1.0'; // M0.1 initial version
const SCHEMAS_DIR = join(__dirname, '../schemas');
const REGISTRY_FILE = join(SCHEMAS_DIR, 'registry.json');

// M0.1 Core Models
const schemas = {
  Product: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://calibr.lat/schemas/product/v0.1.0',
    title: 'Product',
    description: 'M0.1 Product schema - catalog item with pricing',
    type: 'object',
    required: ['id', 'tenantId', 'projectId', 'sku', 'title', 'active'],
    properties: {
      id: { type: 'string', description: 'Unique identifier' },
      tenantId: { type: 'string', description: 'Tenant ID (RLS scope)' },
      projectId: { type: 'string', description: 'Project ID' },
      sku: { type: 'string', description: 'Canonical SKU' },
      title: { type: 'string', description: 'Product title' },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Product tags for filtering'
      },
      channelRefs: {
        type: 'object',
        description: 'Connector-specific references (Shopify ID, etc.)',
        additionalProperties: true
      },
      active: { type: 'boolean', description: 'Active status' },
      createdAt: { type: 'string', format: 'date-time' }
    },
    additionalProperties: false
  },

  PriceVersion: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://calibr.lat/schemas/price-version/v0.1.0',
    title: 'PriceVersion',
    description: 'M0.1 Price version - temporal pricing data',
    type: 'object',
    required: ['id', 'productId', 'currency', 'unitAmount', 'validFrom'],
    properties: {
      id: { type: 'string' },
      productId: { type: 'string', description: 'Product reference' },
      currency: { type: 'string', pattern: '^[A-Z]{3}$', description: 'ISO 4217 currency code' },
      unitAmount: { type: 'integer', description: 'Price in smallest currency unit (cents)' },
      compareAt: { type: 'integer', description: 'Optional compare-at price' },
      validFrom: { type: 'string', format: 'date-time', description: 'Version start date' },
      validTo: { type: 'string', format: 'date-time', description: 'Version end date (null = active)' },
      createdAt: { type: 'string', format: 'date-time' }
    },
    additionalProperties: false
  },

  DiscountPolicy: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://calibr.lat/schemas/discount-policy/v0.1.0',
    title: 'DiscountPolicy',
    description: 'M0.1 Discount policy - reusable pricing rules',
    type: 'object',
    required: ['id', 'tenantId', 'projectId', 'type', 'ruleJson', 'enabled'],
    properties: {
      id: { type: 'string' },
      tenantId: { type: 'string', description: 'Tenant ID (RLS scope)' },
      projectId: { type: 'string' },
      type: {
        type: 'string',
        enum: ['percentage', 'absolute', 'tiered', 'floor', 'ceiling'],
        description: 'Policy type'
      },
      ruleJson: {
        type: 'object',
        description: 'Rule definition (selector + transform)',
        properties: {
          selector: { type: 'object', description: 'Product selector predicate' },
          transform: { type: 'object', description: 'Price transformation' }
        },
        required: ['selector', 'transform']
      },
      enabled: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    additionalProperties: false
  },

  PriceChange: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://calibr.lat/schemas/price-change/v0.1.0',
    title: 'PriceChange',
    description: 'M0.1 Price change - proposed or applied bulk pricing change',
    type: 'object',
    required: ['id', 'tenantId', 'projectId', 'selectorJson', 'transformJson', 'state'],
    properties: {
      id: { type: 'string' },
      tenantId: { type: 'string', description: 'Tenant ID (RLS scope)' },
      projectId: { type: 'string' },
      selectorJson: {
        type: 'object',
        description: 'Rule selector (which products to change)'
      },
      transformJson: {
        type: 'object',
        description: 'Transform definition (%, absolute, floor/ceiling)'
      },
      scheduleAt: {
        type: 'string',
        format: 'date-time',
        description: 'Optional scheduled execution time'
      },
      state: {
        type: 'string',
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'APPLIED', 'FAILED', 'ROLLED_BACK'],
        description: 'Change lifecycle state'
      },
      createdBy: { type: 'string', description: 'Actor (user or system)' },
      createdAt: { type: 'string', format: 'date-time' }
    },
    additionalProperties: false
  },

  Event: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://calibr.lat/schemas/event/v0.1.0',
    title: 'Event',
    description: 'M0.1 Event - append-only event log',
    type: 'object',
    required: ['id', 'tenantId', 'type', 'payload', 'createdAt'],
    properties: {
      id: { type: 'string' },
      tenantId: { type: 'string', description: 'Tenant ID (RLS scope)' },
      projectId: { type: 'string' },
      type: {
        type: 'string',
        description: 'Event type (e.g., shopify.sync.complete, pricechange.applied)'
      },
      payload: {
        type: 'object',
        description: 'Event payload (connector-specific)',
        additionalProperties: true
      },
      createdAt: { type: 'string', format: 'date-time' }
    },
    additionalProperties: false
  },

  Audit: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://calibr.lat/schemas/audit/v0.1.0',
    title: 'Audit',
    description: 'M0.1 Audit - explainable action log',
    type: 'object',
    required: ['id', 'tenantId', 'entity', 'entityId', 'action', 'actor', 'createdAt'],
    properties: {
      id: { type: 'string' },
      tenantId: { type: 'string', description: 'Tenant ID (RLS scope)' },
      projectId: { type: 'string' },
      entity: {
        type: 'string',
        description: 'Entity type (Product, PriceChange, etc.)'
      },
      entityId: { type: 'string', description: 'Entity ID' },
      action: {
        type: 'string',
        description: 'Action performed (create, update, apply, rollback)'
      },
      actor: { type: 'string', description: 'User or system actor' },
      explain: {
        type: 'object',
        description: 'Explainability trace (why/how)',
        additionalProperties: true
      },
      createdAt: { type: 'string', format: 'date-time' }
    },
    additionalProperties: false
  }
};

// Create schemas directory
if (!existsSync(SCHEMAS_DIR)) {
  mkdirSync(SCHEMAS_DIR, { recursive: true });
}

// Write individual schema files
Object.entries(schemas).forEach(([name, schema]) => {
  const filename = join(SCHEMAS_DIR, `${name.toLowerCase()}.v${SCHEMA_VERSION}.json`);
  writeFileSync(filename, JSON.stringify(schema, null, 2));
  console.log(`✓ Generated ${name} schema v${SCHEMA_VERSION}`);
});

// Create semver registry
const registry = {
  version: SCHEMA_VERSION,
  generated: new Date().toISOString(),
  schemas: Object.keys(schemas).reduce((acc, name) => {
    acc[name] = {
      current: SCHEMA_VERSION,
      versions: [SCHEMA_VERSION],
      path: `${name.toLowerCase()}.v${SCHEMA_VERSION}.json`
    };
    return acc;
  }, {} as Record<string, any>)
};

writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2));
console.log(`\n✓ Created schema registry v${SCHEMA_VERSION}`);
console.log(`  Location: ${REGISTRY_FILE}`);
console.log(`  Schemas: ${Object.keys(schemas).length}`);
