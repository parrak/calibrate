# Staging Environment

This document describes the staging environment setup for the Calibrate platform, providing a pre-production testing environment for validating changes before they go to production.

## Overview

The staging environment is a complete replica of the production environment, including:
- **API Service**: Backend API with staging-specific configuration
- **Console Application**: Admin interface for managing the platform
- **Documentation Site**: API documentation and guides
- **Database**: Separate staging database with test data
- **Monitoring**: Staging-specific monitoring and alerting

## Environment URLs

- **API**: https://staging-api.calibr.lat
- **Console**: https://staging-console.calibr.lat
- **Docs**: https://staging-docs.calibr.lat

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Staging API   │    │ Staging Console │    │  Staging Docs   │
│                 │    │                 │    │                 │
│ • Next.js API   │    │ • Next.js App   │    │ • Static Site   │
│ • Prisma ORM    │    │ • React UI      │    │ • Swagger UI    │
│ • PostgreSQL    │    │ • Tailwind CSS  │    │ • OpenAPI Spec  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Staging Database│
                    │                 │
                    │ • PostgreSQL    │
                    │ • Test Data     │
                    │ • Staging Schema│
                    └─────────────────┘
```

## Configuration

### Environment Variables

The staging environment uses the following key configuration:

```typescript
// apps/api/config/staging.ts
export const stagingConfig = {
  NODE_ENV: 'staging',
  database: {
    schema: 'staging',
    ssl: true,
    connectionLimit: 10
  },
  api: {
    baseUrl: 'https://staging-api.calibr.lat',
    corsOrigins: [
      'https://staging.calibr.lat',
      'https://staging-console.calibr.lat',
      'https://staging-docs.calibr.lat'
    ]
  },
  security: {
    enableHttps: true,
    enableCors: true,
    enableRateLimiting: true
  },
  monitoring: {
    enabled: true,
    performanceMonitoring: true,
    securityMonitoring: true
  }
}
```

### Database Configuration

The staging database uses a separate schema (`staging`) and includes:
- **Test Data**: Pre-populated with sample products and price changes
- **Isolated Schema**: Separate from production data
- **Test Users**: Staging-specific user accounts
- **Mock Data**: Realistic test scenarios

## Deployment

### Automatic Deployment

The staging environment is automatically deployed when:
- Code is pushed to the `staging` branch
- A pull request is created targeting the `staging` branch
- Manual deployment is triggered via GitHub Actions

### Manual Deployment

To deploy manually:

```bash
# Deploy all services
pwsh scripts/deploy-staging.ps1

# Deploy with options
pwsh scripts/deploy-staging.ps1 -SkipTests -SkipBuild

# Deploy specific environment
pwsh scripts/deploy-staging.ps1 -Environment "staging-test"
```

### Deployment Process

1. **Build**: Compile all applications
2. **Test**: Run unit and integration tests
3. **Deploy API**: Deploy to Vercel with staging configuration
4. **Deploy Console**: Deploy console application
5. **Deploy Docs**: Deploy documentation site
6. **Initialize DB**: Set up staging database with test data
7. **Verify**: Run health checks and integration tests

## Testing

### Automated Testing

The staging environment includes comprehensive automated testing:

```bash
# Run all staging tests
pwsh scripts/test-staging.ps1

# Run specific test categories
pwsh scripts/test-staging.ps1 -SkipPerformance -SkipSecurity

# Run with custom URLs
pwsh scripts/test-staging.ps1 -ApiUrl "https://custom-api.calibr.lat"
```

### Test Categories

1. **Connectivity Tests**: Verify all services are accessible
2. **Health Checks**: Test API health endpoints
3. **Functionality Tests**: Test core API functionality
4. **Performance Tests**: Measure response times and throughput
5. **Security Tests**: Verify security headers and rate limiting
6. **Database Tests**: Test database connectivity and data integrity
7. **Integration Tests**: Test end-to-end workflows

### Test Data

The staging environment includes realistic test data:

```typescript
// Test Products
const testProducts = [
  {
    code: 'STAGING-PRODUCT-001',
    name: 'Staging Test Product 1',
    currentPrice: 29.99,
    currency: 'USD'
  },
  // ... more test products
]

