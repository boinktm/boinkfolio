import type { ProjectSaveFile } from '../types/content';

export const fallbackProjects: ProjectSaveFile[] = [
  { id: 'seven-towers', slug: 'seven-towers', title: 'Seven Towers', category: '3D Art', sizeKB: 1024, releaseDate: '2026-09-07', iconModel: 'crystal', iconColor: '#91dbff', summary: 'Seven translucent monoliths, illuminated cores, and a slowly drifting camera in a deep blue void. Built with React Three Fiber and physical materials.', tags: ['Three.js', 'Materials', 'Environment'], contentFile: '' },
  { id: 'ocean-fog', slug: 'ocean-fog', title: 'Ocean Fog', category: '3D Art', sizeKB: 384, releaseDate: '2026-09-07', iconModel: 'cube', iconColor: '#98b7ff', summary: 'A procedural ocean of fog combining three noise layers, gentle vertex displacement, and distance haze. Motion respects the operating system’s accessibility preference.', tags: ['GLSL', 'Procedural', 'Shaders'], contentFile: '' },
  { id: 'sound-system', slug: 'sound-system', title: 'Sound System', category: 'Audio', sizeKB: 768, releaseDate: '2026-09-07', iconModel: 'disc', iconColor: '#c2a1f7', summary: 'An original synthesized ambient chord, resonant filter movement, and spatial interface chimes. Gesture unlock, voice limits, and tab suspension keep playback predictable.', tags: ['Web Audio', 'Synthesis', 'Spatial'], contentFile: '' },
  { id: 'luna-desktop', slug: 'luna-desktop', title: 'Luna Desktop', category: 'Web', sizeKB: 512, releaseDate: '2026-09-08', iconModel: 'custom', iconColor: '#92e3c1', summary: 'A windowed desktop with draggable and resizable frames, a memory-card browser, and a docked taskbar. Keyboard window movement and responsive bounds keep every control within reach.', tags: ['React', 'TypeScript', 'Interface'], contentFile: '' },
];

export const projects = fallbackProjects;

function isProject(value: unknown): value is ProjectSaveFile {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.slug === 'string'
    && typeof item.sizeKB === 'number' && Array.isArray(item.tags);
}

export async function loadProjects(): Promise<ProjectSaveFile[]> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}content/projects.json`);
    if (!response.ok) return fallbackProjects;
    const data: unknown = await response.json();
    if (!Array.isArray(data) || !data.every(isProject)) return fallbackProjects;
    return data;
  } catch {
    return fallbackProjects;
  }
}

export function storageStats(entries: readonly Pick<ProjectSaveFile, 'sizeKB'>[], capacity = 8192) {
  const used = entries.reduce((sum, entry) => sum + (Number.isFinite(entry.sizeKB) ? Math.max(0, entry.sizeKB) : 0), 0);
  return { capacity, used, free: Math.max(0, capacity - used), overflow: Math.max(0, used - capacity), percent: Math.min(100, used / capacity * 100) };
}
