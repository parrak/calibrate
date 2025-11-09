import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Design System - Stripe-like UX', () => {
  describe('Color Tokens', () => {
    it('should define all required CSS variables in globals.css', () => {
      const globalsCSS = readFileSync(join(__dirname, '../app/globals.css'), 'utf-8')

      // Required color tokens for Stripe-like design
      const requiredTokens = [
        '--bg',           // Page background
        '--surface',      // Cards and inputs
        '--border',       // Borders
        '--fg',           // Foreground text
        '--mute',         // Secondary text
        '--brand',        // Brand color
        '--accent',       // Accent color
        '--card',         // Card background
        '--card-foreground', // Card text
      ]

      requiredTokens.forEach(token => {
        expect(globalsCSS).toContain(token)
      })
    })

    it('should use light colors (no dark mode in root)', () => {
      const globalsCSS = readFileSync(join(__dirname, '../app/globals.css'), 'utf-8')

      // Ensure no dark mode color definitions in :root
      const rootSection = globalsCSS.match(/:root\s*\{[^}]+\}/s)?.[0] || ''

      // Light background color (should start with #F or be light)
      expect(rootSection).toMatch(/--bg:\s*#[FfEeDd]/)

      // Surface should be white or very light
      expect(rootSection).toMatch(/--surface:\s*#[FfEeDd]/)

      // Foreground should be dark (starts with #0, #1, #2, #3)
      expect(rootSection).toMatch(/--fg:\s*#[0-3]/)
    })

    it('should NOT contain dark mode definitions', () => {
      const globalsCSS = readFileSync(join(__dirname, '../app/globals.css'), 'utf-8')

      // Should not have :root.dark or .dark class definitions
      expect(globalsCSS).not.toMatch(/:root\.dark/)
      expect(globalsCSS).not.toMatch(/\.dark\s*\{/)
    })
  })

  describe('Tailwind Configuration', () => {
    it('should map color tokens in tailwind.config.ts', () => {
      const tailwindConfig = readFileSync(join(__dirname, '../tailwind.config.ts'), 'utf-8')

      const requiredMappings = [
        'bg: \'var(--bg)\'',
        'surface: \'var(--surface)\'',
        'border: \'var(--border)\'',
        'fg: \'var(--fg)\'',
        'mute: \'var(--mute)\'',
        'brand: \'var(--brand)\'',
        'accent: \'var(--accent)\'',
        'card: \'var(--card)\'',
        '\'card-foreground\': \'var(--card-foreground)\'',
      ]

      requiredMappings.forEach(mapping => {
        expect(tailwindConfig).toContain(mapping)
      })
    })
  })

  describe('Component Files - No Dark Mode Classes', () => {
    const componentDirs = [
      join(__dirname, './components'),
      join(__dirname, '../components'),
      join(__dirname, '../app'),
    ]

    it('should not contain dark: variant classes in component files', () => {
      const glob = require('glob')
      const allTsxFiles: string[] = []

      componentDirs.forEach(dir => {
        try {
          const files = glob.sync(`${dir}/**/*.{tsx,jsx}`, {
            absolute: true,
            ignore: ['**/*.test.*', '**/*.spec.*'] // Exclude test files
          })
          allTsxFiles.push(...files)
        } catch (e) {
          // Directory might not exist, skip
        }
      })

      const filesWithDarkMode: string[] = []

      allTsxFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8')
          if (/dark:/g.test(content)) {
            filesWithDarkMode.push(file)
          }
        } catch (e) {
          // Skip files that can't be read
        }
      })

      if (filesWithDarkMode.length > 0) {
        console.log('Files with dark mode classes:', filesWithDarkMode)
      }

      expect(filesWithDarkMode).toHaveLength(0)
    })

    it('should not use hardcoded dark background colors in components', () => {
      const glob = require('glob')
      const allTsxFiles: string[] = []

      componentDirs.forEach(dir => {
        try {
          const files = glob.sync(`${dir}/**/*.{tsx,jsx}`, {
            absolute: true,
            ignore: ['**/*.test.*', '**/*.spec.*'] // Exclude test files
          })
          allTsxFiles.push(...files)
        } catch (e) {
          // Directory might not exist, skip
        }
      })

      // Only check for dark BACKGROUND colors (most critical for UX)
      const darkBackgroundPatterns = [
        /bg-black\b/,
        /bg-gray-900\b/,
        /bg-slate-900\b/,
        /bg-zinc-900\b/,
      ]

      const filesWithDarkBgs: Array<{ file: string; pattern: string }> = []

      allTsxFiles.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8')
          darkBackgroundPatterns.forEach(pattern => {
            if (pattern.test(content)) {
              filesWithDarkBgs.push({ file, pattern: pattern.toString() })
            }
          })
        } catch (e) {
          // Skip files that can't be read
        }
      })

      if (filesWithDarkBgs.length > 0) {
        console.log('Files with dark background colors:', filesWithDarkBgs)
      }

      // Should have no dark backgrounds for Stripe-like UX
      expect(filesWithDarkBgs.length).toBe(0)
    })
  })
})