// Test Price Changes
const testPriceChanges = [
  {
    productCode: 'STAGING-PRODUCT-001',
    oldPrice: 29.99,
    newPrice: 34.99,
    status: 'pending',
    source: 'manual'
  },
  // ... more test price changes
]
```

## Monitoring

### Health Checks

- **API Health**: `/api/staging/health`
- **Main Health**: `/api/health`
- **Metrics**: `/api/metrics`

### Performance Monitoring

The staging environment includes comprehensive performance monitoring:
- Response time tracking
- Error rate monitoring
- Resource usage (CPU, memory, database)
- Throughput metrics

### Security Monitoring

Security monitoring includes:
- Vulnerability scanning
- Security header validation
- Rate limiting verification
- Input validation testing

## Management

### Database Management

```bash
# Initialize staging database
curl -X POST "https://staging-api.calibr.lat/api/staging/manage?action=seed"

# Reset staging database
curl -X POST "https://staging-api.calibr.lat/api/staging/manage?action=reset"

# Clean up test data
curl -X POST "https://staging-api.calibr.lat/api/staging/manage?action=cleanup"

# Check database status
curl "https://staging-api.calibr.lat/api/staging/manage?action=status"
```

### Configuration Management

```bash
# Get staging configuration
curl "https://staging-api.calibr.lat/api/staging/manage?action=config"

# Get staging health
curl "https://staging-api.calibr.lat/api/staging/manage?action=health"
```

## Development Workflow

### Working with Staging

1. **Create Feature Branch**: `git checkout -b feature/my-feature`
2. **Develop Feature**: Make your changes
3. **Test Locally**: Run local tests
4. **Push to Staging**: `git push origin feature/my-feature`
5. **Create PR**: Target the `staging` branch
6. **Review**: Code review and testing
7. **Merge**: Merge to `staging` branch
8. **Deploy**: Automatic deployment to staging
9. **Test**: Run staging tests
10. **Promote**: Merge to `master` for production

### Staging-Specific Features

The staging environment includes features not available in production:
- **Test Endpoints**: Additional endpoints for testing
- **Debug Mode**: Enhanced logging and debugging
- **Mock Services**: Simulated external services
- **Test Data**: Pre-populated test data
- **Performance Testing**: Load testing capabilities

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check database credentials
   - Verify network connectivity
   - Check database status

2. **API Health Check Failures**
   - Check API logs
   - Verify environment variables
   - Check database connectivity

3. **Deployment Failures**
   - Check build logs
   - Verify Vercel configuration
   - Check environment variables

4. **Test Failures**
   - Check test logs
   - Verify test data
   - Check API endpoints

### Debugging

```bash
# Check API health
curl "https://staging-api.calibr.lat/api/staging/health"

# Check database status
curl "https://staging-api.calibr.lat/api/staging/manage?action=status"

# Check metrics
curl "https://staging-api.calibr.lat/api/metrics"

# Run staging tests
pwsh scripts/test-staging.ps1 -Verbose
```

## Security

### Access Control

- **Admin Authentication**: Required for management endpoints
- **API Authentication**: Required for sensitive endpoints
- **CORS Configuration**: Restricted to staging domains
- **Rate Limiting**: Applied to all endpoints

### Data Protection

- **Test Data Only**: No production data in staging
- **Data Isolation**: Separate database schema
- **Secure Configuration**: Staging-specific secrets
- **Regular Cleanup**: Automated test data cleanup

## Best Practices

### Development

1. **Always Test in Staging**: Never deploy directly to production
2. **Use Test Data**: Don't use production data in staging
3. **Clean Up**: Remove test data after testing
4. **Monitor Performance**: Watch for performance regressions
5. **Security First**: Test security measures in staging

### Deployment

1. **Automated Deployment**: Use CI/CD pipelines
2. **Health Checks**: Verify deployment success
3. **Rollback Plan**: Have a rollback strategy
4. **Monitoring**: Monitor deployment health
5. **Documentation**: Keep deployment docs updated

## Support

For issues with the staging environment:

1. **Check Logs**: Review application and deployment logs
2. **Run Tests**: Execute staging test suite
3. **Check Status**: Verify service health
4. **Contact Team**: Reach out to the development team
5. **Create Issue**: File a GitHub issue if needed

## Related Documentation

- [API Documentation](https://staging-docs.calibr.lat)
- [Deployment Guide](DEPLOYMENT.md)
- [Development Guide](DEVELOPMENT.md)
- [Security Guide](SECURITY.md)
- [Performance Guide](PERFORMANCE.md)
