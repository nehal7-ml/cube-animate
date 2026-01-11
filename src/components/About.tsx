import { useEffect } from 'react';

interface Props {
  onClose: () => void;
  isOpen: boolean;
}

export function About({ onClose, isOpen }: Props) {
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
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span className="text-2xl">ℹ️</span> About & Help
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto text-slate-300 space-y-6">
          
          <section>
            <h3 className="text-white font-bold mb-2">Rubik's Animator</h3>
            <p className="text-sm leading-relaxed">
              A high-performance, interactive 3D Rubik's Cube simulator. 
              Features realistic mechanical animations, sound effects, and a built-in CFOP solver.
            </p>
          </section>

          <section>
            <h3 className="text-white font-bold mb-2">How to Use</h3>
            <ul className="text-sm space-y-3">
              <li className="flex gap-3">
                <span className="bg-slate-800 p-1 rounded h-fit text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 16-4"/><path d="m2 8 2 16"/><path d="m22 8-2 16"/></svg>
                </span>
                <div>
                    <strong className="text-slate-200">Scramble:</strong> Randomizes the cube state to start a new puzzle.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="bg-slate-800 p-1 rounded h-fit text-green-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m7.8 16.2-2.9 2.9"/><path d="M6 12H2"/><path d="m7.8 7.8-2.9-2.9"/><circle cx="12" cy="12" r="3"/></svg>
                </span>
                <div>
                    <strong className="text-slate-200">Solve:</strong> Automatically calculates and animates the solution step-by-step.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="bg-slate-800 p-1 rounded h-fit text-blue-400">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                </span>
                <div>
                    <strong className="text-slate-200">Manual Control:</strong> Opens a keypad to perform specific face rotations (U, D, L, R, F, B).
                </div>
              </li>
              <li className="flex gap-3">
                <span className="bg-slate-800 p-1 rounded h-fit text-slate-400">
                    🖱️
                </span>
                <div>
                    <strong className="text-slate-200">Rotate View:</strong> Click and drag anywhere on the background to rotate the camera.
                </div>
              </li>
            </ul>
          </section>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-center">
             <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text font-bold text-sm flex items-center gap-2">
                <span className="text-lg">✨</span> Vibe coded with Code Assist Gemini 3
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}