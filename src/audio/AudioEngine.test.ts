import { describe, expect, it } from 'vitest';
import { AudioEngine, clampUnit } from './AudioEngine';

describe('audio boundary and gesture safety', () => {
  it('handles invalid and out-of-range gain inputs', () => {
    expect([-.5, .5, 2, NaN, Infinity].map(clampUnit)).toEqual([0, .5, 1, 0, 0]);
  });
  it('allows pre-unlock controls without creating a browser AudioContext', async () => {
    const engine = new AudioEngine();
    engine.setVolume(2); engine.setMuted(true); engine.setAmbient(false);
    engine.play('navigate');
    expect(engine.getSnapshot()).toEqual({ status: 'locked', volume: 1, muted: true, ambient: false });
    await engine.dispose();
    await expect(engine.unlock()).rejects.toThrow('disposed');
  });
  it('rejects sample loading before unlock', async () => {
    const engine = new AudioEngine();
    await expect(engine.load({ boot: '/missing.wav' })).rejects.toThrow('Unlock audio');
    await engine.dispose();
  });
  it('notifies subscribers and releases subscriptions', () => {
    const engine = new AudioEngine(); let notifications = 0;
    const unsubscribe = engine.subscribe(() => notifications++);
    engine.setMuted(true); unsubscribe(); engine.setMuted(false);
    expect(notifications).toBe(1);
  });
});
