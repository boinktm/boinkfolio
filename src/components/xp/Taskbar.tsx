import { useEffect, useRef, useState } from 'react';
import { Disc3, HardDrive, Monitor, Settings, Volume2, VolumeX, X } from 'lucide-react';
import { activeWindow, titles } from '../../hooks/windowState';
import type { WindowId, WindowState, WindowAction } from '../../hooks/windowState';
import type { Dispatch } from 'react';
import { useAudioSFX } from '../../hooks/useAudioSFX';
export function Taskbar({ state, dispatch, open }: { state: WindowState; dispatch: Dispatch<WindowAction>; open: (id: WindowId) => void }) {
  const [menu, setMenu] = useState(false);
  const [clock, setClock] = useState(new Date());
  const root = useRef<HTMLDivElement>(null);
  const start = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const { engine, muted } = useAudioSFX();
  useEffect(() => { const timer = window.setInterval(() => setClock(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!menu) return;
    menuRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setMenu(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenu(false); start.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [menu]);
  return <div ref={root} className="taskbar-shell">
    {menu && <nav ref={menuRef} id="start-menu" className="start-menu" aria-label="Start menu" onKeyDown={event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
      const current = items.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      event.preventDefault(); items[next]?.focus();
    }}><div className="start-profile"><span className="avatar"><Disc3 /></span><span>Memory System<small>Personal archive</small></span></div><div className="start-links">{([{ id: 'memory', icon: HardDrive, label: 'Memory Card', detail: 'Browse saved projects' }, { id: 'player', icon: Disc3, label: 'Memory Player', detail: 'Original soundscapes' }, { id: 'settings', icon: Settings, label: 'System Configuration', detail: 'Display and sound' }] as const).map(item => <button key={item.id} onClick={() => { setMenu(false); open(item.id); }}><item.icon size={27} /><span>{item.label}<small>{item.detail}</small></span></button>)}</div><div className="start-bottom"><button onClick={() => { dispatch({ type: 'desktop' }); setMenu(false); start.current?.focus(); }}><Monitor size={17} />Show / restore desktop</button><button aria-label="Close Start menu" onClick={() => { setMenu(false); start.current?.focus(); }}><X size={17} /></button></div></nav>}
    <footer className="xp-taskbar"><button ref={start} className={`start-button ${menu ? 'pressed' : ''}`} aria-expanded={menu} aria-controls="start-menu" onClick={() => { setMenu(!menu); engine.play('open'); }}><span className="start-logo"><i /><i /><i /><i /></span>start</button>
      <button className="show-desktop" aria-label="Show or restore desktop" onClick={() => dispatch({ type: 'desktop' })}><Monitor size={18} /></button>
      <div className="task-buttons">{state.windows.map(entry => <button key={entry.id} aria-pressed={activeWindow(state) === entry.id} className={activeWindow(state) === entry.id ? 'pressed' : ''} onClick={() => { engine.play(entry.minimized ? 'open' : 'minimize'); dispatch({ type: 'task', id: entry.id }); }}><Disc3 size={16} /><span>{titles[entry.id]}</span></button>)}</div>
      <div className="system-tray"><button aria-label={muted ? 'Unmute all audio' : 'Mute all audio'} onClick={() => engine.setMuted(!muted)}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button><time dateTime={clock.toISOString()} title={clock.toLocaleDateString(undefined, { dateStyle: 'full' })}>{clock.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</time></div>
    </footer>
  </div>;
}
