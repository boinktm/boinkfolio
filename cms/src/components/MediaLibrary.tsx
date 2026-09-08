export function MediaLibrary({
  staged,
  remote,
  local,
  pendingDeletes,
  onInsert,
  onRemoveStaged,
  onToggleDelete,
}: {
  staged: readonly { name: string; kind: string; byteLength: number }[];
  remote: readonly string[];
  local: readonly string[];
  pendingDeletes: readonly string[];
  onInsert: (name: string, kind?: 'image' | 'video' | 'other') => void;
  onRemoveStaged: (name: string) => void;
  onToggleDelete: (name: string) => void;
}) {
  return <section className="library">
    <span className="eyebrow">MEDIA LIBRARY</span>
    <h3>Staged and committed assets.</h3>
    <p>Dropped files wait here until you push. Insert places a tag at the article cursor. Remote deletes land in the next GitHub commit.</p>
    <h4>Staged for next push</h4>
    {!staged.length && <p className="empty">No staged media. Drop files on an article to queue them.</p>}
    <ul>{staged.map(item => <li key={item.name}><span>{item.name}</span><small>{item.kind} · {Math.max(1, Math.ceil(item.byteLength / 1024))} KB</small><button type="button" onClick={() => onInsert(item.name, item.kind as 'image' | 'video' | 'other')}>Insert</button><button type="button" onClick={() => onRemoveStaged(item.name)}>Remove</button></li>)}</ul>
    <h4>On disk</h4>
    {!local.length && <p className="empty">Set a local portfolio folder to list public/content/media.</p>}
    <ul>{local.map(name => <li key={`local-${name}`}><span>{name}</span><button type="button" onClick={() => onInsert(name)}>Insert</button></li>)}</ul>
    <h4>On GitHub</h4>
    {!remote.length && <p className="empty">Load from GitHub to list committed media.</p>}
    <ul>{remote.map(name => <li key={`remote-${name}`}><span>{name}</span><button type="button" onClick={() => onInsert(name)}>Insert</button><button type="button" onClick={() => onToggleDelete(name)}>{pendingDeletes.includes(name) ? 'Keep' : 'Delete on push'}</button></li>)}</ul>
  </section>;
}
