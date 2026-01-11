import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useDrag } from '@use-gesture/react';
import * as THREE from 'three';

export function ArcballRotator({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, gl, size } = useThree();
  const isDragging = useRef(false);
  const lastQuat = useRef(new THREE.Quaternion());

  // Project screen coords (x,y) to unit sphere
  const projectOnTrackball = (touchX: number, touchY: number) => {
    const mouseOnBall = new THREE.Vector3();
    const { width, height } = size;
    
    mouseOnBall.set(
      (touchX / width) * 2 - 1,
      -(touchY / height) * 2 + 1,
      0.0
    );

    const length = mouseOnBall.length();
    if (length > 1.0) {
      mouseOnBall.normalize();
    } else {
      mouseOnBall.z = Math.sqrt(1.0 - length * length);
    }
    return mouseOnBall;
  };

  useDrag(({ active, xy: [x, y], last: isLast, memo, first }) => {
    if (!groupRef.current) return;

    if (first) {
        isDragging.current = true;
        lastQuat.current.copy(groupRef.current.quaternion);
    }

    // Get previous coordinates from memo
    const [prevX, prevY] = memo || [x, y];
    
    if (active) {
        const v1 = projectOnTrackball(prevX, prevY);
        const v2 = projectOnTrackball(x, y);
        
        // Axis of rotation is cross product
        const axis = new THREE.Vector3().crossVectors(v1, v2);
        const angle = Math.acos(Math.min(1.0, v1.dot(v2))) * 3.0; // Multiplier for sensitivity

        if (angle > 0.001) {
            const deltaQuat = new THREE.Quaternion();
            
            // We need to bring the axis from Camera space to World space.
            axis.applyQuaternion(camera.quaternion);
            
            deltaQuat.setFromAxisAngle(axis.normalize(), angle);
            
            // Apply
            groupRef.current.quaternion.premultiply(deltaQuat);
        }
    }

    if (isLast) {
        isDragging.current = false;
    }

    return [x, y]; // Return current coords as memo for next frame
  }, { target: gl.domElement }); // Bind to canvas

  // Set initial view
  useEffect(() => {
      if (groupRef.current) {
          const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 6, -Math.PI / 4, 0));
          groupRef.current.quaternion.copy(q);
      }
  }, []);

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}