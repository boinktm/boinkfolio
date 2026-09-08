import { invoke } from '@tauri-apps/api/core';
import type { PortfolioFile } from '../types';
import { isTauri } from './runtime';

export async function pickPortfolioFolder(): Promise<string | null> {
  if (!isTauri()) return null;
  const { open } = await import('@tauri-apps/plugin-dialog');
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select the Memory System portfolio folder',
  });
  return typeof selected === 'string' ? selected : null;
}

export async function writePortfolioFiles(root: string, files: readonly PortfolioFile[]): Promise<string[]> {
  return invoke<string[]>('write_portfolio_files', { root, files });
}

export async function readPortfolioFile(root: string, relativePath: string): Promise<string> {
  return invoke<string>('read_portfolio_file', { root, relativePath });
}

export async function listPortfolioMedia(root: string): Promise<string[]> {
  return invoke<string[]>('list_portfolio_media', { root });
}

export async function runPortfolioBuild(root: string): Promise<string> {
  return invoke<string>('run_portfolio_build', { root });
}

export async function resolvePortfolioRoot(): Promise<string> {
  return invoke<string>('resolve_portfolio_root');
}
