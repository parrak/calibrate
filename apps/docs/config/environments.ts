/**
 * Environment-specific configuration for Calibrate API Documentation
 */

export interface DocsConfig {
  baseUrl: string
  apiBaseUrl: string
  environment: 'development' | 'staging' | 'production'
}

const environments: Record<string, DocsConfig> = {
  development: {
    baseUrl: 'http://localhost:3002',
    apiBaseUrl: 'http://localhost:3000',
    environment: 'development'
  },
  staging: {
    baseUrl: 'https://staging-docs.calibr.lat',
    apiBaseUrl: 'https://staging-api.calibr.lat',
    environment: 'staging'
  },
  production: {
    baseUrl: 'https://docs.calibr.lat',
    apiBaseUrl: 'https://api.calibr.lat',
    environment: 'production'
  }
}

export function getDocsConfig(): DocsConfig {
  const env = process.env.NODE_ENV || 'development'
  return environments[env] || environments.development
}

export function getDocsUrl(): string {
  return getDocsConfig().baseUrl
}

export function getApiUrl(): string {
  return getDocsConfig().apiBaseUrl
}
