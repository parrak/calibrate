# @calibr/types

Generated TypeScript types from the Calibrate API OpenAPI specification.

## Installation

This package is part of the Calibrate monorepo and is automatically available to other packages.

## Usage

### Import Generated Types

```typescript
import type { paths, components } from '@calibr/types/api';

// Use path types for specific endpoints
type HealthResponse = paths['/api/health']['get']['responses']['200']['content']['application/json'];

// Use component types for reusable schemas
type PriceChange = components['schemas']['PriceChange'];
```

### Type-Safe API Calls

```typescript
import type { paths } from '@calibr/types/api';

type PriceChangesResponse = paths['/api/v1/price-changes']['get']['responses']['200']['content']['application/json'];

async function fetchPriceChanges(): Promise<PriceChangesResponse> {
  const response = await fetch('https://api.calibr.lat/api/v1/price-changes');
  return response.json();
}
```

## Generation

Types are automatically generated from `apps/docs/api/openapi.yaml`:

```bash
# Generate types from OpenAPI spec
pnpm --filter @calibr/types generate

# Or build the package (includes generation)
pnpm --filter @calibr/types build
```

## Updating Types

When the OpenAPI specification is updated:

1. Update `apps/docs/api/openapi.yaml`
2. Run `pnpm --filter @calibr/types generate`
3. Commit the updated `api.d.ts` file

## Structure

- `api.d.ts` - Generated TypeScript types from OpenAPI spec
- `src/index.ts` - Package entry point and re-exports
- `dist/` - Compiled output (for future extensions)

