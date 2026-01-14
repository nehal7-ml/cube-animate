import * as THREE from 'three';

export type FaceName = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
export type Color = 'white' | 'yellow' | 'orange' | 'red' | 'green' | 'blue';

export interface Cubie {
  id: number;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  materials: (Color | null)[]; 
}

export interface CubeState {
  cubies: Cubie[];
}

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);

export function createCube(cubies?: Cubie[]): CubeState {
    if (cubies) {
      return {
          cubies: cubies.map(c => ({
            id: c.id,
            position: c.position.clone(),
            quaternion: c.quaternion.clone(),
            materials: [...c.materials]
          }))
      };
    }
    return { cubies: initCubies() };
}

function initCubies(): Cubie[] {
    const cubies: Cubie[] = [];
    let id = 0;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const mats: (Color | null)[] = [null, null, null, null, null, null];
          if (x === 1) mats[0] = 'red';
          if (x === -1) mats[1] = 'orange';
          if (y === 1) mats[2] = 'white';
          if (y === -1) mats[3] = 'yellow';
          if (z === 1) mats[4] = 'green';
          if (z === -1) mats[5] = 'blue';

          cubies.push({
            id: id++,
            position: new THREE.Vector3(x, y, z),
            quaternion: new THREE.Quaternion(), // Identity
            materials: mats
          });
        }
      }
    }
    return cubies;
}

export function applyMove(state: CubeState, move: string): CubeState {
    // Clone state
    const next = createCube(state.cubies);
    
    // Parse move
    const baseMove = move[0];
    const isPrime = move.includes("'");
    const isDouble = move.includes("2");

    let axis: THREE.Vector3;
    let predicate: (pos: THREE.Vector3) => boolean;
    let angle = Math.PI / 2;

    if (isPrime) angle = -Math.PI / 2;
    if (isDouble) angle = Math.PI;

    // Handle Double Layer Moves by recursion
    if (baseMove >= 'a' && baseMove <= 'z') {
        const upper = baseMove.toUpperCase();
        const suffix = isPrime ? "'" : (isDouble ? "2" : "");
        const invSuffix = isPrime ? "" : (isDouble ? "2" : "'");

        if (upper === 'U') return applyMove(applyMove(next, 'U' + suffix), 'E' + invSuffix);
        if (upper === 'D') return applyMove(applyMove(next, 'D' + suffix), 'E' + suffix);
        if (upper === 'R') return applyMove(applyMove(next, 'R' + suffix), 'M' + invSuffix);
        if (upper === 'L') return applyMove(applyMove(next, 'L' + suffix), 'M' + suffix);
        if (upper === 'F') return applyMove(applyMove(next, 'F' + suffix), 'S' + suffix);
        if (upper === 'B') return applyMove(applyMove(next, 'B' + suffix), 'S' + invSuffix);
    }

    switch (baseMove) {
      case 'R': axis = AXIS_X; predicate = p => Math.round(p.x) === 1; angle *= -1; break;
      case 'L': axis = AXIS_X; predicate = p => Math.round(p.x) === -1; angle *= 1; break;
      case 'U': axis = AXIS_Y; predicate = p => Math.round(p.y) === 1; angle *= -1; break;
      case 'D': axis = AXIS_Y; predicate = p => Math.round(p.y) === -1; angle *= 1; break;
      case 'F': axis = AXIS_Z; predicate = p => Math.round(p.z) === 1; angle *= -1; break;
      case 'B': axis = AXIS_Z; predicate = p => Math.round(p.z) === -1; angle *= 1; break;
      case 'M': axis = AXIS_X; predicate = p => Math.round(p.x) === 0; angle *= 1; break;
      case 'E': axis = AXIS_Y; predicate = p => Math.round(p.y) === 0; angle *= 1; break;
      case 'S': axis = AXIS_Z; predicate = p => Math.round(p.z) === 0; angle *= -1; break;
      default: return next;
    }

    const qRot = new THREE.Quaternion();
    qRot.setFromAxisAngle(axis, angle);

    next.cubies.forEach(c => {
      if (predicate(c.position)) {
        c.position.applyAxisAngle(axis, angle);
        c.position.x = Math.round(c.position.x);
        c.position.y = Math.round(c.position.y);
        c.position.z = Math.round(c.position.z);
        
        c.quaternion.premultiply(qRot);
        c.quaternion.normalize();
      }
    });

    return next;
}

