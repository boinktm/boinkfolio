# Copilot Instructions — Boink Brands (callous-cycle)

## Project Overview

A personal portfolio / creative hub called **Boink Brands** (music, 3D art, level design). Built as an **Astro 5** static site with **Tailwind CSS v4** and **TypeScript** (strict mode). Deployed to **GitHub Pages** via GitHub Actions with daily scheduled rebuilds.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Astro 5 (`astro@^5.17`) | Static site generation only — **no SSR** |
| Styling | Tailwind CSS v4 (`tailwindcss@^4.2`) | Via `@tailwindcss/vite` plugin; config lives in `global.css` `@theme` block, **not** `tailwind.config` |
| Language | TypeScript | `astro/tsconfigs/strict` base; `.ts` for libs, `.astro` for components/pages |
| XML parsing | `fast-xml-parser` | Used for SoundCloud RSS feed at build time |
| Deployment | GitHub Pages | CI in `.github/workflows/deploy.yml`, Node 20, `npm ci` |

There are **no client-side frameworks** (React, Vue, Svelte, etc.). All interactivity is vanilla JS inside `<script>` tags in Astro components.

---

## Directory Structure

```
src/
├── components/     # Reusable Astro components (PascalCase.astro)
├── content/        # Content collections (markdown files)
│   └── mapping/    # Mapping project entries (snake_case.md)
├── layouts/        # Page shell (Layout.astro)
├── lib/            # TypeScript utility/data modules
├── pages/          # File-based routing (lowercase)
│   └── mapping/    # Dynamic [slug].astro + index.astro
└── styles/         # global.css (single file, Tailwind + theme tokens)
```

---

## Design System — PlayStation-Inspired Dark Theme

All design tokens are declared in `src/styles/global.css` inside a `@theme {}` block. Always reference these tokens rather than hard-coding hex values.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `void` | `#000000` | Page background, deepest surfaces |
| `obsidian` | `#0a0a0a` | Section backgrounds (alternating with `void`) |
| `charcoal` | `#141414` | Nav bar, footer, elevated surfaces |
| `gunmetal` | `#1e1e1e` | Secondary surfaces |
| `slate` | `#2a2a2a` | Subtle fill areas |
| `ash` | `#3a3a3a` | Subtle fill areas |
| `accent` | `#e60012` | Primary CTA, badges, active states (PS red) |
| `accent-hover` | `#ff1a2e` | Hover state for accent elements |
| `accent-muted` | `#991018` | Subdued accent backgrounds |
| `text-primary` | `#f0f0f0` | Headings, primary text |
| `text-secondary` | `#aaaaaa` | Body copy, descriptions |
| `text-muted` | `#666666` | Labels, metadata, timestamps |
| `border` | `#2d2d2d` | Default borders |
| `border-light` | `#444444` | Hover-state borders |
| `surface` | `#161616` | Card backgrounds |
| `surface-hover` | `#1f1f1f` | Card hover states |
| `chrome` / `chrome-light` | `#555` / `#888` | Metallic divider gradients |

### Typography

| Token | Fonts | Usage |
|-------|-------|-------|
| `--font-sans` (Inter) | `'Inter', 'Helvetica Neue', Arial, sans-serif` | Body text, UI labels |
| `--font-display` (Oswald) | `'Oswald', 'Impact', sans-serif` | Headings, titles — always `uppercase` |
| `--font-mono` (JetBrains Mono) | `'JetBrains Mono', 'Fira Code', monospace` | Code snippets |

Fonts are loaded via Google Fonts in `Layout.astro` `<head>`.

### Spacing & Sizing

- **Max content width**: `--width-content: 1200px` — use `max-w-[var(--width-content)] mx-auto px-4`
- **Border radius**: `--radius-sm: 2px`, `--radius-md: 4px`, `--radius-lg: 8px` — most elements use `rounded-sm`

---

## Reusable CSS Utility Classes

Defined in `global.css` under `@layer utilities`. Use these instead of recreating the patterns:

