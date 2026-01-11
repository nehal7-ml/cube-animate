export type FaceName = 'U' | 'D' | 'L' | 'R' | 'F' | 'B';
export type Color = 'white' | 'yellow' | 'orange' | 'red' | 'green' | 'blue';

// Standard mapping: U:0, D:1, L:2, R:3, F:4, B:5
// Each face has 9 stickers (0-8)
export type CubeState = Record<FaceName, Color[]>;

export const initialState = (): CubeState => ({
  U: Array(9).fill('white'),
  D: Array(9).fill('yellow'),
  L: Array(9).fill('orange'),
  R: Array(9).fill('red'),
  F: Array(9).fill('green'),
  B: Array(9).fill('blue'),
});

// Helper to rotate an array 90 deg clockwise (for face turns)
const rotateArray = (arr: Color[]) => [
  arr[6], arr[3], arr[0],
  arr[7], arr[4], arr[1],
  arr[8], arr[5], arr[2]
];

export function applyMove(state: CubeState, move: string): CubeState {
  if (!move) return state;
  let next = JSON.parse(JSON.stringify(state));

  const baseMove = move[0];
  const suffix = move.slice(1);

  if (suffix === "'") {
    return applyMove(applyMove(applyMove(state, baseMove), baseMove), baseMove);
  }
  if (suffix === "2") {
    return applyMove(applyMove(state, baseMove), baseMove);
  }

  // Handle double-layer moves (lower case)
  // u, d, l, r, f, b
  if (baseMove === baseMove.toLowerCase() && baseMove !== baseMove.toUpperCase()) {
      const upper = baseMove.toUpperCase();
      switch (upper) {
          case 'U': return applyMove(applyMove(state, 'U'), 'Eprime');
          case 'D': return applyMove(applyMove(state, 'D'), 'E');
          case 'L': return applyMove(applyMove(state, 'L'), 'M');
          case 'R': return applyMove(applyMove(state, 'R'), "M'");
          case 'F': return applyMove(applyMove(state, 'F'), 'S');
          case 'B': return applyMove(applyMove(state, 'B'), "S'");
      }
  }

  switch (baseMove) {
    case 'U': {
      next.U = rotateArray(next.U);
      const f_row = [next.F[0], next.F[1], next.F[2]];
      const r_row = [next.R[0], next.R[1], next.R[2]];
      const b_row = [next.B[0], next.B[1], next.B[2]];
      const l_row = [next.L[0], next.L[1], next.L[2]];

      [next.F[0], next.F[1], next.F[2]] = r_row;
      [next.L[0], next.L[1], next.L[2]] = f_row;
      [next.B[0], next.B[1], next.B[2]] = l_row;
      [next.R[0], next.R[1], next.R[2]] = b_row;
      break;
    }
    case 'D': {
      next.D = rotateArray(next.D);
      const f_row = [next.F[6], next.F[7], next.F[8]];
      const r_row = [next.R[6], next.R[7], next.R[8]];
      const b_row = [next.B[6], next.B[7], next.B[8]];
      const l_row = [next.L[6], next.L[7], next.L[8]];

      [next.F[6], next.F[7], next.F[8]] = l_row;
      [next.R[6], next.R[7], next.R[8]] = f_row;
      [next.B[6], next.B[7], next.B[8]] = r_row;
      [next.L[6], next.L[7], next.L[8]] = b_row;
      break;
    }
    case 'L': {
      next.L = rotateArray(next.L);
      const u_col = [next.U[0], next.U[3], next.U[6]];
      const f_col = [next.F[0], next.F[3], next.F[6]];
      const d_col = [next.D[0], next.D[3], next.D[6]];
      const b_col = [next.B[8], next.B[5], next.B[2]]; // B col is inverted relative to U

      [next.F[0], next.F[3], next.F[6]] = u_col;
      [next.D[0], next.D[3], next.D[6]] = f_col;
      [next.B[8], next.B[5], next.B[2]] = d_col;
      [next.U[0], next.U[3], next.U[6]] = b_col;
      break;
    }
    case 'R': {
      next.R = rotateArray(next.R);
      const u_col = [next.U[2], next.U[5], next.U[8]];
      const f_col = [next.F[2], next.F[5], next.F[8]];
      const d_col = [next.D[2], next.D[5], next.D[8]];
      const b_col = [next.B[6], next.B[3], next.B[0]];

      [next.U[2], next.U[5], next.U[8]] = f_col;
      [next.F[2], next.F[5], next.F[8]] = d_col;
      [next.D[2], next.D[5], next.D[8]] = b_col;
      [next.B[6], next.B[3], next.B[0]] = u_col;
      break;
    }
    case 'F': {
      next.F = rotateArray(next.F);
      const u_row = [next.U[6], next.U[7], next.U[8]];
      const r_col = [next.R[0], next.R[3], next.R[6]];
      const d_row = [next.D[2], next.D[1], next.D[0]];
      const l_col = [next.L[8], next.L[5], next.L[2]];

      [next.R[0], next.R[3], next.R[6]] = u_row;
      [next.D[2], next.D[1], next.D[0]] = r_col;
      [next.L[8], next.L[5], next.L[2]] = d_row;
      [next.U[6], next.U[7], next.U[8]] = l_col;
      break;
    }
    case 'B': {
      next.B = rotateArray(next.B);
      const u_row = [next.U[2], next.U[1], next.U[0]];
      const r_col = [next.R[8], next.R[5], next.R[2]];
      const d_row = [next.D[6], next.D[7], next.D[8]];
      const l_col = [next.L[0], next.L[3], next.L[6]];

      [next.L[0], next.L[3], next.L[6]] = u_row;
      [next.D[6], next.D[7], next.D[8]] = l_col;
      [next.R[8], next.R[5], next.R[2]] = d_row;
      [next.U[2], next.U[1], next.U[0]] = r_col;
      break;
    }
    // Middle moves (simplified: they are just swaps)
    case 'M': {
        // M is between L and R, follows L
        const u_mid = [next.U[1], next.U[4], next.U[7]];
        const f_mid = [next.F[1], next.F[4], next.F[7]];
        const d_mid = [next.D[1], next.D[4], next.D[7]];
        const b_mid = [next.B[7], next.B[4], next.B[1]];

        [next.F[1], next.F[4], next.F[7]] = u_mid;
        [next.D[1], next.D[4], next.D[7]] = f_mid;
        [next.B[7], next.B[4], next.B[1]] = d_mid;
        [next.U[1], next.U[4], next.U[7]] = b_mid;
        break;
    }
    case 'E': {
        // E is between U and D, follows D
        const f_mid = [next.F[3], next.F[4], next.F[5]];
        const r_mid = [next.R[3], next.R[4], next.R[5]];
        const b_mid = [next.B[3], next.B[4], next.B[5]];
        const l_mid = [next.L[3], next.L[4], next.L[5]];

        [next.F[3], next.F[4], next.F[5]] = l_mid;
        [next.R[3], next.R[4], next.R[5]] = f_mid;
        [next.B[3], next.B[4], next.B[5]] = r_mid;
        [next.L[3], next.L[4], next.L[5]] = b_mid;
        break;
    }
    case 'S': {
        // S is between F and B, follows F
        const u_mid = [next.U[3], next.U[4], next.U[5]];
        const r_mid = [next.R[1], next.R[4], next.R[7]];
        const d_mid = [next.D[5], next.D[4], next.D[3]];
        const l_mid = [next.L[7], next.L[4], next.L[1]];

        [next.R[1], next.R[4], next.R[7]] = u_mid;
        [next.D[5], next.D[4], next.D[3]] = r_mid;
        [next.L[7], next.L[4], next.L[1]] = d_mid;
        [next.U[3], next.U[4], next.U[5]] = l_mid;
        break;
    }
    case 'Eprime': return applyMove(applyMove(applyMove(state, 'E'), 'E'), 'E');
    case 'Mprime': return applyMove(applyMove(applyMove(state, 'M'), 'M'), 'M');
    case 'Sprime': return applyMove(applyMove(applyMove(state, 'S'), 'S'), 'S');
  }

  return next;
}

export function generateScramble(length: number = 20): string[] {
  const faces = ['U', 'D', 'L', 'R', 'F', 'B'];
  const modifiers = ['', "'", '2'];
  const moves: string[] = [];
  let lastFace = '';

  for (let i = 0; i < length; i++) {
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
