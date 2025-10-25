/**
 * Input Validation and Sanitization System
 * Comprehensive validation for all user inputs
 */

import { NextRequest } from 'next/server'
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'date' | 'json'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: any[]
  custom?: (value: any) => boolean | string
  sanitize?: boolean
  trim?: boolean
}

export interface ValidationResult {
  valid: boolean
  value?: any
  errors: string[]
  sanitized?: any
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export class InputValidator {
  private static instance: InputValidator
  private schemas: Map<string, ValidationSchema> = new Map()

  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator()
    }
    return InputValidator.instance
  }

  /**
   * Register a validation schema
   */
  registerSchema(name: string, schema: ValidationSchema): void {
    this.schemas.set(name, schema)
  }

  /**
   * Validate input against schema
   */
  validate(input: any, schema: ValidationSchema | string): ValidationResult {
    const validationSchema = typeof schema === 'string' ? this.schemas.get(schema) : schema
    
    if (!validationSchema) {
      return {
        valid: false,
        errors: ['Validation schema not found'],
        value: input
      }
    }

    const errors: string[] = []
    const result: any = {}

    for (const [field, rules] of Object.entries(validationSchema)) {
      const fieldValue = input[field]
      const fieldResult = this.validateField(field, fieldValue, rules)
      
      if (!fieldResult.valid) {
        errors.push(...fieldResult.errors)
      } else {
        result[field] = fieldResult.sanitized || fieldResult.value
      }
    }

    return {
      valid: errors.length === 0,
      value: result,
      errors,
      sanitized: result
    }
  }

  /**
   * Validate a single field
   */
  private validateField(field: string, value: any, rules: ValidationRule): ValidationResult {
    const errors: string[] = []

    // Check if required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      return { valid: false, errors, value }
    }

    // Skip validation if value is empty and not required
    if (!rules.required && (value === undefined || value === null || value === '')) {
      return { valid: true, value, errors: [] }
    }

    let processedValue = value

    // Trim if specified
    if (rules.trim && typeof processedValue === 'string') {
      processedValue = processedValue.trim()
    }

    // Sanitize if specified
    if (rules.sanitize && typeof processedValue === 'string') {
      processedValue = this.sanitizeString(processedValue)
    }

    // Type validation
    if (rules.type) {
      const typeResult = this.validateType(field, processedValue, rules.type)
      if (!typeResult.valid) {
        errors.push(...typeResult.errors)
        return { valid: false, errors, value: processedValue }
      }
      processedValue = typeResult.value
    }

    // String length validation
    if (typeof processedValue === 'string') {
      if (rules.minLength && processedValue.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters long`)
      }
      if (rules.maxLength && processedValue.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters long`)
      }
    }

    // Number range validation
    if (typeof processedValue === 'number') {
      if (rules.min !== undefined && processedValue < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`)
      }
      if (rules.max !== undefined && processedValue > rules.max) {
        errors.push(`${field} must be no more than ${rules.max}`)
      }
    }

    // Pattern validation
    if (rules.pattern && typeof processedValue === 'string') {
      if (!rules.pattern.test(processedValue)) {
        errors.push(`${field} format is invalid`)
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(processedValue)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`)
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(processedValue)
      if (customResult !== true) {
        errors.push(typeof customResult === 'string' ? customResult : `${field} validation failed`)
      }
    }

    return {
      valid: errors.length === 0,
      value: processedValue,
      errors,
      sanitized: processedValue
    }
  }

  /**
   * Validate data type
   */
  private validateType(field: string, value: any, type: string): ValidationResult {
    const errors: string[] = []
    let convertedValue = value

    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          convertedValue = String(value)
        }
        break

      case 'number':
        if (typeof value === 'string') {
          const num = Number(value)
          if (isNaN(num)) {
            errors.push(`${field} must be a valid number`)
          } else {
            convertedValue = num
          }
        } else if (typeof value !== 'number') {
          errors.push(`${field} must be a number`)
        }
        break

      case 'boolean':
        if (typeof value === 'string') {
          if (value.toLowerCase() === 'true') {
            convertedValue = true
          } else if (value.toLowerCase() === 'false') {
            convertedValue = false
          } else {
            errors.push(`${field} must be a boolean`)
          }
        } else if (typeof value !== 'boolean') {
          errors.push(`${field} must be a boolean`)
        }
        break

      case 'email':
        if (typeof value !== 'string' || !validator.isEmail(value)) {
          errors.push(`${field} must be a valid email address`)
        }
        break

      case 'url':
        if (typeof value !== 'string' || !validator.isURL(value)) {
          errors.push(`${field} must be a valid URL`)
        }
        break

      case 'uuid':
        if (typeof value !== 'string' || !validator.isUUID(value)) {
          errors.push(`${field} must be a valid UUID`)
        }
        break

      case 'date':
        if (typeof value !== 'string' || !validator.isISO8601(value)) {
          errors.push(`${field} must be a valid ISO 8601 date`)
        }
        break

      case 'json':
        if (typeof value === 'string') {
          try {
            convertedValue = JSON.parse(value)
          } catch {
            errors.push(`${field} must be valid JSON`)
          }
        } else if (typeof value !== 'object') {
          errors.push(`${field} must be a valid JSON object`)
        }
        break
    }

    return {
      valid: errors.length === 0,
      value: convertedValue,
      errors
    }
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(input: string): string {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '')
    
    // HTML sanitization
    sanitized = DOMPurify.sanitize(sanitized)
    
    // Remove potential SQL injection patterns
    sanitized = sanitized.replace(/['";\\]/g, '')
    
    // Remove potential XSS patterns
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    sanitized = sanitized.replace(/javascript:/gi, '')
    sanitized = sanitized.replace(/on\w+\s*=/gi, '')
    
    return sanitized
  }

  /**
   * Validate request body
   */
  async validateRequestBody(req: NextRequest, schema: ValidationSchema | string): Promise<ValidationResult> {
    try {
      const body = await req.json()
      return this.validate(body, schema)
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid JSON in request body'],
        value: null
      }
    }
  }

  /**
   * Validate query parameters
   */
  validateQueryParams(req: NextRequest, schema: ValidationSchema | string): ValidationResult {
    const params = Object.fromEntries(req.nextUrl.searchParams.entries())
    return this.validate(params, schema)
  }

  /**
   * Validate headers
   */
  validateHeaders(req: NextRequest, schema: ValidationSchema | string): ValidationResult {
    const headers: any = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })
    return this.validate(headers, schema)
  }
}

