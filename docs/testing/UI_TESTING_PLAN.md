# UI Testing Plan for console.calibr.lat

## Overview
Comprehensive end-to-end UI testing plan for the Calibrate Console application using Playwright to test the live deployment at `console.calibr.lat`.

## Objectives
1. **Functional Testing**: Verify all user flows work correctly
2. **UI/UX Issues**: Identify broken links, missing elements, layout problems
3. **Accessibility**: Check for basic accessibility issues
4. **Responsive Design**: Test on multiple viewports and devices
5. **Cross-Browser**: Test on Chromium, Firefox, and WebKit
6. **Performance**: Check for slow loading pages and broken API calls

## Test Coverage Areas

### 1. Authentication & Authorization
- **Login Page** (`/login`)
  - ✅ Form elements render correctly
  - ✅ Invalid credentials show error
  - ✅ Successful login redirects appropriately
  - ✅ Quick access credentials are visible
  - ✅ Signup link works
  - ✅ Callback URL handling

- **Signup Page** (`/signup`)
  - ✅ Form validation
  - ✅ Successful registration flow
  - ✅ Error handling

- **Protected Routes**
  - ✅ Unauthenticated users redirected to login
  - ✅ Authenticated users can access protected pages
  - ✅ Session persistence

### 2. Navigation & Routing
- **Main Navigation**
  - ✅ Sidebar navigation works
  - ✅ Active state highlighting
  - ✅ Breadcrumbs display correctly
  - ✅ All links are accessible and functional

- **Page Routing**
  - ✅ All routes load without errors
  - ✅ 404 pages handled correctly
  - ✅ Redirects work as expected

### 3. Dashboard Pages
- **Home/Project Selection** (`/`)
  - ✅ Projects list displays
  - ✅ Project cards are clickable
  - ✅ Create project link works
  - ✅ System dashboards accessible

- **Project Dashboard** (`/p/[slug]`)
  - ✅ Stats cards load and display
  - ✅ Quick action buttons work
  - ✅ Loading states display
  - ✅ Error states handled

### 4. Price Changes Page (`/p/[slug]/price-changes`)
- **Core Functionality**
  - ✅ Table loads with price changes
  - ✅ Filtering by status (Pending, Approved, Applied)
  - ✅ Search functionality
  - ✅ Pagination/load more works
  - ✅ Details drawer opens and displays correctly
  - ✅ Action buttons (Approve, Apply, Reject, Rollback) work
  - ✅ Optimistic updates reflect in UI
  - ✅ Error messages display correctly

- **UI Elements**
  - ✅ Status badges display correctly
  - ✅ Price diff visualization
  - ✅ Policy checks display
  - ✅ Connector status indicators

### 5. Catalog Page (`/p/[slug]/catalog`)
- ✅ Product list displays
- ✅ Search and filters work
- ✅ Pagination works
- ✅ Product details accessible

### 6. Competitors Page (`/p/[slug]/competitors`)
- ✅ Competitor list displays
- ✅ Analytics charts render
- ✅ Filtering options work

### 7. Integrations Page (`/p/[slug]/integrations`)
- ✅ Integration cards display
- ✅ Shopify integration flow
- ✅ Amazon integration flow
- ✅ Connection status indicators
- ✅ Disconnect functionality

### 8. Analytics Page (`/p/[slug]/analytics`)
- ✅ Dashboard loads
- ✅ Metrics display correctly
- ✅ Charts render
- ✅ Date range filters work
- ✅ Trend indicators display

### 9. System Dashboards
- **Performance Dashboard** (`/performance`)
  - ✅ Performance metrics display
  - ✅ Charts and graphs render

- **Security Dashboard** (`/security`)
  - ✅ Security audit data displays
  - ✅ Alert indicators work

### 10. Accessibility & Responsive Design
- **Accessibility**
  - ✅ ARIA labels present
  - ✅ Keyboard navigation works
  - ✅ Focus indicators visible
  - ✅ Screen reader compatibility
  - ✅ Color contrast ratios

- **Responsive Design**
  - ✅ Mobile viewport (320px, 375px)
  - ✅ Tablet viewport (768px)
  - ✅ Desktop viewport (1280px, 1920px)
  - ✅ Sidebar collapses on mobile
  - ✅ Tables responsive/scrollable
  - ✅ Forms usable on mobile

### 11. Error Handling & Edge Cases
- ✅ Network errors handled gracefully
- ✅ API timeout handling
- ✅ Empty states display correctly
- ✅ Loading skeletons display
- ✅ Error messages are user-friendly

