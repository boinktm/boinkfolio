// Original deterministic soundscapes. Run with Node to regenerate the bundled PCM assets.
import { mkdirSync, writeFileSync } from 'node:fs';
const destination = new URL('../public/audio/', import.meta.url);
mkdirSync(destination, { recursive: true });
const rate = 22050, duration = 24, samples = rate * duration;
const tracks = [
  ['blue-hour', [110, 164.8138, 220, 277.1826], [440, 554.365, 659.255, 554.365, 440, 329.628, 277.183, 329.628]],
  ['satellite', [130.8128, 195.9977, 261.6256, 329.6276], [523.251, 659.255, 783.991, 1046.502, 783.991, 659.255, 587.33, 391.995]],
  ['return-to-zero', [98, 146.8324, 196, 246.9417], [391.995, 493.883, 587.33, 493.883, 293.665, 391.995, 246.942, 293.665]],
];
for (const [slug, chord, melody] of tracks) {
  const output = Buffer.alloc(44 + samples * 2);
  output.write('RIFF'); output.writeUInt32LE(output.length - 8, 4); output.write('WAVEfmt ', 8);
  output.writeUInt32LE(16, 16); output.writeUInt16LE(1, 20); output.writeUInt16LE(1, 22);
  output.writeUInt32LE(rate, 24); output.writeUInt32LE(rate * 2, 28); output.writeUInt16LE(2, 32); output.writeUInt16LE(16, 34);
  output.write('data', 36); output.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) {
    const time = index / rate;
    const fade = Math.min(1, time / 1.5, (duration - time) / 2);
    const pad = chord.reduce((sum, frequency, voice) => sum + Math.sin(time * 2 * Math.PI * frequency + Math.sin(time * .3 + voice) * .2), 0) * .045;
    const step = Math.floor(time / .75), age = time % .75;
    const frequency = melody[step % melody.length];
    const envelope = Math.min(1, age / .012) * Math.exp(-age * 5);
    const bell = (Math.sin(age * Math.PI * 2 * frequency) + Math.sin(age * Math.PI * 4 * frequency) * .2) * envelope * .09;
    output.writeInt16LE(Math.round(Math.max(-1, Math.min(1, (pad + bell) * fade)) * 32767), 44 + index * 2);
  }
  writeFileSync(new URL(`${slug}.wav`, destination), output);
}
