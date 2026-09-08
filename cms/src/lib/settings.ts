import type { GitSettings } from '../types';
import { isTauri } from './runtime';
import { SITE_BRANCH, SITE_REPO } from './site';

const KEY = 'memory-card-manager-settings';

export function defaultSettings(): GitSettings {
  return { token: '', repository: SITE_REPO, branch: SITE_BRANCH, localRoot: '' };
}

export function withSiteDefaults(settings: Partial<GitSettings> | null | undefined): GitSettings {
  return {
    ...defaultSettings(),
    ...settings,
    repository: SITE_REPO,
    branch: SITE_BRANCH,
  };
}

export async function loadSettings(): Promise<GitSettings> {
  if (isTauri()) {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load('manager.json');
    const saved = await store.get<Partial<GitSettings>>('git');
    return withSiteDefaults(saved);
  }
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? withSiteDefaults(JSON.parse(raw) as GitSettings) : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export async function saveSettings(settings: GitSettings): Promise<void> {
  const next = withSiteDefaults(settings);
  if (isTauri()) {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load('manager.json');
    await store.set('git', next);
    await store.save();
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(next));
}
