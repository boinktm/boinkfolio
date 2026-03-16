import { escapeAstroQuoted, toSlug } from './utils';

/**
 * Token-based guide generation — replaces __GUIDE_*__ tokens in the template.
 * Used for quick skeleton guides (same approach as content-manager.ps1).
 */
export function buildGuideFromTemplate(template, meta) {
  let output = template;

  output = output.replace(/__GUIDE_TITLE__/g, escapeAstroQuoted(meta.title || ''));
  output = output.replace(/__GUIDE_DESCRIPTION__/g, escapeAstroQuoted(meta.description || ''));
  output = output.replace(/__GUIDE_CATEGORY__/g, escapeAstroQuoted(meta.category || 'General'));
  output = output.replace(/__GUIDE_DATE__/g, escapeAstroQuoted(meta.date || ''));
  output = output.replace(/__GUIDE_HERO_IMAGE__/g, escapeAstroQuoted(meta.heroImage || ''));
  output = output.replace(/__GUIDE_TAGS__/g, (meta.tags || []).join('|'));
  output = output.replace(/__GUIDE_FEATURED__/g, meta.featured ? 'true' : 'false');
  output = output.replace(/__GUIDE_SECTIONS__/g,
    (meta.sections || []).map((s) => s.title || s).join('|')
  );

  if (!output.endsWith('\n')) output += '\n';
  return output;
}

/**
 * Full HTML guide generation — builds a complete .astro file with all section
 * content, Chart.js scripts, checklists, code blocks, etc.
 * Modeled on botw-60fps-guide.astro and bo3-gsc-guide.astro patterns.
 */
