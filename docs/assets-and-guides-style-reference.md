# Assets and Guides Style Reference

This document captures recurring page patterns used in:
- `src/pages/assets-and-guides/pokemon-gba-rom-hacking-guide.astro`
- `src/pages/assets-and-guides/pokemon-diamond-pearl-vs-platinum.astro`
- `src/pages/assets-and-guides/botw-60fps-guide.astro`
- `src/pages/assets-and-guides/bo3-gsc-guide.astro`

Use this as the default blueprint when building new long-form interactive guides.

## 1) Global Design System (Base Tokens)

Primary tokens come from `src/styles/global.css`:
- Accent family: `--color-accent`, `--color-accent-hover`, `--color-accent-muted`
- Text hierarchy: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- Surfaces/borders: `--color-surface`, `--color-border`, `--color-border-light`
- Layout sizing: `--width-content: 1200px`
- Radius scale: `--radius-sm: 2px`, `--radius-md: 4px`, `--radius-lg: 8px`
- Utility classes reused heavily:
  - `.surface-card`
  - `.text-gradient`
  - `.chrome-divider`

Typography defaults from `src/layouts/Layout.astro`:
- Body: Inter (`--font-sans`)
- Display headings: Oswald (`--font-display`)
- Code/technical content: JetBrains Mono (`--font-mono`)

## 2) Core Page Skeleton

All four guides use the same shell:
1. `Layout` wrapper with SEO title/description.
2. `Header` + `SubNav`.
3. Hero section on `bg-void` with:
   - radial red glow overlay
   - optional subtle grid overlay
   - compact kicker (`Interactive Guide`)
   - large display headline (`font-display`, uppercase)
   - intro paragraph in secondary text color
   - optional 3-stat row cards
4. `chrome-divider` at hero bottom.
5. Main content section on `bg-obsidian`.
6. 2-column desktop grid: sticky left nav (about 260px) + right content stream.
7. `Footer`.

Canonical container pattern:
- `max-w-[var(--width-content)] mx-auto px-4`

Canonical main grid:
- `grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6`

## 3) Sidebar / Navigation Pattern

### 3.1 Visual Pattern
Sidebar is consistently:
- `surface-card rounded-sm p-3`
- sticky on large screens: `lg:sticky lg:top-6 lg:self-start h-fit`
- section label: tiny uppercase muted text

Nav item style variants by page:
- `.guide-nav-link`
- `.analysis-nav-link`
- `.bo3-nav-link`
- `.guide-nav-btn` (button variant for tabbed single-section flow)

Despite different class names, behavior is the same:
- transparent background
- subtle border on hover
- accent active state with left inset stripe via `box-shadow: inset 3px 0 0 var(--color-accent)`

### 3.2 Behavior Variants
There are two nav interaction models:
1. Scroll-spy model (most common)
   - Anchor links to section IDs.
   - `IntersectionObserver` toggles `is-active`.
   - Observer options are standardized:
     - `root: null`
     - `rootMargin: '-18% 0px -65% 0px'`
     - `threshold: 0`
2. Panel-toggle model (BotW page)
   - Sidebar buttons with `data-target`.
   - Sections are hidden/shown by toggling `hidden` and `block` classes.

## 4) Content Block Grammar

### 4.1 Section Wrappers
Most content sections use:
- `surface-card rounded-sm p-6 md:p-8`
- `scroll-mt-24` for anchor offset (scroll-spy pages)

Text hierarchy inside sections:
- Kicker: `.section-kicker` (tiny uppercase accent)
- H2: `font-display text-3xl md:text-4xl uppercase`
- Body: `text-sm md:text-base text-text-secondary leading-relaxed`

### 4.2 Reusable Inner Blocks
Repeated composition patterns:
- Technical content card:
  - `surface-card rounded-sm p-5 md:p-6 bg-charcoal/30`
- Callout/alert strip:
  - `border-l-2 border-accent bg-accent/10 p-4`
- Checkpoint box:
  - `.guide-checkpoint` with accent left border and subtle red tint
- Side notes:
  - bordered cards with compact title + helper copy

### 4.3 List and Table Patterns
- Standard content list class: `.guide-list`
  - disc list, consistent left padding, readable line-height
- Numbered variant appears as either:
  - `.guide-list-numbered`, or
  - Tailwind `list-decimal`
- Table style (`pokemon-gba-rom-hacking-guide`):
  - `.guide-table` with uppercase table headers and row hover tint

## 5) Interactive Components Pattern Library

### 5.1 Accordion Pattern
Used in multiple guides for long sections.

Shared structure:
- Trigger button: `.accordion-btn` with `data-accordion-btn`
- Panel container: `.accordion-panel` with `data-accordion-panel`
- Icon text node: `.accordion-icon` (`+`/`-`)

Shared motion:
- Panel animation via `max-height` transition (`0.3s ease`)

Behavior variants:
- Multi-open accordion (ROM guide): toggles one panel independently.
- Single-open accordion (Platinum + BO3): closes others before opening selected panel.

### 5.2 Checklist Pattern
Shared classes:
- row: `.checklist-item` + `data-checklist-item`
- marker: `.checkmark`

Interaction:
- click row -> toggle `.checked`
- switch marker text `[ ]` <-> `[x]`
- checked style uses muted text + line-through

### 5.3 Tab Pattern
Used in Platinum and BO3 pages.

Structure:
- buttons with `data-tab-btn` + `data-target`
- panels with `.tab-panel` and matching `id`

