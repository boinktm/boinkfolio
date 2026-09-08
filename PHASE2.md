# Phase 2 — XP desktop and memory-card browser

## Included

- Luna Blue, Olive, and Silver window frames over the existing 3D environment.
- Pointer drag, corner resize, title-bar double-click maximize, minimize, close, focus stacking, and taskbar restore. Focus a title bar to move with arrow keys; Shift + arrows resizes. Windows stay within the usable viewport, including after a viewport resize.
- Start menu with keyboard navigation and Escape dismissal, desktop shortcuts, show/restore desktop, system-tray master mute, and a local clock.
- Four bundled system saves describing this project's actual modules, with crystal, cube, disc, and voxel icons. Icons rotate, tilt on focus/hover, and use the Phase 1 navigation chime. Hidden memory windows release icon canvases and recreate them on restore. Reduced-motion preferences stop animation.
- Category browsing, selected-save metadata, an empty-category state, and a pinned capacity meter calculated from the whole registry. The included registry uses 2,688 KB of 8,192 KB, leaving 5,504 KB free. Virtual storage is metadata, not an actual measurement of repository assets.
- A functioning music player with three original 24-second synthesized WAV recordings, a playlist, previous/next, seeking, pause/resume, playlist repeat, independent music volume, and a live Web Audio analyser waveform.
- Master volume, mute, ambient hum, bloom, scanlines, and motion controls in System Configuration.

## Files

```text
src/
  App.tsx                         Desktop composition
  desktop.css                     Luna frames, desktop, browser, taskbar, player
  types/content.ts                Typed project-save schema
  data/projects.ts                Bundled registry and storage calculation
  hooks/windowState.ts            Pure window reducer and viewport constraints
  hooks/useWindowManager.ts       React lifecycle and viewport observation
  hooks/windowState.test.ts       Window lifecycle and storage regression tests
  components/xp/WindowFrame.tsx    Focus, pointer capture, keyboard geometry
  components/xp/MemoryBrowser.tsx  Save browsing and metadata inspection
  components/xp/Taskbar.tsx        Taskbar, Start menu, clock, master mute
  components/3d/SaveIcon.tsx       Low-poly meshes and fallback
  components/media/AudioPlayer.tsx Playback transport and waveform
public/audio/                     Bundled WAV recordings
scripts/generate-audio.mjs        Deterministic audio source generator
```

The scene and audio provider from Phase 1 remain shared by the desktop. `AudioEngine.connectMedia()` routes music through the same master gain and limiter as sound effects; closing the player disconnects its source. Minimizing keeps the audio element mounted, so music continues. Hiding the browser tab suspends the context and pauses the music; playback resumes through a user gesture. Music is off on page load.

Window geometry, themes, selection, and music state are session state. Closing an application releases its component resources; reopening starts a new application session. Refresh resets the desktop. No personal credentials or browser storage are involved.

## Run and modify

```sh
npm ci
npm run dev
npm test
npm run build
```

The bundled tracks are already committed as source assets; there is no missing-asset download step. To regenerate them:

```sh
node scripts/generate-audio.mjs
```

Edit `src/data/projects.ts` to change the save registry and its virtual sizes. In this phase, `contentFile` is deliberately empty because the save-information window displays only metadata; it never fetches a nonexistent article. The Phase 3 content loader will provide article paths. The custom icon variant currently renders a built-in voxel monolith, not arbitrary uploaded model files.

## Validation

- Production build runs strict TypeScript checking.
- Ten tests cover audio pre-unlock safety, gain boundaries, subscriptions, window deduplication, focus/close, taskbar restore, maximize/restore, mobile geometry, desktop restoration, and storage overflow.
- Browser smoke checks exercised save information, Start menu launching, playback, playlist switching, playback while minimized, taskbar restoration, maximize, and keyboard movement/resizing. A 375 × 812 viewport was checked for reachable window controls and the fixed storage meter.
- The renderer still produces Vite's large Three.js chunk warning. The 3D modules load separately from the main interface.

Physical speaker output and cross-browser/device coverage are not established by these checks. No publishing or Phase 3/4 work is included.
