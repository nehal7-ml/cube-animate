# Rubik's Animate 🎲

> An interactive 3D Rubik's Cube simulator, scrambler, and solver with real-time animations and step-by-step solutions.

![React](https://img.shields.io/badge/react-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/typescript-5-blue?style=flat-square&logo=typescript)
![Three.js](https://img.shields.io/badge/three.js-latest-blue?style=flat-square&logo=three.js)
![Vite](https://img.shields.io/badge/vite-latest-blue?style=flat-square&logo=vite)

## Features

- 🎨 **3D Interactive Visualization** - Fully rendered Rubik's Cube with smooth animations using Three.js
- 🔀 **Cube Scrambler** - Generate random scrambles and visualize them in real-time
- 🤖 **CFOP Solver** - Automatic solving using the Fridrich method with step-by-step solution playback
- 🎮 **Manual Control** - Rotate individual faces with intuitive mouse/touch gestures
- 📱 **Responsive Design** - Adapts seamlessly from mobile to desktop screens
- 🔊 **Audio Feedback** - Satisfying click sounds for each move
- ⚡ **Smooth Animations** - Hardware-accelerated 3D rendering with 60 FPS animations

## Tech Stack

| Tool | Purpose |
|------|---------|
| **React 19** | UI framework and component management |
| **TypeScript** | Type-safe development experience |
| **Three.js** | 3D graphics rendering |
| **React Three Fiber** | React renderer for Three.js |
| **Drei** | Useful helpers for React Three Fiber |
| **Tailwind CSS v4** | Utility-first styling |
| **Vite** | Lightning-fast build tool and dev server |
| **Bun** | Fast JavaScript runtime and package manager |
| **rubiks-cube-solver** | CFOP solving algorithm |
| **use-gesture** | Gesture recognition for interactions |

## Getting Started

### Prerequisites
- **Node.js** 18+ or **Bun** installed
- A modern browser with WebGL support

### Installation

```bash
# Clone the repository
git clone https://github.com/nehal7-ml/cube-animate.git
cd cube-animate

# Install dependencies
bun install
```

### Development

```bash
# Start development server with hot module reloading
bun dev
```

The app will open at `http://localhost:5173`

### Production Build

```bash
# Type-check and build for production
bun run build

# Preview production build locally
bun run preview
```

### Code Quality

```bash
# Run ESLint to check for code issues
bun run lint
```

## Project Structure

```
src/
├── App.tsx                 # Main app component, state management & layout
├── components/
│   └── Cube.tsx           # 3D cube visualization and animation logic
├── logic/
│   ├── cube.ts            # Cube state logic and move implementation
│   ├── cube3d.ts          # 3D transformations (positions/quaternions)
│   └── solver.ts          # Solver interface and integration
├── hooks/
│   └── useCubeSound.ts    # Audio feedback for moves
└── App.css
```

## How It Works

### Cube State Management
The application uses a dual-representation system:
- **Logical State** (`src/logic/cube.ts`): Tracks the cube's state mathematically
- **3D State** (`src/logic/cube3d.ts`): Maps logical state to 3D positions and rotations

### Animation Pipeline
1. A move is queued (either from user input, scramble, or solver)
2. `VisualCube` animates the move smoothly over ~300ms
3. On completion, `onMoveComplete` callback triggers the next move
4. The logical state updates after animation finishes

### Solving
1. User initiates solver
2. Solver runs asynchronously using the CFOP method
3. Solution moves populate a "future moves" queue
4. Each move animates and plays out sequentially
5. User can watch the entire solution play out automatically

## Usage

### Manual Control
- **Mouse**: Click and drag to rotate the cube
- **Touch**: Swipe to rotate individual faces or the entire cube

### Scramble
- Click the "Scramble" button to generate and apply a random scramble

### Solve
- Click the "Solve" button to generate and execute a solution
- Watch the solver work in real-time with smooth animations

## Performance

- **Optimized Rendering**: Uses `useFrame` for high-frequency updates without blocking the main thread
- **Gesture Handling**: Debounced and optimized gesture recognition
- **Responsive Canvas**: Dynamic camera adjustments based on viewport size
- **Audio**: Lazy-loaded and cached audio samples

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ✅ Full support |
| Edge | ✅ Full support |
| Mobile Browsers | ✅ Full support |

*Requires WebGL support*

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

MIT © 2024 Nehal SK

## Acknowledgments

- Inspired by the Rubik's Cube speedcubing community
- Built with [react-three/fiber](https://docs.pmnd.rs/react-three-fiber/) and [Three.js](https://threejs.org/)
- Solving algorithm from [rubiks-cube-solver](https://github.com/muodov/rubiks-cube-solver)
