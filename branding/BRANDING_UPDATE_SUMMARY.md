# Calibrate Branding Update Summary

This document summarizes the branding updates applied to the Calibrate project based on the Branding Packet v1.

## ✅ Completed Updates

### 1. Color System
Updated all three apps (site, console, docs) with the new brand color palette:

- **L1 (Light Blue)**: `#67C8FF` - Start of gradient, highlights
- **L2 (Mid Blue)**: `#377BFF` - Primary brand color, link color
- **L3 (Deep Blue)**: `#0E3AFF` - Accent, emphasis, theme color
- **Navy**: `#001845` - Text, pointer, strokes
- **Background**: `#F8FAFF` - Off-white panels, site background

**Gradient**: `linear-gradient(90deg, #67C8FF 0%, #377BFF 50%, #0E3AFF 100%)`

### 2. Typography
- **Headings**: Inter SemiBold (600) - Applied via CSS
- **Body/UI**: Inter Regular (400) - Already configured
- **Code**: IBM Plex Mono (400) - Updated in all Tailwind configs and CSS

Font imports added to all three app layouts via Google Fonts.

### 3. Metadata Updates
All three apps now include:
- New tagline: "The AI-native pricing control plane for commerce"
- Theme color: `#0E3AFF`
- Updated OpenGraph images path: `/branding/assets/og-image.png`
- Updated favicon paths: `/branding/assets/favicon.ico` and `/branding/assets/icon-512.png`
- Web manifest: `/branding/assets/manifest.webmanifest`

### 4. Tailwind Configuration
- Added Calibrate brand color tokens (`cb-blue-100`, `cb-blue-500`, `cb-blue-800`, `cb-navy`, `cb-bg`)
- Added gradient color stops (`cb-start`, `cb-mid`, `cb-end`)
- Updated monospace font to IBM Plex Mono
- Fixed duplicate color definitions

### 5. Asset Structure
Created branding asset folders in all three apps:
- `apps/site/public/branding/assets/`
- `apps/console/public/branding/assets/`
- `apps/docs/public/branding/assets/`

Each folder contains:
- `manifest.webmanifest` (copied from branding packet)
- `README.md` (documentation of required assets)

## 📋 Required Assets (Not Included)

The following assets need to be added to each app's `public/branding/assets/` folder:

1. **favicon.ico** - 32×32 favicon
2. **icon-512.png** - 512×512 app icon
3. **maskable.png** - 192×192 PWA maskable icon
4. **og-image.png** - 1200×630 OpenGraph image
5. **logo-primary.svg** - Primary logo with gradient dial + wordmark
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
- `apps/*/public/branding/assets/README.md` (x3)

## 🎨 Usage Examples

### Using Brand Colors in Tailwind
```tsx
// Direct brand colors
<div className="bg-cb-blue-500 text-cb-navy">...</div>

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

2. **Asset Paths**: All asset paths reference `/branding/assets/`. Ensure assets are placed in the `public/branding/assets/` folder of each app.

3. **Theme Color**: The theme color `#0E3AFF` is set in metadata and will affect browser UI elements (address bar, etc.) on supported browsers.

4. **Legacy Colors**: Some files in other directories (docs/, calibrate-standalone/, etc.) still reference old brand colors. These can be updated separately if needed.

## 🚀 Next Steps

1. Export and add the logo/icon assets to each app's `public/branding/assets/` folder
2. Test the branding across all three apps
3. Verify favicon and OpenGraph images display correctly
4. Consider updating other directories (docs/, calibrate-standalone/) if needed
5. Update any hardcoded color references in components

---

**Updated**: January 2025  
**Branding Packet Version**: v1

