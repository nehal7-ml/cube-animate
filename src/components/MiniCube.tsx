import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

const COLORS: Record<string, string> = {
  white: '#ffffff',
  yellow: '#ffff00',
  orange: '#ff8800',
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0088ff',
  black: '#1a1a1a'
};

interface CubieData {
  id: string;
  initialPos: THREE.Vector3;
  mats: string[];
}

function CubieMesh({ materials }: { materials: string[] }) {
  return (
    <>
      <RoundedBox args={[0.95, 0.95, 0.95]} radius={0.1} smoothness={4}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.2} />
      </RoundedBox>
      {materials.map((color, i) => {
        if (color === 'black') return null;
        const pos: [number, number, number] = [0, 0, 0];
        const rot: [number, number, number] = [0, 0, 0];
        const offset = 0.48;
        if (i === 0) { pos[0] = offset; rot[1] = Math.PI / 2; }
        if (i === 1) { pos[0] = -offset; rot[1] = -Math.PI / 2; }
        if (i === 2) { pos[1] = offset; rot[0] = -Math.PI / 2; }
        if (i === 3) { pos[1] = -offset; rot[0] = Math.PI / 2; }
        if (i === 4) { pos[2] = offset; }
        if (i === 5) { pos[2] = -offset; rot[1] = Math.PI; }

        return (
          <mesh key={i} position={pos} rotation={rot}>
            <planeGeometry args={[0.8, 0.8]} />
            <meshStandardMaterial color={COLORS[color]} emissive={COLORS[color]} emissiveIntensity={0.5} roughness={0.02} />
          </mesh>
        );
      })}
    </>
  );
}

function MiniCubeContent({ type }: { type: 'scramble' | 'solve' | 'manual' }) {
  const groupRef = useRef<THREE.Group>(null);
  const cubieRefs = useRef<Map<string, THREE.Group>>(new Map());

  const cubies = useMemo(() => {
    const list: CubieData[] = [];
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const mats = ['black', 'black', 'black', 'black', 'black', 'black'];
          if (x === 1) mats[0] = 'red';
          if (x === -1) mats[1] = 'orange';
          if (y === 1) mats[2] = 'white';
          if (y === -1) mats[3] = 'yellow';
          if (z === 1) mats[4] = 'green';
          if (z === -1) mats[5] = 'blue';
          list.push({ 
            id: `${x},${y},${z}`,
            initialPos: new THREE.Vector3(x, y, z),
            mats 
          });
        }
      }
    }
    return list;
  }, []);

  const moveState = useRef({
    active: false,
    progress: 0,
    axis: new THREE.Vector3(),
    predicate: (_p: THREE.Vector3) => false as boolean,
    angle: 0,
    timer: 0
  });

  const moveOptions = [
    { axis: new THREE.Vector3(1, 0, 0), pred: (p: THREE.Vector3) => p.x > 0.5 },
    { axis: new THREE.Vector3(-1, 0, 0), pred: (p: THREE.Vector3) => p.x < -0.5 },
    { axis: new THREE.Vector3(0, 1, 0), pred: (p: THREE.Vector3) => p.y > 0.5 },
    { axis: new THREE.Vector3(0, -1, 0), pred: (p: THREE.Vector3) => p.y < -0.5 },
    { axis: new THREE.Vector3(0, 0, 1), pred: (p: THREE.Vector3) => p.z > 0.5 },
    { axis: new THREE.Vector3(0, 0, -1), pred: (p: THREE.Vector3) => p.z < -0.5 },
  ];

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (type === 'solve') {
      groupRef.current.rotation.y += delta * 1.5;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      return;
    }

    const m = moveState.current;
    
    if (!m.active) {
      m.timer += delta;
      const waitTime = type === 'scramble' ? 0.05 : 1.2;
      
      if (m.timer > waitTime) {
        if (type === 'manual') {
            // Reset all cubies to initial positions
            cubieRefs.current.forEach((ref, id) => {
                const [x, y, z] = id.split(',').map(Number);
                ref.position.set(x, y, z);
                ref.quaternion.set(0, 0, 0, 1);
            });
        }

        const move = moveOptions[Math.floor(Math.random() * moveOptions.length)];
        m.axis.copy(move.axis);
        m.predicate = move.pred;
        m.angle = Math.PI / 2;
        m.progress = 0;
        m.active = true;
        m.timer = 0;
      }
    } else {
      const speed = type === 'scramble' ? 12 : 4;
      const step = Math.min(delta * speed, 1 - m.progress);
      m.progress += step;

      const qStep = new THREE.Quaternion().setFromAxisAngle(m.axis, m.angle * step);
      
      cubieRefs.current.forEach((ref) => {
        if (m.predicate(ref.position)) {
          ref.position.applyAxisAngle(m.axis, m.angle * step);
          ref.quaternion.premultiply(qStep);
        }
      });

      if (m.progress >= 1) {
        // Snap positions to prevent drift
        cubieRefs.current.forEach((ref) => {
          ref.position.x = Math.round(ref.position.x);
          ref.position.y = Math.round(ref.position.y);
          ref.position.z = Math.round(ref.position.z);
          ref.quaternion.normalize();
        });
        m.active = false;
      }
    }
  });

  return (
    <group ref={groupRef} scale={0.6}>
      {cubies.map((c) => (
        <group 
          key={c.id} 
          position={c.initialPos}
          ref={(el) => {
            if (el) cubieRefs.current.set(c.id, el);
            else cubieRefs.current.delete(c.id);
          }}
        >
          <CubieMesh materials={c.mats} />
        </group>
      ))}
    </group>
  );
}

export function MiniCube({ type, className = "" }: { type: 'scramble' | 'solve' | 'manual', className?: string }) {
  return (
    <div className={`w-10 h-10 ${className}`}>
      <Canvas 
        camera={{ position: [3, 3, 3], fov: 45 }} 
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={1.5} />
        <pointLight position={[5, 5, 5]} intensity={2} />
        <MiniCubeContent type={type} />
      </Canvas>
    </div>
  );
}
