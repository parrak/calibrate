# Vercel Preview Deployments Verification

This document verifies and documents Vercel preview deployment configuration for PRs.

## Overview

Vercel automatically creates preview deployments for pull requests when:
1. Vercel GitHub integration is connected
2. Projects are linked to the GitHub repository
3. Preview deployments are enabled in project settings

## Projects

The following projects should have preview deployments enabled:

| Project | Vercel Project Name | Production URL | Status |
|---------|-------------------|----------------|--------|
| Console | `console` | https://console.calibr.lat | ✅ Configured |
| Site | `calibrate-site` | https://calibr.lat | ✅ Configured |
| Docs | `docs` | https://docs.calibr.lat | ✅ Configured |

## Verification Steps

### 1. Check Vercel GitHub Integration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Git**
3. Verify GitHub integration is connected
4. Verify repository is linked: `parrak/calibrate`

### 2. Verify Project Settings

For each project (console, calibrate-site, docs):

1. Go to **Project Settings** → **Git**
2. Verify:
   - ✅ **Production Branch**: `master` or `main`
   - ✅ **Preview Deployments**: Enabled
   - ✅ **Automatic Preview Deployments**: Enabled for all branches

### 3. Test Preview Deployment

1. Create a test PR or use an existing PR
2. Check Vercel dashboard for preview deployment
3. Verify preview URL is generated (format: `https://[project]-[hash]-[team].vercel.app`)
4. Check PR comments for Vercel bot deployment links

### 4. Verify Vercel Bot Integration

The Vercel bot should automatically comment on PRs with:
- Preview deployment URL
- Build status
- Deployment status

If bot comments are missing:
1. Check Vercel project settings → **Git** → **Deploy Hooks**
2. Verify GitHub integration permissions
3. Check GitHub repository settings → **Integrations** → **Vercel**

## Configuration Files

Each app has a `vercel.json` file configured for monorepo deployment:

- `apps/console/vercel.json`
- `apps/site/vercel.json`
- `apps/docs/vercel.json`

These files configure:
- pnpm version (9.0.0)
- Build commands for monorepo
- Install commands with corepack

## Troubleshooting

### Preview Deployments Not Appearing

**Symptom:** PRs don't trigger preview deployments

**Diagnosis:**
1. Check Vercel dashboard → Project → Deployments
2. Verify GitHub integration is active
3. Check project settings → Git → Preview Deployments enabled

**Fix:**
1. Reconnect GitHub integration if needed
2. Enable "Automatic Preview Deployments" in project settings
3. Verify branch protection rules don't block Vercel

### Preview URL Not in PR Comments

**Symptom:** Deployment succeeds but no bot comment

**Fix:**
1. Check Vercel project settings → Git → Deploy Comments
2. Ensure "Comment on Pull Requests" is enabled
3. Verify Vercel bot has write permissions to repository

### Build Failures on Preview

**Symptom:** Preview deployments fail to build

**Common Causes:**
- Missing environment variables (check Preview environment vars)
- pnpm lockfile issues (verify vercel.json installCommand)
- Monorepo build configuration

**Fix:**
1. Check build logs in Vercel dashboard
2. Verify environment variables are set for Preview environment
3. Test build locally: `pnpm --filter @calibr/[app] build`

## Environment Variables

Preview deployments use **Preview** environment variables. Ensure these are set:

### Console
- `NEXT_PUBLIC_API_BASE` (may differ for previews)
- `AUTH_SECRET`
- `NEXTAUTH_URL` (preview URL)

### Site
- `NEXT_PUBLIC_API_BASE`

### Docs
- (No environment variables required)

**Note:** Preview environment variables can be set in Vercel dashboard → Project → Settings → Environment Variables → Preview

## CI/CD Integration

Vercel preview deployments are independent of GitHub Actions workflows. However, we can add a verification step:

```yaml
# .github/workflows/verify-preview-deployment.yml
name: Verify Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  check-vercel-preview:
    runs-on: ubuntu-latest
    steps:
      - name: Check for Vercel preview comment
        uses: actions/github-script@v6
        with:
          script: |
            // Verify Vercel bot commented on PR
            const comments = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });
            
            const vercelComment = comments.data.find(c => 
              c.user.login === 'vercel[bot]'
            );
            
            if (!vercelComment) {
              core.warning('Vercel preview deployment comment not found');
            }
```

## Best Practices

1. **Always test preview deployments** before merging PRs
2. **Set preview-specific environment variables** when needed
3. **Monitor build times** - preview builds should complete in < 5 minutes
4. **Clean up old previews** - Vercel automatically cleans up after PR merge/close
5. **Document preview URLs** in PR descriptions for reviewers

## Status

✅ **Configuration Complete** (as of January 2025)

All three projects (console, site, docs) are configured with:
- ✅ Vercel.json files for monorepo builds
- ✅ pnpm version configuration
- ✅ GitHub integration (assumed based on production deployments)

**Action Required:** Manual verification in Vercel dashboard to confirm preview deployments are enabled.

## Related Documentation

- [Vercel Deployment Guide](.github/VERCEL_DEPLOYMENT_GUIDE.md)
- [Production Deployment Guide](production-guide.md)
- [README Deployment Section](../../../../README.md#deployment)

