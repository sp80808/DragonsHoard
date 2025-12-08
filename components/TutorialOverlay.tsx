import React, { useEffect, useState } from 'react';
import { Hand } from 'lucide-react';

interface TutorialOverlayProps {
  step: number; // 0: Move, 1: Merge, 2: XP/Level, 3: Done
  gridSize: number;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, gridSize }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    // Slight pulse animation trigger
    const timer = setInterval(() => {
        setVisible(prev => !prev);
    }, 2000);
    return () => clearInterval(timer);
  }, [step]);

  // Mask configurations based on step
  // We use CSS clip-path to create a "spotlight" effect
  // These values are approximations based on typical layout
  
  const getSpotlightStyle = () => {
      switch (step) {
          case 0: // Move - Highlight center grid area
              return { clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 50% 50%, 10% 20%, 90% 20%, 90% 80%, 10% 80%, 10% 20%, 50% 50%)' }; 
              // Actually, standard overlay with transparent hole is easier via box-shadow
              // Let's use a simpler centered box approach for visual clarity
              return {}; 
          default:
              return {};
      }
  };

  if (step > 2) return null;

  return (
    <div className="absolute inset-0 z-[60] pointer-events-none flex flex-col items-center justify-center">
        {/* Darkening Overlay */}
        <div className="absolute inset-0 bg-black/60 transition-opacity duration-500"></div>

        {/* Instructions Container */}
        <div className="relative z-70 flex flex-col items-center gap-6 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
            
            {/* Visual Guide */}
            <div className="relative">
                {step === 0 && (
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 border-4 border-white/80 rounded-xl mb-4 shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center bg-white/5 backdrop-blur-sm animate-pulse">
                            <div className="grid grid-cols-2 gap-2 w-16 h-16 opacity-50">
                                <div className="bg-slate-400 rounded"></div>
                                <div className="bg-slate-400 rounded"></div>
                                <div className="bg-slate-400 rounded"></div>
                                <div className="bg-slate-400 rounded"></div>
                            </div>
                        </div>
                        
                        {/* Animated Hand */}
                        <div className="absolute top-10 right-0 animate-swipe-guide text-white filter drop-shadow-lg">
                            <Hand size={48} fill="white" />
                        </div>
                    </div>
                )}

                {step === 1 && (
                     <div className="flex flex-col items-center">
                        <div className="flex gap-2 items-center mb-4">
                            <div className="w-16 h-16 bg-green-700 rounded-lg border-2 border-green-400 flex items-center justify-center font-bold text-white text-xl shadow-lg">2</div>
                            <span className="text-white font-bold text-2xl">+</span>
                            <div className="w-16 h-16 bg-green-700 rounded-lg border-2 border-green-400 flex items-center justify-center font-bold text-white text-xl shadow-lg">2</div>
                        </div>
                        <div className="absolute top-10 left-1/2 animate-bounce text-white filter drop-shadow-lg">
                            <Hand size={48} fill="white" className="rotate-180" />
                        </div>
                     </div>
                )}

                {step === 2 && (
                    <div className="flex flex-col items-center">
                        <div className="w-64 h-8 bg-slate-800 rounded-full border-2 border-indigo-400 overflow-hidden relative shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                             <div className="h-full bg-indigo-500 w-3/4 animate-pulse"></div>
                        </div>
                        <div className="mt-2 text-indigo-300 font-bold text-sm tracking-widest uppercase">XP Gain</div>
                    </div>
                )}
            </div>

            {/* Text Label */}
            <div className="bg-slate-900/90 border border-slate-700 px-6 py-3 rounded-full backdrop-blur-md shadow-2xl">
                <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500 fantasy-font text-center">
                    {step === 0 && "USE ARROWS OR SWIPE"}
                    {step === 1 && "MERGE TO EVOLVE"}
                    {step === 2 && "LEVEL UP & TRY TO SURVIVE"}
                </h2>
            </div>

        </div>
    </div>
  );
};