// Common validation schemas
export const commonSchemas = {
  projectSlug: {
    slug: {
      required: true,
      type: 'string' as const,
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-z0-9-]+$/,
      sanitize: true,
      trim: true
    }
  },

  priceChange: {
    productCode: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 100,
      sanitize: true,
      trim: true
    },
    currentPrice: {
      required: true,
      type: 'number' as const,
      min: 0
    },
    suggestedPrice: {
      required: true,
      type: 'number' as const,
      min: 0
    },
    reason: {
      required: false,
      type: 'string' as const,
      maxLength: 500,
      sanitize: true,
      trim: true
    },
    source: {
      required: false,
      type: 'string' as const,
      enum: ['manual', 'automatic', 'competitor', 'market'],
      sanitize: true,
      trim: true
    }
  },

  webhookPayload: {
    productCode: {
      required: true,
      type: 'string' as const,
      minLength: 1,
      maxLength: 100,
      sanitize: true,
      trim: true
    },
    price: {
      required: true,
      type: 'number' as const,
      min: 0
    },
    timestamp: {
      required: true,
      type: 'date' as const
    },
    metadata: {
      required: false,
      type: 'json' as const
    }
  },

  adminAction: {
    action: {
      required: true,
      type: 'string' as const,
      enum: ['approve', 'reject', 'modify'],
      sanitize: true,
      trim: true
    },
    reason: {
      required: false,
      type: 'string' as const,
      maxLength: 500,
      sanitize: true,
      trim: true
    }
  }
}

// Export singleton instance
export const inputValidator = InputValidator.getInstance()

// Initialize common schemas
Object.entries(commonSchemas).forEach(([name, schema]) => {
  inputValidator.registerSchema(name, schema)
})
