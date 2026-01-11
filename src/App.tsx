import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { ContactShadows, PresentationControls } from '@react-three/drei';
import { useDrag } from '@use-gesture/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import * as THREE from 'three';
import { type CubeState, createCube, applyMove, generateScramble3D } from './logic/cube3d';
import { VisualCube } from './components/Cube';
import { solve } from './logic/solver';
import { useCubeSound } from './hooks/useCubeSound';
import { ManualControls } from './components/ManualControls';
import { About } from './components/About';
import { Toast } from './components/Toast';

// Component to handle responsive camera adjustments without remounting the Canvas
function ResponsiveCamera({ isMobile, isKeypadOpen }: { isMobile: boolean; isKeypadOpen: boolean }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(6, 4, 6));
  const targetFov = useRef(45);

  useEffect(() => {
    if (isMobile) {
      if (isKeypadOpen) {
        // Scale down on mobile when keypad is open
        targetPos.current.set(11, 9, 11);
        targetFov.current = 55;
      } else {
        targetPos.current.set(8, 6, 8);
        targetFov.current = 50;
      }
    } else {
      targetPos.current.set(6, 4, 6);
      targetFov.current = 45;
    }
  }, [isMobile, isKeypadOpen]);

  useFrame((_, delta) => {
    // Smoothly interpolate camera position
    camera.position.lerp(targetPos.current, 5 * delta);
    
    // Smoothly interpolate FOV
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov.current, 5 * delta);
    
    camera.lookAt(0, 0, 0); // Keep looking at center
    cam.updateProjectionMatrix();
  });

  return null;
}

// Helper to expand complex moves
function expandMoves(moves: string[]): string[] {
  const expanded: string[] = [];
  moves.forEach(move => {
     const baseChar = move[0];
     if (baseChar >= 'a' && baseChar <= 'z') {
        const isPrime = move.includes("'");
        const isDouble = move.includes("2");
        const suffix = isDouble ? "2" : (isPrime ? "'" : "");
        const invSuffix = isDouble ? "2" : (isPrime ? "" : "'");
        
        let parts: string[] = [];
        switch(baseChar) {
            case 'u': parts = ['U'+suffix, 'E'+invSuffix]; break;
            case 'd': parts = ['D'+suffix, 'E'+suffix]; break;
            case 'r': parts = ['R'+suffix, 'M'+invSuffix]; break;
            case 'l': parts = ['L'+suffix, 'M'+suffix]; break;
            case 'f': parts = ['F'+suffix, 'S'+suffix]; break;
            case 'b': parts = ['B'+suffix, 'S'+invSuffix]; break;
        }
        if (parts.length > 0) {
            parts.forEach(p => {
                if (p.endsWith('2')) {
                    const b = p.slice(0, -1);
                    expanded.push(b, b);
                } else {
                    expanded.push(p);
                }
            });
            return;
        }
     }
     if (move.endsWith('2')) {
        const base = move.slice(0, -1);
        expanded.push(base, base);
        return;
     }
     expanded.push(move);
  });
  return expanded;
}

interface MoveData {
  move: string;
  source: 'user' | 'scramble' | 'solution';
}