export function getSolverString(state: CubeState): string {
    const getFaceColors = (face: FaceName): Color[] => {
      const colors: Color[] = [];
      let start: THREE.Vector3, rowDir: THREE.Vector3, colDir: THREE.Vector3;
      let faceNormal: THREE.Vector3;

      switch (face) {
        case 'U': // y=1
            faceNormal = new THREE.Vector3(0, 1, 0);
            start = new THREE.Vector3(-1, 1, -1);
            colDir = new THREE.Vector3(1, 0, 0);
            rowDir = new THREE.Vector3(0, 0, 1);
            break;
        case 'D': // y=-1
            faceNormal = new THREE.Vector3(0, -1, 0);
            start = new THREE.Vector3(-1, -1, 1); 
            colDir = new THREE.Vector3(1, 0, 0);
            rowDir = new THREE.Vector3(0, 0, -1); 
            break;
        case 'L': // x=-1
            faceNormal = new THREE.Vector3(-1, 0, 0);
            start = new THREE.Vector3(-1, 1, -1); 
            colDir = new THREE.Vector3(0, 0, 1); 
            rowDir = new THREE.Vector3(0, -1, 0); 
            break;
        case 'R': // x=1
            faceNormal = new THREE.Vector3(1, 0, 0);
            start = new THREE.Vector3(1, 1, 1); 
            colDir = new THREE.Vector3(0, 0, -1); 
            rowDir = new THREE.Vector3(0, -1, 0); 
            break;
        case 'F': // z=1
            faceNormal = new THREE.Vector3(0, 0, 1);
            start = new THREE.Vector3(-1, 1, 1); 
            colDir = new THREE.Vector3(1, 0, 0); 
            rowDir = new THREE.Vector3(0, -1, 0); 
            break;
        case 'B': // z=-1
            faceNormal = new THREE.Vector3(0, 0, -1);
            start = new THREE.Vector3(1, 1, -1); 
            colDir = new THREE.Vector3(-1, 0, 0); 
            rowDir = new THREE.Vector3(0, -1, 0); 
            break;
        default: throw new Error("Invalid face");
      }

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const targetPos = start.clone()
            .addScaledVector(rowDir, r)
            .addScaledVector(colDir, c);
          
          const cubie = state.cubies.find(cubie => cubie.position.distanceToSquared(targetPos) < 0.1);
          if (!cubie) {
              // Should not happen for a valid cube
              continue;
          }

          const localNormal = faceNormal.clone().applyQuaternion(cubie.quaternion.clone().invert());
          let color: Color | null = null;
          if (localNormal.x > 0.9) color = cubie.materials[0];
          else if (localNormal.x < -0.9) color = cubie.materials[1];
          else if (localNormal.y > 0.9) color = cubie.materials[2];
          else if (localNormal.y < -0.9) color = cubie.materials[3];
          else if (localNormal.z > 0.9) color = cubie.materials[4];
          else if (localNormal.z < -0.9) color = cubie.materials[5];
          
          if (color) colors.push(color);
        }
      }
      return colors;
    };

    // Get color of center for each face to build mapping
    const centers: Record<string, Color> = {
        U: getFaceColors('U')[4],
        R: getFaceColors('R')[4],
        F: getFaceColors('F')[4],
        D: getFaceColors('D')[4],
        L: getFaceColors('L')[4],
        B: getFaceColors('B')[4],
    };

    const colorToCode: Record<string, string> = {};
    Object.entries(centers).forEach(([face, color]) => {
        colorToCode[color] = face;
    });

    const mapFace = (face: FaceName) => getFaceColors(face).map(c => colorToCode[c] || 'X').join('');

    // Standard Solver Order: U R F D L B
    return mapFace('U') + mapFace('R') + mapFace('F') + mapFace('D') + mapFace('L') + mapFace('B');
}

export function generateScramble3D(): string[] {
    const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
    const modifiers = ['', "'", '2'];
    const moves: string[] = [];
    let lastFace = '';
  
    for (let i = 0; i < 20; i++) {
      let face = faces[Math.floor(Math.random() * faces.length)];
      while (face === lastFace) {
         face = faces[Math.floor(Math.random() * faces.length)];
      }
      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      moves.push(face + modifier);
      lastFace = face;
    }
    return moves;
}
