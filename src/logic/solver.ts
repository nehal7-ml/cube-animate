import { getSolverString, type CubeState } from './cube3d';

export async function solve(state: CubeState): Promise<string[]> {
  const cubeString = getSolverString(state);
  // console.log("Solver String:", cubeString); // Debugging
  
  try {
    // Dynamic import to reduce initial bundle size
    // @ts-ignore
    const { default: solver } = await import('rubiks-cube-solver');
    
    const solution = solver(cubeString);
    if (!solution) return [];

    // The solver returns a string of moves like "Rprime U L2 ..."
    // We need to convert "prime" back to "'" and split into an array
    let moves = solution
      .replace(/prime/g, "'")
      .split(/\s+/)
      .filter((m: string) => m.length > 0);
    
    return moves;
  } catch (e) {
    console.error("Solver failed for state:", cubeString, e);
    return [];
  }
}
