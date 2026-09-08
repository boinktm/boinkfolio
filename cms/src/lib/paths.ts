export const CONTENT_ROOT = 'public/content';

export function registryPath(): string {
  return `${CONTENT_ROOT}/projects.json`;
}

export function postPath(slug: string): string {
  return `${CONTENT_ROOT}/posts/${slug}.md`;
}

export function mediaPath(name: string): string {
  return `${CONTENT_ROOT}/media/${name}`;
}

export function publicContentFile(slug: string): string {
  return `content/posts/${slug}.md`;
}

export function mediaPublicUrl(name: string): string {
  return `/content/media/${name}`;
}
