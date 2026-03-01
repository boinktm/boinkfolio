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
  return withBase(`assets/${normalizedSlug}`);
}

export function musingPath(slug: string): string {
  const normalizedSlug = slug.replace(/^\/+/, '');
  return withBase(`musings/${normalizedSlug}`);
}