function App() {
  const [cube, setCube] = useState<CubeState>(createCube());
  const [pastMoves, setPastMoves] = useState<MoveData[]>([]); 
  const [futureMoves, setFutureMoves] = useState<MoveData[]>([]); 
  const [isSolving, setIsSolving] = useState(false); 
  const [isScrambling, setIsScrambling] = useState(false);
  const [activeMove, setActiveMove] = useState<MoveData | undefined>(undefined);
  const [showKeypad, setShowKeypad] = useState(false);
  const [toastMsg, setToastMessage] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Draggable Manual Controls State (Imperative for performance)
  const manualControlsRef = useRef<HTMLDivElement>(null);
  // Store the *accumulated* offset here (persisted position)
  const manualPosRef = useRef<{ x: number, y: number }>( (() => {
    try {
        const saved = localStorage.getItem('manualControlsPos');
        return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch {
        return { x: 0, y: 0 };
    }
  })() );

  // We still need this to initialize the position on mount, but not for updates
  useEffect(() => {
    if (manualControlsRef.current && !isMobile) {
        const { x, y } = manualPosRef.current;
        manualControlsRef.current.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
    }
  }, [windowWidth]); // Re-apply on resize if needed (though isMobile handles switch)

  const bindDrag = useDrag(({ offset: [x, y], last }) => {
     if (manualControlsRef.current) {
        manualControlsRef.current.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
     }
     if (last) {
        manualPosRef.current = { x, y };
        localStorage.setItem('manualControlsPos', JSON.stringify({ x, y }));
     }
  }, {
    from: () => [manualPosRef.current.x, manualPosRef.current.y],
    filterTaps: true,
  });

  const playSound = useCubeSound();
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Responsive window resize handling
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // SEO Info
  const appTitle = "Rubik's Cube Solver & Animator";
  const appDescription = "Interactive 3D Rubik's Cube simulator with CFOP solver, realistic animations, and mechanical sound effects.";

  // Scroll logic: Keep active move visible
  useEffect(() => {
    if (timelineScrollRef.current) {
        const container = timelineScrollRef.current;
        if (activeMove || pastMoves.length > 0) {
             container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
        }
    }
  }, [pastMoves, activeMove]);

  // Animation Loop
  useEffect(() => {
    if (futureMoves.length > 0 && !activeMove) {
      const nextMove = futureMoves[0];
      setActiveMove(nextMove);
      playSound(nextMove.move);
    }
  }, [futureMoves, activeMove, playSound]);

  const onMoveComplete = useCallback(() => {
    if (!activeMove) return;
    setCube(prev => applyMove(prev, activeMove.move));
    setPastMoves(prev => [...prev, activeMove]);
    setFutureMoves(prev => {
        const remaining = prev.slice(1);
        if (remaining.length === 0) {
            setIsSolving(false);
            setIsScrambling(false);
        }
        return remaining;
    });
    setActiveMove(undefined);
  }, [activeMove]);

  const handleMove = (m: string) => {
    const moves = expandMoves([m]);
    setFutureMoves(prev => [...prev, ...moves.map(move => ({ move, source: 'user' } as MoveData))]);
  };

  const handleScramble = () => {
    if (activeMove || futureMoves.length > 0) return;
    const moves = generateScramble3D();
    const expanded = expandMoves(moves);
    setPastMoves([]);
    setFutureMoves(expanded.map(move => ({ move, source: 'scramble' })));
    setIsSolving(false);
    setIsScrambling(true);
  };

  const handleReset = () => {
    setPastMoves([]);
    setFutureMoves([]);
    setIsSolving(false);
    setIsScrambling(false);
    setActiveMove(undefined);
    setCube(createCube());
    setToastMessage("Cube Reset");
  };

  const handleSolve = async () => {
    if (activeMove || futureMoves.length > 0) return;
    
    // Set a temporary loading state or toast if needed, 
    // but the button is disabled while isBusy, which covers it?
    // Not exactly, we need to show we are "calculating".
    setToastMessage("Calculating solution...");
    
    try {
        const rawSolution = await solve(cube);
        if (rawSolution.length === 0) {
          setToastMessage("Cube is already solved!");
          return;
        }
        const expanded = expandMoves(rawSolution);
        setFutureMoves(expanded.map(move => ({ move, source: 'solution' })));
        setIsSolving(true);
        setIsScrambling(false);
        setToastMessage(null); // Clear calculating message
    } catch (error) {
        setToastMessage("Solver failed. Check console.");
    }
  };

  const isBusy = activeMove !== undefined || futureMoves.length > 0;

  // Determine Status Text
  let statusText = "Ready";
  let statusColor = "text-slate-500";
  
  if (isScrambling) {
      statusText = "Scrambling...";
      statusColor = "text-yellow-500";
  } else if (isSolving) {
      statusText = "Solving...";
      statusColor = "text-green-500";
  } else if (isBusy) {
      statusText = "Animating...";
      statusColor = "text-blue-400";
  }

  const isMobile = windowWidth < 768;

  return (
    <div className="h-[100dvh] w-full bg-slate-800 flex flex-col overflow-hidden font-sans text-slate-100">
      <Helmet>
        <title>{appTitle}</title>
        <meta name="description" content={appDescription} />
        <meta property="og:title" content={appTitle} />
        <meta property="og:description" content={appDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" /> 
      </Helmet>

      <Toast message={toastMsg} onClose={() => setToastMessage(null)} />

      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-slate-900/80 backdrop-blur border-b border-slate-800 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold shadow-lg">3x3</div>
          <h1 className="text-lg font-bold tracking-tight">Rubik's Animator</h1>
        </div>
        {/* Status Indicator in Header */}
        <div className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${statusColor}`}>
            {isBusy && <div className="w-2 h-2 rounded-full bg-current animate-ping"></div>}
            {statusText}
        </div>
      </header>
      
      <div className="flex-1 relative flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Canvas Area - Always takes remaining space */}
        <div className="flex-1 relative touch-none min-h-0 min-w-0">
          <Canvas 
            shadows 
            gl={{ antialias: true }} 
            style={{ touchAction: 'none' }}
          >
            <ResponsiveCamera isMobile={isMobile} isKeypadOpen={showKeypad} />
            <ambientLight intensity={1.5} />
            <directionalLight 
              position={[10, 20, 10]} 
              intensity={2} 
              castShadow 
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.001}
            />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            <pointLight position={[0, 5, 0]} intensity={1} distance={10} />
            
            <PresentationControls
              global={false}
              cursor={true}
              speed={2}
              rotation={[Math.PI / 6, -Math.PI / 4, 0]}
              polar={[-Infinity, Infinity]}
              azimuth={[-Infinity, Infinity]}
            >
              <VisualCube cube={cube} activeMove={activeMove?.move} onMoveComplete={onMoveComplete} />
            </PresentationControls>
            
            <ContactShadows 
              position={[0, -2.5, 0]} 
              opacity={0.7} 
              scale={20} 
              blur={2.5} 
              far={4.5} 
              color="#000000"
            />
          </Canvas>

          {/* Top Overlays - Absolute within Canvas Area */}
          <div className="absolute top-4 left-4 right-4 flex flex-col gap-4 pointer-events-none select-none z-10">
             
             {/* Box 1: History */}
             {(pastMoves.length > 0 || (activeMove && !isSolving)) && (
                <div className="flex-1 max-w-md bg-black/60 backdrop-blur p-4 rounded-lg border border-slate-700 pointer-events-auto shadow-lg">
                    <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">History / Scramble</div>
                    <div 
                        ref={timelineScrollRef}
                        className="flex overflow-x-auto gap-1 py-1 scrollbar-hide mask-linear-fade"
                    >
                        {pastMoves.map((m, i) => (
                            <span key={`past-${i}`} className={`shrink-0 px-2 py-1 rounded text-xs font-mono border ${
                                m.source === 'solution' ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-slate-800 text-slate-400 border-transparent'
                            }`}>
                                {m.move}
                            </span>
                        ))}
                        {activeMove && !isSolving && (
                            <span className="shrink-0 px-2 py-1 bg-yellow-500 text-black rounded text-xs font-mono font-bold animate-pulse">
                                {activeMove.move}
                            </span>
                        )}
                    </div>
                </div>
             )}

             {/* Box 2: CFOP Solution */}
             {(isSolving || (futureMoves.length > 0 && isSolving)) && (
               <div className="flex-1 max-w-md bg-green-900/40 backdrop-blur p-4 rounded-lg border border-green-500/30 pointer-events-auto shadow-lg">
                 <div className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                    <span>CFOP Solution</span>
                    <span>{futureMoves.length} left</span>
                 </div>
                 <div className="flex overflow-x-auto gap-2 py-1 scrollbar-hide">
                   {activeMove && isSolving && (
                     <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-yellow-500 text-black rounded font-mono font-bold text-sm scale-110 shadow-glow">
                       {activeMove.move}
                     </span>
                   )}
                   {futureMoves.map((m, i) => (
                     <span key={`future-${i}`} className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-800 text-slate-300 rounded font-mono text-sm border border-slate-700">
                       {m.move}
                     </span>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </div>

        {/* Keypad Area - Floating on Desktop, Drawer on Mobile */}
        {showKeypad && (
            <div 
                ref={manualControlsRef}
                className="relative md:absolute z-30 w-full md:w-auto md:bottom-auto md:top-1/2 md:right-4 md:-translate-y-1/2 animate-in slide-in-from-bottom md:animate-in md:fade-in md:zoom-in-95"
            >
                <ManualControls 
                    onMove={handleMove} 
                    onClose={() => setShowKeypad(false)} 
                    className="w-full md:w-80 lg:w-[480px] shadow-2xl rounded-t-2xl md:rounded-2xl border-t md:border border-slate-700"
                    extraHeaderProps={!isMobile ? bindDrag() : {}}
                />
            </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div className="bg-slate-900 border-t border-slate-800 flex flex-col shrink-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {/* Main Controls */}
        <div className="p-4 pb-6 safe-area-bottom flex gap-4 items-center justify-center">
            <button 
                onClick={handleReset} 
                disabled={isBusy}
                className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95 disabled:opacity-50"
                aria-label="Reset"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>

            <button 
                onClick={handleScramble} 
                disabled={isBusy}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-yellow-500 font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 16-4"/><path d="m2 8 2 16"/><path d="m22 8-2 16"/></svg>
                SCRAMBLE
            </button>

            <button 
                onClick={() => setShowKeypad(!showKeypad)}
                disabled={isBusy}
                className={`p-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 ${showKeypad ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'bg-slate-800 hover:bg-slate-700 text-blue-400'}`}
                aria-label="Manual Controls"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>

            <button 
                onClick={handleSolve} 
                disabled={isBusy}
                className="flex-[1.5] py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m7.8 16.2-2.9 2.9"/><path d="M6 12H2"/><path d="m7.8 7.8-2.9-2.9"/><circle cx="12" cy="12" r="3"/></svg>
                SOLVE
            </button>
        </div>
      </div>
    </div>
  );
}

export default App;