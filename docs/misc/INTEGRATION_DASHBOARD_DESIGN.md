# Integration Dashboard Design Specification

**Owner:** Agent C
**Status:** Implemented
**Location:** `/p/[slug]/integrations`

---

## Overview

The Integration Dashboard provides a unified view of all platform connections for a project. Users can view connection status, manage platforms, trigger syncs, and monitor recent activity.

---

## Current Implementation Status

### ✅ Implemented Components

**Main Page:** [apps/console/app/p/[slug]/integrations/page.tsx](apps/console/app/p/[slug]/integrations/page.tsx)

**Components:**
- [PlatformCard.tsx](apps/console/components/platforms/PlatformCard.tsx) - Individual platform connection card
- [IntegrationStats.tsx](apps/console/components/platforms/IntegrationStats.tsx) - Stats overview

---

## Page Structure

### 1. Header Section
```
┌─────────────────────────────────────────────┐
│ Integrations                                 │
│ Connect and manage your e-commerce platforms│
└─────────────────────────────────────────────┘
```

**Elements:**
- Page title: "Integrations"
- Description: "Connect and manage your e-commerce platforms"

---

### 2. Integration Stats (4-Column Grid)

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 🔗 Total     │ ✅ Connected │ 🔄 Syncing   │ ⚠️ Errors    │
│ Platforms    │              │              │              │
│     3        │      2       │      1       │      0       │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

**Stat Cards:**
1. **Total Platforms** (Gray)
   - Count of all configured integrations

2. **Connected** (Green)
   - Count with status = 'CONNECTED'

3. **Syncing** (Blue)
   - Count with syncStatus = 'SYNCING'

4. **Errors** (Red)
   - Count with status = 'ERROR'

**Loading State:**
- Animated skeleton placeholders for all 4 cards

---

### 3. Available Platforms (Grid Layout)

```
┌──────────────────────────────────────────────────────┐
│ Available Platforms                                   │
│                                                       │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│ │ Shopify    │  │ Amazon     │  │ Google     │     │
│ │ Card       │  │ Card       │  │ Shopping   │     │
│ └────────────┘  └────────────┘  └────────────┘     │
└──────────────────────────────────────────────────────┘
```

**Responsive Grid:**
- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (lg): 3 columns

**Empty State:**
```
     🔌
No platforms available
Check back later for new platform integrations
```

---

## Platform Card Design

### Not Connected State

```
┌─────────────────────────────────────────────┐
│ 🛍️ Shopify              [Not Connected]    │
├─────────────────────────────────────────────┤
│ Connect your Shopify store to sync          │
│ products and manage pricing.                │
│                                             │
│ [   Connect Shopify   ] (Blue Button)       │
└─────────────────────────────────────────────┘
```

**Elements:**
- Platform icon (emoji)
- Platform name
- Status badge (gray)
- Description text
- Connect button (links to `/p/[slug]/integrations/[platform]`)

---

### Connected State

```
┌─────────────────────────────────────────────┐
│ 🛍️ Shopify              [Connected]        │
│    my-store.myshopify.com                   │
├─────────────────────────────────────────────┤
│ Status:      CONNECTED                      │
│ Last Sync:   Jan 15, 2025                   │
│ Sync Status: SUCCESS                        │
│                                             │
│ [  Manage  ] [  Sync Now  ]                │
│                                             │
│           Disconnect (Red Link)              │
└─────────────────────────────────────────────┘
```

**Elements:**
- Platform icon & name
- Status badge (green "Connected")
- Store identifier (platformName)
- Connection info:
  - Status
  - Last Sync timestamp
  - Sync Status
- Action buttons:
  - **Manage** (black) - Navigate to platform details
  - **Sync Now** (blue) - Trigger manual sync
- **Disconnect** link (red, with confirmation)

**Button States:**
- Sync Now disabled when already syncing
- Shows "Syncing..." when active
- Disconnect disabled during operation

---

## Recent Sync Activity Section

```
┌─────────────────────────────────────────────────────────┐
│ Recent Sync Activity                                     │
│                                                          │
│ 🛍️ Shopify                           ✓ Success         │
│    Last synced Jan 15, 2025 10:30 AM                    │
│                                                          │
│ 📦 Amazon                             ⟳ Syncing         │
│    Last synced Jan 15, 2025 9:15 AM                     │
│                                                          │
│ 🔍 Google Shopping                    ⚠ Error           │
│    Last synced Jan 14, 2025 5:00 PM                     │
└─────────────────────────────────────────────────────────┘
```

**Shows for:** Projects with at least one connected integration

**Elements (per entry):**
- Platform icon
- Platform name
- Last sync timestamp or "Never synced"
- Status badge:
  - ✓ Success (green)
  - ⟳ Syncing (blue)
  - ⚠ Error (red)
  - – Idle (gray)

**Limit:** Shows up to 5 most recent entries

---

## Color Palette

