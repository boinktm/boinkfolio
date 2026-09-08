import { useEffect, useRef } from 'react';
import type { Dispatch, PointerEvent, ReactNode } from 'react';
import { Minus, Square, Copy, X, Disc3 } from 'lucide-react';
import { titles } from '../../hooks/windowState';
import type { DesktopWindow, WindowAction, Viewport } from '../../hooks/windowState';
import { useAudioSFX } from '../../hooks/useAudioSFX';

interface Props { window: DesktopWindow; active: boolean; order: number; viewport: Viewport; dispatch: Dispatch<WindowAction>; children: ReactNode; }
export function WindowFrame({ window: entry, active, order, viewport, dispatch, children }: Props) {
  const { engine } = useAudioSFX();
  const frame = useRef<HTMLElement>(null);
  const gesture = useRef<{ x: number; y: number; bounds: DesktopWindow['bounds']; resize: boolean } | null>(null);
  useEffect(() => { if (active && !entry.minimized && !frame.current?.contains(document.activeElement)) frame.current?.focus({ preventScroll: true }); }, [active, entry.minimized]);
  const bounds = entry.maximized ? { x: 0, y: 0, ...viewport } : entry.bounds;
  function begin(event: PointerEvent<HTMLElement>, resize = false) {
    if (event.button !== 0 || entry.maximized || (event.target as HTMLElement).closest('button')) return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { x: event.clientX, y: event.clientY, bounds: entry.bounds, resize };
  }
  function move(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    dispatch({ type: 'bounds', id: entry.id, bounds: start.resize ? { ...start.bounds, width: start.bounds.width + dx, height: start.bounds.height + dy } : { ...start.bounds, x: start.bounds.x + dx, y: start.bounds.y + dy } });
  }
  function action(type: 'close' | 'minimize' | 'maximize') {
    engine.play(type === 'maximize' ? 'open' : type);
    dispatch({ type, id: entry.id });
  }
  return <section ref={frame} tabIndex={-1} role="dialog" aria-modal="false" aria-labelledby={`title-${entry.id}`} hidden={entry.minimized}
    className={`xp-window ${active ? 'active' : ''} ${entry.maximized ? 'maximized' : ''}`} style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height, zIndex: order + 10 }}
    onPointerDownCapture={() => { if (!active) dispatch({ type: 'focus', id: entry.id }); }}
    onFocusCapture={() => { if (!active) dispatch({ type: 'focus', id: entry.id }); }}>
    <header className="xp-titlebar" tabIndex={0} aria-label={`${titles[entry.id]}. Arrow keys move; Shift and arrow keys resize.`}
      onPointerDown={event => begin(event)} onPointerMove={move} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }} onLostPointerCapture={() => { gesture.current = null; }}
      onDoubleClick={event => { if (!(event.target as HTMLElement).closest('button')) action('maximize'); }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || entry.maximized || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const dx = event.key === 'ArrowLeft' ? -16 : event.key === 'ArrowRight' ? 16 : 0;
        const dy = event.key === 'ArrowUp' ? -16 : event.key === 'ArrowDown' ? 16 : 0;
        dispatch({ type: 'bounds', id: entry.id, bounds: event.shiftKey ? { ...entry.bounds, width: entry.bounds.width + dx, height: entry.bounds.height + dy } : { ...entry.bounds, x: entry.bounds.x + dx, y: entry.bounds.y + dy } });
      }}>
      <Disc3 size={17} /><h2 id={`title-${entry.id}`}>{titles[entry.id]}</h2>
      <div className="window-buttons"><button aria-label={`Minimize ${titles[entry.id]}`} onClick={() => action('minimize')}><Minus size={16} /></button><button aria-label={`${entry.maximized ? 'Restore' : 'Maximize'} ${titles[entry.id]}`} onClick={() => action('maximize')}>{entry.maximized ? <Copy size={14} /> : <Square size={14} />}</button><button className="close-button" aria-label={`Close ${titles[entry.id]}`} onClick={() => action('close')}><X size={19} /></button></div>
    </header>
    <div className="window-content">{children}</div>
    {!entry.maximized && <div className="resize-grip" aria-hidden="true" onPointerDown={event => begin(event, true)} onPointerMove={move} onPointerUp={() => { gesture.current = null; }} onPointerCancel={() => { gesture.current = null; }} onLostPointerCapture={() => { gesture.current = null; }} />}
  </section>;
}
