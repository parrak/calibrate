## Summary

Implements the new Calibrate branding system (v1) across all apps with updated teal colors, typography, and icon system.

## Changes

### Color System

* **New Brand Colors (Teal Palette)**:  
   * L1 (Light Teal): `#80D9D9`  
   * L2 (Mid Teal): `#00A3A3` - Primary brand color  
   * L3 (Deep Teal): `#008080` - Accent and theme color  
   * Navy: `#001845` - Text color  
   * Background: `#F8FAFF` - Off-white background
* **Gradient**: `linear-gradient(90deg, #80D9D9 0%, #00A3A3 50%, #008080 100%)`

### Typography

* Headings: Inter SemiBold (600)
* Body: Inter Regular (400)
* Code: IBM Plex Mono (400)

### Icons & Favicons

* Created dynamic icon system using Next.js App Router
* All icons use teal-colored logo image from branding assets
* Static favicon.ico, icon-512.png, and logo.png files added to public folders
* Icon.tsx and apple-icon.tsx files read logo image and generate icons dynamically
* Fallback to teal gradient with calibration dial design if logo not found
* Icons automatically generated at build time
* Updated OpenGraph images with new teal brand colors

### Metadata

* Updated tagline: "The AI-native pricing control plane for commerce"
* Theme color: `#008080` (Deep Teal)
* Updated across site, console, and docs apps

### Brand Name Consistency

* Updated all "Calibr" references to "Calibrate" in visible text and documentation
* Applied brand color (#00A3A3) to all "Calibrate" text in UI
* Domain names and API headers remain unchanged

## Files Changed

* Updated CSS variables in all `globals.css` files (teal color system)
* Updated Tailwind configs with new teal color tokens (`cb-teal-*`)
* Created/updated `icon.tsx` and `apple-icon.tsx` for all apps
* Updated metadata in all layout files
* Added logo image files to all app public folders
* Added branding packet structure with documentation
* Updated CHANGELOG.md with branding changes

## Testing

* ✅ Lint passes (local)
* ✅ Type check passes
* ✅ All icon files generate correctly
* ✅ Brand colors applied consistently across all apps
* ✅ Logo displays correctly in all headers

## Documentation

* Added `branding/BRANDING_UPDATE_SUMMARY.md`
* Added `branding/ICON_SETUP.md`
* Updated `CHANGELOG.md` with teal color system

See `branding/README.md` for full style guide and usage examples.

