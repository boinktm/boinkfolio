const rawBase = import.meta.env.BASE_URL ?? '/';

const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export function withBase(path = ''): string {
  const trimmedPath = path.trim();
  if (!trimmedPath) return normalizedBase;

  if (
    /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(trimmedPath) ||
    /^[a-z][a-z\d+\-.]*:/i.test(trimmedPath) ||
    trimmedPath.startsWith('#')
  ) {
    return trimmedPath;
  }

  const normalizedPath = trimmedPath.replace(/^\/+/, '');
  return `${normalizedBase}${normalizedPath}`;
}

export function mappingPath(slug: string): string {
  const normalizedSlug = slug.replace(/^\/+/, '');
  return withBase(`mapping/${normalizedSlug}`);
}

export function artPath(slug: string): string {
  const normalizedSlug = slug.replace(/^\/+/, '');
  return withBase(`art/${normalizedSlug}`);
}

export function assetPath(slug: string): string {
  const normalizedSlug = slug.replace(/^\/+/, '');
  return withBase(`assets-and-guides/${normalizedSlug}`);
}

export function musingPath(slug: string): string {
  const normalizedSlug = slug.replace(/^\/+/, '');
  return withBase(`musings/${normalizedSlug}`);
}

/**
 * Extract a Google Drive file ID from any Drive URL variant and return
 * the direct-embeddable lh3 URL.  Returns the original string if it
 * isn't a recognisable Drive link.
 */
export function normalizeGoogleDriveUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();

  // Already in the correct format
  if (trimmed.startsWith('https://lh3.googleusercontent.com/')) return trimmed;

  let fileId: string | null = null;
  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname;

    if (host === 'drive.google.com') {
      // /thumbnail?id=ID  or  /uc?...&id=ID
      fileId = parsed.searchParams.get('id');
      if (!fileId) {
        // /file/d/ID/...
        const m = parsed.pathname.match(/\/file\/d\/([^/]+)/);
        if (m) fileId = m[1];
      }
    } else if (host === 'drive.usercontent.google.com') {
      fileId = parsed.searchParams.get('id');
    }
  } catch {
    return trimmed;
  }

  return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : trimmed;
}