| Class | Purpose |
|-------|---------|
| `text-gradient` | Gradient text (primary → chrome-light) with `background-clip: text` |
| `border-glow` | 1px border with subtle red box-shadow glow |
| `surface-card` | Standard card: `bg-surface`, `border-border`, hover border/shadow transition |
| `chrome-divider` | Horizontal metallic gradient rule (transparent → chrome → transparent) |
| `tab-active` | Active tab state: white text, accent bottom border |
| `subnav-tab` | SubNav tab with colored accent `::after` bar |
| `subnav-accent-red/gold/blue` | SubNav color variants |

---

## Component Conventions

### File Naming
- **Components**: `PascalCase.astro` (e.g., `FeatureCards.astro`, `MappingGallery.astro`)
- **Pages**: lowercase, hyphens OK (e.g., `index.astro`, `[slug].astro`)
- **Content files**: `snake_case.md` with game-mode prefix (e.g., `de_railyard.md`, `cs_complex.md`)
- **Lib modules**: `camelCase.ts` (e.g., `soundcloud.ts`)

### Component Structure
Every `.astro` component follows this pattern:

```astro
---
/**
 * ComponentName — Brief description
 * Additional context about what it mirrors or its role
 */

// TypeScript imports
// Props interface (if accepting props)
// Data fetching / logic
---

<!-- HTML template with Tailwind utility classes -->
```

- Start frontmatter with a JSDoc-style `/** ... */` comment describing the component's purpose
- Define `Props` interface with TypeScript `interface Props { ... }` when the component accepts props
- Use `Astro.props` with destructuring and defaults

### Conditional Classes
Use Astro's `class:list` directive for conditional class concatenation:
```astro
<div class:list={[
  'base-classes',
  condition ? 'active-classes' : 'inactive-classes',
]}></div>
```

### Client-Side Interactivity
- Use `<script>` tags at the bottom of `.astro` components (vanilla JS/TS only)
- Query the DOM with `document.getElementById` / `document.querySelectorAll`
- Use `data-*` attributes to pass data from Astro templates to client scripts
- Wrap in `document.addEventListener('DOMContentLoaded', () => { ... })` for lightbox/overlay patterns

---

## Page Layout Pattern

Every page follows this skeleton:

```astro
<Layout title="Page Title — Boink Brands">
  <Header />
  <SubNav activeTab="Tab Name" />
  <!-- Page hero section -->
  <!-- Content sections (alternating bg-void / bg-obsidian) -->
  <Footer />
</Layout>
```

- **Layout** wraps everything in `<html>`, `<head>`, `<body>` with global CSS and fonts
- **Header** is sticky top nav with social icons and branding
- **SubNav** has 3 colored tabs: Music (red), 3D Art (gold), Mapping Projects (blue)
- **Footer** has footer links, branding, and copyright
- Sections alternate between `bg-void` and `bg-obsidian` backgrounds
- Use `chrome-divider` `<div>` between major visual sections

---

## Content Collection Schema

Content collections are defined in `src/content.config.ts` using `defineCollection` with `glob` loader and `z` (Zod) schema.

### Mapping Collection Frontmatter

```yaml
title: "Map Name"              # Display name (required)
game: "Counter-Strike 2"       # Game / engine (required)
tagline: "One-liner"           # Gallery card subtitle (required)
thumbnail: "https://..."       # Hero / thumbnail URL (required)
images: [...]                  # Screenshot URLs (default: [])
videos: [...]                  # Video embed URLs (default: [])
workshopUrl: "https://..."     # Steam Workshop link (optional)
date: "Feb 2026"               # Release date string (required)
tags: ["Defuse", "5v5"]        # Category tags (default: [])
featured: true                 # Show as large hero card (default: false)
```

- The **filename** becomes the URL slug (e.g., `de_railyard.md` → `/mapping/de_railyard`)
- The markdown **body** is rendered as the project description on the detail page
- When adding a new collection, follow the same pattern: `defineCollection` + `glob` loader + Zod schema

---

## Styling Rules

1. **Utility-first**: Use Tailwind utility classes inline. No component-scoped `<style>` blocks.
2. **No hard-coded colors**: Always reference theme tokens (`text-text-primary`, `bg-obsidian`, `border-border`, etc.)
3. **Consistent radius**: Use `rounded-sm` (2px) for cards, buttons, badges, images.
4. **Display headings**: `font-display text-Xxl uppercase leading-none tracking-tight`
5. **Metadata labels**: `text-[9px]` or `text-[10px]`, `font-bold`, `uppercase`, `tracking-wider` or `tracking-widest`
6. **Body text**: `text-sm text-text-secondary leading-relaxed`
7. **Section taglines**: `text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-3`
8. **Responsive**: Use `md:` and `lg:` breakpoint prefixes. Mobile-first approach.
9. **Transitions**: Default `transition-colors duration-200` or `transition-all duration-200` for interactive elements.
10. **Hover cards**: `surface-card` class handles border-color and box-shadow transitions automatically.

