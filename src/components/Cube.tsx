import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { type CubeState, type Color, type Cubie } from '../logic/cube3d';

// Glossy Sticker Materials - Brighter & More Vibrant
const stickerMaterials: Record<Color, THREE.Material> = {
  white: new THREE.MeshPhysicalMaterial({ 
    color: '#ffffff', emissive: '#444444', roughness: 0.02, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.02 
  }),
  yellow: new THREE.MeshPhysicalMaterial({ 
    color: '#ffff00', emissive: '#444400', roughness: 0.02, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.02 
  }),
  orange: new THREE.MeshPhysicalMaterial({ 
    color: '#ff8800', emissive: '#442200', roughness: 0.02, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.02 
  }),
  red: new THREE.MeshPhysicalMaterial({ 
    color: '#ff0000', emissive: '#440000', roughness: 0.02, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.02 
  }),
  green: new THREE.MeshPhysicalMaterial({ 
    color: '#00ff00', emissive: '#004400', roughness: 0.02, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.02 
  }),
  blue: new THREE.MeshPhysicalMaterial({ 
    color: '#0088ff', emissive: '#002244', roughness: 0.02, metalness: 0.1, clearcoat: 1.0, clearcoatRoughness: 0.02 
  }),
};

// Matte Black Plastic
const blackMaterial = new THREE.MeshStandardMaterial({ 
  color: '#1a1a1a', roughness: 0.6, metalness: 0.1 
});

interface Props {
  cube: CubeState;
  activeMove?: string;
  onMoveComplete?: () => void;
}

// Geometry for the base plastic cubie
const BaseCubie = () => (
  <RoundedBox
    args={[0.98, 0.98, 0.98]}
    radius={0.08}
    smoothness={4}
    material={blackMaterial}
    castShadow
    receiveShadow
  />
);

// Sticker Geometry Configuration
// Size 0.82 leaves visible black border (padding)
const STICKER_SIZE = 0.82;
const STICKER_OFFSET = 0.50; // Just slightly above the face (0.49 is face surface)
const stickerGeometry = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);

// Helper to render stickers for a single cubie
function CubieMesh({ cubie }: { cubie: Cubie }) {
  // We only render stickers where the material is not null
  const stickers = useMemo(() => {
    const list = [];
    // 0: Right (+x)
    if (cubie.materials[0]) list.push({ mat: cubie.materials[0]!, pos: [STICKER_OFFSET, 0, 0], rot: [0, Math.PI / 2, 0] });
    // 1: Left (-x)
    if (cubie.materials[1]) list.push({ mat: cubie.materials[1]!, pos: [-STICKER_OFFSET, 0, 0], rot: [0, -Math.PI / 2, 0] });
    // 2: Top (+y)
    if (cubie.materials[2]) list.push({ mat: cubie.materials[2]!, pos: [0, STICKER_OFFSET, 0], rot: [-Math.PI / 2, 0, 0] });
    // 3: Bottom (-y)
    if (cubie.materials[3]) list.push({ mat: cubie.materials[3]!, pos: [0, -STICKER_OFFSET, 0], rot: [Math.PI / 2, 0, 0] });
    // 4: Front (+z)
    if (cubie.materials[4]) list.push({ mat: cubie.materials[4]!, pos: [0, 0, STICKER_OFFSET], rot: [0, 0, 0] });
    // 5: Back (-z)
    if (cubie.materials[5]) list.push({ mat: cubie.materials[5]!, pos: [0, 0, -STICKER_OFFSET], rot: [0, Math.PI, 0] });
    
    return list;
  }, [cubie.materials]);

  return (
    <group>
      <BaseCubie />
      {stickers.map((s, i) => (
        <mesh 
          key={i} 
          geometry={stickerGeometry} 
          material={stickerMaterials[s.mat]} 
          position={s.pos as [number, number, number]} 
          rotation={s.rot as [number, number, number]} 
        />
      ))}
    </group>
  );
}

