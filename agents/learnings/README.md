# Agent Learnings & Bug Fixes

This directory consolidates key learnings, bug fixes, and troubleshooting guides extracted from project documentation.

## Structure

- **bug-fixes/** - Critical bug fixes and resolutions
- **setup-guides/** - Setup and configuration guides
- **troubleshooting/** - Common issues and solutions
- **deployment/** - Deployment-related learnings

## Quick Reference

### Critical Bug Fixes

1. **Shopify Connector Registration** - `bug-fixes/shopify-connector-registration.md`
   - Issue: Integrations page showing "Failed to fetch" - only Amazon registered
   - Fix: Import Shopify connector to trigger auto-registration
   - File: `apps/api/lib/platforms/register.ts`

2. **Shopify OAuth & CORS Issues (Oct 31, 2025)** - `bug-fixes/shopify-oauth-cors.md`
   - Multiple OAuth and CORS fixes documented
   - Key learnings on CORS requirements, const reassignment, credential flow

3. **CORS Configuration** - `bug-fixes/cors-configuration.md`
   - All API routes need `withSecurity` middleware and OPTIONS handler
   - Must include `credentials: 'include'` in fetch calls

### Setup Guides

- **Shopify Integration** - `setup-guides/shopify-integration.md`
- **Environment Variables** - `setup-guides/environment-setup.md`
- **Local Development** - `setup-guides/local-development.md`

### Deployment

- **Production Deployment** - `deployment/production-guide.md`
- **Railway Deployment** - `deployment/railway-deployment.md`

## How to Use

1. **When debugging**: Check `bug-fixes/` for similar issues
2. **When setting up**: Check `setup-guides/` for configuration
3. **When deploying**: Check `deployment/` for deployment notes
4. **When troubleshooting**: Check `troubleshooting/` for common issues

## Contributing

When documenting a new learning or bug fix:
1. Create a file in the appropriate subdirectory
2. Include: Issue description, root cause, fix, testing, file references
3. Update this README if it's a critical fix

