export function slugify(value: string): string {
  const slug = value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || 'save';
}

export function uniqueSlug(base: string, used: readonly string[], currentId?: string): string {
  const root = slugify(base);
  if (!used.includes(root) || root === currentId) return root;
  let index = 2;
  while (used.includes(`${root}-${index}`)) index += 1;
  return `${root}-${index}`;
}

export function safeFileName(name: string, used: readonly string[] = []): string {
  const trimmed = name.trim();
  const dot = trimmed.lastIndexOf('.');
  const rawBase = (dot === -1 ? trimmed : trimmed.slice(0, dot)).toLowerCase();
  const ext = (dot === -1 ? '' : trimmed.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 8);
  const base = slugify(rawBase) || 'asset';
  const candidate = ext ? `${base}.${ext}` : base;
  if (!used.includes(candidate)) return candidate;
  let index = 2;
  while (used.includes(ext ? `${base}-${index}.${ext}` : `${base}-${index}`)) index += 1;
  return ext ? `${base}-${index}.${ext}` : `${base}-${index}`;
}
