export type SoundName = 'boot' | 'navigate' | 'confirm' | 'open' | 'close' | 'minimize' | 'error';
export type SoundManifest = Partial<Record<SoundName | 'ambient', string>>;
export type AudioStatus = 'locked' | 'running' | 'suspended' | 'unavailable';
export interface AudioSnapshot { status: AudioStatus; volume: number; muted: boolean; ambient: boolean; }
interface Voice { source: AudioScheduledSourceNode; nodes: AudioNode[]; }

const notes: Record<SoundName, readonly number[]> = {
  boot: [110, 164.81, 220, 329.63], navigate: [880, 1320], confirm: [523.25, 659.25, 783.99],
  open: [392, 587.33, 783.99], close: [587.33, 392, 261.63], minimize: [659.25, 440], error: [196, 185],
};
export const clampUnit = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;

/** Lazy, gesture-unlocked audio graph. No fetches or audio resources at module import. */
export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private snapshot: AudioSnapshot = { status: 'locked', volume: .45, muted: false, ambient: true };
  private listeners = new Set<() => void>();
  private voices = new Set<Voice>();
  private drone: Voice[] = [];
  private buffers = new Map<string, AudioBuffer>();
  private loadController: AbortController | null = null;
  private lastNavigation = -Infinity;
  private disposed = false;
  private booted = false;
  private mediaSources = new Map<HTMLMediaElement, { source: MediaElementAudioSourceNode; analyser: AnalyserNode }>();

  /** Route a playlist element through the same master mute, limiter and tab lifecycle. */
  connectMedia(element: HTMLMediaElement): AnalyserNode {
    if (!this.context || !this.master || this.disposed) throw new Error('Unlock audio before connecting media.');
    const existing = this.mediaSources.get(element);
    if (existing) return existing.analyser;
    const source = this.context.createMediaElementSource(element);
    const analyser = this.context.createAnalyser(); analyser.fftSize = 256;
    source.connect(analyser).connect(this.master);
    this.mediaSources.set(element, { source, analyser });
    return analyser;
  }

  disconnectMedia(element: HTMLMediaElement) {
    const nodes = this.mediaSources.get(element);
    if (!nodes) return;
    element.pause(); nodes.source.disconnect(); nodes.analyser.disconnect();
    this.mediaSources.delete(element);
  }

  getSnapshot = (): AudioSnapshot => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(patch: Partial<AudioSnapshot>) { this.snapshot = { ...this.snapshot, ...patch }; this.listeners.forEach(listener => listener()); }
  private ramp(node: AudioParam, value: number, seconds = .06) {
    if (!this.context) return;
    node.cancelScheduledValues(this.context.currentTime);
    node.setTargetAtTime(value, this.context.currentTime, seconds);
  }

  /** Call directly from a click/key handler, before unrelated asynchronous work. */
  async unlock(): Promise<void> {
    if (this.disposed) throw new Error('Audio engine has been disposed.');
    if (!this.context) {
      if (typeof AudioContext === 'undefined') { this.publish({ status: 'unavailable' }); throw new Error('Web Audio is unavailable in this browser.'); }
      const context = new AudioContext();
      this.context = context;
      this.master = context.createGain();
      this.master.gain.value = this.snapshot.muted ? 0 : this.snapshot.volume;
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -12; limiter.knee.value = 12; limiter.ratio.value = 8;
      this.master.connect(limiter).connect(context.destination);
      this.ambientGain = context.createGain();
      this.ambientGain.gain.value = this.snapshot.ambient ? .32 : 0;
      this.filter = context.createBiquadFilter();
      this.filter.type = 'lowpass'; this.filter.frequency.value = 620; this.filter.Q.value = 1.4;
      this.filter.connect(this.ambientGain).connect(this.master);
      context.onstatechange = () => {
        if (!this.disposed) this.publish({ status: context.state === 'running' ? 'running' : 'suspended' });
      };
      this.startDrone();
    }
    await this.context.resume();
    if (this.disposed) return;
    this.publish({ status: this.context.state === 'running' ? 'running' : 'suspended' });
    if (!this.booted) { this.booted = true; this.play('boot'); }
  }

  private startDrone() {
    const context = this.context;
    if (!context || !this.filter) return;
    for (const frequency of [55, 82.4069, 110.12, 164.8138]) {
      const source = context.createOscillator(); const gain = context.createGain();
      source.type = 'sine'; source.frequency.value = frequency; gain.gain.value = .12;
      source.connect(gain).connect(this.filter); source.start();
      this.drone.push({ source, nodes: [gain] });
    }
    // Slow filter modulation supplies movement without timers or render-loop coupling.
    const lfo = context.createOscillator(); const depth = context.createGain();
    lfo.frequency.value = .075; depth.gain.value = 230;
    lfo.connect(depth).connect(this.filter.frequency); lfo.start();
    this.drone.push({ source: lfo, nodes: [depth] });
  }

  /** Optional recordings replace synthesis. Paths may use Vite's import.meta.env.BASE_URL. */
  async load(manifest: SoundManifest): Promise<void> {
    const context = this.context;
    if (!context || this.disposed) throw new Error('Unlock audio before loading recordings.');
    this.loadController?.abort();
    const controller = new AbortController(); this.loadController = controller;
    const entries = await Promise.all(Object.entries(manifest).map(async ([name, url]) => {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Unable to load ${name}: HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      return [name, await context.decodeAudioData(bytes)] as const;
    }));
    if (controller.signal.aborted || this.disposed) return;
    entries.forEach(([name, buffer]) => this.buffers.set(name, buffer));
    const ambient = this.buffers.get('ambient');
    if (ambient && this.filter) {
      this.drone.forEach(voice => this.stopVoice(voice)); this.drone = [];
      const source = context.createBufferSource(); source.buffer = ambient; source.loop = true;
      source.connect(this.filter); source.start(); this.drone.push({ source, nodes: [] });
    }
  }

  play(name: SoundName, pan = 0): void {
    const context = this.context;
    if (!context || !this.master || context.state !== 'running' || this.snapshot.muted || this.disposed) return;
    if (name === 'navigate') {
      if (context.currentTime - this.lastNavigation < .075) return;
      this.lastNavigation = context.currentTime;
    }
    const frequencies = notes[name];
    const buffer = this.buffers.get(name);
    const count = buffer ? 1 : frequencies.length;
    while (this.voices.size + count > 24) {
      const oldest = this.voices.values().next().value as Voice | undefined;
      if (!oldest) break;
      this.stopVoice(oldest); this.voices.delete(oldest);
    }
    const start = context.currentTime;
    for (let index = 0; index < count; index++) {
      const gain = context.createGain(); const panner = context.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, Number.isFinite(pan) ? pan : 0));
      gain.connect(panner).connect(this.master);
      const at = start + index * (name === 'boot' ? .15 : .045);
      const duration = buffer ? buffer.duration : name === 'boot' ? 2.4 : .34;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(buffer ? .65 : .10, at + Math.min(.015, duration / 4));
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      const source = buffer ? context.createBufferSource() : context.createOscillator();
      if (source instanceof AudioBufferSourceNode) source.buffer = buffer ?? null;
      else { source.type = 'sine'; source.frequency.value = frequencies[index] ?? 440; }
      source.connect(gain);
      const voice = { source, nodes: [gain, panner] }; this.voices.add(voice);
      source.onended = () => { source.disconnect(); voice.nodes.forEach(node => node.disconnect()); this.voices.delete(voice); };
      source.start(at); source.stop(at + duration + .025);
    }
  }

  setVolume(value: number) { const volume = clampUnit(value); this.publish({ volume }); if (this.master) this.ramp(this.master.gain, this.snapshot.muted ? 0 : volume); }
  setMuted(muted: boolean) { this.publish({ muted }); if (this.master) this.ramp(this.master.gain, muted ? 0 : this.snapshot.volume); }
  setAmbient(ambient: boolean) { this.publish({ ambient }); if (this.ambientGain) this.ramp(this.ambientGain.gain, ambient ? .32 : 0, .25); }
  async suspend() { if (this.context?.state === 'running') await this.context.suspend(); }
  private stopVoice(voice: Voice) { voice.source.onended = null; voice.source.stop(); voice.source.disconnect(); voice.nodes.forEach(node => node.disconnect()); }
  async dispose() {
    this.disposed = true; this.loadController?.abort();
    this.mediaSources.forEach((_, element) => this.disconnectMedia(element));
    this.voices.forEach(voice => this.stopVoice(voice)); this.drone.forEach(voice => this.stopVoice(voice));
    this.voices.clear(); this.drone = []; this.buffers.clear(); this.listeners.clear();
    if (this.context) { this.context.onstatechange = null; await this.context.close(); }
    this.context = null;
  }
}
