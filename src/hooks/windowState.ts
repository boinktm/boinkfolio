export type WindowId = 'memory' | 'player' | 'settings' | 'save';
export interface Bounds { x: number; y: number; width: number; height: number; }
export interface Viewport { width: number; height: number; }
export interface DesktopWindow { id: WindowId; bounds: Bounds; minimized: boolean; maximized: boolean; }
export interface WindowState { windows: DesktopWindow[]; viewport: Viewport; desktopRestore?: WindowId[]; }
export type WindowAction =
  | { type: 'open' | 'close' | 'focus' | 'minimize' | 'maximize' | 'task'; id: WindowId }
  | { type: 'bounds'; id: WindowId; bounds: Bounds }
  | { type: 'viewport'; viewport: Viewport }
  | { type: 'desktop' };
export const titles: Record<WindowId, string> = { memory: 'Memory Card Slot 1', player: 'Memory Player', settings: 'System Configuration', save: 'Save File Information' };
export function constrainBounds(bounds: Bounds, viewport: Viewport): Bounds {
  const width = Math.min(viewport.width, Math.max(Math.min(320, viewport.width), bounds.width));
  const height = Math.min(viewport.height, Math.max(Math.min(260, viewport.height), bounds.height));
  return { width, height, x: Math.max(0, Math.min(bounds.x, viewport.width - width)), y: Math.max(0, Math.min(bounds.y, viewport.height - height)) };
}
export function defaultBounds(id: WindowId, viewport: Viewport): Bounds {
  const presets: Record<WindowId, Bounds> = {
    memory: { x: Math.max(92, viewport.width * .12), y: 70, width: 820, height: 530 },
    player: { x: viewport.width - 400, y: viewport.height - 380, width: 370, height: 354 },
    settings: { x: 170, y: 95, width: 440, height: 450 },
    save: { x: 230, y: 130, width: 470, height: 400 },
  };
  return constrainBounds(presets[id], viewport);
}
export function activeWindow(state: WindowState) { return [...state.windows].reverse().find(window => !window.minimized)?.id; }
export function windowReducer(state: WindowState, action: WindowAction): WindowState {
  if (action.type === 'viewport') return { viewport: action.viewport, windows: state.windows.map(window => ({ ...window, bounds: constrainBounds(window.bounds, action.viewport) })) };
  if (action.type === 'desktop') {
    const hide = state.windows.some(window => !window.minimized);
    const restore = state.desktopRestore ?? [];
    return { ...state, desktopRestore: hide ? state.windows.filter(window => !window.minimized).map(window => window.id) : [], windows: state.windows.map(window => ({ ...window, minimized: hide || !restore.includes(window.id) })) };
  }
  const existing = state.windows.find(window => window.id === action.id);
  if (action.type === 'close') return { ...state, windows: state.windows.filter(window => window.id !== action.id) };
  if (!existing) return action.type === 'open' ? { ...state, windows: [...state.windows, { id: action.id, bounds: defaultBounds(action.id, state.viewport), minimized: false, maximized: false }] } : state;
  let updated = existing;
  if (action.type === 'bounds') updated = { ...existing, bounds: constrainBounds(action.bounds, state.viewport) };
  if (action.type === 'minimize') updated = { ...existing, minimized: true };
  if (action.type === 'maximize') updated = { ...existing, maximized: !existing.maximized, minimized: false };
  if (action.type === 'open' || action.type === 'focus') updated = { ...existing, minimized: false };
  if (action.type === 'task') updated = { ...existing, minimized: !existing.minimized && activeWindow(state) === action.id };
  const raise = ['open', 'focus', 'maximize', 'task'].includes(action.type) && !updated.minimized;
  return { ...state, windows: raise ? [...state.windows.filter(window => window.id !== action.id), updated] : state.windows.map(window => window.id === action.id ? updated : window) };
}
