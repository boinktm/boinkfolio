import { marked } from 'marked';
import { useEffect, useMemo, useRef, useState } from 'react';
import { TokenPanel } from './components/GitSettings';
import { SaveEditor } from './components/SaveEditor';
import { listPortfolioMedia, readPortfolioFile, resolvePortfolioRoot, writePortfolioFiles } from './lib/desktop';
import { draftFromSave, emptyDraft } from './lib/draft';
import { fileToBase64 } from './lib/encoding';
import { fallbackProjects } from './lib/fallback';
import { createOctokit, fetchMediaNames, fetchPost, fetchRegistry, githubMessage, commitFiles } from './lib/github';
import { insertText, mediaMarkup } from './lib/markup';
import { postPath, publicContentFile, registryPath } from './lib/paths';
import { buildCommitFiles, mergeById, parseRegistry, removeSave, upsertSave } from './lib/registry';
import { apiFetch, isTauri } from './lib/runtime';
import { defaultSettings, loadSettings, saveSettings } from './lib/settings';
import { SITE_URL } from './lib/site';
import { safeFileName, uniqueSlug } from './lib/slug';
import { mediaKind, virtualSizeKB } from './lib/virtualSize';
import type { Draft, GitSettings, ProjectSaveFile, StagedMedia } from './types';
import './styles.css';

type Tab = 'new' | 'edit' | 'token';
type Status = { kind: 'info' | 'ok' | 'error'; text: string };

const MAX_BYTES = 90 * 1024 * 1024;
marked.setOptions({ gfm: true, breaks: true });
const number = new Intl.NumberFormat('en-US');

