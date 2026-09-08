export function parseRepo(value: string): { owner: string; repo: string } {
  const cleaned = value.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/, '').replace(/^\/+|\/+$/g, '');
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error('Repository must be owner/repo-name.');
  return { owner: parts[0], repo: parts[1] };
}
