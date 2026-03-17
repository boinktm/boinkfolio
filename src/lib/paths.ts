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

export function getGoogleDriveFileId(url: string): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname;

    if (host === 'drive.google.com') {
      const idFromSearch = parsed.searchParams.get('id');
      if (idFromSearch) return idFromSearch;

      const filePathMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
      if (filePathMatch) return filePathMatch[1];
    }

    if (host === 'drive.usercontent.google.com') {
      return parsed.searchParams.get('id');
    }

    if (host === 'lh3.googleusercontent.com') {
      const drivePathMatch = parsed.pathname.match(/\/d\/([^/]+)/);
      if (drivePathMatch) return drivePathMatch[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function toGoogleDrivePreviewUrl(url: string): string {
  const fileId = getGoogleDriveFileId(url);
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
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

  const fileId = getGoogleDriveFileId(trimmed);

  return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : trimmed;
}
