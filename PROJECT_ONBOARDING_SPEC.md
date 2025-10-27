# Project Onboarding Flow - Detailed Specification

**Owner:** Agent C
**Priority:** HIGH
**Timeline:** Week 1 of Phase 4
**Status:** Planning

---

## 🎯 Goal

Create a seamless first-time user experience that takes users from sign-up to their first connected platform in under 5 minutes.

---

## 📋 User Journey

### Flow Overview

```
Login/Sign-up → Welcome → Create Project → Choose Platform → Platform Setup → Dashboard
```

### Detailed Steps

#### 1. Authentication (Existing)
- ✅ Already implemented with NextAuth v5
- User logs in via [console.calibr.lat/login](https://console.calibr.lat/login)
- Creates User record in database
- Redirects to appropriate entry point

#### 2. First-Time Detection
**Route:** `/` (console root)
**Logic:**
```typescript
// Check if user has any projects
const projects = await getProjectsForUser(user.id)

if (projects.length === 0) {
  redirect('/onboarding')
} else {
  // Show project list or redirect to last active project
  redirect('/projects')
}
```

#### 3. Welcome Screen
**Route:** `/onboarding`

**UI Elements:**
- Welcome message with user's name
- Brief value proposition (3-4 bullet points)
- "Get Started" CTA button
- Skip option (creates demo project automatically)

**Content:**
```
Welcome to Calibrate, [User Name]!

Let's set up your first project. You'll be able to:
• Connect your Shopify or Amazon stores
• Monitor competitor prices automatically
• Manage pricing changes in one place
• Track revenue impact of price updates

[Get Started Button]
[Or start with a demo project →]
```

#### 4. Project Creation
**Route:** `/onboarding/project`

**Form Fields:**
1. **Project Name** (required)
   - Text input
   - Validation: 3-50 characters
   - Placeholder: "My Store" or "Acme Products"

2. **Project Slug** (auto-generated, editable)
   - Auto-slugified from name
   - Validation: lowercase, alphanumeric + hyphens
   - Shows preview: `https://app.calibr.lat/p/[slug]`
   - Real-time availability check

3. **Setup Type** (radio selection)
   - 🚀 **Quick Setup**: Connect a platform now
   - 🔧 **Advanced Setup**: Manual configuration (skip to dashboard)

**API Endpoint:**
```typescript
POST /api/projects
{
  name: string
  slug: string
  setupType: 'quick' | 'advanced'
}

Response:
{
  id: string
  slug: string
  tenantId: string
  createdAt: string
}
```

**Backend Logic:**
- Create Tenant if user doesn't have one
- Create Project with unique slug
- Create Membership (user = OWNER)
- Store in session for next steps

#### 5. Platform Selection (Quick Setup Only)
**Route:** `/onboarding/platform`

**UI Layout:**
```
┌─────────────────────────────────────┐
│  Which platform do you want to      │
│  connect first?                      │
│                                      │
│  ┌──────────┐  ┌──────────┐        │
│  │ Shopify  │  │  Amazon  │        │
│  │   🛍️     │  │    📦     │        │
│  │          │  │          │        │
│  │ [Select] │  │ [Select] │        │
│  └──────────┘  └──────────┘        │
│                                      │
│  You can add more platforms later   │
│                                      │
│  [Skip for now →]                   │
└─────────────────────────────────────┘
```

**Platform Cards:**
- **Shopify**
  - Icon/Logo
  - "Connect your Shopify store"
  - Requirements: Store URL, App installation
  - Time estimate: ~2 minutes

- **Amazon**
  - Icon/Logo
  - "Connect your Amazon Seller account"
  - Requirements: SP-API credentials
  - Time estimate: ~3 minutes

**Skip Option:**
- Takes user directly to project dashboard
- Shows empty state with "Add Integration" CTA

#### 6. Platform-Specific Setup

##### Option A: Shopify
**Route:** `/onboarding/shopify`

**Steps:**
1. Store URL Input
   ```
   Enter your Shopify store URL:
   [____________.myshopify.com]
   ```

2. OAuth Initiation
   - Click "Connect to Shopify"
   - Redirects to Shopify OAuth
   - User authorizes app
   - Callback to `/api/platforms/shopify/oauth/callback`
   - Shows loading state during token exchange

3. Initial Sync Options
   ```
   ☑️ Import products from Shopify
   ☑️ Set up automatic price sync
   ☐ Import past orders (optional)

   [Complete Setup]
   ```

##### Option B: Amazon
**Route:** `/onboarding/amazon`

**Steps:**
1. Credentials Input
   ```
   Amazon SP-API Credentials:

   Seller ID: [__________________]
   Client ID: [__________________]
   Client Secret: [__________________]
   Refresh Token: [__________________]

   Marketplace: [United States ▼]

   [Need help? View setup guide →]
   ```

2. Connection Test
   - Click "Test Connection"
   - Shows loading spinner
   - Validates credentials
   - Shows success/error message

3. Initial Sync Options
   ```
   ☑️ Import catalog from Amazon
   ☑️ Enable price feed updates
   ☐ Import competitive pricing data

   [Complete Setup]
   ```

#### 7. Success & Next Steps
**Route:** `/onboarding/success`

**UI Content:**
```
✅ All set! Your project is ready.

[Project Name] is now connected to [Platform]

What's next?
1. ✓ Project created
2. ✓ [Platform] connected
3. → View your products in the catalog
4. → Set up competitor monitoring
5. → Configure pricing rules

[Go to Dashboard]
[Add another platform]
```

**Redirect:**
- After 3 seconds OR on button click
- Navigate to `/p/[slug]` (project dashboard)

---

## 🗄️ Database Changes

### New Fields (No schema changes required!)
Current schema already supports:
- ✅ Tenant model (for multi-tenancy)
- ✅ Project model with slug
- ✅ Membership model for user-project access
- ✅ PlatformIntegration model for connections

### Potential Enhancement
Add optional field to User model to track onboarding state:

```prisma
model User {
  // ... existing fields
  onboardingCompleted Boolean @default(false)
  onboardedAt DateTime?
}
```

---

## 🎨 UI Components to Build

### New Components

1. **OnboardingLayout** (`components/onboarding/OnboardingLayout.tsx`)
   - Progress indicator (steps 1-5)
   - Consistent header/footer
   - Back button (except on welcome)
   - Skip option visibility control

2. **ProjectForm** (`components/onboarding/ProjectForm.tsx`)
   - Name input with validation
   - Slug auto-generation
   - Setup type selector
   - Real-time slug availability check

3. **PlatformCard** (`components/onboarding/PlatformCard.tsx`)
   - Platform logo/icon
   - Description
   - Requirements list
   - Time estimate badge
   - Select button

4. **SuccessScreen** (`components/onboarding/SuccessScreen.tsx`)
   - Checkmark animation
   - Summary of completed steps
   - Next steps checklist
   - CTA buttons

### Existing Components to Reuse
- `Button` from `@/lib/components`
- `EmptyState` from `@/lib/components`
- Form inputs from UI package

---

## 🔌 API Endpoints to Create

### 1. Projects API
```typescript
// apps/api/app/api/projects/route.ts

POST /api/projects
- Create new project
- Auto-create tenant if needed
- Create owner membership
- Return project details

GET /api/projects
- List user's projects
- Include membership role
- Include integration count

GET /api/projects/[slug]
- Get single project details
- Check user has access
```

### 2. Projects Check API
```typescript
// apps/api/app/api/projects/check-slug/route.ts

GET /api/projects/check-slug?slug=my-project
- Check if slug is available
- Return: { available: boolean }
```

### 3. Onboarding State API (Optional)
```typescript
// apps/api/app/api/user/onboarding/route.ts

GET /api/user/onboarding
- Get onboarding state
- Return: { completed: boolean, currentStep?: string }

POST /api/user/onboarding/complete
- Mark onboarding as complete
```

---

## 📁 File Structure

```
apps/console/
├── app/
│   ├── onboarding/
│   │   ├── layout.tsx                 # Onboarding-specific layout
│   │   ├── page.tsx                   # Welcome screen
│   │   ├── project/
│   │   │   └── page.tsx               # Project creation form
│   │   ├── platform/
│   │   │   └── page.tsx               # Platform selection
│   │   ├── shopify/
│   │   │   └── page.tsx               # Shopify setup
│   │   ├── amazon/
│   │   │   └── page.tsx               # Amazon setup
│   │   └── success/
│   │       └── page.tsx               # Success screen
│   └── projects/
│       └── page.tsx                   # Project list (update)
│
├── components/
│   └── onboarding/
│       ├── OnboardingLayout.tsx
│       ├── ProgressIndicator.tsx
│       ├── ProjectForm.tsx
│       ├── PlatformCard.tsx
│       ├── PlatformSelector.tsx
│       ├── ShopifySetup.tsx
│       ├── AmazonSetup.tsx
│       └── SuccessScreen.tsx
│
└── lib/
    └── api-client.ts                  # Add project endpoints

apps/api/
└── app/
    └── api/
        ├── projects/
        │   ├── route.ts               # POST, GET
        │   ├── [slug]/
        │   │   └── route.ts           # GET single project
        │   └── check-slug/
        │       └── route.ts           # Slug availability
        └── user/
            └── onboarding/
                └── route.ts           # Onboarding state
```

---

## 🧪 Testing Requirements

### Unit Tests
- [x] ProjectForm validation logic
- [x] Slug generation algorithm
- [x] Slug availability check
- [x] Platform selection state

### Integration Tests
```typescript
// tests/onboarding/flow.test.ts

describe('Onboarding Flow', () => {
  it('creates project and redirects new user', async () => {
    // 1. Mock authenticated user with no projects
    // 2. Visit root
    // 3. Assert redirected to /onboarding
    // 4. Complete project creation
    // 5. Select platform
    // 6. Mock OAuth flow
    // 7. Assert redirected to dashboard
  })

  it('shows project list for returning users', async () => {
    // 1. Mock user with existing projects
    // 2. Visit root
    // 3. Assert shows /projects page
  })

  it('allows skipping platform setup', async () => {
    // 1. Start onboarding
    // 2. Create project
    // 3. Skip platform selection
    // 4. Assert redirected to empty dashboard
  })
})
```

### E2E Tests
- Complete Shopify onboarding flow
- Complete Amazon onboarding flow
- Skip flows and demo project creation
- Error handling (invalid credentials, network failures)

---

## ✅ Success Criteria

### User Experience
- [ ] First-time user completes onboarding in < 5 minutes
- [ ] Clear progress indication at each step
- [ ] No dead ends (always have back/skip option)
- [ ] Mobile responsive (works on tablets/phones)
- [ ] Error messages are actionable

### Technical
- [ ] No breaking changes to existing flows
- [ ] Backward compatible with demo project
- [ ] API response times < 500ms
- [ ] Proper error handling at each step
- [ ] Session state management robust

### Analytics (Future)
- Track completion rate by step
- Time spent on each step
- Most common drop-off points
- Platform selection distribution

---

## 🔄 Integration Points

### With Agent A (Shopify)
- Uses `/api/platforms/shopify/oauth/install` endpoint
- Redirects to Shopify OAuth
- Callback creates PlatformIntegration
- Triggers initial product sync

### With Agent B (Amazon)
- Uses `/api/platforms/amazon/validate` endpoint
- Tests credentials before saving
- Creates PlatformIntegration on success
- Optionally triggers catalog import

### Existing Console Routes
- Updates `/` to detect first-time users
- Updates `/projects` to show create button
- Links to existing `/p/[slug]` dashboard

---

## 📝 Copy/Content Requirements

### Welcome Screen
- Personalized greeting
- 3-4 key value propositions
- Single clear CTA
- Optional skip/demo option

### Form Labels
- Clear, concise field labels
- Helpful placeholder text
- Inline validation messages
- Tooltips for technical fields

### Error Messages
- "Project name is required (3-50 characters)"
- "This slug is already taken. Try [suggestion]"
- "Unable to connect to Shopify. Check your store URL."
- "Invalid Amazon credentials. Verify your SP-API keys."

### Success Messages
- "✅ Project created successfully!"
- "✅ Connected to Shopify!"
- "✅ Your products are syncing now..."

---

## 🎨 Design Specifications

### Progress Indicator
```
○ Welcome → ● Create Project → ○ Choose Platform → ○ Setup → ○ Complete
```

### Colors (Use existing design system)
- Primary CTA: Blue (#3B82F6)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Neutral: Gray scale

### Spacing
- Section padding: 6-8 (24-32px)
- Card gap: 4 (16px)
- Form field gap: 4 (16px)

### Responsive Breakpoints
- Mobile: < 640px (stack vertically)
- Tablet: 640-1024px (2-column for platforms)
- Desktop: > 1024px (centered max-width container)

---

## 🚀 Rollout Plan

### Phase 1: Core Flow (Days 1-2)
- Build OnboardingLayout component
- Implement welcome screen
- Build project creation form
- Create projects API endpoints

### Phase 2: Platform Selection (Day 3)
- Build platform selector UI
- Create platform cards
- Implement skip logic
- Link to existing OAuth flows

### Phase 3: Success & Routing (Day 4)
- Build success screen
- Update root route logic
- Update projects list page
- Add first-time user detection

### Phase 4: Testing & Polish (Day 5)
- Write unit tests
- Write integration tests
- Manual testing of all paths
- Fix bugs and edge cases
- Polish animations/transitions

---

## 🔒 Security Considerations

- ✅ Authenticated users only
- ✅ Validate user owns tenant before creating project
- ✅ Sanitize project name and slug inputs
- ✅ Rate limit project creation (prevent spam)
- ✅ CSRF protection on all forms
- ✅ Never expose other users' project slugs

---

## 📊 Monitoring & Analytics

### Metrics to Track
- Onboarding completion rate (by step)
- Average time to complete
- Platform selection distribution
- Error rate by step
- Skip rate vs complete rate

### Logging
```typescript
// Log onboarding events
analytics.track('onboarding_started', { userId })
analytics.track('project_created', { userId, projectId, setupType })
analytics.track('platform_selected', { userId, platform })
analytics.track('onboarding_completed', { userId, duration })
analytics.track('onboarding_skipped', { userId, step })
```

---

## 🎯 Future Enhancements

### V2 Features (Post-Launch)
- [ ] Multi-platform selection (connect both at once)
- [ ] Team invitations during onboarding
- [ ] Import existing products from CSV
- [ ] Industry/use-case selection for tailored experience
- [ ] Video tutorials embedded in flow
- [ ] Live chat support during setup
- [ ] Pre-built template projects

### Optimization Ideas
- [ ] A/B test different copy variations
- [ ] Reduce steps (combine screens where possible)
- [ ] Add progress save/resume capability
- [ ] Provide setup checklist PDF export

---

**Document Status:** Draft - Ready for Review
**Last Updated:** October 27, 2025
**Next Review:** Start of Phase 4 Week 1

Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