export function buildFullGuide(meta, sections) {
  const lines = [];
  const safeTitle = escapeAstroQuoted(meta.title || '');
  const safeDesc = escapeAstroQuoted(meta.description || '');

  // --- Frontmatter ---
  lines.push('---');
  lines.push("import Layout from '../../layouts/Layout.astro';");
  lines.push("import Header from '../../components/Header.astro';");
  lines.push("import SubNav from '../../components/SubNav.astro';");
  lines.push("import Footer from '../../components/Footer.astro';");
  lines.push('---');
  lines.push('');

  // --- Layout wrapper ---
  lines.push('<Layout');
  lines.push(`  title="${safeTitle} - Boink Brands"`);
  lines.push(`  description="${safeDesc}"`);
  lines.push('>');
  lines.push('  <Header />');
  lines.push('  <SubNav activeTab="3D Art" />');
  lines.push('');

  // --- Hero section ---
  lines.push('  <section class="bg-void relative overflow-hidden">');
  lines.push('    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(230,0,18,0.16)_0%,transparent_65%)]"></div>');
  lines.push('    <div class="relative max-w-[var(--width-content)] mx-auto px-4 py-12 md:py-16">');
  lines.push('      <p class="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-3">Interactive Guide</p>');
  lines.push('      <h1 class="font-display text-4xl md:text-6xl uppercase leading-none tracking-tight mb-4">');
  lines.push(`        <span class="text-gradient">${esc(meta.title)}</span>`);
  lines.push('      </h1>');
  lines.push('      <p class="text-text-secondary text-sm md:text-base max-w-3xl leading-relaxed">');
  lines.push(`        ${esc(meta.description)}`);
  lines.push('      </p>');
  lines.push('    </div>');
  lines.push('    <div class="chrome-divider"></div>');
  lines.push('  </section>');
  lines.push('');

  // --- Main content area ---
  lines.push('  <section class="bg-obsidian py-8 md:py-10">');
  lines.push('    <div class="max-w-[var(--width-content)] mx-auto px-4">');
  lines.push('      <div class="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">');

  // --- Sidebar nav ---
  lines.push('        <aside class="surface-card rounded-sm p-3 lg:sticky lg:top-6 lg:self-start h-fit">');
  lines.push('          <p class="text-[10px] uppercase tracking-widest text-text-muted font-bold px-3 pb-2">Sections</p>');
  lines.push('          <nav id="guide-nav" class="space-y-1">');
  sections.forEach((section, i) => {
    const sectionId = toSlug(section.title) || `section-${i + 1}`;
    lines.push(`            <a href="#${sectionId}" class="guide-nav-link${i === 0 ? ' is-active' : ''}">${esc(section.title)}</a>`);
  });
  lines.push('          </nav>');
  lines.push('        </aside>');
  lines.push('');

  // --- Content sections ---
  lines.push('        <main id="guide-content" class="space-y-6">');

  sections.forEach((section, i) => {
    const sectionId = toSlug(section.title) || `section-${i + 1}`;
    lines.push(`          <section id="${sectionId}" data-guide-section class="surface-card rounded-sm p-6 md:p-8 scroll-mt-24">`);
    lines.push(`            <h2 class="font-display text-3xl md:text-4xl uppercase text-text-primary leading-none mb-4">${esc(section.title)}</h2>`);

    if (section.intro) {
      lines.push(`            <p class="text-sm md:text-base text-text-secondary leading-relaxed max-w-3xl mb-6">${esc(section.intro)}</p>`);
    }

    // Render content blocks
    for (const block of section.blocks || []) {
      lines.push('');
      switch (block.type) {
        case 'paragraph':
          lines.push(`            <p class="text-sm text-text-secondary leading-relaxed mb-4">${esc(block.content)}</p>`);
          break;

        case 'checklist':
          lines.push('            <div class="surface-card rounded-sm p-5 md:p-6 bg-charcoal/30 mb-4">');
          if (block.heading) {
            lines.push(`              <h3 class="font-display text-xl uppercase text-text-primary mb-4">${esc(block.heading)}</h3>`);
          }
          lines.push('              <ul class="space-y-3">');
          for (const item of block.items || []) {
            lines.push('                <li class="checklist-item" data-checklist-item>');
            lines.push('                  <span class="checkmark">[ ]</span>');
            lines.push(`                  <span>${item}</span>`);
            lines.push('                </li>');
          }
          lines.push('              </ul>');
          lines.push('            </div>');
          break;

        case 'code':
          lines.push('            <div class="surface-card rounded-sm p-5 md:p-6 bg-charcoal/30 mb-4">');
          if (block.heading) {
            lines.push(`              <h3 class="text-xs font-bold uppercase tracking-widest text-accent mb-3">${esc(block.heading)}</h3>`);
          }
          if (block.description) {
            lines.push(`              <p class="text-sm text-text-secondary mb-3 leading-relaxed">${esc(block.description)}</p>`);
          }
          lines.push(`              <pre class="guide-code-block"><code>${esc(block.content)}</code></pre>`);
          lines.push('            </div>');
          break;

        case 'callout':
          lines.push('            <div class="border-l-2 border-accent bg-accent/10 p-4 rounded-sm mb-4">');
          if (block.heading) {
            lines.push(`              <h4 class="text-xs font-bold uppercase tracking-widest text-accent">${esc(block.heading)}</h4>`);
          }
          lines.push(`              <p class="text-xs text-text-secondary mt-2 leading-relaxed">${esc(block.content)}</p>`);
          lines.push('            </div>');
          break;

        case 'ordered-list':
          lines.push('            <ol class="list-decimal pl-5 space-y-2 text-sm text-text-secondary mb-4">');
          for (const item of block.items || []) {
            lines.push(`              <li>${item}</li>`);
          }
          lines.push('            </ol>');
          break;

        case 'unordered-list':
          lines.push('            <ul class="space-y-1 text-sm text-text-secondary mb-4">');
          for (const item of block.items || []) {
            lines.push(`              <li>- ${item}</li>`);
          }
          lines.push('            </ul>');
          break;

        case 'chart':
          lines.push('            <div class="surface-card rounded-sm p-5 md:p-6 bg-charcoal/30 mb-6">');
          lines.push('              <div class="chart-container">');
          lines.push(`                <canvas id="${block.canvasId || `chart-${sectionId}`}"></canvas>`);
          lines.push('              </div>');
          if (block.caption) {
            lines.push(`              <p class="text-[11px] text-text-muted text-center mt-3">${esc(block.caption)}</p>`);
          }
          lines.push('            </div>');
          break;

        case 'image':
          lines.push('            <div class="mb-4">');
          lines.push(`              <img src="${esc(block.src)}" alt="${esc(block.alt || '')}" class="rounded-sm max-w-full" loading="lazy" />`);
          if (block.caption) {
            lines.push(`              <p class="text-[11px] text-text-muted mt-2">${esc(block.caption)}</p>`);
          }
          lines.push('            </div>');
          break;

        case 'card':
          lines.push(`            <article class="surface-card rounded-sm p-5 md:p-6 bg-charcoal/30 mb-4">`);
          if (block.heading) {
            lines.push(`              <h3 class="font-display text-xl uppercase text-text-primary mb-3">${esc(block.heading)}</h3>`);
          }
          lines.push(`              <p class="text-sm text-text-secondary leading-relaxed">${esc(block.content)}</p>`);
          lines.push('            </article>');
          break;

        default:
          break;
      }
    }

    lines.push('          </section>');
    lines.push('');
  });

  lines.push('        </main>');
  lines.push('      </div>');
  lines.push('    </div>');
  lines.push('  </section>');
  lines.push('');

  // --- Footer ---
  lines.push('  <Footer />');
  lines.push('');

  // --- Scripts ---
  const hasCharts = sections.some((s) => (s.blocks || []).some((b) => b.type === 'chart'));
  const hasChecklists = sections.some((s) => (s.blocks || []).some((b) => b.type === 'checklist'));

  if (hasCharts) {
    lines.push('  <script is:inline src="https://cdn.jsdelivr.net/npm/chart.js"></script>');
  }

  // Interactive script block
  lines.push('  <script is:inline>');
  // Scroll-spy nav
  lines.push('    const navLinks = Array.from(document.querySelectorAll(".guide-nav-link"));');
  lines.push('    const guideSections = Array.from(document.querySelectorAll("[data-guide-section]"));');
  lines.push('    if (navLinks.length && guideSections.length) {');
  lines.push('      const observer = new IntersectionObserver(');
  lines.push('        (entries) => {');
  lines.push('          entries.forEach((entry) => {');
  lines.push('            if (!entry.isIntersecting) return;');
  lines.push('            navLinks.forEach((link) => {');
  lines.push('              const isMatch = link.getAttribute("href") === "#" + entry.target.id;');
  lines.push('              link.classList.toggle("is-active", isMatch);');
  lines.push('            });');
  lines.push('          });');
  lines.push('        },');
  lines.push('        { root: null, rootMargin: "-18% 0px -65% 0px", threshold: 0 }');
  lines.push('      );');
  lines.push('      guideSections.forEach((s) => observer.observe(s));');
  lines.push('    }');

  // Checklist toggles
  if (hasChecklists) {
    lines.push('');
    lines.push('    const checklistItems = Array.from(document.querySelectorAll("[data-checklist-item]"));');
    lines.push('    checklistItems.forEach((item) => {');
    lines.push('      item.addEventListener("click", () => {');
    lines.push('        item.classList.toggle("checked");');
    lines.push('        const marker = item.querySelector(".checkmark");');
    lines.push('        if (marker) marker.textContent = item.classList.contains("checked") ? "[x]" : "[ ]";');
    lines.push('      });');
    lines.push('    });');
  }

  // Chart.js initialization
  if (hasCharts) {
    const chartBlocks = sections.flatMap((s) =>
      (s.blocks || []).filter((b) => b.type === 'chart')
    );
    for (const chart of chartBlocks) {
      if (!chart.chartConfig) continue;
      const canvasId = chart.canvasId || 'chart';
      lines.push('');
      lines.push(`    const ${canvasId}El = document.getElementById("${canvasId}");`);
      lines.push(`    if (${canvasId}El && window.Chart) {`);
      lines.push(`      new window.Chart(${canvasId}El, ${JSON.stringify(chart.chartConfig, null, 8).split('\n').map((l, i) => i === 0 ? l : '      ' + l).join('\n')});`);
      lines.push('    }');
    }
  }

  lines.push('  </script>');
  lines.push('');

  // --- Scoped styles ---
  lines.push('<style>');
  lines.push('  .guide-nav-link {');
  lines.push('    display: block;');
  lines.push('    width: 100%;');
  lines.push('    text-align: left;');
  lines.push('    border: 1px solid transparent;');
  lines.push('    background: transparent;');
  lines.push('    color: var(--color-text-secondary);');
  lines.push('    font-size: 0.75rem;');
  lines.push('    text-transform: uppercase;');
  lines.push('    letter-spacing: 0.06em;');
  lines.push('    padding: 0.7rem 0.8rem;');
  lines.push('    border-radius: var(--radius-sm);');
  lines.push('    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;');
  lines.push('  }');
  lines.push('  .guide-nav-link:hover {');
  lines.push('    color: var(--color-text-primary);');
  lines.push('    border-color: var(--color-border-light);');
  lines.push('    background: rgba(255, 255, 255, 0.02);');
  lines.push('  }');
  lines.push('  .guide-nav-link.is-active {');
  lines.push('    color: #ffffff;');
  lines.push('    border-color: var(--color-accent);');
  lines.push('    background: rgba(230, 0, 18, 0.15);');
  lines.push('    box-shadow: inset 3px 0 0 var(--color-accent);');
  lines.push('  }');

  if (hasChecklists) {
    lines.push('  .checklist-item {');
    lines.push('    display: flex;');
    lines.push('    align-items: center;');
    lines.push('    gap: 0.75rem;');
    lines.push('    padding: 0.5rem;');
    lines.push('    border: 1px solid transparent;');
    lines.push('    border-radius: var(--radius-sm);');
    lines.push('    cursor: pointer;');
    lines.push('    color: var(--color-text-secondary);');
    lines.push('    transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;');
    lines.push('  }');
    lines.push('  .checklist-item:hover {');
    lines.push('    border-color: var(--color-border-light);');
    lines.push('    background: rgba(255, 255, 255, 0.02);');
    lines.push('    color: var(--color-text-primary);');
    lines.push('  }');
    lines.push('  .checklist-item.checked {');
    lines.push('    color: var(--color-text-muted);');
    lines.push('    text-decoration: line-through;');
    lines.push('  }');
    lines.push('  .checkmark {');
    lines.push('    font-family: var(--font-mono);');
    lines.push('    font-size: 0.85rem;');
    lines.push('    color: var(--color-accent);');
    lines.push('    flex-shrink: 0;');
    lines.push('  }');
  }

  if (hasCharts) {
    lines.push('  .chart-container {');
    lines.push('    position: relative;');
    lines.push('    width: 100%;');
    lines.push('    max-width: 900px;');
    lines.push('    margin-inline: auto;');
    lines.push('    height: 320px;');
    lines.push('  }');
    lines.push('  @media (min-width: 768px) {');
    lines.push('    .chart-container { height: 380px; }');
    lines.push('  }');
  }

  lines.push('  .guide-code-block {');
  lines.push('    background: #0f0f0f;');
  lines.push('    border: 1px solid var(--color-border);');
  lines.push('    color: #d4d4d4;');
  lines.push('    border-radius: var(--radius-sm);');
  lines.push('    font-size: 0.75rem;');
  lines.push('    line-height: 1.5;');
  lines.push('    padding: 1rem;');
  lines.push('    overflow-x: auto;');
  lines.push('  }');
  lines.push('</style>');

  // --- Close Layout ---
  lines.push('</Layout>');
  lines.push('');

  return lines.join('\n');
}

/** HTML-escape minimal characters */
function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
