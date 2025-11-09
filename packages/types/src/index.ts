/**
 * @calibr/types - Generated TypeScript types from Calibrate API OpenAPI specification
 * 
 * This package provides type-safe TypeScript definitions for the Calibrate API.
 * Types are automatically generated from the OpenAPI specification.
 * 
 * @example
 * ```typescript
 * import type { paths } from '@calibr/types/api';
 * 
 * // Use generated types for API requests/responses
 * type HealthResponse = paths['/api/health']['get']['responses']['200']['content']['application/json'];
 * ```
 */

// Re-export generated API types
export type { paths, operations, components } from '../api';

// M0.1: Export generated DTOs from Prisma schema
export * from './generated/m0.1-dtos';

// Export a version identifier for type checking
export const API_TYPES_VERSION = '1.0.0' as const;

