
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FeedbackEvent } from '../types';
import { Skull, Star, Maximize } from 'lucide-react';

interface FeedbackLayerProps {
    events: FeedbackEvent[];
    onDismiss: (id: string) => void;
}

export const FeedbackLayer: React.FC<FeedbackLayerProps> = ({ events, onDismiss }) => {
    const activeEvent = events[0]; // Queue system

    useEffect(() => {
        if (activeEvent) {
            // Auto dismiss duration
            const duration = activeEvent.type === 'BOSS_KILLED' ? 3000 : 2500;
            const timer = setTimeout(() => {
                onDismiss(activeEvent.id);
            }, duration);

            // INPUT LISTENER FOR INSTANT DISMISS
            // This allows players to "swipe away" the notification by just playing the game
            const handleInput = () => {
                onDismiss(activeEvent.id);
            };

            window.addEventListener('keydown', handleInput);
            window.addEventListener('touchstart', handleInput);
            window.addEventListener('mousedown', handleInput);

            return () => {
                clearTimeout(timer);
                window.removeEventListener('keydown', handleInput);
                window.removeEventListener('touchstart', handleInput);
                window.removeEventListener('mousedown', handleInput);
            };
        }
    }, [activeEvent, onDismiss]);

    if (!activeEvent) return null;

    const renderContent = () => {
        switch (activeEvent.type) {
            case 'BOSS_KILLED':
                return (
                    <div className="flex flex-col items-center justify-center text-center animate-shake pointer-events-none">
                        <div className="relative">
                            <Skull size={100} className="text-red-500 mx-auto animate-pulse mb-4 drop-shadow-[0_0_50px_rgba(220,38,38,0.8)]" />
                            <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse"></div>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-950 fantasy-font drop-shadow-2xl tracking-tighter">
                            BOSS SLAIN
                        </h1>
                        {activeEvent.reward && (
                            <div className="mt-4 px-6 py-2 bg-black/60 border border-red-500/30 rounded-full text-xl md:text-2xl font-bold text-yellow-400 animate-in slide-in-from-bottom-4 fade-in duration-700 drop-shadow-md">
                                {activeEvent.reward}
                            </div>
                        )}
                    </div>
                );
            case 'LEVEL_UP':
                return (
                    <div className="flex flex-col items-center justify-center text-center animate-in zoom-in-50 duration-500 pointer-events-none">
                        <div className="relative">
                            <Star size={120} className="text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-50 animate-pulse" />
                            <h1 className="relative z-10 text-6xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-400 to-yellow-700 fantasy-font drop-shadow-[0_0_40px_rgba(251,191,36,0.6)] filter">
                                LEVEL UP!
                            </h1>
                        </div>
                        
                        <div className="mt-6 bg-black/80 border-y-2 border-yellow-500/50 w-full py-4 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-8 duration-700 flex flex-col items-center">
                            <div className="text-3xl md:text-5xl font-black text-white mb-1 uppercase tracking-widest">{activeEvent.title}</div>
                            {activeEvent.subtitle && (
                                <p className="text-yellow-200/80 text-sm md:text-lg uppercase tracking-[0.3em] font-serif">{activeEvent.subtitle}</p>
                            )}
                        </div>
                    </div>
                );
            case 'GRID_EXPAND':
                return (
                    <div className="flex flex-col items-center justify-center text-center animate-in zoom-in duration-700 pointer-events-none">
                        <Maximize size={80} className="text-emerald-400 mb-6 animate-pulse drop-shadow-[0_0_30px_rgba(52,211,153,0.6)]" />
                        <h2 className="text-4xl md:text-7xl font-black text-white fantasy-font uppercase drop-shadow-2xl">
                            DOMAIN EXPANDED
                        </h2>
                        <p className="text-emerald-300 mt-4 text-lg md:text-xl font-bold tracking-widest max-w-lg bg-black/60 px-6 py-2 rounded-lg border border-emerald-500/30">
                            The dungeon grows larger.
                        </p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Darker Backdrop for Popups */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            />
            
            <div className="relative z-10 w-full flex items-center justify-center">
                {renderContent()}
            </div>
            
            {/* Dismiss Hint */}
            <div className="absolute bottom-10 left-0 right-0 text-center opacity-50 animate-pulse text-white text-xs font-bold tracking-[0.2em]">
                MOVE TO CONTINUE
            </div>
        </div>
    );
};
