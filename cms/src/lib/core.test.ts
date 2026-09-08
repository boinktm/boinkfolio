import { describe, expect, it } from 'vitest';
import { bytesToBase64, textToBase64 } from './encoding';
import { insertText, mediaMarkup } from './markup';
import { mediaPath, postPath, publicContentFile, registryPath } from './paths';
import { buildCommitFiles, mergeById, parseRegistry, upsertSave } from './registry';
import { parseRepo } from './repo';
import { withSiteDefaults } from './settings';
import { SITE_BRANCH, SITE_REPO, SITE_URL } from './site';
import { safeFileName, slugify, uniqueSlug } from './slug';
import { mediaKind, virtualSizeKB } from './virtualSize';

describe('slug helpers', () => {
  it('slugifies titles and keeps unique ids', () => {
    expect(slugify('The Viaduct Custom Map')).toBe('the-viaduct-custom-map');
    expect(uniqueSlug('Seven Towers', ['seven-towers'])).toBe('seven-towers-2');
    expect(uniqueSlug('Seven Towers', ['seven-towers'], 'seven-towers')).toBe('seven-towers');
    expect(safeFileName('Wire Frame.PNG', ['wire-frame.png'])).toBe('wire-frame-2.png');
  });
});

describe('virtual size', () => {
  it('charges markdown, images, and video in 32 KB steps', () => {
    expect(virtualSizeKB('', [])).toBe(64);
    expect(virtualSizeKB('x'.repeat(50), [])).toBe(96);
    expect(virtualSizeKB('', [{ kind: 'image' }])).toBe(320);
    expect(virtualSizeKB('', [{ kind: 'video' }, { kind: 'image' }])).toBe(1344);
    expect(mediaKind('video/mp4', 'clip.mp4')).toBe('video');
  });
});

describe('markup and paths', () => {
  it('inserts CRT-ready media tags and commit paths', () => {
    expect(mediaMarkup('showcase.mp4', 'video')).toBe('<video src="/content/media/showcase.mp4" controls></video>\n');
    expect(mediaMarkup('wireframe.webp', 'image')).toBe('![wireframe](/content/media/wireframe.webp)\n');
    expect(insertText('Hello', 'world', 5).value).toBe('Hello\nworld');
    expect(registryPath()).toBe('public/content/projects.json');
    expect(postPath('the-viaduct-custom-map')).toBe('public/content/posts/the-viaduct-custom-map.md');
    expect(mediaPath('showcase.mp4')).toBe('public/content/media/showcase.mp4');
    expect(publicContentFile('the-viaduct-custom-map')).toBe('content/posts/the-viaduct-custom-map.md');
  });
});

describe('registry', () => {
  const sample = { id: 'a', slug: 'a', title: 'A', category: 'Web' as const, sizeKB: 128, releaseDate: '2026-09-07', iconModel: 'cube' as const, iconColor: '#00aaff', summary: '', tags: [], contentFile: 'content/posts/a.md' };

  it('upserts, merges remote + local, and builds a Git tree payload', () => {
    expect(upsertSave([], sample)).toHaveLength(1);
    expect(upsertSave([sample], { ...sample, title: 'B' })[0]?.title).toBe('B');
    expect(mergeById([sample], [{ ...sample, id: 'b', slug: 'b', title: 'Local' }])).toHaveLength(2);
    expect(parseRegistry([{ ...sample }, { nope: true }])).toEqual([sample]);
    const files = buildCommitFiles({ registry: [sample], slug: 'a', markdown: '# Hi', media: [], deletions: ['old.webp'] });
    expect(files.map(file => file.relativePath)).toEqual([
      'public/content/projects.json',
      'public/content/posts/a.md',
      'public/content/media/old.webp',
    ]);
    expect(files[2]?.delete).toBe(true);
  });
});

describe('repo parsing and encoding', () => {
  it('accepts owner/repo URLs and encodes UTF-8 as base64', () => {
    expect(parseRepo('https://github.com/acme/memory-card.git')).toEqual({ owner: 'acme', repo: 'memory-card' });
    expect(() => parseRepo('just-a-name')).toThrow(/owner\/repo-name/);
    expect(textToBase64('Memory System')).toBe(bytesToBase64(new TextEncoder().encode('Memory System')));
  });
});

describe('site defaults', () => {
  it('locks publishing to boinktm/boinkfolio on main', () => {
    expect(SITE_REPO).toBe('boinktm/boinkfolio');
    expect(SITE_BRANCH).toBe('main');
    expect(SITE_URL).toBe('https://boinktm.github.io/boinkfolio/');
    expect(withSiteDefaults({ token: 'ghp_test', repository: 'someone/else', branch: 'dev', localRoot: 'C:\\site' })).toEqual({
      token: 'ghp_test',
      repository: 'boinktm/boinkfolio',
      branch: 'main',
      localRoot: 'C:\\site',
    });
  });
});
