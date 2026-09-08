import { describe, expect, it } from 'vitest';
import { activeWindow, constrainBounds, windowReducer } from './windowState';
import type { WindowState } from './windowState';
import { storageStats } from '../data/projects';
const initial = (): WindowState => ({ windows: [], viewport: { width: 1200, height: 760 } });
describe('window lifecycle', () => {
  it('opens one instance per application and restores minimized tasks', () => {
    let state = windowReducer(initial(), { type: 'open', id: 'memory' });
    state = windowReducer(state, { type: 'open', id: 'memory' });
    expect(state.windows).toHaveLength(1);
    state = windowReducer(state, { type: 'task', id: 'memory' });
    expect(activeWindow(state)).toBeUndefined();
    state = windowReducer(state, { type: 'task', id: 'memory' });
    expect(activeWindow(state)).toBe('memory');
  });
  it('brings background tasks forward before minimizing and returns focus after closing', () => {
    let state = windowReducer(initial(), { type: 'open', id: 'memory' });
    state = windowReducer(state, { type: 'open', id: 'player' });
    state = windowReducer(state, { type: 'task', id: 'memory' });
    expect(activeWindow(state)).toBe('memory');
    state = windowReducer(state, { type: 'close', id: 'memory' });
    expect(activeWindow(state)).toBe('player');
  });
  it('restores pre-maximize geometry', () => {
    let state = windowReducer(initial(), { type: 'open', id: 'memory' });
    const bounds = state.windows[0]!.bounds;
    state = windowReducer(state, { type: 'maximize', id: 'memory' });
    expect(state.windows[0]!.maximized).toBe(true);
    state = windowReducer(state, { type: 'maximize', id: 'memory' });
    expect(state.windows[0]!.bounds).toEqual(bounds);
    expect(state.windows[0]!.maximized).toBe(false);
  });
  it('fits windows inside a shrinking mobile viewport', () => {
    let state = windowReducer(initial(), { type: 'open', id: 'memory' });
    state = windowReducer(state, { type: 'viewport', viewport: { width: 280, height: 220 } });
    expect(state.windows[0]!.bounds).toEqual({ x: 0, y: 0, width: 280, height: 220 });
    expect(constrainBounds({ x: -50, y: 800, width: 10, height: 100 }, initial().viewport)).toEqual({ x: 0, y: 500, width: 320, height: 260 });
  });
  it('show desktop restores only windows that were visible before hiding', () => {
    let state = windowReducer(initial(), { type: 'open', id: 'memory' });
    state = windowReducer(state, { type: 'open', id: 'player' });
    state = windowReducer(state, { type: 'minimize', id: 'player' });
    state = windowReducer(state, { type: 'desktop' });
    expect(activeWindow(state)).toBeUndefined();
    state = windowReducer(state, { type: 'desktop' });
    expect(activeWindow(state)).toBe('memory');
    expect(state.windows.find(window => window.id === 'player')?.minimized).toBe(true);
  });
});
describe('virtual storage', () => {
  it('sums registry sizes without negative free space or overfilled meters', () => {
    expect(storageStats([{ sizeKB: 1024 }, { sizeKB: 512 }]).free).toBe(6656);
    expect(storageStats([{ sizeKB: 9000 }])).toMatchObject({ free: 0, percent: 100, overflow: 808 });
    expect(storageStats([{ sizeKB: NaN }, { sizeKB: -1 }]).used).toBe(0);
  });
});
