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

// SVG Assets
import ScrambleIcon from './assets/cube_of_rubik_1.svg';
import SolveIcon from './assets/kubas.svg';

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
  index?: number; // Added to fix highlighting logic
}

function App() {
  const [cube, setCube] = useState<CubeState>(createCube());
  const [pastMoves, setPastMoves] = useState<MoveData[]>([]); 
  const [futureMoves, setFutureMoves] = useState<MoveData[]>([]); 
  const [solutionToDisplay, setSolutionToDisplay] = useState<MoveData[]>([]); 
  const [isSolving, setIsSolving] = useState(false); 
  const [isScrambling, setIsScrambling] = useState(false);
  const [activeMove, setActiveMove] = useState<MoveData | undefined>(undefined);
  const [showKeypad, setShowKeypad] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [toastMsg, setToastMessage] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Refs for scrolling logic
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const solutionScrollRef = useRef<HTMLDivElement>(null);
  const activeHistoryRef = useRef<HTMLSpanElement>(null);
  const activeSolutionRef = useRef<HTMLSpanElement>(null);

  // Auto-centering scroll logic
  useEffect(() => {
    if (activeHistoryRef.current) {
        activeHistoryRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeMove, pastMoves]);

  useEffect(() => {
    if (activeSolutionRef.current) {
        activeSolutionRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeMove, solutionToDisplay]);

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

  // Responsive window resize handling
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // SEO Info
  const appTitle = "Rubik's Cube Solver & Animator";
  const appDescription = "Interactive 3D Rubik's Cube simulator with CFOP solver, realistic animations, and mechanical sound effects.";

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
    setSolutionToDisplay([]); 
    setFutureMoves(expanded.map(move => ({ move, source: 'scramble' })));
    setIsSolving(false);
    setIsScrambling(true);
  };

  const handleReset = () => {
    setPastMoves([]);
    setFutureMoves([]);
    setSolutionToDisplay([]); 
    setIsSolving(false);
    setIsScrambling(false);
    setActiveMove(undefined);
    setCube(createCube());
    setToastMessage("Cube Reset");
  };

  const handleSolve = async () => {
    if (activeMove || futureMoves.length > 0) return;
    
    setToastMessage("Calculating solution...");
    
    try {
        const rawSolution = await solve(cube);
        if (rawSolution.length === 0) {
          setToastMessage("Cube is already solved!");
          return;
        }
        const expanded = expandMoves(rawSolution);
        const solutionMoves = expanded.map((move, i) => ({ move, source: 'solution', index: i } as MoveData));
        setFutureMoves(solutionMoves);
        setSolutionToDisplay(solutionMoves); 
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
  let statusColor = "text-slate-400";
  
  if (isScrambling) {
      statusText = "Scrambling...";
      statusColor = "text-neon-yellow animate-pulse";
  } else if (isSolving) {
      statusText = "Solving...";
      statusColor = "text-neon-green animate-pulse";
  } else if (isBusy) {
      statusText = "Animating...";
      statusColor = "text-neon-cyan";
  }

  const isMobile = windowWidth < 768;

  return (
    <div className="h-[100dvh] w-full bg-vegas-gradient animate-gradient-x flex flex-col overflow-hidden font-sans text-slate-100">
      <Helmet>
        <title>{appTitle}</title>
        <meta name="description" content={appDescription} />
        <meta property="og:title" content={appTitle} />
        <meta property="og:description" content={appDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" /> 
      </Helmet>

      <Toast message={toastMsg} onClose={() => setToastMessage(null)} />

      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-vegas-black/80 backdrop-blur border-b border-neon-pink/30 shrink-0 z-20 shadow-lg shadow-neon-pink/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-pink rounded-lg flex items-center justify-center text-xs font-bold shadow-neon-pink text-white">3x3</div>
          <h1 className="text-lg font-bold tracking-tight text-white">Rubik's Animator</h1>
        </div>
        {/* Status Indicator & Help in Header */}
        <div className="flex items-center gap-4">
            <div className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${statusColor}`}>
                {isBusy && <div className="w-2 h-2 rounded-full bg-current animate-ping"></div>}
                {statusText}
            </div>
            <button 
                onClick={() => setShowAbout(true)}
                className="p-2 text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 rounded-full transition-colors"
                aria-label="Help"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            </button>
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
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#ff00ff" distance={30} />
            <pointLight position={[-10, 5, 10]} intensity={1.5} color="#00ffff" distance={30} />
            
            <directionalLight 
              position={[5, 10, 5]} 
              intensity={1} 
              castShadow 
              shadow-mapSize={[2048, 2048]}
              shadow-bias={-0.001}
            />
            
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
              color="#050510"
            />
          </Canvas>

          {/* Top Overlays - Absolute within Canvas Area */}
          <div className="absolute top-4 left-4 right-4 flex flex-col gap-4 pointer-events-none select-none z-10">
             
             {/* Box 1: History */}
             {(pastMoves.length > 0 || (activeMove && !isSolving)) && (
                <div className="flex-1 max-w-md bg-vegas-dark/90 backdrop-blur p-4 rounded-lg neon-border-pink pointer-events-auto shadow-lg transition-all duration-300 hover:scale-[1.02]">
                    <div className="text-neon-pink text-xs font-bold uppercase tracking-wider mb-2 px-2">History / Scramble</div>
                    <div 
                        ref={historyScrollRef}
                        className="flex overflow-x-auto gap-2 py-2 scrollbar-thin scrollbar-thumb-neon-pink scrollbar-track-transparent mask-bidirectional-fade"
                        style={{ paddingLeft: '45%', paddingRight: '45%' }}
                    >
                        {pastMoves.map((m, i) => (
                            <span 
                                key={`past-${i}`} 
                                ref={i === pastMoves.length - 1 && (!activeMove || isSolving) ? activeHistoryRef : null}
                                className={`shrink-0 px-3 py-1.5 rounded text-sm font-bold font-mono border transition-colors ${
                                    m.source === 'solution' ? 'bg-green-900/30 text-neon-green border-green-800' : 'bg-vegas-black text-slate-200 border-neon-pink/20 hover:border-neon-pink/60'
                                }`}
                            >
                                {m.move}
                            </span>
                        ))}
                        {activeMove && !isSolving && (
                            <span 
                                ref={activeHistoryRef}
                                className="shrink-0 px-3 py-1.5 bg-neon-yellow text-black rounded text-sm font-mono font-bold animate-pulse box-glow-yellow border border-neon-yellow"
                            >
                                {activeMove.move}
                            </span>
                        )}
                    </div>
                </div>
             )}

             {/* Box 2: CFOP Solution (Persistent) */}
             {(solutionToDisplay.length > 0) && (
               <div className="flex-1 max-w-md bg-vegas-dark/90 backdrop-blur p-4 rounded-lg neon-border-green pointer-events-auto shadow-lg transition-all duration-300 hover:scale-[1.02]">
                 <div className="text-neon-green text-xs font-bold uppercase tracking-wider mb-2 flex justify-between px-2">
                    <span>CFOP Solution</span>
                    <span>{solutionToDisplay.length} steps</span>
                 </div>
                 <div 
                    ref={solutionScrollRef}
                    className="flex overflow-x-auto gap-2 py-2 scrollbar-thin scrollbar-thumb-neon-green scrollbar-track-transparent mask-bidirectional-fade"
                    style={{ paddingLeft: '45%', paddingRight: '45%' }}
                 >
                   {solutionToDisplay.map((m, i) => {
                       const isCurrent = activeMove?.source === 'solution' && activeMove?.index === i;

                       return (
                         <span 
                            key={`sol-${i}`} 
                            ref={isCurrent ? activeSolutionRef : null}
                            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded font-mono font-bold text-sm border transition-all ${
                                isCurrent 
                                    ? 'bg-neon-yellow text-black box-glow-yellow border-neon-yellow scale-110 z-10'
                                    : 'bg-vegas-black text-neon-green border-neon-green/30 opacity-80'
                            }`}
                         >
                           {m.move}
                         </span>
                       );
                   })}
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
                    className="w-full md:w-80 lg:w-[480px] shadow-2xl rounded-t-2xl md:rounded-2xl border-t md:border neon-border-cyan bg-vegas-dark/95"
                    extraHeaderProps={!isMobile ? bindDrag() : {}}
                />
            </div>
        )}
      </div>

      {/* Bottom Panel */}
      <div className="bg-vegas-black border-t border-neon-cyan/20 flex flex-col shrink-0 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {/* Main Controls */}
        <div className="p-4 pb-6 safe-area-bottom flex gap-4 items-center justify-center">
            <button 
                onClick={handleReset} 
                disabled={isBusy}
                className="p-4 rounded-xl bg-transparent border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black hover:box-glow-cyan transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neon-cyan disabled:hover:shadow-none"
                aria-label="Reset"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>

            <button 
                onClick={handleScramble} 
                disabled={isBusy}
                className="flex-1 py-4 bg-transparent border border-neon-orange text-neon-orange font-bold rounded-xl hover:bg-neon-orange hover:text-black hover:box-glow-orange transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neon-orange disabled:hover:shadow-none flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(255,170,0,0.2)] group"
            >
                <img src={ScrambleIcon} alt="" className="w-6 h-6 invert group-hover:brightness-0" />
                SCRAMBLE
            </button>

            <button 
                onClick={() => setShowKeypad(!showKeypad)}
                disabled={isBusy}
                className={`p-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 border ${showKeypad ? 'bg-neon-purple text-white border-neon-purple box-glow-pink' : 'bg-transparent text-neon-purple border-neon-purple hover:bg-neon-purple hover:text-white hover:box-glow-pink'}`}
                aria-label="Manual Controls"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>

            <button 
                onClick={handleSolve} 
                disabled={isBusy}
                className="flex-[1.5] py-4 bg-transparent border border-neon-green text-neon-green font-bold rounded-xl hover:bg-neon-green hover:text-black hover:box-glow-green transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-neon-green disabled:hover:shadow-none flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(0,255,0,0.2)] group"
            >
                <img src={SolveIcon} alt="" className="w-6 h-6 invert group-hover:brightness-0" />
                SOLVE
            </button>
        </div>
      </div>
      
      <About isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}

export default App;