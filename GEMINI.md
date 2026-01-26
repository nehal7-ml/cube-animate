# Rubik's Animate - Project Context

## Overview
`rubiks-animate` is an interactive 3D Rubik's Cube simulator and solver built with React, TypeScript, and Three.js. It features realistic 3D animations, a CFOP solver, manual control support, and a responsive UI.

## Tech Stack
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **3D Graphics:** `three`, `@react-three/fiber`, `@react-three/drei`
- **Logic:** Custom cube logic + `rubiks-cube-solver`
- **Interactions:** `@use-gesture/react`
- **Package Manager:** Bun

## Key Directories & Files
- **`src/App.tsx`**: Main entry point for application logic, state management (moves history, future moves), and UI layout.
- **`src/components/Cube.tsx`**: Contains the `VisualCube` component, handling the 3D rendering of the cube, individual cubies, stickers, and animations.
- **`src/logic/cube.ts`**: Defines the logical state of the cube (`CubeState`) and implements move logic (U, D, L, R, F, B, M, E, S).
- **`src/logic/cube3d.ts`**: Handles the 3D specific state (positions/quaternions) mapping to logical state.
- **`src/logic/solver.ts`**: Interface for the solving algorithm.
- **`src/hooks/useCubeSound.ts`**: Handles audio feedback for moves.

## Development Scripts
| Command | Description |
| :--- | :--- |
| `bun dev` | Starts the local development server (Vite). |
| `bun run build` | Type-checks and builds the application for production. |
| `bun run preview` | Previews the production build locally. |
| `bun run lint` | Runs ESLint to check for code quality issues. |

## Coding Conventions
- **State Management**: Mixed approach. `useState` for UI/React state, `useRef` for high-frequency animation updates (Three.js `useFrame`).
- **3D Logic**: `VisualCube` decouples rendering from logical state updates to handle smooth animations.
- **Styling**: Tailwind CSS utility classes are used extensively.
- **Types**: Strict TypeScript usage for Cube states (`CubeState`), Moves, and Props.

## Architecture Notes
- **Animation Loop**: The app uses a "future moves" queue system. `App.tsx` feeds moves to `VisualCube` one by one. `VisualCube` animates the move and calls `onMoveComplete` to trigger the next one.
- **Solver**: The solver runs asynchronously and populates the "future moves" queue with the solution path.
- **Responsive Design**: The camera position and FOV adjust dynamically based on screen width (Mobile vs Desktop).
