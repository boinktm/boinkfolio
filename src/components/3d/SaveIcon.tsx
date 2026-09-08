import { Component, useRef } from 'react';
import type { ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Group } from 'three';
import type { ProjectSaveFile } from '../../types/content';
interface Props { model: ProjectSaveFile['iconModel']; color: string; active: boolean; animate: boolean; }
function Model({ model, color, active, animate }: Props) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!group.current || !animate) return;
    group.current.rotation.y += Math.min(delta, .05) * (active ? .8 : .22);
    group.current.rotation.x += ((active ? .25 : .08) - group.current.rotation.x) * Math.min(delta * 5, 1);
  });
  const material = <meshStandardMaterial color={color} metalness={.65} roughness={.23} emissive={color} emissiveIntensity={active ? .25 : .08} />;
  return <group ref={group} rotation={[.08, .5, .12]} scale={active ? 1.1 : 1}>
    {model === 'cube' && <mesh>{material}<boxGeometry args={[1.15, 1.15, 1.15]} /></mesh>}
    {model === 'crystal' && <mesh scale={[.8, 1.35, .8]}>{material}<octahedronGeometry args={[1, 0]} /></mesh>}
    {model === 'disc' && <mesh rotation={[Math.PI / 2, .25, 0]}>{material}<torusGeometry args={[.8, .25, 8, 32]} /></mesh>}
    {model === 'custom' && [-1, 0, 1].map((x, index) => <mesh key={x} position={[x * .52, index === 1 ? .22 : -.12, 0]}>{material}<boxGeometry args={[.42, index === 1 ? 1.7 : 1.05, .55]} /></mesh>)}
  </group>;
}
class IconBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function SaveIcon(props: Props) {
  const fallback = <span className="icon-fallback" style={{ background: props.color }} />;
  return <div className="save-icon" aria-hidden="true"><IconBoundary fallback={fallback}>
    <Canvas dpr={[1, 1.25]} frameloop={props.animate ? 'always' : 'demand'} camera={{ position: [0, .4, 4], fov: 43 }} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} fallback={fallback}>
      <ambientLight intensity={1.5} /><directionalLight position={[2, 3, 4]} intensity={4} /><pointLight position={[-3, 0, 2]} intensity={15} color="#b898ff" /><Model {...props} />
    </Canvas>
  </IconBoundary></div>;
}
