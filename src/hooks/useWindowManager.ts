import { useEffect, useReducer } from 'react';
import { defaultBounds, windowReducer } from './windowState';
import type { Viewport, WindowState } from './windowState';
const viewport = (): Viewport => ({ width: window.innerWidth, height: Math.max(0, window.innerHeight - 44) });
export function useWindowManager() {
  const [state, dispatch] = useReducer(windowReducer, undefined, (): WindowState => {
    const size = viewport();
    return { viewport: size, windows: [{ id: 'memory', bounds: defaultBounds('memory', size), minimized: false, maximized: size.width < 600 }] };
  });
  useEffect(() => {
    const resize = () => dispatch({ type: 'viewport', viewport: viewport() });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return { state, dispatch };
}
