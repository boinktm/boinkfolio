# Memory System — Phases 1 and 2 + Content Studio

A runnable React 19 / strict TypeScript / Vite project containing the PS2-inspired audiovisual core and XP desktop, plus a separate Tauri v2 **Memory Card Manager** that commits save entries, markdown, and media to GitHub. Phases 1 and 2 are implemented. The portfolio reads `public/content/projects.json` at runtime; markdown articles live under `public/content/posts/`. See [Phase 2 implementation notes](PHASE2.md) for the desktop components and [cms/README.md](cms/README.md) for the content studio.

## Run

Use Node 22.12+ (or a supported newer Node release).

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Vite emits `dist/` with relative asset URLs (`base: './'`). This phase has one page and no client-side routes; the routing fallback belongs to Phase 3.

## Memory Card Manager (Tauri CMS)

The desktop content studio lives in `cms/`. It needs Rust and the Windows C++ build tools in addition to Node.

```sh
cd cms
npm install
npm test
npm run tauri dev
```

In **Memory Card Manager**, paste a GitHub Personal Access Token with `repo` scope if asked. After that, add a project and click **Publish**. The live site is [https://boinktm.github.io/boinkfolio/](https://boinktm.github.io/boinkfolio/). The token is stored only on this computer.

## Core source map (Phase 1)

```text
portfolio-web/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx                        # Desktop composition and shared controls
    ├── main.tsx
    ├── styles.css                     # Blue void, CRT overlay, compact Luna controls
    ├── audio/
    │   ├── AudioEngine.ts             # Synth, recording loader, mixing and lifecycle
    │   └── AudioEngine.test.ts
    ├── hooks/
    │   ├── useAudioSFX.tsx            # Provider + external-store subscription
    │   └── useEnvironment.ts          # Visibility and reduced-motion preferences
    └── components/3d/
        ├── BootScene.tsx              # Canvas, seven towers, drift, particles, bloom
        └── fogShaders.ts              # Layered animated noise and ocean displacement
```

## Scene integration

```tsx
import { BootScene } from './components/3d/BootScene';
import { useEnvironment } from './hooks/useEnvironment';

function Background() {
  const { visible, reducedMotion } = useEnvironment();
  return <BootScene animate={visible && !reducedMotion} bloom />;
}
```

The canvas is positioned by `.scene`. It has a capped 1.5 pixel ratio, 60 particles, seven small meshes, one 48×48 fog plane, no shadows, and optional post-processing. The time step is capped after interruptions. Motion-disabled mode uses demand rendering and excludes animated particles. Three.js owns and disposes declarative GPU resources through React Three Fiber. A CSS blue-void fallback remains visible if rendering fails; context loss offers a retry control.

Fog combines three spatial noise layers with gentle vertex displacement; scene-wide exponential fog blends distant towers into the background. The glass appearance uses physical material shading, translucent faces, illuminated cores, and edge outlines. Bloom is actual GPU post-processing; scanlines are a pointer-transparent CSS overlay. Reduced-motion preferences disable camera, tower, and fog animation. Pausing motion does not mute audio; the controls are independent.

## Audio integration

Wrap the application once in `AudioProvider`. The provider creates no AudioContext until a user gesture. It cleans up on unmount, including React Strict Mode's setup/cleanup cycle.

```tsx
import { useAudioSFX } from './hooks/useAudioSFX';

function SoundButton() {
  const { engine, status } = useAudioSFX();
  return <button onClick={async () => {
    try {
      await engine.unlock();
      engine.play('confirm', 0.25);
    } catch (error) {
      console.error(error); // Surface this in the consuming UI, as App.tsx does.
    }
  }}>{status === 'running' ? 'Confirm' : 'Enable audio'}</button>;
}
```

Available events: `boot`, `navigate`, `confirm`, `open`, `close`, `minimize`, `error`. `play(name, pan)` accepts a stereo position from −1 to 1. Navigation is throttled to 75 ms; active sound voices are capped at 24. Oscillators use gain envelopes and disconnect when finished. Master gain is clamped, parameter changes are smoothed, and a compressor limits the combined signal.

The included sounds are original synthesis inspired by console and desktop interfaces, not Sony/Microsoft recordings. Four sine oscillators form the ambient chord; a slow oscillator modulates a resonant low-pass filter. The boot chord plays on the first successful unlock. Ambient can be disabled before unlocking. Tab hiding suspends the whole AudioContext; returning requires the visible Resume sound control, preventing surprise playback.

### Optional supplied recordings

No external audio files are required. To replace synthesis, add your recordings under `public/sfx/`, then call this after `unlock()`:

```ts
await engine.load({
  ambient: `${import.meta.env.BASE_URL}sfx/ambient.ogg`,
  boot: `${import.meta.env.BASE_URL}sfx/boot.ogg`,
  navigate: `${import.meta.env.BASE_URL}sfx/navigate.ogg`,
});
```

Only supplied keys replace synthesis. `load()` fetches and decodes the batch before installing it; failures reject to the caller and preserve the existing sound set. A newer load aborts the previous fetch batch. Ambient recordings must be edited for seamless looping and appropriately normalized; remote sources need CORS headers. Disposal aborts requests and closes the audio graph. `setVolume`, `setMuted`, and `setAmbient` work before or after unlock.

## Validation and practical limits

`npm run build` runs strict type checking before bundling. `npm test` verifies gain boundaries, pre-unlock safety, subscription cleanup, and loader ordering. These tests do not claim to validate physical audio output or GPU appearance. Before release, verify on target browsers/devices: enable and resume audio, all six test sounds, mute and ambient controls, tab switching, motion preference, bloom/CRT toggles, and WebGL context recovery. GPU and speaker checks require an actual browser/device.

The 3D module is lazy-loaded, keeping the UI in a separate chunk. Three.js and post-processing still carry a substantial first-use download; use HTTP compression on the host. Styling is plain CSS for this bounded engine preview; Tailwind and the Phase 2 window system are not required by this core.

References: [Fiber/React version pairing](https://r3f.docs.pmnd.rs/getting-started/installation), [Web Audio gesture and autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).
