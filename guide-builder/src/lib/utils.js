/**
 * Convert a string to a URL-safe slug.
 */
export function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Normalize image URLs — extract Google Drive direct links, etc.
 * Ported from content-manager.ps1 Normalize-ImageUrl.
 */
export function normalizeImageUrl(raw) {
  if (!raw) return '';
  const trimmed = raw.trim();

  // Google Drive file link → direct view URL
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }

  // Google Drive open link
  const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([\w-]+)/);
  if (openMatch) {
    return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  }

  // Already a direct uc link — keep as-is
  if (trimmed.includes('drive.google.com/uc?')) {
    return trimmed;
  }

  return trimmed;
}

/**
 * Escape single-quoted strings for Astro template insertion.
 * Ported from Escape-AstroSingleQuoted in content-manager.ps1.
 */
export function escapeAstroQuoted(str) {
  return str.replace(/'/g, "\\'").replace(/\n/g, ' ');
}

/**
 * Format a date for display (default: "MMM YYYY").
 */
export function defaultDate() {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
}
