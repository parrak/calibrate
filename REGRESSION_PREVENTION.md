# Regression Prevention Guide

## 🚨 Critical Issue Analysis

### What Went Wrong (BigInt Serialization Regression)

**Root Cause:**
- PostgreSQL returns `BigInt` values that cannot be serialized to JSON
- Enhanced health check endpoint returned raw database query results
- No local testing caught the BigInt serialization issue
- Deployment failed with "Do not know how to serialize a BigInt"

**Impact:**
- Production deployment completely broken
- Health checks failing, preventing deployment promotion
- All API endpoints returning 500 errors
- System unusable until hotfix deployed

## 🛡️ Comprehensive Safeguards Implemented

### 1. Automated Validation Script
**File:** `scripts/validate-deployment.ps1`

**Features:**
- Comprehensive pre-deployment testing
- JSON serialization validation
- API endpoint testing
- Docker build verification
- Database migration testing
- Health check validation

**Usage:**
```powershell
# Full validation
.\scripts\validate-deployment.ps1

# Skip specific checks
.\scripts\validate-deployment.ps1 -SkipBuild -SkipTests
```

### 2. Pre-commit Hook
**File:** `.github/hooks/pre-commit`

**Features:**
- Detects BigInt serialization issues before commit
- Validates critical files
- Checks for common regression patterns
- Prevents problematic commits

**Installation:**
```bash
chmod +x .github/hooks/pre-commit
cp .github/hooks/pre-commit .git/hooks/
```

### 3. CI/CD Pipeline
**File:** `.github/workflows/deployment-validation.yml`

**Features:**
- Automated testing on every push/PR
- JSON serialization validation
- Docker build testing
- API endpoint verification
- Prevents broken code from reaching master

### 4. JSON Serialization Test Utility
**File:** `apps/api/lib/json-serialization-test.ts`

**Features:**
- Tests all API endpoints for serialization issues
- Detects BigInt values before deployment
- Provides safe JSON response helpers
- CLI interface for manual testing

**Usage:**
```bash
pnpm --filter @calibr/api run test:json-serialization
```

### 5. Enhanced Agent Instructions
**File:** `.github/copilot-instructions.md`

**New Sections:**
- JSON serialization prevention patterns
- Required BigInt conversion patterns
- Comprehensive validation checklist
- Common regression causes table

## 🔧 Required Patterns for All Developers

### BigInt Handling (CRITICAL)

```typescript
// ❌ WRONG - Will cause deployment failure
const result = await prisma().$queryRaw`SELECT count(*) as total FROM table`
return NextResponse.json({ total: result[0].total })

// ✅ CORRECT - Convert BigInt to number
const result = await prisma().$queryRaw`SELECT count(*) as total FROM table`
return NextResponse.json({ total: Number(result[0].total) || 0 })
```

### Safe JSON Response Helper

```typescript
import { safeJsonResponse } from '@/lib/json-serialization-test'

// Use this for all API responses
return safeJsonResponse({ data: convertedData })
```

### Required Validation Steps

1. **Before Every Commit:**
   ```bash
   # Run pre-commit hook
   .git/hooks/pre-commit
   
   # Test JSON serialization
   pnpm --filter @calibr/api run test:json-serialization
   ```

2. **Before Every Merge:**
   ```bash
   # Run full validation
   .\scripts\validate-deployment.ps1
   
   # Test all API endpoints
   curl http://localhost:3000/api/health | jq .
   curl "http://localhost:3000/api/metrics?project=demo" | jq .
   ```

3. **Before Every Push to Master:**
   ```bash
   # Run comprehensive validation
   .\scripts\validate-deployment.ps1 -Verbose
   
   # Verify Docker build
   docker build -f apps/api/Dockerfile -t test .
   ```

## 📋 Agent Checklist

### Before Making Changes
- [ ] Read this regression prevention guide
- [ ] Understand BigInt serialization requirements
- [ ] Review existing patterns in codebase

### During Development
- [ ] Convert all BigInt values to numbers
- [ ] Use `safeJsonResponse` helper
- [ ] Test JSON serialization locally
- [ ] Run pre-commit hook

### Before Committing
- [ ] Run `.\scripts\validate-deployment.ps1`
- [ ] Test all affected API endpoints
- [ ] Verify JSON responses are valid
- [ ] Check for BigInt serialization issues

### Before Merging
- [ ] Full validation script passes
- [ ] All API endpoints return valid JSON
- [ ] Docker build succeeds
- [ ] Health check works correctly

## 🚨 Emergency Response

### If Deployment Fails
1. **Immediate:** Check Railway logs for BigInt errors
2. **Quick Fix:** Convert BigInt values to numbers
3. **Deploy:** Push hotfix to master
4. **Verify:** Test all endpoints work
5. **Document:** Update this guide with new patterns

### Common Error Messages
- `"Do not know how to serialize a BigInt"` → Convert BigInt to number
- `"Cannot convert the JSON string because a dictionary contains duplicated keys"` → Normalize object keys
- `"Health check failed"` → Check BigInt serialization in health endpoint

## 📊 Success Metrics

### Validation Coverage
- [ ] All API endpoints tested
- [ ] JSON serialization validated
- [ ] Docker build verified
- [ ] Health check working
- [ ] Database migrations tested

### Regression Prevention
- [ ] Pre-commit hooks active
- [ ] CI/CD pipeline running
- [ ] Validation script comprehensive
- [ ] Agent instructions updated
- [ ] Patterns documented

## 🔄 Continuous Improvement

### Monthly Reviews
- Review validation script effectiveness
- Update patterns based on new issues
- Enhance agent instructions
- Improve CI/CD pipeline

### Feedback Loop
- Document any new regression patterns
- Update this guide with new safeguards
- Share learnings with team
- Improve validation tools

---

**Remember:** Prevention is better than cure. Always run validation before deploying!
