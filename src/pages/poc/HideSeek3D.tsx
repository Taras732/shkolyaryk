import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, useGLTF, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { sayUk } from '@/games/shared/uk-audio';

/**
 * PoC «Де сховалось звірятко?» у 3D: low-poly кущі з примітивів + зайчик —
 * 3D-модель, отримана з нашої ж ілюстрації (image→3D). Логіка та сама, що в 2.5D.
 */
const SPOTS: [number, number, number][] = [
  [-2.1, 0, 0.2],
  [0, 0, -0.4],
  [2.1, 0, 0.2],
];

function Bush({ pos, onTap, found, shaking, here }: { pos: [number, number, number]; onTap: () => void; found: boolean; shaking: boolean; here: boolean }) {
  const g = useRef<THREE.Group>(null!);
  const blobs = useMemo(
    () => [
      [0, 0.75, 0, 0.95],
      [-0.65, 0.55, 0.15, 0.7],
      [0.65, 0.55, 0.1, 0.72],
      [0.2, 1.2, -0.1, 0.62],
      [-0.3, 1.1, 0.25, 0.55],
    ],
    [],
  );
  const t0 = useRef(Math.random() * 10);
  useFrame((s, dt) => {
    const t = s.clock.elapsedTime + t0.current;
    const target = found ? 1.9 : 0;
    g.current.position.x = THREE.MathUtils.damp(g.current.position.x, pos[0] + target, 6, dt);
    g.current.rotation.z = found ? THREE.MathUtils.damp(g.current.rotation.z, -0.35, 6, dt) : Math.sin(t * (here ? 2.6 : 1.6)) * (here ? 0.06 : 0.03) + (shaking ? Math.sin(t * 40) * 0.12 : 0);
  });
  return (
    <group ref={g} position={pos} onPointerDown={(e) => { e.stopPropagation(); onTap(); }}>
      {blobs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={i % 2 ? '#5fae4b' : '#6cc155'} flatShading roughness={0.9} />
        </mesh>
      ))}
      {[[-0.3, 0.9, 0.85], [0.4, 1.0, 0.8], [0.05, 0.55, 0.95]].map(([x, y, z], i) => (
        <mesh key={`b${i}`} position={[x, y, z]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color="#e8436b" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Rabbit({ pos, found }: { pos: [number, number, number]; found: boolean }) {
  const { scene } = useGLTF('/poc/rabbit.glb');
  const model = useMemo(() => {
    const m = scene.clone(true);
    const box = new THREE.Box3().setFromObject(m);
    const size = box.getSize(new THREE.Vector3());
    const k = 1.6 / Math.max(size.x, size.y, size.z);
    m.scale.setScalar(k);
    const c = box.getCenter(new THREE.Vector3()).multiplyScalar(k);
    m.position.set(-c.x, -box.min.y * k, -c.z);
    m.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    return m;
  }, [scene]);
  const g = useRef<THREE.Group>(null!);
  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    const y = found ? 0.25 + Math.abs(Math.sin(t * 6)) * 0.35 : -0.55 + Math.sin(t * 2) * 0.05;
    g.current.position.y = THREE.MathUtils.damp(g.current.position.y, y, 8, dt);
    g.current.rotation.y = found ? Math.sin(t * 3) * 0.4 : 0;
  });
  return (
    <group ref={g} position={[pos[0], -0.55, pos[2] - 0.7]}>
      <primitive object={model} />
      {found && <Sparkles count={40} scale={2.2} size={6} speed={1.2} color="#ffd24a" position={[0, 1, 0]} />}
    </group>
  );
}

export default function HideSeek3D() {
  const [spot, setSpot] = useState(() => Math.floor(Math.random() * 3));
  const [found, setFound] = useState(false);
  const [shake, setShake] = useState<number | null>(null);
  const [round, setRound] = useState(0);

  useEffect(() => { sayUk('poc.where', 'Де сховався зайчик?'); }, [round]);

  const tap = (i: number) => {
    if (found) return;
    if (i === spot) { setFound(true); sayUk('poc.found', 'Ось він! Молодець!'); }
    else { setShake(i); sayUk('poc.notHere', 'Тут немає. Шукай ще!'); setTimeout(() => setShake(null), 450); }
  };
  const next = () => {
    let n = spot;
    while (n === spot) n = Math.floor(Math.random() * 3);
    setSpot(n); setFound(false); setRound((r) => r + 1);
  };

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '9 / 14', maxHeight: '78vh', borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(#bfe6ff 0%, #e8f7ff 55%, #cdeeb5 56%, #9fd47f 100%)' }}>
      <div style={{ position: 'absolute', top: '6%', left: 0, right: 0, textAlign: 'center', zIndex: 2, fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 22, color: '#2b3a2b', textShadow: '0 2px 0 #fff', pointerEvents: 'none' }}>
        {found ? 'Ось він! 🎉' : 'Де сховався зайчик?'}
      </div>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 3.2, 7.5], fov: 40 }} onCreated={({ camera }) => camera.lookAt(0, 0.6, 0)}>
        <hemisphereLight args={['#ffffff', '#8cc66a', 0.9]} />
        <directionalLight position={[4, 8, 5]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <circleGeometry args={[9, 48]} />
          <meshStandardMaterial color="#8fd16f" roughness={1} />
        </mesh>
        <Suspense fallback={null}>
          <Rabbit key={round} pos={SPOTS[spot]} found={found} />
        </Suspense>
        {SPOTS.map((p, i) => (
          <Bush key={`${round}-${i}`} pos={p} here={i === spot} found={found && i === spot} shaking={shake === i} onTap={() => tap(i)} />
        ))}
        <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={12} blur={2.4} far={3} />
      </Canvas>
      {found && (
        <button onClick={next} style={{ position: 'absolute', bottom: '5%', left: '20%', right: '20%', padding: '16px 0', borderRadius: 20, border: 0, background: '#7c3aed', color: '#fff', fontFamily: 'var(--font-round)', fontWeight: 900, fontSize: 22, boxShadow: '0 8px 20px -6px rgba(124,58,237,.6)', cursor: 'pointer', zIndex: 2 }}>
          ▶ Ще раз
        </button>
      )}
    </div>
  );
}

useGLTF.preload('/poc/rabbit.glb');
