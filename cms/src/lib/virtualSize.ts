import type { MediaKind } from '../types';

const STEP = 32;
const BASE = 64;
const IMAGE_KB = 256;
const VIDEO_KB = 1024;
const OTHER_KB = 128;
const CHARS_PER_KB = 50;
const MIN = 32;
const MAX = 4096;

export function mediaKind(mime: string, name = ''): MediaKind {
  if (mime.startsWith('video/') || /\.(mp4|webm|ogv|mov)$/i.test(name)) return 'video';
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name)) return 'image';
  return 'other';
}

export function virtualSizeKB(markdown: string, media: readonly { kind: MediaKind }[]): number {
  const text = Math.ceil(markdown.length / CHARS_PER_KB);
  const assets = media.reduce((sum, item) => {
    if (item.kind === 'video') return sum + VIDEO_KB;
    if (item.kind === 'image') return sum + IMAGE_KB;
    return sum + OTHER_KB;
  }, 0);
  const rounded = Math.ceil((BASE + text + assets) / STEP) * STEP;
  return Math.min(MAX, Math.max(MIN, rounded));
}
