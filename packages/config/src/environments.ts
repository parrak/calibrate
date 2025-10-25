/**
 * Shared environment configuration for Calibrate applications
 */

export interface EnvironmentConfig {
  docsUrl: string
  apiUrl: string
  consoleUrl: string
  siteUrl: string
  environment: 'development' | 'staging' | 'production'
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    docsUrl: 'http://localhost:3002',
    apiUrl: 'http://localhost:3000',
    consoleUrl: 'http://localhost:3001',
    siteUrl: 'http://localhost:3003',
    environment: 'development'
  },
  staging: {
    docsUrl: 'https://staging-docs.calibr.lat',
    apiUrl: 'https://staging-api.calibr.lat',
    consoleUrl: 'https://staging-console.calibr.lat',
    siteUrl: 'https://staging.calibr.lat',
    environment: 'staging'
  },
  production: {
    docsUrl: 'https://docs.calibr.lat',
    apiUrl: 'https://api.calibr.lat',
    consoleUrl: 'https://console.calibr.lat',
    siteUrl: 'https://calibr.lat',
    environment: 'production'
  }
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || 'development'
  return environments[env] || environments.development
}

export function getDocsUrl(): string {
  return process.env.DOCS_BASE_URL || getEnvironmentConfig().docsUrl
}

export function getApiUrl(): string {
  return process.env.API_BASE_URL || getEnvironmentConfig().apiUrl
}

export function getConsoleUrl(): string {
  return process.env.CONSOLE_BASE_URL || getEnvironmentConfig().consoleUrl
}

export function getSiteUrl(): string {
  return process.env.SITE_BASE_URL || getEnvironmentConfig().siteUrl
}
