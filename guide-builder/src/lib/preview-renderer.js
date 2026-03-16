import { toSlug } from './utils';

/**
 * Generate a full HTML document for the preview iframe,
 * injecting the site's design system CSS and Google Fonts.
 */
export function renderPreviewHTML(meta, sections, globalCSS) {
  const sectionNavHTML = sections.map((s, i) => {
    const id = toSlug(s.title) || `section-${i + 1}`;
    return `<a href="#${id}" class="guide-nav-link${i === 0 ? ' is-active' : ''}">${esc(s.title)}</a>`;
  }).join('\n            ');

  const sectionContentHTML = sections.map((s, i) => {
    const id = toSlug(s.title) || `section-${i + 1}`;
    return `
          <section id="${id}" data-guide-section class="surface-card rounded-sm p-6 md:p-8 scroll-mt-24">
            <h2 class="font-display text-3xl md:text-4xl uppercase text-text-primary leading-none mb-4">${esc(s.title)}</h2>
            ${s.intro ? `<p class="text-sm md:text-base text-text-secondary leading-relaxed max-w-3xl mb-6">${esc(s.intro)}</p>` : ''}
            ${renderBlocks(s.blocks || [], id)}
          </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Oswald:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: {
        colors: {
          void: '#000000', obsidian: '#0a0a0a', charcoal: '#141414',
          gunmetal: '#1e1e1e', slate: '#2a2a2a', ash: '#3a3a3a',
          accent: '#e60012', 'accent-hover': '#ff1a2e', 'accent-muted': '#991018',
          'text-primary': '#f0f0f0', 'text-secondary': '#aaaaaa', 'text-muted': '#666666',
          border: '#2d2d2d', 'border-light': '#444444', surface: '#161616',
          chrome: '#555555', 'chrome-light': '#888888',
        },
        fontFamily: {
          sans: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
          display: ['Oswald', 'Impact', 'sans-serif'],
          mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        },
        borderRadius: { sm: '2px', md: '4px', lg: '8px' },
      }}
    };
  </script>
  <style>
    ${globalCSS || ''}
    html { background: #0a0a0a; color: #f0f0f0; font-family: 'Inter', sans-serif; }
    body { margin: 0; }
    ::selection { background: #e60012; color: white; }
    .text-gradient {
      background: linear-gradient(135deg, #f0f0f0 0%, #888 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .surface-card { background: #161616; border: 1px solid #2d2d2d; }
    .chrome-divider { height: 1px; background: linear-gradient(90deg, transparent, #555, transparent); }
    .guide-nav-link {
      display: block; width: 100%; text-align: left;
      border: 1px solid transparent; background: transparent;
      color: #aaa; font-size: 0.75rem; text-transform: uppercase;
      letter-spacing: 0.06em; padding: 0.7rem 0.8rem; border-radius: 2px;
      transition: border-color 0.2s, color 0.2s, background 0.2s;
      text-decoration: none;
    }
    .guide-nav-link:hover { color: #f0f0f0; border-color: #444; background: rgba(255,255,255,0.02); }
    .guide-nav-link.is-active { color: #fff; border-color: #e60012; background: rgba(230,0,18,0.15); box-shadow: inset 3px 0 0 #e60012; }
    .checklist-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem;
      border: 1px solid transparent; border-radius: 2px; cursor: pointer;
      color: #aaa; transition: border-color 0.2s, color 0.2s, background 0.2s;
    }
    .checklist-item:hover { border-color: #444; background: rgba(255,255,255,0.02); color: #f0f0f0; }
    .checklist-item.checked { color: #666; text-decoration: line-through; }
    .checkmark { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #e60012; flex-shrink: 0; }
    .guide-code-block {
      background: #0f0f0f; border: 1px solid #2d2d2d; color: #d4d4d4;
      border-radius: 2px; font-size: 0.75rem; line-height: 1.5; padding: 1rem; overflow-x: auto;
    }
    .chart-container { position: relative; width: 100%; max-width: 900px; margin-inline: auto; height: 320px; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <section style="background:#000;position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at top,rgba(230,0,18,0.16) 0%,transparent 65%);"></div>
    <div style="position:relative;max-width:1200px;margin:0 auto;padding:3rem 1rem;">
      <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.3em;color:#e60012;margin-bottom:0.75rem;">Interactive Guide</p>
      <h1 style="font-family:Oswald,Impact,sans-serif;font-size:clamp(2rem,5vw,3.5rem);text-transform:uppercase;line-height:1;letter-spacing:-0.02em;margin-bottom:1rem;">
        <span class="text-gradient">${esc(meta.title || 'Guide Title')}</span>
      </h1>
      <p style="color:#aaa;font-size:0.9rem;max-width:48rem;line-height:1.6;">${esc(meta.description || '')}</p>
    </div>
    <div class="chrome-divider"></div>
  </section>

  <section style="background:#0a0a0a;padding:2rem 0;">
    <div style="max-width:1200px;margin:0 auto;padding:0 1rem;">
      <div style="display:grid;grid-template-columns:260px 1fr;gap:1.5rem;">
        <aside class="surface-card" style="border-radius:2px;padding:0.75rem;position:sticky;top:1.5rem;align-self:start;">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.16em;color:#666;font-weight:700;padding:0 0.75rem 0.5rem;">Sections</p>
          <nav style="display:flex;flex-direction:column;gap:0.25rem;">
            ${sectionNavHTML}
          </nav>
        </aside>

        <main style="display:flex;flex-direction:column;gap:1.5rem;">
          ${sectionContentHTML}
        </main>
      </div>
    </div>
  </section>

  <script>
    // Scroll-spy
    const navLinks = Array.from(document.querySelectorAll('.guide-nav-link'));
    const sects = Array.from(document.querySelectorAll('[data-guide-section]'));
    if (navLinks.length && sects.length) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
        });
      }, { rootMargin: '-18% 0px -65% 0px' });
      sects.forEach((s) => obs.observe(s));
    }
    // Checklists
    document.querySelectorAll('[data-checklist-item]').forEach((item) => {
      item.addEventListener('click', () => {
        item.classList.toggle('checked');
        const m = item.querySelector('.checkmark');
        if (m) m.textContent = item.classList.contains('checked') ? '[x]' : '[ ]';
      });
    });
  </script>
</body>
</html>`;
}

function renderBlocks(blocks, sectionId) {
  return blocks.map((block) => {
    switch (block.type) {
      case 'paragraph':
        return `<p class="text-sm" style="color:#aaa;line-height:1.7;margin-bottom:1rem;">${esc(block.content)}</p>`;

      case 'checklist':
        return `
            <div class="surface-card" style="border-radius:2px;padding:1.25rem 1.5rem;background:rgba(20,20,20,0.3);margin-bottom:1rem;">
              ${block.heading ? `<h3 style="font-family:Oswald;font-size:1.2rem;text-transform:uppercase;color:#f0f0f0;margin-bottom:1rem;">${esc(block.heading)}</h3>` : ''}
              <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:0.75rem;">
                ${(block.items || []).map((item) => `
                <li class="checklist-item" data-checklist-item>
                  <span class="checkmark">[ ]</span>
                  <span>${item}</span>
                </li>`).join('')}
              </ul>
            </div>`;

      case 'code':
        return `
            <div class="surface-card" style="border-radius:2px;padding:1.25rem 1.5rem;background:rgba(20,20,20,0.3);margin-bottom:1rem;">
              ${block.heading ? `<h3 style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#e60012;margin-bottom:0.75rem;">${esc(block.heading)}</h3>` : ''}
              ${block.description ? `<p style="font-size:0.85rem;color:#aaa;margin-bottom:0.75rem;">${esc(block.description)}</p>` : ''}
              <pre class="guide-code-block"><code>${esc(block.content)}</code></pre>
            </div>`;

      case 'callout':
        return `
            <div style="border-left:2px solid #e60012;background:rgba(230,0,18,0.1);padding:1rem;border-radius:2px;margin-bottom:1rem;">
              ${block.heading ? `<h4 style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#e60012;">${esc(block.heading)}</h4>` : ''}
              <p style="font-size:0.75rem;color:#aaa;margin-top:0.5rem;line-height:1.6;">${esc(block.content)}</p>
            </div>`;

      case 'ordered-list':
        return `<ol style="padding-left:1.25rem;color:#aaa;font-size:0.85rem;line-height:1.7;margin-bottom:1rem;">
              ${(block.items || []).map((item) => `<li style="margin-bottom:0.5rem;">${item}</li>`).join('')}
            </ol>`;

      case 'unordered-list':
        return `<ul style="list-style:none;padding:0;color:#aaa;font-size:0.85rem;line-height:1.7;margin-bottom:1rem;">
              ${(block.items || []).map((item) => `<li>- ${item}</li>`).join('')}
            </ul>`;

      case 'chart':
        return `
            <div class="surface-card" style="border-radius:2px;padding:1.25rem 1.5rem;background:rgba(20,20,20,0.3);margin-bottom:1.5rem;">
              <div class="chart-container">
                <canvas id="${block.canvasId || `chart-${sectionId}`}"></canvas>
              </div>
              ${block.caption ? `<p style="font-size:11px;color:#666;text-align:center;margin-top:0.75rem;">${esc(block.caption)}</p>` : ''}
            </div>`;

      case 'image':
        return `
            <div style="margin-bottom:1rem;">
              <img src="${esc(block.src)}" alt="${esc(block.alt || '')}" style="border-radius:2px;max-width:100%;" loading="lazy" />
              ${block.caption ? `<p style="font-size:11px;color:#666;margin-top:0.5rem;">${esc(block.caption)}</p>` : ''}
            </div>`;

      case 'card':
        return `
            <div class="surface-card" style="border-radius:2px;padding:1.25rem 1.5rem;background:rgba(20,20,20,0.3);margin-bottom:1rem;">
              ${block.heading ? `<h3 style="font-family:Oswald;font-size:1.2rem;text-transform:uppercase;color:#f0f0f0;margin-bottom:0.75rem;">${esc(block.heading)}</h3>` : ''}
              <p style="font-size:0.85rem;color:#aaa;line-height:1.7;">${esc(block.content)}</p>
            </div>`;

      default:
        return '';
    }
  }).join('\n');
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
