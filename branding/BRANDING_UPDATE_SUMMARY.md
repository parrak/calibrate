# Calibrate Branding Update Summary

This document summarizes the branding updates applied to the Calibrate project based on the Branding Packet v1.

## ✅ Completed Updates

### 1. Color System
Updated all three apps (site, console, docs) with the live teal brand palette used in `apps/*/app/globals.css`:

- **L1 (Light Teal)**: `#80D9D9` — subtle fills, gradients
- **L2 (Mid Teal — Primary)**: `#00A3A3` — buttons, links, primary accents
- **L3 (Deep Teal / Accent)**: `#008080` — theme color, focus rings, hover states
- **Navy Text**: `#001845` — headings and body text
- **Muted Text**: `#697386` — secondary text
- **Border**: `#E3E8EE` — dividers, input borders
- **Background**: `#F8FAFF` — page background / panels

**Gradient**: `linear-gradient(90deg, #80D9D9 0%, #00A3A3 50%, #008080 100%)` (matches Tailwind `cb-start/cb-mid/cb-end`)

### 2. Typography
- **Headings**: Inter SemiBold (600) - Applied via CSS
- **Body/UI**: Inter Regular (400) - Already configured
- **Code**: IBM Plex Mono (400) - Updated in all Tailwind configs and CSS

Font imports added to all three app layouts via Google Fonts.

### 3. Metadata Updates
All three apps now include:
- Tagline: "The AI-native pricing control plane for commerce"
- Theme color: `#008080` (teal, aligns with `--brand-dark`)
- OpenGraph image is generated via the Next.js OG route; falls back to `/opengraph-image` where available
- Favicons/icons served from each app’s `/public` (`favicon.ico`, `icon-512.png`, `logo.png`)
- Manifest path configured via Next metadata (`/manifest.webmanifest`)

### 4. Tailwind Configuration
- Added Calibrate brand color tokens (`cb-teal-100`, `cb-teal-500`, `cb-teal-800`, `cb-navy`, `cb-bg`)
- Added teal gradient stops (`cb-start`, `cb-mid`, `cb-end`)
- Updated monospace font to IBM Plex Mono
- Fixed duplicate color definitions

### 5. Asset Structure
Brand assets currently live at each app’s `/public` root (`favicon.ico`, `icon-512.png`, `logo.png`). The shared branding packet remains under `branding/` with placeholder assets until the final logo set is delivered.

## 📋 Required Assets (Not Included)

The following assets still need to be added alongside the existing icons in each app's `/public/` folder (or a `public/branding/assets/` subfolder if we later namespace them):

1. **favicon.ico** - 32×32 favicon
2. **icon-512.png** - 512×512 app icon
3. **maskable.png** - 192×192 PWA maskable icon
4. **og-image.png** - 1200×630 OpenGraph image
5. **logo-primary.svg** - Primary logo with teal dial + wordmark
6. **logo-icon.svg** - Compact icon (dial only)
7. **logo-mono-dark.svg** - Monochrome dark variant
8. **logo-mono-light.svg** - Monochrome light variant

## 📁 Files Modified

### CSS Files
- `apps/site/app/globals.css`
- `apps/console/app/globals.css`
- `apps/docs/app/globals.css`

### Tailwind Configs
- `apps/site/tailwind.config.js`
- `apps/console/tailwind.config.ts`
- `apps/docs/tailwind.config.ts`

### Layout Files (Metadata)
- `apps/site/app/layout.tsx`
- `apps/console/app/layout.tsx`
- `apps/docs/app/layout.tsx`

### New Files
- `branding/README.md` (from packet)
- `branding/assets/manifest.webmanifest` (from packet)
- `branding/usage/next/metadata.ts` (from packet)
- `branding/usage/tailwind/tokens.config.ts` (from packet)
- `branding/usage/web/head-snippets.html` (from packet)

## 🎨 Usage Examples

### Using Brand Colors in Tailwind
```tsx
// Direct brand colors
<div className="bg-cb-teal-500 text-cb-navy">...</div>

// CSS variables (recommended)
<div className="bg-brand text-fg">...</div>

// Gradient
<div className="bg-gradient-to-r from-cb-start via-cb-mid to-cb-end">...</div>
```

### Typography
```tsx
// Headings automatically use Inter SemiBold (600)
<h1>Calibrate</h1>

// Code uses IBM Plex Mono
<code>const example = 'code';</code>
```

## ⚠️ Notes

1. **Font Loading**: Font imports are added via `<link>` tags in layout files. For production, consider using Next.js `next/font` for optimized font loading.

2. **Asset Paths**: Live icons currently resolve from each app’s `/public` root; if we adopt the packet structure later, mirror them under `/public/branding/assets/`.

3. **Theme Color**: The theme color `#008080` (deep teal) is set in metadata and will affect browser UI elements (address bar, etc.) on supported browsers.

4. **Legacy Colors**: Some files in other directories (docs/, calibrate-standalone/, etc.) still reference old brand colors. These can be updated separately if needed.

## 🚀 Next Steps

1. Export and add the logo/icon assets alongside the existing icons in each app's `/public/` folder (or `/public/branding/assets/` if we namespace them)
2. Test the branding across all three apps
3. Verify favicon and OpenGraph images display correctly
4. Consider updating other directories (docs/, calibrate-standalone/) if needed
5. Update any hardcoded color references in components

---

**Updated**: November 29, 2025  
**Branding Packet Version**: v1