Interaction:
- toggle active button class (for underline/accent)
- hide non-target panels with `hidden`

### 5.4 Chart Pattern (Chart.js)
Chart usage is consistent across pages:
- CDN include: `<script is:inline src="https://cdn.jsdelivr.net/npm/chart.js"></script>`
- Guard render with `if (canvas && window.Chart)`
- `responsive: true`, `maintainAspectRatio: false`
- dark chart palette + red accent dataset
- legend/tick text in gray tones

Common containers:
- `.guide-chart-container` or `.chart-container`
- default heights around `320px`, larger on desktop (`380-390px`)

Chart types observed:
- radar
- vertical bar
- horizontal bar (`indexAxis: 'y'`)

## 6) Code/Technical Content Styling

### 6.1 Generic Code Blocks
- `.guide-code-block` is the base for preformatted examples.
- Dark background (`#0f0f0f`) + subtle border.
- Monospace typography, horizontal scroll enabled.

### 6.2 Domain-Specific Token Classes (BO3 page)
For pseudo-syntax highlighting without a full highlighter:
- `.gsc-keyword`
- `.gsc-entity`
- `.gsc-function`
- `.gsc-literal`
- `.gsc-plain`
- `.gsc-comment`

Inline code helper:
- `.gsc-inline-code`

Use this approach when you need deterministic styling and no runtime highlighter dependency.

## 7) Visual Language Consistency Rules

These pages share a strict visual mood:
- dark, metallic, restrained UI
- red accent used as directional emphasis, not full background fill
- uppercase display headings and tiny technical kickers
- small radii (`rounded-sm`) for sharp industrial edges
- frequent use of `surface-card` to break dense information into modules

Red accent placement pattern:
- active nav markers
- left-border callouts
- kicker labels
- selected tab underline
- key chart datasets

## 8) Naming and Class Convention Patterns

Observed naming strategy:
- Page-scoped prefixes for local components:
  - `guide-*` (generic tutorial pages)
  - `analysis-*` (Platinum page)
  - `bo3-*` (BO3 page)
- Shared reusable classes for global patterns:
  - `.surface-card`, `.accordion-btn`, `.accordion-panel`, `.guide-list`, `.guide-code-block`

Recommendation:
- Keep page-specific wrappers prefixed.
- Reuse common interaction class names when behavior matches existing patterns.

## 9) Accessibility and Robustness Practices Already Present

Patterns worth preserving:
- Buttons for interactive controls (tabs, accordions) instead of clickable divs.
- `aria-label` present on tab nav group in the version comparison section.
- Runtime guards around optional elements (`if (!targetId) return`, `if (canvas && window.Chart)`).
- Safe initialization gate:
  - `DOMContentLoaded` listener when needed
  - immediate init when document is already loaded

## 10) Recommended Blueprint for New Guides

When creating a new guide in this section, default to this sequence:
1. Clone shell: hero + sticky sidebar + section stream.
2. Use scroll-spy nav unless the content is truly step-pane based.
3. Build each major concept as a `surface-card` section.
4. Use accent left-border callouts for warnings/checkpoints/key insights.
5. Add accordions only for high-density subtopics.
6. Add checklists for procedural/setup content.
7. Add charts only where quantitative comparison improves comprehension.
8. Keep script initialization in one local `init*` function and gate on DOM readiness.

## 11) Implementation Snippet (Starter Scaffold)

```astro
<section class="bg-void relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(230,0,18,0.18)_0%,transparent_62%)]"></div>
  <div class="relative max-w-[var(--width-content)] mx-auto px-4 py-12 md:py-16">
    <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-3">Interactive Guide</p>
    <h1 class="font-display text-4xl md:text-6xl uppercase leading-none tracking-tight mb-4">
      <span class="text-gradient">Guide Title</span>
    </h1>
  </div>
  <div class="chrome-divider"></div>
</section>

<section class="bg-obsidian py-8 md:py-10">
  <div class="max-w-[var(--width-content)] mx-auto px-4">
    <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      <aside class="surface-card rounded-sm p-3 lg:sticky lg:top-6 lg:self-start h-fit"></aside>
      <main class="space-y-6"></main>
    </div>
  </div>
</section>
```

## 12) Page-Specific Differences (Quick Matrix)

- `pokemon-gba-rom-hacking-guide`
  - Most complete tutorial grammar: tables, checkpoints, checklists, accordion roadmap.
  - Multi-open accordion behavior.
- `pokemon-diamond-pearl-vs-platinum`
  - Strongest comparison grammar: radar + bar charts and revision tabs.
  - Single-open accordion behavior.
- `botw-60fps-guide`
  - Uses section-switching sidebar buttons instead of scroll-spy anchors.
  - Horizontal and vertical bar charts for practical metrics.
- `bo3-gsc-guide`
  - Richest code presentation (tokenized pseudo highlighting, roadmap badges, resource cards).
  - Uses both tabs and single-open accordion plus radar analytics.

## 13) Reuse Decision Rules

If content is tutorial/step execution heavy:
- Prefer checklist pattern + checkpoint callouts.

If content is comparative analysis heavy:
- Prefer tabs + charts + side-by-side cards.

If content is code ecosystem heavy:
- Prefer syntax-highlight-like token classes + resource card grid.

If content is long and linear:
- Use scroll-spy sticky sidebar.

If content is short and mode-based:
- Use section-toggle buttons (BotW pattern).