### 12. Performance & Load Times
- ✅ Page load times acceptable
- ✅ API calls complete successfully
- ✅ No console errors
- ✅ Images load correctly
- ✅ No broken asset links

## Test Structure

```
apps/console/e2e/
├── auth.spec.ts              # Authentication tests
├── navigation.spec.ts        # Navigation and routing
├── dashboard.spec.ts         # Dashboard pages
├── price-changes.spec.ts     # Price changes functionality
├── catalog.spec.ts           # Catalog page
├── competitors.spec.ts       # Competitors page
├── integrations.spec.ts     # Integrations page
├── analytics.spec.ts         # Analytics dashboard
├── system-dashboards.spec.ts # Performance & Security
├── accessibility.spec.ts    # Accessibility checks
├── responsive.spec.ts        # Responsive design
└── fixtures/
    ├── auth.ts               # Authentication helpers
    └── test-data.ts          # Test data utilities
```

## Test Data Strategy

### Authentication
- Use test accounts: `admin@calibr.lat`, `demo@calibr.lat`
- Store credentials in environment variables
- Create authenticated context for tests

### Mock Data
- For API responses, use real API when possible
- Document expected API responses
- Handle empty states and error states

## Execution Plan

### Phase 1: Setup (Day 1)
1. ✅ Install Playwright
2. ✅ Configure Playwright
3. ✅ Create test directory structure
4. ✅ Set up authentication helpers

### Phase 2: Core Tests (Day 2-3)
1. ✅ Authentication tests
2. ✅ Navigation tests
3. ✅ Dashboard tests
4. ✅ Price Changes tests

### Phase 3: Extended Tests (Day 4-5)
1. ✅ Catalog, Competitors, Integrations
2. ✅ Analytics tests
3. ✅ System dashboards

### Phase 4: Quality Tests (Day 6)
1. ✅ Accessibility tests
2. ✅ Responsive design tests
3. ✅ Cross-browser tests

### Phase 5: Documentation & CI (Day 7)
1. ✅ Document test results
2. ✅ Create issue report
3. ✅ Set up CI integration (optional)

## Expected Issues to Find

Based on common UI issues:
1. **Broken Links**: Links pointing to non-existent routes
2. **Missing Error Handling**: API failures not handled gracefully
3. **Loading States**: Missing loading indicators
4. **Mobile Responsiveness**: Layout issues on small screens
5. **Accessibility**: Missing ARIA labels, keyboard navigation
6. **Form Validation**: Client-side validation issues
7. **State Management**: UI not updating after actions
8. **Performance**: Slow API calls, unoptimized queries
9. **Console Errors**: JavaScript errors in browser console
10. **Visual Issues**: Broken images, incorrect styling

## Success Criteria

- ✅ All critical user flows tested
- ✅ Major UI issues identified and documented
- ✅ Test suite runs reliably
- ✅ Test results documented with screenshots/videos
- ✅ Issues prioritized by severity

## Tools & Configuration

- **Playwright**: v1.40.0
- **Browsers**: Chromium, Firefox, WebKit
- **Viewports**: Mobile (320px, 375px), Tablet (768px), Desktop (1280px, 1920px)
- **Base URL**: `https://console.calibr.lat`
- **Reporters**: HTML, List, JSON
- **Traces**: On first retry
- **Screenshots**: On failure
- **Videos**: On failure

## Environment Variables

```bash
CONSOLE_URL=https://console.calibr.lat
TEST_USER_EMAIL=admin@calibr.lat
TEST_USER_PASSWORD=<stored securely>
```

## Running Tests

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm --filter @calibr/console test:e2e

# Run in UI mode
pnpm --filter @calibr/console test:e2e:ui

# Run in headed mode
pnpm --filter @calibr/console test:e2e:headed

# Run specific test
pnpm --filter @calibr/console test:e2e auth

# Debug mode
pnpm --filter @calibr/console test:e2e:debug
```

## Deliverables

1. ✅ Complete Playwright test suite
2. ✅ Test execution report with findings
3. ✅ Issue documentation with screenshots
4. ✅ Priority ranking of issues
5. ✅ Recommendations for fixes

## Timeline

- **Setup**: 1 day
- **Core Tests**: 2-3 days
- **Extended Tests**: 2 days
- **Quality Tests**: 1 day
- **Documentation**: 1 day

**Total**: ~7 days for complete implementation and testing
