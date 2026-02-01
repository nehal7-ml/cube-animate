import { useEffect } from 'react';

interface Props {
  onClose: () => void;
  isOpen: boolean;
}

export function TokenStats({ onClose, isOpen }: Props) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-vegas-black/90 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-vegas-dark border border-neon-cyan shadow-2xl shadow-neon-cyan/20 rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-neon-cyan/30 flex justify-between items-center bg-vegas-black/50">
          <h2 className="text-xl font-bold text-neon-cyan text-glow-cyan flex items-center gap-2">
            <span className="text-2xl">📊</span> Token Statistics
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-neon-cyan hover:text-white hover:bg-neon-cyan/20 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
           
           {/* Model Info */}
           <div className="bg-vegas-black/30 rounded-xl p-4 border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-neon-purple/10 rounded-lg border border-neon-purple/30">
                 <img src="https://cdn.simpleicons.org/googlegemini/a855f7" alt="Gemini" className="w-8 h-8" />
              </div>
              <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Primary Model</div>
                  <div className="text-lg font-bold text-white">Gemini 3.0</div>
                  <div className="text-xs text-neon-purple">via Gemini Code Assist</div>
              </div>
           </div>

           {/* Stats Grid */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-vegas-black/30 p-4 rounded-xl border border-white/5">
                 <div className="text-slate-400 text-xs font-bold uppercase mb-1">Input Tokens</div>
                 <div className="text-2xl font-mono font-bold text-neon-blue">~340k</div>
                 <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-neon-blue h-full w-[85%]"></div>
                 </div>
              </div>
              <div className="bg-vegas-black/30 p-4 rounded-xl border border-white/5">
                 <div className="text-slate-400 text-xs font-bold uppercase mb-1">Output Tokens</div>
                 <div className="text-2xl font-mono font-bold text-neon-green">~115k</div>
                 <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-neon-green h-full w-[45%]"></div>
                 </div>
              </div>
           </div>

           {/* Total */}
           <div className="bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 p-4 rounded-xl border border-neon-pink/30 flex justify-between items-center">
              <div>
                 <div className="text-neon-pink text-xs font-bold uppercase mb-1">Lifetime Context</div>
                 <div className="text-sm text-slate-300">Total project development effort</div>
              </div>
              <div className="text-3xl font-mono font-bold text-white text-glow-pink">
                 455k+
              </div>
           </div>

           <div className="text-center text-xs text-slate-500 font-mono">
              * Statistics are estimated based on project complexity and interaction history.
           </div>

        </div>
      </div>
    </div>
  );
}