### Status Colors
- **Connected/Success:** Green (#10B981, green-600)
- **Syncing/In Progress:** Blue (#3B82F6, blue-600)
- **Error/Warning:** Red (#EF4444, red-600)
- **Not Connected/Idle:** Gray (#6B7280, gray-600)

### UI Colors
- **Primary Action:** Blue (#3B82F6, blue-600)
- **Secondary Action:** Gray (#111827, gray-900)
- **Destructive:** Red (#EF4444, red-600)
- **Background:** White (#FFFFFF)
- **Border:** Gray (#E5E7EB, gray-200)

---

## API Integration

### Data Sources

**1. List Available Platforms**
```typescript
GET /api/platforms
Response: {
  platforms: [{
    platform: 'shopify' | 'amazon' | 'google_shopping'
    name: string
    available: boolean
  }]
}
```

**2. Get Integration Status**
```typescript
GET /api/platforms/[platform]?project={slug}
Response: {
  integration: {
    id: string
    platform: string
    platformName: string
    status: 'CONNECTED' | 'ERROR' | 'DISCONNECTED'
    syncStatus: 'SYNCING' | 'SUCCESS' | 'ERROR' | null
    lastSyncAt: string | null
    createdAt: string
  } | null
}
```

**3. Trigger Manual Sync**
```typescript
POST /api/platforms/[platform]/sync
Body: { projectSlug: string }
Response: { success: boolean }
```

**4. Disconnect Platform**
```typescript
DELETE /api/platforms/[platform]?project={slug}
Response: { success: boolean }
```

---

## User Flows

### Flow 1: Connect New Platform
1. User lands on `/p/{slug}/integrations`
2. Sees "Not Connected" card for available platforms
3. Clicks "Connect {Platform}" button
4. Redirects to `/p/{slug}/integrations/{platform}`
5. Completes OAuth or credential input
6. Redirects back to integrations page
7. Card now shows "Connected" state

### Flow 2: Manual Sync
1. User sees connected platform card
2. Clicks "Sync Now" button
3. Button changes to "Syncing..." and disables
4. API call triggers sync
5. Stats update to show "Syncing" count
6. On completion, "Last Sync" timestamp updates
7. Button re-enables

### Flow 3: Disconnect Platform
1. User clicks "Disconnect" link
2. Confirmation dialog appears: "Disconnect from {Platform}?"
3. User confirms
4. API call removes integration
5. Card changes to "Not Connected" state
6. Stats update to reflect change

---

## Loading States

### Initial Page Load
- Stats show skeleton placeholders (4 animated cards)
- Platform grid shows 3 skeleton cards
- Recent activity hidden until data loads

### Sync in Progress
- "Sync Now" button shows "Syncing..."
- Button disabled
- Stats update "Syncing" count
- Recent activity shows spinning indicator

### Error State
```
┌─────────────────────────────────────────────┐
│ ⚠️ Error                                    │
│ Failed to load integrations                 │
│ [Try again] (Link)                          │
└─────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Mobile (< 640px)
- Stats: Stack 2x2 grid
- Platforms: Single column
- Cards: Full width
- Recent activity: Full width entries

### Tablet (640px - 1024px)
- Stats: 4-column grid
- Platforms: 2-column grid
- Cards: Maintain padding and spacing

### Desktop (> 1024px)
- Stats: 4-column grid
- Platforms: 3-column grid
- Maximum container width for readability

---

## Accessibility

### Keyboard Navigation
- All buttons and links focusable
- Tab order: Stats → Platform cards → Recent activity
- Enter/Space to activate buttons

### Screen Readers
- Semantic HTML (headers, lists)
- aria-labels for icon buttons
- Status announcements for async actions
- Error messages clearly associated with actions

### Visual
- Color not sole indicator (icons + text)
- Sufficient contrast ratios (WCAG AA)
- Focus indicators visible
- Loading states announced

---

## Performance Considerations

### Optimizations
- Parallel API calls for platform status
- Lazy load recent activity if many integrations
- Debounce sync button to prevent spam
- Cache platform list (rarely changes)

### Metrics
- Initial load: < 2s
- Sync trigger: < 500ms response
- No layout shift during loading

---

## Future Enhancements

### Phase 2 (Post-Launch)
- [ ] Sync schedule configuration per platform
- [ ] Detailed sync logs with filtering
- [ ] Webhook configuration UI
- [ ] Platform-specific health metrics
- [ ] Bulk operations (sync all, disconnect all)
- [ ] Integration templates/presets

### Advanced Features
- [ ] Real-time sync progress (WebSocket)
- [ ] Sync history charts/graphs
- [ ] Alert configuration per platform
- [ ] Cost/usage tracking per integration
- [ ] A/B testing for platform performance

---

## Technical Notes

### Component Architecture
```
IntegrationsPage (page.tsx)
├── IntegrationStats (stats overview)
│   └── StatCard (individual stat)
└── PlatformCard (per platform)
    ├── Connected view
    │   ├── Manage button
    │   ├── Sync button
    │   └── Disconnect link
    └── Not Connected view
        └── Connect button
```

### State Management
- Local React state for UI interactions
- API polling every 30s for sync status updates
- Optimistic updates for sync/disconnect actions
- Error boundaries for component failures

### Testing Coverage
- [ ] Unit tests for StatCard calculations
- [ ] Integration tests for API calls
- [ ] E2E tests for connect/disconnect flows
- [ ] Visual regression tests for loading states

---

**Document Status:** Complete
**Last Updated:** October 27, 2025
**Next Review:** After initial user feedback

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
