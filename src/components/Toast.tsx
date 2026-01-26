import { useEffect, useState } from 'react';

interface Props {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for fade out
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div 
      className={`absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ease-out transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
    >
      <div className="bg-vegas-black border border-neon-cyan text-neon-cyan px-6 py-3 rounded-full shadow-lg shadow-neon-cyan/50 flex items-center gap-3 box-glow-cyan">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon-cyan animate-pulse"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span className="font-bold text-sm text-glow-cyan uppercase tracking-wide">{message}</span>
      </div>
    </div>
  );
}