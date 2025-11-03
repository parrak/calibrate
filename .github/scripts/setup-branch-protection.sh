#!/bin/bash
# Setup GitHub Branch Protection Rules
# This script configures branch protection for the master branch to require
# all GitHub Actions to pass before merging.

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

# Status checks that must pass (job names from workflows)
REQUIRED_CHECKS=(
  "Deployment Validation / validate-deployment"
  "Lockfile Check / pnpm-frozen-lockfile"
)

echo -e "${GREEN}Setting up branch protection for ${BRANCH} branch...${NC}"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
  echo "Install it from: https://cli.github.com/manual/installation"
  exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
  echo -e "${RED}Error: Not authenticated with GitHub CLI.${NC}"
  echo "Run: gh auth login"
  exit 1
fi

# Check if we have permission to modify branch protection
echo "Checking permissions..."
REPO="${REPO_OWNER}/${REPO_NAME}"

# Verify repo exists and we have access
if ! gh repo view "${REPO}" &> /dev/null; then
  echo -e "${RED}Error: Cannot access repository ${REPO}${NC}"
  echo "Make sure you have admin access to the repository"
  exit 1
fi

echo -e "${GREEN}✓ Repository access confirmed${NC}"

# Check if branch exists
if ! git show-ref --verify --quiet refs/heads/${BRANCH} && ! git show-ref --verify --quiet refs/remotes/origin/${BRANCH}; then
  echo -e "${YELLOW}Warning: Branch ${BRANCH} not found locally or remotely${NC}"
  echo "Fetching from remote..."
  git fetch origin ${BRANCH} || {
    echo -e "${RED}Error: Branch ${BRANCH} does not exist${NC}"
    exit 1
  }
fi

echo -e "${GREEN}✓ Branch ${BRANCH} found${NC}"

# Check if status checks are available
echo "Checking if status checks are available..."
AVAILABLE_CHECKS=$(gh api repos/${REPO}/branches/${BRANCH}/protection --jq '.required_status_checks.contexts[]?' 2>/dev/null || echo "")
ALL_CHECKS=$(gh api "repos/${REPO}/commits/${BRANCH}/check-runs?per_page=100" --jq '.check_runs[].name' 2>/dev/null | sort -u || echo "")

echo "Available status checks from recent runs:"
if [ -n "$ALL_CHECKS" ]; then
  echo "$ALL_CHECKS" | while read -r check; do
    echo "  - $check"
  done
else
  echo -e "  ${YELLOW}⚠ No checks found yet${NC}"
fi

# Check if required checks exist
MISSING_CHECKS=()
for check in "${REQUIRED_CHECKS[@]}"; do
  if echo "$ALL_CHECKS" | grep -q "$check" || echo "$AVAILABLE_CHECKS" | grep -q "$check"; then
    echo -e "  ${GREEN}✓${NC} Found: $check"
  else
    echo -e "  ${YELLOW}⚠${NC} Not found: $check"
    MISSING_CHECKS+=("$check")
  fi
done

if [ ${#MISSING_CHECKS[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠ Some required checks are not yet available${NC}"
  echo ""
  echo "GitHub requires workflows to run at least once before they appear as status checks."
  echo "Options:"
  echo ""
  echo "1. Create a test pull request to trigger the workflows"
  echo "2. Manually trigger workflows from the Actions tab"
  echo "3. Set up branch protection now (without specific checks)"
  echo "   - Protection will still block merges when checks fail"
  echo "   - You can add specific checks later once they appear"
  echo ""
  read -p "Do you want to continue setting up branch protection anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "To trigger workflows, create a test PR:"
    echo "  git checkout -b test/trigger-checks"
    echo "  # Make a small change"
    echo "  git commit -am 'test: trigger CI checks'"
    echo "  git push origin test/trigger-checks"
    echo "  # Create PR on GitHub, wait for checks to run"
    echo ""
    echo "Then re-run this script."
    exit 1
  fi
fi

echo ""
# Create temporary file for branch protection configuration
TEMP_FILE=$(mktemp)
cat > "${TEMP_FILE}" <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Deployment Validation / validate-deployment",
      "Lockfile Check / pnpm-frozen-lockfile"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismissal_restrictions": {},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": false,
  "allow_squash_merge": true,
  "allow_merge_commit": true,
  "allow_rebase_merge": true,
  "block_creations": false,
  "required_conversation_resolution": false,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF

echo "Configuring branch protection..."
echo ""
echo "Settings to be applied:"
echo "  - Require pull request before merging: ✓"
echo "  - Require status checks to pass: ✓"
echo "    - ${REQUIRED_CHECKS[0]}"
echo "    - ${REQUIRED_CHECKS[1]}"
echo "  - Require branches to be up to date: ✓"
echo "  - Require approvals: 1"
echo "  - Enforce on administrators: ✓"
echo "  - Allow force pushes: ✗"
echo "  - Allow deletions: ✗"
echo ""

# Apply branch protection using GitHub CLI
if gh api \
  repos/${REPO}/branches/${BRANCH}/protection \
  --method PUT \
  --input "${TEMP_FILE}" \
  2>/dev/null; then
  echo -e "${GREEN}✓ Branch protection configured successfully!${NC}"
else
  echo -e "${RED}✗ Failed to configure branch protection${NC}"
  echo ""
  echo "This might be because:"
  echo "  1. You don't have admin access to the repository"
  echo "  2. The repository is part of an organization and requires special permissions"
  echo "  3. Branch protection is already configured differently"
  echo ""
  echo "Please set up branch protection manually via GitHub UI:"
  echo "  1. Go to: https://github.com/${REPO}/settings/branches"
  echo "  2. Add/edit rule for '${BRANCH}' branch"
  echo "  3. Enable 'Require status checks to pass before merging'"
  echo "  4. Select the required checks listed above"
  rm "${TEMP_FILE}"
  exit 1
fi

# Cleanup
rm "${TEMP_FILE}"

# Verify the configuration
echo ""
echo "Verifying configuration..."
if gh api repos/${REPO}/branches/${BRANCH}/protection --jq '.required_status_checks.contexts[]' 2>/dev/null | grep -q "Deployment Validation"; then
  echo -e "${GREEN}✓ Branch protection is active${NC}"
else
  echo -e "${YELLOW}⚠ Could not verify configuration automatically${NC}"
  echo "Please check manually at: https://github.com/${REPO}/settings/branches"
fi

echo ""
echo -e "${GREEN}Branch protection setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Create a test PR to verify the protection is working"
echo "  2. Try merging with failing checks to confirm they block the merge"
echo ""
echo "View branch protection settings:"
echo "  https://github.com/${REPO}/settings/branches"

