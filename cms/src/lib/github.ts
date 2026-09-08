import { Octokit } from '@octokit/rest';
import type { GitSettings, PortfolioFile, ProjectSaveFile } from '../types';
import { postPath, registryPath } from './paths';
import { parseRegistry } from './registry';
import { parseRepo } from './repo';

export function createOctokit(token: string, fetchImpl: typeof fetch): Octokit {
  return new Octokit({
    auth: token,
    userAgent: 'memory-card-manager',
    request: { fetch: fetchImpl },
  });
}

function isNotFound(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404);
}

export function githubMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    if (status === 401) return 'GitHub rejected the token. Use a Personal Access Token with repo scope.';
    if (status === 403) return 'GitHub refused the request. Edit your token for boinktm/boinkfolio and set Contents to Read and write. If Publish still fails, also set Workflows to Read and write.';
    if (status === 404) return 'Could not reach boinktm/boinkfolio. Check that the token can access that GitHub repo.';
    if (status === 409) return 'GitHub reported a conflict. Reload from GitHub and try again.';
    if (status === 422) return 'GitHub could not apply the tree. Check file paths and that the branch exists.';
  }
  return error instanceof Error ? error.message : 'GitHub request failed.';
}

function wrap(error: unknown): Error {
  return new Error(githubMessage(error));
}

function decodeContent(content: string): string {
  return new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\n/g, '')), ch => ch.charCodeAt(0)));
}

export async function fetchRegistry(octokit: Octokit, settings: GitSettings): Promise<ProjectSaveFile[]> {
  const { owner, repo } = parseRepo(settings.repository);
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: registryPath(), ref: settings.branch });
    if (Array.isArray(data) || !('content' in data) || !data.content) return [];
    return parseRegistry(JSON.parse(decodeContent(data.content)));
  } catch (error) {
    if (isNotFound(error)) return [];
    throw wrap(error);
  }
}

export async function fetchPost(octokit: Octokit, settings: GitSettings, slug: string): Promise<string> {
  const { owner, repo } = parseRepo(settings.repository);
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: postPath(slug), ref: settings.branch });
    if (Array.isArray(data) || !('content' in data) || !data.content) return '';
    return decodeContent(data.content);
  } catch (error) {
    if (isNotFound(error)) return '';
    throw wrap(error);
  }
}

export async function fetchMediaNames(octokit: Octokit, settings: GitSettings): Promise<string[]> {
  const { owner, repo } = parseRepo(settings.repository);
  try {
    const { data } = await octokit.repos.getContent({ owner, repo, path: 'public/content/media', ref: settings.branch });
    if (!Array.isArray(data)) return [];
    return data.filter(item => item.type === 'file' && item.name).map(item => item.name);
  } catch (error) {
    if (isNotFound(error)) return [];
    throw wrap(error);
  }
}

export async function commitFiles(
  octokit: Octokit,
  settings: GitSettings,
  files: readonly PortfolioFile[],
  message: string,
): Promise<string> {
  if (!files.length) throw new Error('Nothing to commit.');
  const { owner, repo } = parseRepo(settings.repository);
  const branch = settings.branch || 'main';
  try {
    const { data: ref } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    const parent = ref.object.sha;
    const { data: commit } = await octokit.git.getCommit({ owner, repo, commit_sha: parent });
    const additions = files.filter(file => !file.delete && file.contentBase64);
    const blobs = await Promise.all(additions.map(async file => {
      const { data } = await octokit.git.createBlob({
        owner,
        repo,
        content: file.contentBase64 ?? '',
        encoding: 'base64',
      });
      return { path: file.relativePath, mode: '100644' as const, type: 'blob' as const, sha: data.sha };
    }));
    const deletions = files.filter(file => file.delete).map(file => ({
      path: file.relativePath,
      mode: '100644' as const,
      type: 'blob' as const,
      sha: null,
    }));
    const { data: tree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: commit.tree.sha,
      tree: [...blobs, ...deletions],
    });
    const { data: next } = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: tree.sha,
      parents: [parent],
    });
    await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: next.sha });
    return next.sha;
  } catch (error) {
    throw wrap(error);
  }
}

export function commitUrl(settings: GitSettings, sha: string): string {
  const { owner, repo } = parseRepo(settings.repository);
  return `https://github.com/${owner}/${repo}/commit/${sha}`;
}