export default function App() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<Tab>('new');
  const [settings, setSettings] = useState<GitSettings>(defaultSettings);
  const [registry, setRegistry] = useState<ProjectSaveFile[]>(fallbackProjects);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [staged, setStaged] = useState<StagedMedia[]>([]);
  const [remoteMedia, setRemoteMedia] = useState<string[]>([]);
  const [localMedia, setLocalMedia] = useState<string[]>([]);
  const [deletions, setDeletions] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status | null>({
    kind: 'info',
    text: 'Name the project, write the article, drop images, then Publish.',
  });

  const previewHtml = useMemo(() => marked.parse(draft.markdown, { async: false }) as string, [draft.markdown]);
  const usedSlugs = registry.filter(item => item.id !== draft.save.id).map(item => item.slug);

  useEffect(() => {
    void (async () => {
      const loaded = await loadSettings();
      let next = loaded;
      if (isTauri() && !next.localRoot) {
        try {
          next = { ...next, localRoot: await resolvePortfolioRoot() };
          await saveSettings(next);
        } catch {
          /* Publish can still go to GitHub. */
        }
      }
      setSettings(next);
      if (!next.token.trim()) {
        setTab('token');
        setStatus({ kind: 'info', text: 'Paste your GitHub token once. After that, fill in a project and click Publish.' });
        return;
      }
      await refreshFromGithub(next);
    })();
  }, []);

  async function refreshFromGithub(current: GitSettings) {
    try {
      const github = createOctokit(current.token.trim(), apiFetch);
      const [remote, media] = await Promise.all([fetchRegistry(github, current), fetchMediaNames(github, current)]);
      setRegistry(remote.length ? remote : fallbackProjects);
      setRemoteMedia(media);
      if (isTauri() && current.localRoot) {
        try {
          const raw = await readPortfolioFile(current.localRoot, registryPath());
          const local = parseRegistry(JSON.parse(raw));
          if (!remote.length && local.length) setRegistry(local);
          setLocalMedia(await listPortfolioMedia(current.localRoot));
        } catch {
          /* GitHub is the source of truth. */
        }
      }
    } catch (error) {
      setStatus({ kind: 'error', text: githubMessage(error) });
    }
  }

  function patchSave(patch: Partial<Draft['save']> & { overrideSize?: boolean; slugTouched?: boolean }) {
    const { overrideSize, slugTouched, ...save } = patch;
    setDraft(current => ({
      ...current,
      overrideSize: overrideSize ?? current.overrideSize,
      slugTouched: slugTouched ?? current.slugTouched,
      save: { ...current.save, ...save },
    }));
  }

  function onTitle(title: string) {
    setDraft(current => {
      const slug = current.slugTouched ? current.save.slug : uniqueSlug(title, usedSlugs, current.save.id || undefined);
      return { ...current, save: { ...current.save, title, slug, id: current.save.id || slug } };
    });
  }

  function finishedSave(): ProjectSaveFile {
    const slug = uniqueSlug(draft.slugTouched ? draft.save.slug || draft.save.title : draft.save.title, usedSlugs, draft.save.id || undefined);
    return {
      ...draft.save,
      id: draft.save.id || slug,
      slug,
      title: draft.save.title.trim(),
      summary: draft.save.summary.trim(),
      sizeKB: draft.overrideSize ? Math.max(32, Number(draft.save.sizeKB) || 32) : virtualSizeKB(draft.markdown, staged),
      contentFile: publicContentFile(slug),
    };
  }

  async function stageFiles(list: FileList | File[]) {
    const used = [...staged.map(item => item.name), ...remoteMedia, ...localMedia];
    const next: StagedMedia[] = [];
    let markdown = draft.markdown;
    let caret = textareaRef.current?.selectionStart ?? markdown.length;
    for (const file of Array.from(list)) {
      if (file.size > MAX_BYTES) {
        setStatus({ kind: 'error', text: `${file.name} is larger than 90 MB.` });
        continue;
      }
      const kind = mediaKind(file.type, file.name);
      const name = safeFileName(file.name, [...used, ...next.map(item => item.name)]);
      const { contentBase64, byteLength } = await fileToBase64(file);
      next.push({ name, mime: file.type || 'application/octet-stream', kind, contentBase64, byteLength });
      const inserted = insertText(markdown, mediaMarkup(name, kind), caret);
      markdown = inserted.value;
      caret = inserted.caret;
    }
    if (!next.length) return;
    setStaged(current => [...current, ...next]);
    setDraft(current => ({ ...current, markdown }));
    if (tab === 'token') setTab(draft.save.id && registry.some(item => item.id === draft.save.id) ? 'edit' : 'new');
  }

  async function openSave(save: ProjectSaveFile) {
    setBusy(true);
    try {
      let markdown = '# Project Breakdown\n\n';
      if (isTauri() && settings.localRoot && save.slug) {
        try { markdown = await readPortfolioFile(settings.localRoot, postPath(save.slug)); } catch { /* keep template */ }
      }
      if (settings.token) {
        try {
          const github = createOctokit(settings.token.trim(), apiFetch);
          const remote = await fetchPost(github, settings, save.slug);
          if (remote) markdown = remote;
        } catch { /* keep local or template */ }
      }
      setDraft(draftFromSave(save, markdown));
      setTab('edit');
    } catch (error) {
      setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Could not open that project.' });
    } finally { setBusy(false); }
  }

  async function persistToken() {
    const next = { ...settings, token: settings.token.trim() };
    await saveSettings(next);
    setSettings(next);
    if (!next.token) {
      setStatus({ kind: 'error', text: 'Paste your GitHub token first.' });
      return;
    }
    setTab('new');
    setStatus({ kind: 'ok', text: 'Token saved on this computer. You can Publish now.' });
    await refreshFromGithub(next);
  }

  async function publish() {
    if (!settings.token.trim()) {
      setTab('token');
      setStatus({ kind: 'error', text: 'Paste your GitHub token first.' });
      return;
    }
    const save = finishedSave();
    if (!save.title) {
      setStatus({ kind: 'error', text: 'Give the project a name first.' });
      return;
    }
    setBusy(true);
    setStatus({ kind: 'info', text: 'Publishing…' });
    try {
      let localRoot = settings.localRoot;
      if (isTauri() && !localRoot) {
        try {
          localRoot = await resolvePortfolioRoot();
          const next = { ...settings, localRoot };
          setSettings(next);
          await saveSettings(next);
        } catch {
          localRoot = '';
        }
      }
      const github = createOctokit(settings.token.trim(), apiFetch);
      const remote = await fetchRegistry(github, settings);
      const merged = upsertSave(mergeById(remote, registry), save);
      const files = buildCommitFiles({
        registry: merged,
        slug: save.slug,
        markdown: draft.markdown,
        media: staged,
        deletions,
      });
      if (isTauri() && localRoot) {
        try {
          await writePortfolioFiles(localRoot, files);
          setLocalMedia(await listPortfolioMedia(localRoot).catch(() => []));
        } catch {
          /* Live site still publishes through GitHub. */
        }
      }
      await commitFiles(github, settings, files, `Publish ${save.title}`);
      setRegistry(merged);
      setDraft(current => ({ ...current, save }));
      setStaged([]);
      setDeletions([]);
      setRemoteMedia(await fetchMediaNames(github, settings).catch(() => []));
      setStatus({ kind: 'ok', text: `Live in about a minute: ${SITE_URL}` });
    } catch (error) {
      setStatus({ kind: 'error', text: githubMessage(error) });
    } finally { setBusy(false); }
  }

  const used = registry.reduce((sum, item) => sum + item.sizeKB, 0);
  const needsToken = !settings.token.trim() || tab === 'token';

  return <div className="studio">
    <header className="chrome">
      <div className="wordmark"><span>MEMORY CARD MANAGER</span><small>Add a project, then Publish.</small></div>
      <div className="chrome-meta">
        <span className="capacity">{number.format(used)} / 8,192 KB</span>
        {settings.token.trim() ? <button type="button" className="token-btn" onClick={() => setTab('token')}>Change GitHub token</button> : null}
      </div>
    </header>
    <nav className="toolbar" aria-label="Studio sections">
      <button type="button" className={tab === 'new' ? 'active' : ''} onClick={() => { setDraft(emptyDraft()); setTab('new'); }}>New project</button>
      <button type="button" className={tab === 'edit' ? 'active' : ''} onClick={() => setTab('edit')}>Edit project</button>
    </nav>
    <div className="workspace">
      {needsToken && <TokenPanel
        settings={settings}
        busy={busy}
        onChange={patch => setSettings(current => ({ ...current, ...patch }))}
        onSave={() => void persistToken()}
      />}
      {!needsToken && tab === 'edit' && <aside className="save-list">
        <span className="eyebrow">SLOT 1 / REGISTRY</span>
        {registry.map(item => <button key={item.id} type="button" className={item.id === draft.save.id ? 'selected' : ''} onClick={() => void openSave(item)}>
          <strong>{item.title}</strong>
          <small>{item.category} · {number.format(item.sizeKB)} KB</small>
        </button>)}
        <button type="button" className="danger" disabled={!draft.save.id || busy} onClick={() => {
          if (!draft.save.id) return;
          setRegistry(removeSave(registry, draft.save.id));
          setDraft(emptyDraft());
          setStatus({ kind: 'info', text: 'Removed here. Click Publish to update the live site.' });
        }}>Remove from registry</button>
      </aside>}
      {!needsToken && (tab === 'new' || tab === 'edit') && <SaveEditor
        draft={draft}
        previewHtml={previewHtml}
        textareaRef={textareaRef}
        dragging={dragging}
        onTitle={onTitle}
        onField={patchSave}
        onMarkdown={markdown => setDraft(current => ({ ...current, markdown }))}
        onFiles={files => void stageFiles(files)}
        onDrag={setDragging}
      />}
    </div>
    {status && <p className={`status ${status.kind}`} role={status.kind === 'error' ? 'alert' : 'status'}>{status.text}</p>}
    <footer className="actions">
      <button type="button" className="push" disabled={busy} onClick={() => void publish()}>Publish</button>
    </footer>
  </div>;
}
