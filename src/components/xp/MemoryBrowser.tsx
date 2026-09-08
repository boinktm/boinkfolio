import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowLeft, HardDrive, Info } from 'lucide-react';
import { storageStats } from '../../data/projects';
import { renderMarkdown } from '../../content/renderMarkdown';
import { useAudioSFX } from '../../hooks/useAudioSFX';
import type { ProjectSaveFile } from '../../types/content';
const SaveIcon = lazy(() => import('../3d/SaveIcon'));
const number = new Intl.NumberFormat('en-US');
export function MemoryBrowser({ projects, animate, visible, onOpen }: { projects: readonly ProjectSaveFile[]; animate: boolean; visible: boolean; onOpen: (project: ProjectSaveFile) => void }) {
  const { engine } = useAudioSFX();
  const [selected, setSelected] = useState(projects[0]?.id);
  const [hovered, setHovered] = useState<string | null>(null);
  const [category, setCategory] = useState('All saves');
  useEffect(() => {
    if (!projects.some(project => project.id === selected)) setSelected(projects[0]?.id);
  }, [projects, selected]);
  const stats = storageStats(projects);
  const filtered = projects.filter(project => category === 'All saves' || project.category === category);
  const current = projects.find(project => project.id === selected);
  return <div className="memory-browser">
    <div className="browser-toolbar"><button onClick={() => { setCategory('All saves'); setSelected(projects[0]?.id); }} aria-label="Show all saves"><ArrowLeft size={17} />All saves</button><span className="address"><HardDrive size={15} />Memory Card / Slot 1</span><span className="capacity-chip">8 MB</span></div>
    <div className="memory-layout"><aside className="memory-sidebar"><span className="sidebar-label">MEMORY CARD</span><HardDrive size={42} strokeWidth={1} /><h3>Slot 1</h3><span>PlayStation 2 format</span><hr /><span className="sidebar-label">BROWSE SAVES</span>{['All saves', '3D Art', 'Audio', 'Web', 'GameDev'].map(item => <button key={item} className={category === item ? 'selected' : ''} onClick={() => { setCategory(item); engine.play('navigate'); }}>{item}<span>{item === 'All saves' ? projects.length : projects.filter(project => project.category === item).length}</span></button>)}<div className="card-note"><Info size={14} />{projects.some(project => project.contentFile) ? 'Memory Card Manager registry' : 'Bundled system saves'}</div></aside>
      <div className="memory-main"><div className="memory-heading"><div><span className="eyebrow">BROWSER / 01</span><h3>{category === 'All saves' ? 'Your saved worlds.' : category}</h3></div><span>{filtered.length} {filtered.length === 1 ? 'SAVE' : 'SAVES'}</span></div>
        <div className="save-grid" aria-label="Project saves">{filtered.map(project => <button key={project.id} className={`save-card ${selected === project.id ? 'selected' : ''}`} aria-pressed={selected === project.id}
          onPointerEnter={() => { setHovered(project.id); engine.play('navigate'); }} onPointerLeave={() => setHovered(null)} onFocus={() => { setSelected(project.id); engine.play('navigate'); }}
          onClick={() => { setSelected(project.id); onOpen(project); }}>
          {visible ? <Suspense fallback={<div className="save-icon" />}><SaveIcon model={project.iconModel} color={project.iconColor} active={selected === project.id || hovered === project.id} animate={animate} /></Suspense> : <div className="save-icon" />}
          <span className="save-title">{project.title}</span><span className="save-category">{project.category}</span><span className="save-size">{number.format(project.sizeKB)} KB</span>
        </button>)}</div>
        {!filtered.length && <p className="empty-saves">No saves in this category.</p>}
        <div className="save-hint"><span className="controller-cross">×</span> Open save information <span className="current-save">{current?.title}</span></div>
      </div>
    </div>
    <div className="storage-footer"><div><span>{number.format(stats.capacity)} KB TOTAL</span><strong>{number.format(stats.free)} KB free</strong></div><progress aria-label="Memory card space used" max={stats.capacity} value={Math.min(stats.used, stats.capacity)} /><span>{number.format(stats.used)} KB used · {projects.length} saves{stats.overflow > 0 ? ` · ${number.format(stats.overflow)} KB over capacity` : ''}</span></div>
  </div>;
}

export function SaveInformation({ project }: { project: ProjectSaveFile | null }) {
  const [article, setArticle] = useState('');
  useEffect(() => {
    if (!project?.contentFile) { setArticle(''); return; }
    const url = `${import.meta.env.BASE_URL}${project.contentFile.replace(/^\//, '')}`;
    let cancelled = false;
    fetch(url).then(response => response.ok ? response.text() : '').then(text => { if (!cancelled) setArticle(text); }).catch(() => { if (!cancelled) setArticle(''); });
    return () => { cancelled = true; };
  }, [project]);
  if (!project) return <p className="save-information">Select a save in the memory card browser.</p>;
  return <article className="save-information"><span className="eyebrow">{project.category} / SYSTEM SAVE</span><h2>{project.title}</h2><p>{project.summary}</p><div className="tag-list">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div><dl><div><dt>Virtual size</dt><dd>{number.format(project.sizeKB)} KB</dd></div><div><dt>Saved</dt><dd>{project.releaseDate}</dd></div><div><dt>Icon</dt><dd>{project.iconModel}</dd></div></dl>{article && <div className="save-article" dangerouslySetInnerHTML={{ __html: renderMarkdown(article) }} />}</article>;
}
