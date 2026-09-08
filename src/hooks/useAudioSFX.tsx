import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { AudioEngine } from '../audio/AudioEngine';

export const AudioContext = createContext<AudioEngine | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<AudioEngine | null>(null);
  useEffect(() => {
    const instance = new AudioEngine(); setEngine(instance);
    const visibility = () => { if (document.hidden) void instance.suspend().catch(console.error); };
    document.addEventListener('visibilitychange', visibility);
    return () => { document.removeEventListener('visibilitychange', visibility); void instance.dispose().catch(console.error); };
  }, []);
  return engine ? <AudioContext.Provider value={engine}>{children}</AudioContext.Provider> : null;
}

export function useAudioSFX() {
  const engine = useContext(AudioContext);
  if (!engine) throw new Error('useAudioSFX must be inside AudioProvider.');
  const state = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  return { engine, ...state };
}
