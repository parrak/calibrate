#!/bin/bash
# Verify GitHub Branch Protection Configuration
# This script checks if branch protection is properly configured.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BRANCH="master"
REPO_OWNER="parrak"
REPO_NAME="calibrate"
REPO="${REPO_OWNER}/${REPO_NAME}"

# Required checks
REQUIRED_CHECKS=(
  "Deployment Validation / validate-deployment"
  "Lockfile Check / pnpm-frozen-lockfile"
)

echo "Verifying branch protection for ${BRANCH} branch..."
echo ""

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
  exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
  echo -e "${RED}Error: Not authenticated with GitHub CLI.${NC}"
  exit 1
fi

# Fetch branch protection status
echo "Checking branch protection status..."
PROTECTION_STATUS=$(gh api repos/${REPO}/branches/${BRANCH}/protection 2>/dev/null || echo "{}")

# Check if protection is enabled
if [ "$PROTECTION_STATUS" = "{}" ]; then
  echo -e "${RED}✗ Branch protection is NOT enabled for ${BRANCH}${NC}"
  echo ""
  echo "To enable it, run:"
  echo "  bash .github/scripts/setup-branch-protection.sh"
  exit 1
fi

echo -e "${GREEN}✓ Branch protection is enabled${NC}"
echo ""

# Check required status checks
echo "Checking required status checks..."
REQUIRED_STATUS_CHECKS=$(echo "$PROTECTION_STATUS" | jq -r '.required_status_checks.contexts[]?' 2>/dev/null || echo "")

if [ -z "$REQUIRED_STATUS_CHECKS" ]; then
  echo -e "${YELLOW}⚠ No required status checks found${NC}"
else
  echo "Configured checks:"
  echo "$REQUIRED_STATUS_CHECKS" | while read -r check; do
    if echo "${REQUIRED_CHECKS[@]}" | grep -q "$check"; then
      echo -e "  ${GREEN}✓${NC} $check"
    else
      echo -e "  ${YELLOW}?${NC} $check"
    fi
  done
  echo ""
  
  # Verify all required checks are present
  ALL_PRESENT=true
  for check in "${REQUIRED_CHECKS[@]}"; do
    if ! echo "$REQUIRED_STATUS_CHECKS" | grep -q "$check"; then
      echo -e "${YELLOW}⚠ Missing required check: $check${NC}"
      ALL_PRESENT=false
    fi
  done
  
  if [ "$ALL_PRESENT" = true ]; then
    echo -e "${GREEN}✓ All required checks are configured${NC}"
  fi
fi

echo ""

# Check other protection settings
STRICT_MODE=$(echo "$PROTECTION_STATUS" | jq -r '.required_status_checks.strict' 2>/dev/null || echo "false")
ENFORCE_ADMINS=$(echo "$PROTECTION_STATUS" | jq -r '.enforce_admins.enabled' 2>/dev/null || echo "false")
ALLOW_FORCE_PUSHES=$(echo "$PROTECTION_STATUS" | jq -r '.allow_force_pushes.enabled' 2>/dev/null || echo "true")

echo "Other protection settings:"
if [ "$STRICT_MODE" = "true" ]; then
  echo -e "  ${GREEN}✓${NC} Require branches to be up to date"
else
  echo -e "  ${YELLOW}⚠${NC} Branches don't need to be up to date"
fi

if [ "$ENFORCE_ADMINS" = "true" ]; then
  echo -e "  ${GREEN}✓${NC} Protection enforced on administrators"
else
  echo -e "  ${YELLOW}⚠${NC} Administrators can bypass protection"
fi

if [ "$ALLOW_FORCE_PUSHES" = "false" ]; then
  echo -e "  ${GREEN}✓${NC} Force pushes disabled"
else
  echo -e "  ${RED}✗${NC} Force pushes are allowed (not recommended)"
fi

echo ""
echo "View full configuration:"
echo "  https://github.com/${REPO}/settings/branches"

