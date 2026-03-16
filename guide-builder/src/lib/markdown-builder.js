/**
 * Build a YAML frontmatter + markdown body string from field values.
 * Used by Art, Assets, Mapping, Musings collection editors.
 */
export function buildMarkdownFile(fields, body = '') {
  const lines = ['---'];

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - '${String(item).replace(/'/g, "''")}'`);
        }
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: '${String(value).replace(/'/g, "''")}'`);
    }
  }

  lines.push('---');
  lines.push('');

  if (body.trim()) {
    lines.push(body.trim());
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Collection field schemas matching content.config.ts Zod definitions.
 * Each schema entry defines: key, label, type, required, default.
 */
export const SCHEMAS = {
  art: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'tagline', label: 'Tagline', type: 'text', required: true },
    { key: 'thumbnail', label: 'Thumbnail', type: 'image', required: true },
    { key: 'fullres', label: 'Full Resolution', type: 'image' },
    { key: 'images', label: 'Images', type: 'tags' },
    { key: 'videos', label: 'Videos', type: 'tags' },
    { key: 'medium', label: 'Medium', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'text', required: true },
    { key: 'date', label: 'Date', type: 'text', required: true },
    { key: 'software', label: 'Software', type: 'tags' },
    { key: 'externalUrl', label: 'External URL', type: 'text' },
    { key: 'tags', label: 'Tags', type: 'tags' },
    { key: 'featured', label: 'Featured', type: 'checkbox', default: false },
  ],
  assets: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'summary', label: 'Summary', type: 'textarea', required: true },
    { key: 'filePath', label: 'File Path', type: 'text', required: true },
    { key: 'previewImage', label: 'Preview Image', type: 'image' },
    { key: 'category', label: 'Category', type: 'text', required: true },
    { key: 'sourceType', label: 'Source Type', type: 'text', required: true },
    { key: 'date', label: 'Date', type: 'text', required: true },
    { key: 'tags', label: 'Tags', type: 'tags' },
    { key: 'isPublic', label: 'Public', type: 'checkbox', default: false },
    { key: 'relatedArtSlug', label: 'Related Art Slug', type: 'text' },
  ],
  mapping: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'game', label: 'Game', type: 'text', required: true },
    { key: 'tagline', label: 'Tagline', type: 'text', required: true },
    { key: 'thumbnail', label: 'Thumbnail', type: 'image', required: true },
    { key: 'images', label: 'Images', type: 'tags' },
    { key: 'videos', label: 'Videos', type: 'tags' },
    { key: 'workshopUrl', label: 'Workshop URL', type: 'text' },
    { key: 'date', label: 'Date', type: 'text', required: true },
    { key: 'tags', label: 'Tags', type: 'tags' },
    { key: 'featured', label: 'Featured', type: 'checkbox', default: false },
  ],
  musings: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'excerpt', label: 'Excerpt', type: 'textarea', required: true },
    { key: 'date', label: 'Date', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'text', required: true },
    { key: 'featured', label: 'Featured', type: 'checkbox', default: false },
  ],
};

/**
 * Get default empty values for a schema.
 */
export function getDefaults(schemaKey) {
  const schema = SCHEMAS[schemaKey];
  const defaults = { slug: '' };
  for (const field of schema) {
    if (field.type === 'tags') defaults[field.key] = [];
    else if (field.type === 'checkbox') defaults[field.key] = field.default ?? false;
    else defaults[field.key] = field.default ?? '';
  }
  return defaults;
}
