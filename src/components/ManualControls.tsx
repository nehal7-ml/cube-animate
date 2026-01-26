import { useState, useRef, useCallback } from 'react';

interface Props {
  onMove: (m: string) => void;
  onClose: () => void;
  className?: string;
  extraHeaderProps?: any;
}

const LONG_PRESS_MS = 300;

const LongPressButton = ({ move, onMove }: { move: string, onMove: (m: string) => void }) => {
  const [isPrime, setIsPrime] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const start = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); 
    setIsPressed(true);
    setIsPrime(false);
    startTimeRef.current = Date.now();

    timerRef.current = setTimeout(() => {
      setIsPrime(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, LONG_PRESS_MS);
  }, []);

  const end = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    if (!isPressed) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed < LONG_PRESS_MS) {
      onMove(move);
    } else {
      onMove(move + "'");
    }

    setIsPressed(false);
    setIsPrime(false);
  }, [isPressed, move, onMove]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressed(false);
    setIsPrime(false);
  }, []);

  return (
    <button
      onPointerDown={start}
      onPointerUp={end}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      className={`
        relative w-full aspect-square rounded-xl font-bold text-xl lg:text-3xl transition-all duration-200 select-none
        flex items-center justify-center shadow-lg cursor-pointer active:scale-95 border
        ${isPressed 
            ? (isPrime 
                ? 'bg-neon-pink text-white border-neon-pink box-glow-pink scale-95' 
                : 'bg-neon-cyan text-black border-neon-cyan box-glow-cyan scale-95') 
            : 'bg-vegas-black text-neon-cyan border-neon-cyan/50 hover:bg-neon-cyan/10 hover:border-neon-cyan hover:box-glow-cyan hover:text-white'}
      `}
    >
      <span className="relative z-10 drop-shadow-md">{move}{isPrime ? "'" : ""}</span>
      
      {/* Progress Indicator for Long Press */}
      {isPressed && !isPrime && (
        <svg className="absolute inset-0 w-full h-full p-1 opacity-50" viewBox="0 0 100 100">
           <circle 
             cx="50" cy="50" r="46" 
             fill="none" 
             stroke="currentColor" 
             strokeWidth="8"
             strokeDasharray="289"
             strokeDashoffset="289"
             className="animate-spin-fill"
             style={{
                animation: `dash ${LONG_PRESS_MS}ms linear forwards`,
                transformOrigin: 'center',
                transform: 'rotate(-90deg)'
             }}
           />
        </svg>
      )}
      
      {/* Hint Text */}
      <span className="absolute bottom-1 text-[8px] lg:text-[10px] font-mono opacity-70 uppercase tracking-wider">
        {isPrime ? "PRIME" : "HOLD"}
      </span>
    </button>
  );
};

export function ManualControls({ onMove, onClose, className = "", extraHeaderProps = {} }: Props) {
  const rows = [
    ['U', 'u', 'E', 'd', 'D'],
    ['L', 'l', 'M', 'r', 'R'],
    ['F', 'f', 'S', 'b', 'B']
  ];

  return (
    <div className={`bg-vegas-dark/95 backdrop-blur-md flex flex-col rounded-2xl overflow-hidden neon-border-cyan transition-all duration-300 hover:scale-[1.01] ${className}`}>
      {/* Header */}
            <div 
              className="p-4 border-b border-neon-cyan/30 flex justify-between items-center bg-vegas-black shrink-0 cursor-move touch-none"
              {...extraHeaderProps}
            >
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-neon-cyan">Manual Control</h2>
                <span className="text-xs text-slate-400">Tap for CW • Hold for Prime (')</span>
              </div>
              <button            onClick={onClose}
          className="p-2 bg-transparent hover:bg-neon-pink/20 rounded-full transition-colors text-neon-pink border border-transparent hover:border-neon-pink hover:box-glow-pink"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      {/* Grid */}
      <div className="p-4 lg:p-6 overflow-y-auto flex-1">
         <div className="grid grid-cols-5 gap-3 md:gap-4 lg:gap-5">
           {rows.flat().map(move => (
             <LongPressButton 
               key={move} 
               move={move} 
               onMove={onMove} 
             />
           ))}
         </div>
      </div>
      
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}