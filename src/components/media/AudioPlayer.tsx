import { useEffect, useRef, useState } from 'react';
import { Disc3, Pause, Play, Repeat2, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useAudioSFX } from '../../hooks/useAudioSFX';
const tracks = [
  { title: 'Blue Hour', file: 'blue-hour.wav', subtitle: 'Slow signals across the void' },
  { title: 'Satellite', file: 'satellite.wav', subtitle: 'A small orbit, endlessly returning' },
  { title: 'Return to Zero', file: 'return-to-zero.wav', subtitle: 'The quiet after the last save' },
] as const;
const timeLabel = (time: number) => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;

export function AudioPlayer({ visible, animate }: { visible: boolean; animate: boolean }) {
  const { engine, ambient, status, muted } = useAudioSFX();
  const audio = useRef<HTMLAudioElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const request = useRef(0);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(.7);
  const [repeat, setRepeat] = useState(true);
  const [error, setError] = useState('');
  const track = tracks[index]!;
  useEffect(() => {
    const element = audio.current;
    return () => { request.current++; if (element) { element.pause(); engine.disconnectMedia(element); } };
  }, [engine]);
  useEffect(() => { if (audio.current) audio.current.volume = volume; }, [volume]);
  useEffect(() => { if (status !== 'running') audio.current?.pause(); }, [status]);
  useEffect(() => {
    const element = canvas.current;
    const context = element?.getContext('2d');
    if (!element || !context || !visible) return;
    const data = new Uint8Array(256); let frame = 0;
    function draw() {
      if (!context || !element) return;
      context.clearRect(0, 0, element.width, element.height);
      context.strokeStyle = '#78d8ef'; context.lineWidth = 1.5; context.beginPath();
      data.fill(128);
      if (playing && !muted) analyser.current?.getByteTimeDomainData(data);
      for (let point = 0; point < data.length; point++) {
        const x = point / (data.length - 1) * element.width, y = (data[point]! / 128) * element.height / 2;
        if (point === 0) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.stroke();
      if (animate && playing) frame = requestAnimationFrame(draw);
    }
    draw(); return () => cancelAnimationFrame(frame);
  }, [visible, animate, playing, muted]);

  async function playTrack(next = index) {
    const element = audio.current;
    if (!element) return;
    const token = ++request.current;
    try {
      setError('');
      await engine.unlock();
      if (token !== request.current) return;
      analyser.current = engine.connectMedia(element);
      if (next !== index || !element.getAttribute('src')) {
        element.src = `${import.meta.env.BASE_URL}audio/${tracks[next]!.file}`;
        setTime(0); setDuration(0); setIndex(next);
      }
      await element.play();
    } catch (cause) {
      if (token === request.current) setError(cause instanceof Error ? cause.message : 'Unable to play this track.');
    }
  }
  function pause() { request.current++; audio.current?.pause(); }
  return <div className="media-player">
    <audio ref={audio} preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onLoadedMetadata={event => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onError={() => setError('This track could not be loaded. Select another track or retry playback.')} onEnded={() => { setPlaying(false); if (index < tracks.length - 1 || repeat) void playTrack((index + 1) % tracks.length); }} />
    <div className="player-display"><div className="player-label"><span>MEMORY PLAYER / STEREO</span><span>{playing ? 'PLAYING' : 'PAUSED'}</span></div><div className="now-playing"><Disc3 size={36} /><div><h3>{track.title}</h3><p>{track.subtitle}</p></div></div><canvas ref={canvas} width={600} height={78} aria-label="Live audio waveform" role="img" /><div className="track-time"><span>{timeLabel(time)}</span><span>{timeLabel(duration)}</span></div><input aria-label="Playback position" type="range" min={0} max={duration || 1} step={.1} value={Math.min(time, duration || 0)} disabled={!duration} onChange={event => { if (audio.current) { audio.current.currentTime = Number(event.target.value); setTime(Number(event.target.value)); } }} /></div>
    <div className="transport"><button aria-label="Previous track" onClick={() => void playTrack((index - 1 + tracks.length) % tracks.length)}><SkipBack size={19} /></button><button className="play-button" aria-label={playing ? 'Pause playback' : 'Play track'} onClick={() => { if (playing) pause(); else void playTrack(); }}>{playing ? <Pause size={22} /> : <Play size={22} />}</button><button aria-label="Next track" onClick={() => void playTrack((index + 1) % tracks.length)}><SkipForward size={19} /></button><button aria-label="Repeat playlist" aria-pressed={repeat} onClick={() => setRepeat(!repeat)}><Repeat2 size={17} /></button><Volume2 size={16} /><input aria-label="Music volume" type="range" min={0} max={1} step={.01} value={volume} onChange={event => setVolume(Number(event.target.value))} /></div>
    <ol className="playlist">{tracks.map((item, itemIndex) => <li key={item.file}><button aria-current={index === itemIndex ? 'true' : undefined} onClick={() => void playTrack(itemIndex)}><span>{String(itemIndex + 1).padStart(2, '0')}</span>{item.title}<span>0:24</span></button></li>)}</ol>
    <label className="player-ambient"><input type="checkbox" checked={ambient} onChange={event => engine.setAmbient(event.target.checked)} />Ambient background hum<span>Original recordings</span></label>
    {error && <p role="alert" className="error">{error}</p>}
  </div>;
}
