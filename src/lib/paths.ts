const rawBase = import.meta.env.BASE_URL ?? '/';

const normalizedBase = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export function withBase(path = ''): string {
  const normalizedPath = path.replace(/^\/+/, '');
  if (!normalizedPath) return normalizedBase;
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
