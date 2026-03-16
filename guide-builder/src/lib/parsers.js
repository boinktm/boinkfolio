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
 * Parse an Astro guide file to extract metadata and sections.
 * Uses regex patterns matching the template token format.
 */
export function parseGuideAstro(content) {
  const meta = {};

  const extract = (key, pattern) => {
    const m = content.match(pattern);
    if (m) meta[key] = m[1].replace(/\\'/g, "'");
  };

  extract('title', /title:\s*'((?:\\'|[^'])*)'/);
  extract('description', /description:\s*'((?:\\'|[^'])*)'/);
  extract('category', /category:\s*'((?:\\'|[^'])*)'/);
  extract('date', /date:\s*'((?:\\'|[^'])*)'/);
  extract('heroImage', /heroImage:\s*'((?:\\'|[^'])*)'/);

  // Featured token
  const featuredMatch = content.match(/featuredToken:\s*'((?:\\'|[^'])*)'/);
  meta.featured = featuredMatch ? featuredMatch[1].replace(/\\'/g, "'").toLowerCase() === 'true' : false;

  // Tags (pipe-separated)
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

  // Sections — extract from nav links or section IDs
  const sectionRegex = /id="([\w-]+)"\s+data-guide-section/g;
  const sections = [];
  let secMatch;
  while ((secMatch = sectionRegex.exec(content)) !== null) {
    sections.push({
      id: secMatch[1],
      title: secMatch[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  }
  meta.sections = sections;

  return { meta, rawContent: content };
}
