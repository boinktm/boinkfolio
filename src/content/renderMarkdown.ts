export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] ?? ch));
}

const SAFE_MEDIA = /^\/content\/media\/[A-Za-z0-9._-]+$/;

export function withBaseUrl(absolutePath: string, base = import.meta.env.BASE_URL): string {
  const trimmed = absolutePath.replace(/^\//, '');
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${trimmed}`;
}

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/!\[([^\]]*)\]\((\/content\/media\/[A-Za-z0-9._-]+)\)/g, (_match, alt: string, src: string) => (
      `<img alt="${alt}" src="${withBaseUrl(src)}" />`
    ))
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

export function renderMarkdown(markdown: string): string {
  const html: string[] = [];
  let buffer: string[] = [];
  const flush = () => {
    if (!buffer.length) return;
    html.push(`<p>${inline(buffer.join(' '))}</p>`);
    buffer = [];
  };
  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    const video = /^<video\s+src="(\/content\/media\/[A-Za-z0-9._-]+)"(?:\s+controls)?\s*><\/video>\s*$/i.exec(line);
    if (video?.[1] && SAFE_MEDIA.test(video[1])) {
      flush();
      html.push(`<video src="${withBaseUrl(video[1])}" controls></video>`);
      continue;
    }
    if (line.startsWith('# ')) { flush(); html.push(`<h1>${inline(line.slice(2))}</h1>`); continue; }
    if (line.startsWith('## ')) { flush(); html.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    if (line.startsWith('### ')) { flush(); html.push(`<h3>${inline(line.slice(4))}</h3>`); continue; }
    if (line.trim() === '') { flush(); continue; }
    buffer.push(line);
  }
  flush();
  return html.join('');
}
