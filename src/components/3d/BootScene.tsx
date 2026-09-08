import { Component, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges, Sparkles } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { AdditiveBlending, DoubleSide, Group, ShaderMaterial } from 'three';
import { fogFragment, fogVertex } from './fogShaders';

interface SceneProps { animate: boolean; bloom: boolean; }
const towers = [
  [-5.2, 1.2, -3.7, .72, 3.8], [-3.3, 2.0, -6.2, .85, 6.0], [-1.5, 1.3, -2.8, .55, 3.7],
  [.15, 2.8, -5.0, 1.0, 7.4], [2.0, 1.5, -3.4, .62, 4.8], [3.7, 2.2, -7.0, .9, 6.5], [5.0, .9, -2.8, .60, 3.2],
] as const;

function Tower({ data, index, animate }: { data: typeof towers[number]; index: number; animate: boolean }) {
  const group = useRef<Group>(null);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!group.current || !animate) return;
    elapsed.current += Math.min(delta, .05);
    group.current.position.y = data[1] + Math.sin(elapsed.current * .25 + index) * .22;
    group.current.rotation.y = .42 + Math.sin(elapsed.current * .09 + index) * .14;
  });
  return <group ref={group} position={[data[0], data[1], data[2]]} rotation={[0, .42, 0]}>
    <mesh>
      <boxGeometry args={[data[3], data[4], data[3]]} />
      <meshPhysicalMaterial color={index % 2 ? '#527ead' : '#7bc7de'} metalness={.38} roughness={.16}
        transparent opacity={.48} depthWrite={false} clearcoat={1} emissive="#193f68" emissiveIntensity={.45} />
      <Edges color="#6ab6db" transparent opacity={.38} />
    </mesh>
    <mesh scale={[.2, .96, .2]}>
      <boxGeometry args={[data[3], data[4], data[3]]} />
      <meshBasicMaterial color="#79c8ff" transparent opacity={.48} blending={AdditiveBlending} depthWrite={false} />
    </mesh>
  </group>;
}

function OceanFog({ animate }: { animate: boolean }) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, delta) => { if (animate) uniforms.uTime.value += Math.min(delta, .05); });
  return <mesh position={[0, -.7, -6]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
    <planeGeometry args={[46, 46, 48, 48]} />
    <shaderMaterial ref={material} vertexShader={fogVertex} fragmentShader={fogFragment} uniforms={uniforms}
      transparent depthWrite={false} side={DoubleSide} />
  </mesh>;
}

function World({ animate, bloom }: SceneProps) {
  const time = useRef(0);
  useFrame(({ camera }, delta) => {
    if (!animate) return;
    time.current += Math.min(delta, .05);
    camera.position.x = Math.sin(time.current * .07) * .7;
    camera.position.y = 3.3 + Math.sin(time.current * .11) * .18;
    camera.lookAt(0, 1.6, -4);
  });
  return <>
    <color attach="background" args={['#020719']} /><fogExp2 attach="fog" args={['#08152e', .038]} />
    <ambientLight intensity={.7} color="#596eac" />
    <directionalLight position={[-4, 8, 3]} intensity={2.5} color="#92dcff" />
    <pointLight position={[4, 3, -6]} intensity={25} color="#7161ed" />
    {towers.map((data, index) => <Tower key={index} data={data} index={index} animate={animate} />)}
    <OceanFog animate={animate} />
    {animate && <Sparkles count={60} scale={[22, 12, 20]} position={[0, 2, -6]} size={1.4} speed={.12} opacity={.35} color="#97c9ff" />}
    {bloom && <EffectComposer multisampling={0}><Bloom intensity={.65} luminanceThreshold={.65} mipmapBlur /></EffectComposer>}
  </>;
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function BootScene({ animate, bloom }: SceneProps) {
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (failed) return;
    const element = canvas.current;
    const lost = (event: Event) => { event.preventDefault(); setFailed(true); };
    element?.addEventListener('webglcontextlost', lost);
    return () => element?.removeEventListener('webglcontextlost', lost);
  }, [failed, retry]);
  return <div className="scene" aria-label="Seven luminous crystal towers floating above blue ocean fog" role="img">
    {!failed && <SceneBoundary key={retry} onError={() => setFailed(true)}>
      <Canvas ref={canvas} dpr={[1, 1.5]} frameloop={animate ? 'always' : 'demand'} camera={{ position: [0, 3.3, 12], fov: 48, near: .1, far: 70 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'low-power' }} fallback={<span>WebGL is unavailable. Static environment active.</span>}
        onCreated={({ camera }) => camera.lookAt(0, 1.6, -4)}>
        <World animate={animate} bloom={bloom} />
      </Canvas>
    </SceneBoundary>}
    {failed && <div className="scene-error">3D rendering paused. <button onClick={() => { setRetry(v => v + 1); setFailed(false); }}>Retry graphics</button></div>}
  </div>;
}
