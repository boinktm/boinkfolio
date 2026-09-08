import type { PortfolioFile, ProjectSaveFile, StagedMedia } from '../types';
import { textToBase64 } from './encoding';
import { mediaPath, postPath, registryPath } from './paths';

export function upsertSave(list: readonly ProjectSaveFile[], save: ProjectSaveFile): ProjectSaveFile[] {
  const index = list.findIndex(item => item.id === save.id);
  if (index === -1) return [...list, save];
  return list.map((item, current) => current === index ? save : item);
}

export function mergeById(remote: readonly ProjectSaveFile[], local: readonly ProjectSaveFile[]): ProjectSaveFile[] {
  const map = new Map<string, ProjectSaveFile>();
  for (const item of remote) map.set(item.id, item);
  for (const item of local) map.set(item.id, item);
  return [...map.values()];
}

export function removeSave(list: readonly ProjectSaveFile[], id: string): ProjectSaveFile[] {
  return list.filter(item => item.id !== id);
}

export function isProjectSave(value: unknown): value is ProjectSaveFile {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.slug === 'string'
    && typeof item.sizeKB === 'number' && typeof item.category === 'string' && Array.isArray(item.tags);
}

export function parseRegistry(value: unknown): ProjectSaveFile[] {
  return Array.isArray(value) ? value.filter(isProjectSave) : [];
}

export function buildCommitFiles(options: {
  registry: readonly ProjectSaveFile[];
  slug: string;
  markdown: string;
  media: readonly StagedMedia[];
  deletions?: readonly string[];
}): PortfolioFile[] {
  const files: PortfolioFile[] = [
    { relativePath: registryPath(), contentBase64: textToBase64(`${JSON.stringify(options.registry, null, 2)}\n`) },
    { relativePath: postPath(options.slug), contentBase64: textToBase64(options.markdown) },
    ...options.media.map(item => ({ relativePath: mediaPath(item.name), contentBase64: item.contentBase64 })),
    ...(options.deletions ?? []).map(name => ({ relativePath: mediaPath(name), delete: true })),
  ];
  return files;
}
