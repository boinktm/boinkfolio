import { mediaPublicUrl } from './paths';
import type { MediaKind } from '../types';

export function mediaMarkup(name: string, kind: MediaKind): string {
  const src = mediaPublicUrl(name);
  if (kind === 'video') return `<video src="${src}" controls></video>\n`;
  if (kind === 'image') {
    const alt = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    return `![${alt}](${src})\n`;
  }
  return `[${name}](${src})\n`;
}

export function insertText(source: string, snippet: string, start: number, end = start): { value: string; caret: number } {
  const from = Math.max(0, Math.min(start, source.length));
  const to = Math.max(from, Math.min(end, source.length));
  const prefix = from > 0 && source[from - 1] !== '\n' ? '\n' : '';
  const inserted = prefix + snippet;
  return { value: source.slice(0, from) + inserted + source.slice(to), caret: from + inserted.length };
}