---

## Button Patterns

### Primary CTA
```html
<a class="px-6 py-3 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-widest
          transition-all duration-200 rounded-sm hover:shadow-[0_0_20px_rgba(230,0,18,0.3)]">
```

### Secondary / Ghost Button
```html
<a class="px-6 py-3 border border-border hover:border-border-light text-text-secondary hover:text-text-primary
          text-xs font-bold uppercase tracking-widest transition-all duration-200 rounded-sm">
```

### Tag / Badge
```html
<span class="text-[9px] font-semibold uppercase tracking-wider text-text-muted border border-border px-2 py-0.5 rounded-sm">
```

### Accent Badge (e.g., "Featured", "NEW")
```html
<span class="text-[9px] font-bold uppercase tracking-wider bg-accent/20 text-accent px-2 py-0.5 rounded-sm">
```

---

## Icon Conventions

- **All icons are inline SVGs** — no icon library imports
- Standard size: `w-4 h-4` for navigation, `w-3 h-3` for inline/small, `w-5 h-5` for interactive buttons
- Use `fill="currentColor"` for filled icons, `stroke="currentColor" stroke-width="2"` for outlined
- Animated arrows on hover: `group-hover:translate-x-1 transition-transform`
- Icon-only buttons must have `aria-label`

---

## Accessibility Checklist

- `aria-label` on all icon-only buttons
- `alt` text on all images (descriptive for content, empty for decorative)
- `lang="en"` on `<html>`
- Semantic elements: `<header>`, `<nav>`, `<main>` (implicit), `<section>`, `<footer>`
- Keyboard navigation for lightbox (Escape closes, ArrowLeft/ArrowRight navigates)
- External links: `target="_blank" rel="noopener noreferrer"`
- Focus-visible styles (inherits from Tailwind defaults)

---

## Data Fetching Patterns

- **Build-time only** — all data fetches happen in Astro frontmatter during SSG
- **SoundCloud**: RSS feed via `fast-xml-parser`, accessed through `src/lib/soundcloud.ts`
- **Steam Workshop**: Direct HTML fetch + regex extraction in Hero component
- **Fallback data**: Always provide fallback/hardcoded data for when external APIs fail
- **Environment variables**: Access via `import.meta.env.VARIABLE_NAME`; sensitive values go in `.env` (git-ignored) and GitHub Secrets for CI

---

## Content Width Wrapper

Every content section uses this consistent wrapper:
```html
<div class="max-w-[var(--width-content)] mx-auto px-4">
```

---

## Adding New Pages

1. Create a new `.astro` file in `src/pages/`
2. Import `Layout`, `Header`, `SubNav`, and `Footer`
3. Follow the page skeleton: `Layout > Header > SubNav > sections > Footer`
4. Alternate section backgrounds between `bg-void` and `bg-obsidian`
5. Separate visual sections with `<div class="chrome-divider"></div>`

## Adding New Content Entries (Mapping)

1. Create a new `.md` file in `src/content/mapping/`
2. Name it with the game-mode prefix: `de_`, `cs_`, etc.
3. Fill in all required frontmatter fields per the schema
4. Write the markdown body as the project description
5. Set `featured: true` for at most one entry to display as hero card

## Adding New Content Collections

1. Define the collection in `src/content.config.ts` with `defineCollection`, `glob` loader, and Zod schema
2. Export it in the `collections` object
3. Create the content directory under `src/content/`
4. Create gallery/detail pages following the mapping pattern

---

## CI/CD Notes

- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Triggers: push to `main`, daily cron (`0 0 * * *`), manual dispatch
- Node 20, `npm ci`, builds from `boinkfolio/` subdirectory
- `SOUNDCLOUD_USER_ID` must be set as a GitHub repository secret
- Output artifact: `boinkfolio/dist`
