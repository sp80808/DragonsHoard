
import React, { useEffect, useState, useRef } from 'react';
import { Hand, Skull, Zap, ArrowUpCircle, Swords, MousePointer } from 'lucide-react';

interface TutorialOverlayProps {
  onDismiss: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onDismiss }) => {
  const [step, setStep] = useState(0);
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const steps = [
      {
          title: "WELCOME, HERO",
          text: "The dungeon awaits. Your goal is to build an army and defeat the Dragon God.",
          icon: <Swords size={80} className="text-yellow-500 animate-bounce" />,
          sub: "SWIPE OR PRESS ANY KEY TO START"
      },
      {
          title: "MERGE TO EVOLVE",
          text: "Swipe to move tiles. Merge two identical monsters to EVOLVE them into a stronger form.",
          icon: <ArrowUpCircle size={80} className="text-green-500 animate-pulse" />,
          sub: "TRY MOVING NOW"
      },
      {
          title: "BOSS BATTLES",
          text: "Bosses don't move. You must throw high-level tiles at them to deal damage!",
          icon: <Skull size={80} className="text-red-500 animate-shake" />,
          sub: "PREPARE YOURSELF"
      }
  ];

  const current = steps[step];

  // Logic to advance step on ANY input
  const advance = () => {
      if (step < steps.length - 1) {
          setStep(s => s + 1);
      } else {
          onDismiss();
      }
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          e.preventDefault();
          advance();
      };

      const handleTouchStart = (e: TouchEvent) => {
          touchStartRef.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY
          };
      };

      const handleTouchEnd = (e: TouchEvent) => {
          if (!touchStartRef.current) return;
          const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
          const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
          
          // If valid swipe or tap
          if (Math.abs(dx) > 10 || Math.abs(dy) > 10 || true) {
              advance();
          }
          touchStartRef.current = null;
      };

      const handleMouseDown = () => {
          // Allow clicks too
          advance();
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchend', handleTouchEnd);
      window.addEventListener('mousedown', handleMouseDown);

      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchend', handleTouchEnd);
          window.removeEventListener('mousedown', handleMouseDown);
      };
  }, [step]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer">
        <div className="w-full max-w-lg p-8 flex flex-col items-center text-center space-y-8 select-none">
            
            {/* Visual Icon Container */}
            <div className="relative">
                <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-150"></div>
                <div className="relative z-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    {current.icon}
                </div>
            </div>

            {/* Text Content */}
            <div className="space-y-4 max-w-md">
                <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 fantasy-font tracking-wide drop-shadow-sm">
                    {current.title}
                </h2>
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
                <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed">
                    {current.text}
                </p>
            </div>

            {/* Interaction Prompt */}
            <div className="pt-8 opacity-80 animate-pulse flex flex-col items-center gap-2">
                <div className="flex gap-2 text-white/50">
                    <MousePointer size={20} />
                    <Hand size={20} />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-[0.3em] border-b border-white/20 pb-1">
                    {current.sub}
                </span>
            </div>

            {/* Step Indicator */}
            <div className="flex gap-2 mt-4">
                {steps.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                    ></div>
                ))}
            </div>
        </div>
    </div>
  );
};
