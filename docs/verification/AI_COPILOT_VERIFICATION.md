# AI Copilot Production Verification Checklist

## Overview
This document provides a testing checklist for verifying the AI Pricing Assistant (Copilot) feature in production.

**Production URLs:**
- Console: https://console.calibr.lat/p/demo/assistant
- API: https://api.calibr.lat/api/v1/assistant/query

**Deployed:** [Pending PR merge]
**Environment Variables Configured:** ✅ OPENAI_API_KEY added to Railway

---

## Prerequisites

### Environment Variables (Railway - API)
- ✅ `OPENAI_API_KEY` - Enables GPT-4 powered queries
- ✅ `CONSOLE_INTERNAL_TOKEN` - Console authentication
- ✅ `DATABASE_URL` - Database connection

### Environment Variables (Vercel - Console)
- ✅ `NEXT_PUBLIC_API_BASE` - API endpoint (https://api.calibr.lat)
- ✅ `CONSOLE_INTERNAL_TOKEN` - Matches API token
- ✅ `DATABASE_URL` - NextAuth session storage

---

## Test Cases

### 1. Page Load and Navigation
**Location:** https://console.calibr.lat/p/demo

- [ ] "AI Assistant" link appears in project sidebar
- [ ] Clicking "AI Assistant" navigates to `/p/demo/assistant`
- [ ] Page loads without errors
- [ ] Empty state displays with welcome message
- [ ] 6 suggested questions display correctly

### 2. Authentication Checks
**Location:** https://console.calibr.lat/p/demo/assistant

#### When Not Signed In:
- [ ] Input field is disabled
- [ ] "Ask" button is disabled
- [ ] Amber warning banner displays: "Please sign in to use the AI Assistant"
- [ ] Suggested question buttons are disabled

#### When Signed In:
- [ ] Input field is enabled
- [ ] "Ask" button is enabled
- [ ] Warning banner does not display
- [ ] Suggested question buttons are enabled

### 3. Suggested Questions (Pattern-Based Fallback)
Test each suggested question by clicking the button:

#### Question 1: "Why was this price changed?"
- [ ] Question appears in chat as user message
- [ ] Loading animation displays (3 bouncing dots)
- [ ] Assistant responds with price change explanation
- [ ] Response includes SKU name/code, delta, percentage
- [ ] Response includes status and policy checks
- [ ] "View Data" expandable section available
- [ ] Shows "Pattern-based" method indicator
- [ ] Timestamp displays correctly

#### Question 2: "What if I increase prices by 10%?"
- [ ] Simulation response shows affected product count
- [ ] Shows total revenue impact
- [ ] Shows average margin impact
- [ ] Shows top 3 product impacts
- [ ] Data section shows examples array

#### Question 3: "Show me products with low margins"
- [ ] Response lists products with margins below 20%
- [ ] Shows SKU codes and margin percentages
- [ ] Data section shows up to 10 products
- [ ] SQL query section shows the generated query

#### Question 4: "How many price changes were made last week?"
- [ ] Response shows total count
- [ ] Shows breakdown by status (pending, approved, etc.)
- [ ] Data section shows counts object
- [ ] SQL query visible

#### Question 5: "Which products have the highest margins?"
- [ ] Response returns meaningful answer or helpful error
- [ ] Handles gracefully if query not implemented

#### Question 6: "What's my average price change percentage?"
- [ ] Response returns meaningful answer or helpful error
- [ ] Handles gracefully if query not implemented

### 4. AI-Powered Queries (GPT-4)
**Prerequisite:** OPENAI_API_KEY must be set in Railway

Test custom queries to verify GPT-4 integration:

#### Test Query 1: "Show me all price changes from last month"
- [ ] Response processes successfully
- [ ] Method indicator shows "AI-powered"
- [ ] SQL query is generated and visible
- [ ] Data results display correctly
- [ ] Query is project-scoped (security check)

#### Test Query 2: "What's the average price of all products?"
- [ ] GPT-4 generates appropriate SELECT query
- [ ] Response includes explanation
- [ ] Data section shows results
- [ ] SQL injection protection verified (no UPDATE/DELETE/DROP)

#### Test Query 3: "List products ordered by price descending"
- [ ] Query executes successfully
- [ ] Results ordered correctly
- [ ] LIMIT clause present to prevent large result sets

### 5. Error Handling

#### Invalid/Unclear Queries:
- [ ] Type: "asdfasdf random gibberish"
- [ ] Response suggests valid question types
- [ ] No crash or blank response
- [ ] Suggestions list displays

#### Authentication Failures:
- [ ] Sign out of console
- [ ] Try to send query
- [ ] Verify button stays disabled
- [ ] Warning banner persists

#### Network Errors:
- [ ] Simulate by temporarily blocking API (DevTools)
- [ ] Error message displays in chat
- [ ] Error is user-friendly, not technical stack trace
- [ ] Toast notification appears

### 6. AIExplanation Component (Price Changes Page)
**Location:** https://console.calibr.lat/p/demo/price-changes

#### Access:
- [ ] Navigate to price-changes page
- [ ] Click on any price change row to open drawer
- [ ] Scroll down to find "AI Explanation" section

#### Component Display:
- [ ] Section shows "AI Explanation" header
- [ ] Shows "Powered by GPT-4" badge
- [ ] "Explain with AI" button visible
- [ ] Placeholder text displays before clicking

#### Generate Explanation:
- [ ] Click "Explain with AI" button
- [ ] Button changes to "Analyzing..." with loading state
- [ ] Response appears within 2-5 seconds
- [ ] Explanation is contextual to the specific price change
- [ ] Mentions SKU code, price delta, percentage
- [ ] Button disappears after explanation loads

#### Without Authentication:
- [ ] Sign out
- [ ] Open price change drawer
- [ ] Button shows as disabled
- [ ] Error message: "Please sign in to use AI features"

### 7. UI/UX Checks

#### Chat Interface:
- [ ] User messages appear on right (blue background)
- [ ] Assistant messages appear on left (muted background)
- [ ] Messages scrollable when exceeding height
- [ ] Input field clears after sending message
- [ ] Proper spacing between messages
- [ ] Timestamps display correctly

#### Expandable Sections:
- [ ] "View Data" section collapses/expands on click
- [ ] "View SQL Query" section collapses/expands on click
- [ ] JSON formatting is readable with proper indentation
- [ ] SQL formatting is monospace and readable

#### Follow-up Suggestions:
- [ ] If response includes suggestions, they display
- [ ] Clicking suggestion sends new query
- [ ] Works as expected like suggested questions

#### Mobile Responsiveness:
- [ ] Test on mobile viewport (DevTools)
- [ ] Chat bubbles adjust to max-width
- [ ] Suggested questions stack vertically on small screens
- [ ] Input and button remain usable

### 8. Performance

- [ ] Page load time < 3 seconds
- [ ] Query response time < 5 seconds (pattern-based)
- [ ] Query response time < 10 seconds (AI-powered)
- [ ] No memory leaks after multiple queries
- [ ] Smooth scrolling in message history

### 9. Security

#### SQL Injection Protection:
- [ ] Try query: "'; DROP TABLE Sku; --"
- [ ] Verify query is rejected or sanitized
- [ ] No database modification occurs

#### Project Scoping:
- [ ] All queries include projectId filter
- [ ] Cannot access data from other projects
- [ ] Verify in SQL output: `WHERE "projectId" = '...'`

#### Authentication:
- [ ] API requires valid bearer token
- [ ] Unauthenticated requests return 401
- [ ] Token from NextAuth session works correctly

---

## API Endpoint Testing (Manual)

### Test AI Query Endpoint Directly

```bash
# Get token from browser console after signing in:
# copy(session.apiToken)

curl -X POST https://api.calibr.lat/api/v1/assistant/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "projectId": "demo",
    "query": "Show me products with low margins"
  }'
```

**Expected Response:**
```json
{
  "answer": "Found X products with margins below 20%...",
  "data": [...],
  "sql": "SELECT ...",
  "method": "ai" or "pattern"
}
```

### Error Cases to Test:

#### Missing Token:
```bash
curl -X POST https://api.calibr.lat/api/v1/assistant/query \
  -H "Content-Type: application/json" \
  -d '{"projectId": "demo", "query": "test"}'
```
- [ ] Returns 401 Unauthorized

#### Missing Required Fields:
```bash
curl -X POST https://api.calibr.lat/api/v1/assistant/query \
  -H "Authorization: Bearer TOKEN" \
  -d '{}'
```
- [ ] Returns 400 Bad Request
- [ ] Error message: "projectId and query are required"

---

## Rollback Plan

If critical issues are found:

1. **Console Issue Only:**
   - Revert PR on GitHub
   - Vercel auto-deploys previous version
   - API remains functional

2. **API Issue:**
   - Set `OPENAI_API_KEY` to empty string in Railway
   - Forces fallback to pattern-matching only
   - Feature remains partially functional

3. **Complete Rollback:**
   - Revert all commits in branch
   - Force push to trigger redeployment
   - Remove "AI Assistant" from navigation temporarily

---

## Sign-off

**Tested By:** _________________
**Date:** _________________
**Environment:** Production
**Status:** ⬜ Pass / ⬜ Fail / ⬜ Pass with Issues

**Issues Found:**
-

**Notes:**
-

---

## Post-Deployment Tasks

After successful verification:

- [ ] Update CHANGELOG.md with deployment date
- [ ] Update agent workflow document (mark AI Copilot as deployed)
- [ ] Monitor Railway logs for errors (first 24 hours)
- [ ] Monitor OpenAI API usage and costs
- [ ] Gather user feedback on AI Assistant
- [ ] Consider adding analytics tracking for feature usage
