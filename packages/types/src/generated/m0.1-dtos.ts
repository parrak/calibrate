/**
 * M0.1 DTOs - Auto-generated from Prisma schema
 * DO NOT EDIT MANUALLY
 * Generated: 2025-11-09T00:24:47.176Z
 */

// ============================================================================
// Core M0.1 DTOs
// ============================================================================

export interface ProductDTO {
  id: string;
  tenantId: string;
  projectId: string;
  sku: string;
  title: string;
  tags: string[];
  channelRefs?: Record<string, any>;
  active: boolean;
  createdAt: Date | string;
}

export interface CreateProductDTO {
  sku: string;
  title: string;
  tags?: string[];
  channelRefs?: Record<string, any>;
  active?: boolean;
}

export interface UpdateProductDTO {
  title?: string;
  tags?: string[];
  channelRefs?: Record<string, any>;
  active?: boolean;
}

// ============================================================================
// PriceVersion DTOs
// ============================================================================

export interface PriceVersionDTO {
  id: string;
  productId: string;
  currency: string;
  unitAmount: number;
  compareAt?: number;
  validFrom: Date | string;
  validTo?: Date | string;
  createdAt: Date | string;
}

export interface CreatePriceVersionDTO {
  productId: string;
  currency: string;
  unitAmount: number;
  compareAt?: number;
  validFrom?: Date | string;
  validTo?: Date | string;
}

// ============================================================================
// DiscountPolicy DTOs
// ============================================================================

export interface DiscountPolicyDTO {
  id: string;
  tenantId: string;
  projectId: string;
  type: 'percentage' | 'absolute' | 'tiered' | 'floor' | 'ceiling';
  ruleJson: {
    selector: Record<string, any>;
    transform: Record<string, any>;
  };
  enabled: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateDiscountPolicyDTO {
  type: 'percentage' | 'absolute' | 'tiered' | 'floor' | 'ceiling';
  ruleJson: {
    selector: Record<string, any>;
    transform: Record<string, any>;
  };
  enabled?: boolean;
}

export interface UpdateDiscountPolicyDTO {
  type?: 'percentage' | 'absolute' | 'tiered' | 'floor' | 'ceiling';
  ruleJson?: {
    selector: Record<string, any>;
    transform: Record<string, any>;
  };
  enabled?: boolean;
}

// ============================================================================
// PriceChange DTOs
// ============================================================================

export type PriceChangeState =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED'
  | 'FAILED'
  | 'ROLLED_BACK';

export interface PriceChangeDTO {
  id: string;
  tenantId: string;
  projectId: string;
  selectorJson: Record<string, any>;
  transformJson: Record<string, any>;
  scheduleAt?: Date | string;
  state: PriceChangeState;
  createdBy?: string;
  createdAt: Date | string;
}

export interface CreatePriceChangeDTO {
  selectorJson: Record<string, any>;
  transformJson: Record<string, any>;
  scheduleAt?: Date | string;
  createdBy?: string;
}

export interface UpdatePriceChangeDTO {
  state?: PriceChangeState;
  scheduleAt?: Date | string;
}

// ============================================================================
// Event DTOs
// ============================================================================

export interface EventDTO {
  id: string;
  tenantId: string;
  projectId?: string;
  type: string;
  payload: Record<string, any>;
  createdAt: Date | string;
}

export interface CreateEventDTO {
  type: string;
  payload: Record<string, any>;
  projectId?: string;
}

// ============================================================================
// Audit DTOs
// ============================================================================

export interface AuditDTO {
  id: string;
  tenantId: string;
  projectId?: string;
  entity: string;
  entityId: string;
  action: string;
  actor: string;
  explain?: Record<string, any>;
  createdAt: Date | string;
}

export interface CreateAuditDTO {
  entity: string;
  entityId: string;
  action: string;
  actor: string;
  explain?: Record<string, any>;
  projectId?: string;
}

// ============================================================================
// Query/Filter DTOs
// ============================================================================

export interface ProductFilter {
  sku?: string;
  tags?: string[];
  active?: boolean;
  search?: string;
}

export interface PriceChangeFilter {
  state?: PriceChangeState;
  createdBy?: string;
  scheduledAfter?: Date | string;
  scheduledBefore?: Date | string;
}

export interface AuditFilter {
  entity?: string;
  entityId?: string;
  action?: string;
  actor?: string;
  after?: Date | string;
  before?: Date | string;
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
