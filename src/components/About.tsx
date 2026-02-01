import { useEffect } from 'react';
import { MiniCube } from './MiniCube';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  onOpenStats?: () => void;
}

export function About({ onClose, isOpen, onOpenStats }: Props) {
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-vegas-black/90 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-vegas-dark border border-neon-purple shadow-2xl shadow-neon-purple/50 rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-neon-purple/30 flex justify-between items-center bg-vegas-black/50">
          <h2 className="text-xl font-bold text-neon-pink text-glow-pink flex items-center gap-2">
            <span className="text-2xl">ℹ️</span> About & Help
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-neon-purple hover:text-white hover:bg-neon-purple/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto text-slate-300 space-y-6 scrollbar-hide">
          
          <section>
            <h3 className="text-neon-cyan font-bold mb-2 text-glow-cyan">Rubik's Animator</h3>
            <p className="text-sm leading-relaxed text-slate-200">
              A high-performance, interactive 3D Rubik's Cube simulator. 
              Features realistic mechanical animations, sound effects, and a built-in CFOP solver.
            </p>
          </section>

          <section>
            <h3 className="text-neon-cyan font-bold mb-2 text-glow-cyan">How to Use</h3>
            <ul className="text-sm space-y-3">
              <li className="flex gap-3 items-center">
                <div className="bg-vegas-black border border-neon-orange rounded h-fit">
                    <MiniCube type="scramble" className="w-8 h-8" />
                </div>
                <div>
                    <strong className="text-neon-orange">Scramble:</strong> Randomizes the cube state to start a new puzzle.
                </div>
              </li>
              <li className="flex gap-3 items-center">
                <div className="bg-vegas-black border border-neon-green rounded h-fit">
                    <MiniCube type="solve" className="w-8 h-8" />
                </div>
                <div>
                    <strong className="text-neon-green">Solve:</strong> Automatically calculates and animates the solution step-by-step.
                </div>
              </li>
              <li className="flex gap-3 items-center">
                <div className="bg-vegas-black border border-neon-purple rounded h-fit">
                   <MiniCube type="manual" className="w-8 h-8" />
                </div>
                <div>
                    <strong className="text-neon-purple">Manual Control:</strong> Opens a keypad to perform specific face rotations.
                </div>
              </li>
              <li className="flex gap-3 items-center">
                <span className="bg-vegas-black border border-neon-cyan p-2 rounded h-fit text-neon-cyan box-glow-cyan">
                    🖱️
                </span>
                <div>
                    <strong className="text-neon-cyan">Rotate View:</strong> Click and drag anywhere on the background to rotate the camera.
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-neon-purple font-bold mb-3 text-glow-pink">Tech Stack</h3>
            <div className="flex flex-wrap gap-6 items-center justify-center bg-vegas-black/30 p-4 rounded-xl border border-neon-purple/20">
              {[
                { name: 'Vite', icon: 'https://cdn.simpleicons.org/vite/646CFF', url: 'https://vitejs.dev' },
                { name: 'React', icon: 'https://cdn.simpleicons.org/react/61DAFB', url: 'https://react.dev' },
                { name: 'Tailwind', icon: 'https://cdn.simpleicons.org/tailwindcss/06B6D4', url: 'https://tailwindcss.com' },
                { name: 'Vercel', icon: 'https://cdn.simpleicons.org/vercel/FFFFFF', url: 'https://vercel.com' },
              ].map((tech) => (
                <a 
                  key={tech.name} 
                  href={tech.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 transition-transform hover:scale-110"
                >
                  <img src={tech.icon} alt={tech.name} className="w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] uppercase font-bold text-slate-500 group-hover:text-slate-300 tracking-wider">{tech.name}</span>
                </a>
              ))}
            </div>
          </section>

          <div className="pt-4 border-t border-neon-purple/30 flex flex-col items-center justify-center gap-3">
             <div className="flex flex-col items-center gap-2">
                <div className="bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan text-transparent bg-clip-text font-bold text-sm flex items-center gap-2">
                    <img src="https://cdn.simpleicons.org/googlegemini/8E75B2" alt="Gemini" className="w-5 h-5 animate-pulse" />
                    Vibe coded with Gemini Code Assist
                </div>
                {onOpenStats && (
                    <button 
                        onClick={onOpenStats}
                        className="text-[10px] text-neon-cyan hover:text-white transition-colors uppercase tracking-widest font-bold border border-neon-cyan/30 px-2 py-0.5 rounded hover:bg-neon-cyan/20 cursor-pointer"
                    >
                        View Token Stats
                    </button>
                )}
             </div>
             <a 
                href="https://software-smith.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-neon-cyan transition-colors flex items-center gap-1 group"
             >
                Built by <span className="font-bold group-hover:underline">Software Smith</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 group-hover:opacity-100"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
             </a>
          </div>

        </div>
      </div>
    </div>
  );
}