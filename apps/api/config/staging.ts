/**
 * Staging Environment Configuration
 * Configuration for staging environment deployment
 */

export const stagingConfig = {
  // Environment
  NODE_ENV: 'staging',
  PORT: 3000,

  // Database Configuration
  database: {
    url: process.env.STAGING_DATABASE_URL || 'postgresql://staging_user:staging_password@staging-db.calibr.lat:5432/calibrate_staging?schema=staging',
    directUrl: process.env.STAGING_DIRECT_URL || 'postgresql://staging_user:staging_password@staging-db.calibr.lat:5432/calibrate_staging?schema=staging',
    schema: 'staging',
    ssl: true,
    connectionLimit: 10,
    poolTimeout: 30000
  },

  // API Configuration
  api: {
    baseUrl: process.env.STAGING_API_BASE_URL || 'https://staging-api.calibr.lat',
    webhookSecret: process.env.STAGING_WEBHOOK_SECRET || 'staging_webhook_secret_key_32_chars_min',
    sessionSecret: process.env.STAGING_SESSION_SECRET || 'staging_session_secret_key_32_chars_min',
    corsOrigins: [
      'https://staging.calibr.lat',
      'https://staging-console.calibr.lat',
      'https://staging-docs.calibr.lat',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002'
    ]
  },

  // Security Configuration
  security: {
    enableHttps: true,
    enableCors: true,
    enableRateLimiting: true,
    enableSecurityHeaders: true,
    enableInputValidation: true,
    enableAuth: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },

  // Monitoring Configuration
  monitoring: {
    enabled: true,
    performanceMonitoring: true,
    securityMonitoring: true,
    logLevel: 'info',
    metricsRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
    alertThresholds: {
      errorRate: 5.0,
      responseTimeP95: 2000,
      memoryUsage: 85,
      cpuLoad: 2.0
    }
  },

  // Feature Flags
  features: {
    enableDebugMode: false,
    enableAnalytics: true,
    enablePerformanceTracking: true,
    enableSecurityScanning: true,
    enableWebhookRetry: true,
    enableCaching: true,
    enableRateLimiting: true
  },

  // External Services
  services: {
    redis: {
      url: process.env.STAGING_REDIS_URL || 'redis://staging-redis.calibr.lat:6379',
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100
    },
    elasticsearch: {
      url: process.env.STAGING_ELASTICSEARCH_URL || 'http://staging-elasticsearch.calibr.lat:9200',
      index: 'calibrate-staging'
    }
  },

  // Email Configuration
  email: {
    host: process.env.STAGING_SMTP_HOST || 'staging-smtp.calibr.lat',
    port: parseInt(process.env.STAGING_SMTP_PORT || '587'),
    user: process.env.STAGING_SMTP_USER || 'staging@calibr.lat',
    pass: process.env.STAGING_SMTP_PASS || 'staging_smtp_password',
    secure: false,
    from: 'Calibrate Staging <staging@calibr.lat>'
  },

  // Webhook Configuration
  webhook: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    maxConcurrent: 10,
    queueSize: 1000
  },

  // Cache Configuration
  cache: {
    ttl: 300, // 5 minutes
    maxSize: 1000,
    checkPeriod: 120, // 2 minutes
    useClones: false
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    webhookMaxRequests: 60,
    priceChangeMaxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Logging Configuration
  logging: {
    level: 'info',
    format: 'json',
    enableConsole: true,
    enableFile: true,
    filePath: '/var/log/calibrate-staging/api.log',
    maxFileSize: '10MB',
    maxFiles: 5
  },

  // Testing Configuration
  testing: {
    enableTestData: true,
    enableTestEndpoints: true,
    testDataRetention: 24 * 60 * 60 * 1000, // 24 hours
    mockExternalServices: true
  }
}

export default stagingConfig
