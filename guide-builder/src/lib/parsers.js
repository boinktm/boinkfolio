/**
 * Parse a markdown file with YAML frontmatter into { frontmatter, body }.
 * Ported from Parse-MarkdownContentFile in content-manager.ps1.
 */
export function parseMarkdownFile(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const rawFm = match[1];
  const body = (match[2] || '').trim();
  const frontmatter = {};

  let currentKey = null;
  let inArray = false;

  for (const line of rawFm.split(/\r?\n/)) {
    // Array item
    if (inArray && /^\s+-\s+(.*)$/.test(line)) {
      const val = line.match(/^\s+-\s+(.*)$/)[1].replace(/^['"]|['"]$/g, '').trim();
      if (val) frontmatter[currentKey].push(val);
      continue;
    }

    // Key-value pair
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const rawVal = kvMatch[2].trim();

      if (rawVal === '') {
        // Could be start of array or empty value
        frontmatter[currentKey] = [];
        inArray = true;
        continue;
      }

      inArray = false;

      // Inline array: [a, b, c]
      if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
        frontmatter[currentKey] = rawVal
          .slice(1, -1)
          .split(',')
          .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean);
        continue;
      }

      // Boolean
      if (rawVal === 'true') { frontmatter[currentKey] = true; continue; }
      if (rawVal === 'false') { frontmatter[currentKey] = false; continue; }

      // Quoted string
      if ((rawVal.startsWith('"') && rawVal.endsWith('"')) || (rawVal.startsWith("'") && rawVal.endsWith("'"))) {
        frontmatter[currentKey] = rawVal.slice(1, -1);
        continue;
      }

      // Plain value
      frontmatter[currentKey] = rawVal;
    } else {
      inArray = false;
    }
  }

  return { frontmatter, body };
}

/**
 * Parse an Astro guide file to extract metadata and sections with full content.
 * Handles both token-based template files AND full HTML guide files.
 */
