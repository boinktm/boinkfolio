import { lazy, Suspense, useEffect, useState } from 'react';
import { Disc3, HardDrive, Settings, Volume2 } from 'lucide-react';
import { AudioProvider, useAudioSFX } from './hooks/useAudioSFX';
import { useEnvironment } from './hooks/useEnvironment';
import { useWindowManager } from './hooks/useWindowManager';
import { activeWindow } from './hooks/windowState';
import type { WindowId } from './hooks/windowState';
import type { ProjectSaveFile } from './types/content';
import { WindowFrame } from './components/xp/WindowFrame';
import { Taskbar } from './components/xp/Taskbar';
import { MemoryBrowser, SaveInformation } from './components/xp/MemoryBrowser';
import { AudioPlayer } from './components/media/AudioPlayer';
import { fallbackProjects, loadProjects } from './data/projects';
import type { SoundName } from './audio/AudioEngine';
import './desktop.css';
const BootScene = lazy(() => import('./components/3d/BootScene').then(module => ({ default: module.BootScene })));
type Theme = 'blue' | 'olive' | 'silver';

function Desktop() {
  const { visible, reducedMotion } = useEnvironment();
  const { engine, status, muted, volume, ambient } = useAudioSFX();
  const { state, dispatch } = useWindowManager();
  const [motion, setMotion] = useState(true);
  const [bloom, setBloom] = useState(true);
  const [crt, setCrt] = useState(true);
  const [theme, setTheme] = useState<Theme>('blue');
  const [selected, setSelected] = useState<ProjectSaveFile | null>(null);
  const [projects, setProjects] = useState(fallbackProjects);
  const [error, setError] = useState('');
  useEffect(() => { void loadProjects().then(setProjects); }, []);
  const animate = visible && motion && !reducedMotion;
  const active = activeWindow(state);
  function open(id: WindowId) { engine.play('open'); dispatch({ type: 'open', id }); }
  async function enableAudio() {
    try { setError(''); await engine.unlock(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Audio could not start.'); }
  }
  return <main className={`desktop theme-${theme} ${crt ? 'crt' : ''}`}>
    <Suspense fallback={<div className="scene" />}><BootScene animate={animate} bloom={bloom} /></Suspense><div className="desktop-shade" />
    <div className="desktop-wordmark" aria-hidden="true"><span>MEMORY SYSTEM</span><small>A PLACE BETWEEN WORLDS</small></div>
    <nav className="desktop-shortcuts" aria-label="Desktop shortcuts">{([{ id: 'memory', icon: HardDrive, title: 'Memory Card' }, { id: 'player', icon: Disc3, title: 'Memory Player' }, { id: 'settings', icon: Settings, title: 'Configuration' }] as const).map(item => <button key={item.id} onClick={() => open(item.id)}><item.icon size={34} strokeWidth={1.25} /><span>{item.title}</span></button>)}</nav>
    {(status !== 'running' || error) && <div className="sound-banner"><Volume2 size={16} /><button disabled={status === 'unavailable'} onClick={() => void enableAudio()}>{status === 'suspended' ? 'Resume system sound' : status === 'unavailable' ? 'Audio unavailable' : 'Enable system sound'}</button>{error && <span role="alert">{error}</span>}</div>}
    {state.windows.map((entry, index) => <WindowFrame key={entry.id} window={entry} active={active === entry.id} order={index} viewport={state.viewport} dispatch={dispatch}>
      {entry.id === 'memory' && <MemoryBrowser projects={projects} animate={animate && !entry.minimized} visible={visible && !entry.minimized} onOpen={project => { setSelected(project); engine.play('confirm'); open('save'); }} />}
      {entry.id === 'save' && <SaveInformation project={selected} />}
      {entry.id === 'player' && <AudioPlayer visible={visible && !entry.minimized} animate={animate} />}
      {entry.id === 'settings' && status !== 'running' && <button className="configuration-unlock" disabled={status === 'unavailable'} onClick={() => void enableAudio()}>{status === 'suspended' ? 'Resume system sound' : 'Enable system sound'}</button>}
      {entry.id === 'settings' && <div className="configuration"><span className="eyebrow">SYSTEM CONFIGURATION</span><h3>Make yourself at home.</h3><fieldset><legend>Window appearance</legend><div className="theme-options">{(['blue', 'olive', 'silver'] as const).map(option => <label key={option}><input type="radio" name="theme" checked={theme === option} onChange={() => setTheme(option)} />Luna {option}</label>)}</div></fieldset><fieldset><legend>Display</legend><label><input type="checkbox" checked={crt} onChange={event => setCrt(event.target.checked)} />CRT scanlines</label><label><input type="checkbox" checked={bloom} onChange={event => setBloom(event.target.checked)} />Crystal bloom</label><label><input type="checkbox" checked={motion && !reducedMotion} disabled={reducedMotion} onChange={event => setMotion(event.target.checked)} />Animated environment</label>{reducedMotion && <small>Your system’s reduced-motion preference is active.</small>}</fieldset><fieldset><legend>Sound</legend><label>Master volume<input aria-label="Master volume" type="range" min={0} max={1} step={.01} value={volume} onChange={event => engine.setVolume(Number(event.target.value))} /><output>{Math.round(volume * 100)}%</output></label><label><input type="checkbox" checked={muted} onChange={event => engine.setMuted(event.target.checked)} />Mute all audio</label><label><input type="checkbox" checked={ambient} onChange={event => engine.setAmbient(event.target.checked)} />Ambient background hum</label><div className="sound-tests">{(['navigate', 'confirm', 'open', 'close', 'minimize', 'error'] satisfies SoundName[]).map(sound => <button key={sound} disabled={status !== 'running'} onClick={() => engine.play(sound)}>{sound}</button>)}</div></fieldset><p className="keyboard-tip">Focus a window’s title bar and use arrow keys to move it. Hold Shift to resize.</p></div>}
    </WindowFrame>)}
    <div className="desktop-caption" aria-hidden="true">MEMORY CARD SLOT 1 <span>8,192 KB</span></div>
    <Taskbar state={state} dispatch={dispatch} open={open} />
  </main>;
}
export default function App() { return <AudioProvider><Desktop /></AudioProvider>; }