export function VisualCube({ cube, activeMove, onMoveComplete }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const cubieRefs = useRef<Map<number, THREE.Object3D>>(new Map());
  
  const animationProgress = useRef(0);
  const isAnimating = useRef(false);
  const currentMoveParams = useRef<{ axis: THREE.Vector3, ids: number[], angle: number } | null>(null);
  
  // New ref to prevent double firing and handle sync
  const hasTriggeredComplete = useRef(false);
  // Ref to track which cube state we are animating FROM
  const animatingCubeRef = useRef<CubeState | null>(null);

  // RESET LOGIC: When cube updates, the logical state has caught up with visual.
  useEffect(() => {
      isAnimating.current = false;
      animationProgress.current = 0;
      currentMoveParams.current = null;
      hasTriggeredComplete.current = false;
      animatingCubeRef.current = null;
  }, [cube]);

  // START LOGIC
  useEffect(() => {
    if (!activeMove || isAnimating.current) return;

    // Capture the state we are starting to animate
    animatingCubeRef.current = cube;

    const baseMove = activeMove[0];
    const isPrime = activeMove.includes("'");
    const isDouble = activeMove.includes("2");

    let axis = new THREE.Vector3();
    let predicate: (c: Cubie) => boolean;
    let angleDir = 1;

    switch (baseMove) {
        case 'R': axis.set(1, 0, 0); predicate = c => Math.round(c.position.x) === 1; angleDir = -1; break;
        case 'L': axis.set(1, 0, 0); predicate = c => Math.round(c.position.x) === -1; angleDir = 1; break;
        case 'U': axis.set(0, 1, 0); predicate = c => Math.round(c.position.y) === 1; angleDir = -1; break;
        case 'D': axis.set(0, 1, 0); predicate = c => Math.round(c.position.y) === -1; angleDir = 1; break;
        case 'F': axis.set(0, 0, 1); predicate = c => Math.round(c.position.z) === 1; angleDir = -1; break;
        case 'B': axis.set(0, 0, 1); predicate = c => Math.round(c.position.z) === -1; angleDir = 1; break;
        case 'M': axis.set(1, 0, 0); predicate = c => Math.round(c.position.x) === 0; angleDir = 1; break;
        case 'E': axis.set(0, 1, 0); predicate = c => Math.round(c.position.y) === 0; angleDir = 1; break;
        case 'S': axis.set(0, 0, 1); predicate = c => Math.round(c.position.z) === 0; angleDir = -1; break;
        default: return;
    }

    if (isPrime) angleDir *= -1;
    if (isDouble) angleDir *= 2; 

    const targetIds = cube.cubies.filter(predicate).map(c => c.id);

    currentMoveParams.current = {
        axis,
        ids: targetIds,
        angle: angleDir * (Math.PI / 2)
    };
    
    isAnimating.current = true;
    animationProgress.current = 0;
    hasTriggeredComplete.current = false;

  }, [activeMove]); 

  useFrame((_, delta) => {
    cube.cubies.forEach(c => {
        const obj = cubieRefs.current.get(c.id);
        if (obj) {
            obj.position.copy(c.position);
            obj.quaternion.copy(c.quaternion);

            if (isAnimating.current && currentMoveParams.current && currentMoveParams.current.ids.includes(c.id)) {
                // Safety check: Only apply animation if we are rendering the START state.
                // If 'cube' has updated (is different from animatingCubeRef.current), 
                // it means we have the NEW logical state (already rotated), so skip the extra rotation.
                if (cube === animatingCubeRef.current) {
                    const { axis, angle } = currentMoveParams.current;
                    const progress = animationProgress.current; 
                    const currentAngle = angle * progress;

                    obj.position.applyAxisAngle(axis, currentAngle);
                    const qRot = new THREE.Quaternion().setFromAxisAngle(axis, currentAngle);
                    obj.quaternion.premultiply(qRot);
                }
            }
        }
    });

    if (isAnimating.current) {
        const speed = 4.0; 
        animationProgress.current += delta * speed;
        
        if (animationProgress.current >= 1) {
            animationProgress.current = 1; // Clamp at 1
            if (!hasTriggeredComplete.current) {
                hasTriggeredComplete.current = true;
                if (onMoveComplete) onMoveComplete();
            }
            // Do NOT reset isAnimating here. Wait for new cube props.
        }
    }
  });

  return (
    <group ref={groupRef}>
      {cube.cubies.map((cubie) => (
        <group 
            key={cubie.id} 
            ref={el => { if(el) cubieRefs.current.set(cubie.id, el) }}
        >
            <CubieMesh cubie={cubie} />
        </group>
      ))}
    </group>
  );
}