export function parseGuideAstro(content) {
  const meta = {};

  // --- Metadata extraction ---
  // Strategy: try Layout tag attributes first (full HTML), fall back to template tokens

  // Layout tag: <Layout title="..." description="...">
  const layoutBlock = content.match(/<Layout\b[\s\S]*?>/);
  if (layoutBlock) {
    const layoutStr = layoutBlock[0];
    const titleAttr = layoutStr.match(/title=["']([^"']*?)["']/);
    const descAttr = layoutStr.match(/description=["']([\s\S]*?)["']\s*(?:\/?>|\w+=)/);
    if (titleAttr) meta.title = unesc(titleAttr[1]).replace(/\s*[-–—]\s*Boink Brands\s*$/i, '');
    if (descAttr) meta.description = unesc(descAttr[1]).replace(/\s+/g, ' ').trim();
  }

  // Layout with JSX expressions: title={`${guideMeta.title} - Boink Brands`}
  if (!meta.title) {
    const titleExpr = content.match(/title=\{`\$\{guideMeta\.title\}[^`]*`\}/);
    if (titleExpr) {
      const tokenVal = content.match(/title:\s*'((?:\\'|[^'])*)'/);
      if (tokenVal) meta.title = tokenVal[1].replace(/\\'/g, "'");
    }
  }

  // Template token fallbacks
  const extractToken = (key, pattern) => {
    if (!meta[key]) {
      const m = content.match(pattern);
      if (m) meta[key] = m[1].replace(/\\'/g, "'");
    }
  };
  extractToken('title', /title:\s*'((?:\\'|[^'])*)'/);
  extractToken('description', /description:\s*'((?:\\'|[^'])*)'/);
  extractToken('category', /category:\s*'((?:\\'|[^'])*)'/);
  extractToken('date', /date:\s*'((?:\\'|[^'])*)'/);
  extractToken('heroImage', /heroImage:\s*'((?:\\'|[^'])*)'/);

  // Guide-meta comment (round-trip data from full HTML mode)
  const metaComment = content.match(/<!-- guide-meta: (\{[\s\S]*?\}) -->/);
  if (metaComment) {
    try {
      const stored = JSON.parse(metaComment[1]);
      if (!meta.category && stored.category) meta.category = stored.category;
      if (!meta.date && stored.date) meta.date = stored.date;
      if (!meta.heroImage && stored.heroImage) meta.heroImage = stored.heroImage;
      if ((!meta.tags || meta.tags.length === 0) && stored.tags) meta.tags = stored.tags;
      if (stored.featured != null) meta.featured = stored.featured;
    } catch (_) { /* ignore malformed JSON */ }
  }

  // Featured (template token fallback, only if not set by guide-meta comment)
  if (meta.featured == null) {
    const featuredMatch = content.match(/featuredToken:\s*'((?:\\'|[^'])*)'/);
    meta.featured = featuredMatch ? featuredMatch[1].replace(/\\'/g, "'").toLowerCase() === 'true' : false;
  }

  // Tags (pipe-separated token format, only if not set by guide-meta comment)
  if (!meta.tags || meta.tags.length === 0) {
    const tagMatch = content.match(/tags:\s*'((?:\\'|[^'])*)'/);
    if (tagMatch) {
      meta.tags = tagMatch[1]
        .replace(/\\'/g, "'")
        .split('|')
        .map((t) => t.trim())
        .filter(Boolean);
    } else {
      meta.tags = [];
    }
  }

  // --- Section extraction with content ---
  meta.sections = parseSections(content);

  return { meta, rawContent: content };
}

/**
 * Extract sections from guide HTML content.
 * Detects sections by <section id="..." ...> tags and parses their content blocks.
 */
function parseSections(content) {
  // Find all content sections — match both data-guide-section and content-section patterns
  const sectionPattern = /<section\s+id="([\w-]+)"[^>]*(?:data-guide-section|content-section)[^>]*>([\s\S]*?)<\/section>/g;

  // Fallback: if no data-guide-section/content-section attributes, find sections inside <main>
  let matches = [...content.matchAll(sectionPattern)];

  if (matches.length === 0) {
    // Try broader pattern: sections inside a <main> tag
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    if (mainMatch) {
      const mainContent = mainMatch[1];
      const broadPattern = /<section\s+id="([\w-]+)"[^>]*>([\s\S]*?)<\/section>/g;
      matches = [...mainContent.matchAll(broadPattern)];
    }
  }

  if (matches.length === 0) {
    // Last resort: grab section IDs from nav links
    const navSections = [];
    const navLinkPattern = /(?:href="#|data-target=")([\w-]+)"/g;
    let navMatch;
    while ((navMatch = navLinkPattern.exec(content)) !== null) {
      const id = navMatch[1];
      if (!navSections.some((s) => s.id === id)) {
        navSections.push({
          id,
          title: id.replace(/^section-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          intro: '',
          blocks: [],
        });
      }
    }
    return navSections;
  }

  return matches.map(([, id, html]) => parseSectionHtml(id, html));
}

/**
 * Parse a single section's HTML into { id, title, intro, blocks }.
 */
function parseSectionHtml(id, html) {
  const section = { id, title: '', intro: '', blocks: [] };

  // Extract title from <h2>
  const h2Match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
  if (h2Match) section.title = stripTags(h2Match[1]).trim();

  // Fallback title from id
  if (!section.title) {
    section.title = id.replace(/^section-/, '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Extract intro: first <p> tag after the h2 that has the intro styling
  const introMatch = html.match(/<h2[\s\S]*?<\/h2>\s*<p\s+class="text-sm[^"]*text-text-secondary[^"]*leading-relaxed[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  if (introMatch) {
    section.intro = stripTags(introMatch[1]).trim();
  }

  // Parse content blocks after the intro
  parseBlocks(html, section);

  return section;
}

/**
 * Parse content blocks from section HTML.
 */
function parseBlocks(html, section) {
  // Remove the h2 and intro paragraph so we only process remaining content
  let body = html;
  const h2End = body.indexOf('</h2>');
  if (h2End !== -1) body = body.slice(h2End + 5);

  // Skip the intro paragraph if present
  if (section.intro) {
    const introEnd = body.match(/^[\s\S]*?<p\s+class="text-sm[^"]*text-text-secondary[^"]*leading-relaxed[^"]*"[^>]*>[\s\S]*?<\/p>/);
    if (introEnd) body = body.slice(introEnd[0].length);
  }

  // Callouts: <div class="border-l-2 border-accent bg-accent/10 ...">
  // Checklists: containers with data-checklist-item elements
  // Code blocks: containers with <pre class="guide-code-block">
  // Charts: containers with <canvas>
  // Cards: <article class="surface-card ...">
  // Ordered lists: <ol class="list-decimal ...">
  // Unordered lists: <ul class="space-y-1 ..."> with "- " prefix items
  // Paragraphs: standalone <p> tags
  // Images: <img> tags

  // Use a sequential scan approach to extract blocks in order
  const tokens = tokenizeBlocks(body);
  let blockId = 1;

  for (const token of tokens) {
    const block = { id: blockId++ };
    switch (token.type) {
      case 'callout': {
        block.type = 'callout';
        const headMatch = token.html.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
        block.heading = headMatch ? stripTags(headMatch[1]).trim() : '';
        // Get callout text — find <p> tags within the callout
        const calloutPs = [...token.html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
        block.content = calloutPs.map((m) => stripTags(m[1]).trim()).filter(Boolean).join(' ');
        section.blocks.push(block);
        break;
      }
      case 'checklist': {
        block.type = 'checklist';
        const chkHead = token.html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
        block.heading = chkHead ? stripTags(chkHead[1]).trim() : '';
        // Match each checklist-item and extract the second <span> (content, not checkmark)
        const items = [...token.html.matchAll(/data-checklist-item[^>]*>[\s\S]*?<span[^>]*>[\s\S]*?<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>/g)];
        block.items = items.map((m) => stripTags(m[1]).trim()).filter(Boolean);
        section.blocks.push(block);
        break;
      }
      case 'code': {
        block.type = 'code';
        const codeHead = token.html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
        block.heading = codeHead ? stripTags(codeHead[1]).trim() : '';
        // Get description: <p> before the <pre>
        const descMatch = token.html.match(/<p[^>]*>([\s\S]*?)<\/p>\s*<pre/);
        block.description = descMatch ? stripTags(descMatch[1]).trim() : '';
        const codeMatch = token.html.match(/<code[^>]*>([\s\S]*?)<\/code>/);
        block.content = codeMatch ? unesc(codeMatch[1]).trim() : '';
        section.blocks.push(block);
        break;
      }
      case 'chart': {
        block.type = 'chart';
        const canvasMatch = token.html.match(/<canvas\s+id="([^"]+)"/);
        block.canvasId = canvasMatch ? canvasMatch[1] : '';
        const captionMatch = token.html.match(/<p[^>]*text-text-muted[^>]*>([\s\S]*?)<\/p>/);
        block.caption = captionMatch ? stripTags(captionMatch[1]).trim() : '';
        section.blocks.push(block);
        break;
      }
      case 'ordered-list': {
        block.type = 'ordered-list';
        const olItems = [...token.html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
        block.items = olItems.map((m) => stripTags(m[1]).trim()).filter(Boolean);
        section.blocks.push(block);
        break;
      }
      case 'unordered-list': {
        block.type = 'unordered-list';
        const ulItems = [...token.html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
        block.items = ulItems.map((m) => stripTags(m[1]).replace(/^-\s*/, '').trim()).filter(Boolean);
        section.blocks.push(block);
        break;
      }
      case 'card': {
        block.type = 'card';
        const cardHead = token.html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
        block.heading = cardHead ? stripTags(cardHead[1]).trim() : '';
        const cardPs = [...token.html.matchAll(/<p[^>]*text-text-secondary[^>]*>([\s\S]*?)<\/p>/g)];
        block.content = cardPs.map((m) => stripTags(m[1]).trim()).filter(Boolean).join(' ');
        section.blocks.push(block);
        break;
      }
      case 'image': {
        block.type = 'image';
        const imgMatch = token.html.match(/<img\s+[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*/);
        block.src = imgMatch ? imgMatch[1] : '';
        block.alt = imgMatch ? imgMatch[2] : '';
        const imgCaption = token.html.match(/<p[^>]*text-text-muted[^>]*>([\s\S]*?)<\/p>/);
        block.caption = imgCaption ? stripTags(imgCaption[1]).trim() : '';
        section.blocks.push(block);
        break;
      }
      case 'paragraph': {
        block.type = 'paragraph';
        block.content = stripTags(token.html.match(/<p[^>]*>([\s\S]*?)<\/p>/)?.[1] || '').trim();
        if (block.content) section.blocks.push(block);
        break;
      }
    }
  }
}

/**
 * Tokenize section body HTML into typed block tokens in document order.
 */
function tokenizeBlocks(html) {
  const tokens = [];
  // Build a list of match positions for each block type
  const patterns = [
    // Callouts: border-l-2 border-accent bg-accent/10
    { type: 'callout', re: /<div\s+class="[^"]*border-l-2[^"]*border-accent[^"]*bg-accent[^"]*"[^>]*>[\s\S]*?<\/div>/g },
    // Charts: containers holding <canvas>
    { type: 'chart', re: /<div[^>]*class="[^"]*chart-container[^"]*"[^>]*>[\s\S]*?<canvas[\s\S]*?<\/div>\s*(?:<p[^>]*text-text-muted[^>]*>[\s\S]*?<\/p>\s*)?<\/div>/g },
    // Code blocks: containers with guide-code-block
    { type: 'code', re: /<(?:div|article)\s+class="[^"]*surface-card[^"]*"[^>]*>[\s\S]*?<pre\s+class="guide-code-block"[\s\S]*?<\/pre>[\s\S]*?<\/(?:div|article)>/g },
    // Checklists: containers with data-checklist-item
    { type: 'checklist', re: /<(?:div|ul)\s+[^>]*>[\s\S]*?data-checklist-item[\s\S]*?<\/(?:div|ul)>/g },
    // Ordered lists: <ol class="list-decimal">
    { type: 'ordered-list', re: /<ol\s+class="[^"]*list-decimal[^"]*"[^>]*>[\s\S]*?<\/ol>/g },
    // Unordered lists with "- " items (not checklists)
    { type: 'unordered-list', re: /<ul\s+class="[^"]*space-y-1[^"]*"[^>]*>[\s\S]*?<\/ul>/g },
    // Cards: <article class="surface-card ..."> without code blocks inside
    { type: 'card', re: /<article\s+class="[^"]*surface-card[^"]*"[^>]*>[\s\S]*?<\/article>/g },
    // Images
    { type: 'image', re: /<div[^>]*>\s*<img\s+[^>]*>[\s\S]*?<\/div>/g },
    // Standalone paragraphs (text-sm text-text-secondary)
    { type: 'paragraph', re: /<p\s+class="text-sm[^"]*text-text-secondary[^"]*"[^>]*>[\s\S]*?<\/p>/g },
  ];

  const allMatches = [];
  for (const { type, re } of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      allMatches.push({ type, start: m.index, end: m.index + m[0].length, html: m[0] });
    }
  }

  // Sort by position and remove overlapping matches (keep earliest/longest)
  allMatches.sort((a, b) => a.start - b.start || b.end - a.end);
  let lastEnd = 0;
  for (const match of allMatches) {
    if (match.start < lastEnd) continue; // skip overlapping
    // Skip cards that contain code blocks (those are already captured as 'code')
    if (match.type === 'card' && match.html.includes('guide-code-block')) continue;
    // Skip checklists that overlap with already-captured content
    tokens.push(match);
    lastEnd = match.end;
  }

  return tokens;
}

/** Strip HTML tags from a string */
function stripTags(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Unescape HTML entities */
function unesc(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
