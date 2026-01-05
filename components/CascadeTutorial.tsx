
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tile, TileType } from '../types';
import { TileComponent } from './TileComponent';
import { Hand, Zap, Sparkles, RefreshCw, ArrowDown } from 'lucide-react';
import { createId } from '../services/gameLogic';
import { completeCascadeTutorial } from '../services/storageService';
import { audioService } from '../services/audioService';

interface CascadeTutorialProps {
    onComplete: () => void;
}

export const CascadeTutorial: React.FC<CascadeTutorialProps> = ({ onComplete }) => {
    const [step, setStep] = useState<'INTRO' | 'INTERACTIVE' | 'ANIMATING' | 'SUCCESS'>('INTRO');
    const [grid, setGrid] = useState<Tile[]>([]);
    
    // Initial Setup: 
    // [2] (t1) at 0,0
    // [ ] at 0,1
    // [2] (t2) at 0,2
    // [4] (t3) at 0,3
    
    useEffect(() => {
        const initialGrid: Tile[] = [
            { id: 't1', x: 0, y: 0, value: 2, type: TileType.NORMAL },
            { id: 't2', x: 0, y: 2, value: 2, type: TileType.NORMAL },
            { id: 't3', x: 0, y: 3, value: 4, type: TileType.NORMAL },
        ];
        setGrid(initialGrid);
    }, []);

    const triggerCascade = () => {
        setStep('ANIMATING');
        audioService.playMove();

        // Step 1: Move & First Manual Merge (2+2)
        // t1 falls to t2. They merge into 4 at 0,2.
        setTimeout(() => {
            setGrid(prev => {
                const t1 = prev.find(t => t.id === 't1')!;
                const t2 = prev.find(t => t.id === 't2')!;
                const t3 = prev.find(t => t.id === 't3')!;
                
                return [
                    { ...t1, y: 2, isDying: true }, // Top 2 Moves down and dies
                    { ...t2, isDying: true }, // Bottom 2 dies
                    { ...t3 }, // 4 stays at bottom
                    { id: 'm1', x: 0, y: 2, value: 4, type: TileType.NORMAL, isNew: true, mergedFrom: ['t1', 't2'] } // New 4 created at 0,2
                ];
            });
            audioService.playMerge(4, 1);
        }, 300);

        // Step 2: Visual Pause for "Cascade" realization
        // Grid now has [4] at 0,2 and [4] at 0,3.
        
        // Step 3: Trigger Auto-Merge (4+4)
        setTimeout(() => {
            setGrid(prev => {
                const t3 = prev.find(t => t.id === 't3')!;
                const m1 = prev.find(t => t.id === 'm1')!;
                
                // Cascade detects 4 above 4. Merges into 8 at 0,3.
                
                return [
                    { ...m1, y: 3, isDying: true }, // Top 4 falls
                    { ...t3, isDying: true }, // Bottom 4 consumed
                    { id: 'm2', x: 0, y: 3, value: 8, type: TileType.NORMAL, isNew: true, mergedFrom: ['m1', 't3'], isCascade: true } // Result 8
                ];
            });
            audioService.playCascade(1);
            audioService.playMerge(8, 2);
        }, 1200); // Longer delay to emphasize the "Auto" nature

        // Step 4: Finish
        setTimeout(() => {
            setStep('SUCCESS');
            audioService.playLevelUp();
            completeCascadeTutorial();
        }, 3500);
    };

    // Input Listeners
    useEffect(() => {
        if (step !== 'INTERACTIVE') return;

        const handleInput = () => triggerCascade();
        
        window.addEventListener('keydown', handleInput);
        window.addEventListener('mousedown', handleInput);
        window.addEventListener('touchstart', handleInput);

        return () => {
            window.removeEventListener('keydown', handleInput);
            window.removeEventListener('mousedown', handleInput);
            window.removeEventListener('touchstart', handleInput);
        };
    }, [step]);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md">
            <div className="w-full max-w-md p-6 flex flex-col items-center text-center relative overflow-hidden">
                
                {/* Background FX */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-purple-900/20 pointer-events-none"></div>

                <AnimatePresence mode='wait'>
                    {step === 'INTRO' && (
                        <motion.div 
                            key="intro"
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="space-y-6 z-10"
                        >
                            <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mx-auto border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-pulse">
                                <Zap size={40} className="text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 fantasy-font mb-2">
                                    SYSTEM UPGRADE
                                </h2>
                                <p className="text-purple-200/80 font-bold text-sm tracking-widest uppercase">
                                    Chain Reactions Unlocked
                                </p>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed max-w-xs mx-auto">
                                The dungeon's magic has shifted. <br/>
                                <strong className="text-white">Adjacent matching tiles</strong> will now merge automatically after your turn to create powerful combos.
                            </p>
                            <button 
                                onClick={() => setStep('INTERACTIVE')}
                                className="px-8 py-3 bg-white text-purple-950 font-black rounded-xl hover:scale-105 transition-transform shadow-xl"
                            >
                                TRY IT OUT
                            </button>
                        </motion.div>
                    )}

                    {(step === 'INTERACTIVE' || step === 'ANIMATING') && (
                        <motion.div 
                            key="demo"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center z-10 w-full"
                        >
                            <div className="text-2xl font-black text-purple-400 fantasy-font mb-8 flex items-center gap-2">
                                {step === 'ANIMATING' ? <RefreshCw size={24} className="animate-spin-slow" /> : <Zap size={24} />} 
                                {step === 'ANIMATING' ? 'CHAIN REACTION...' : 'READY'}
                            </div>

                            {/* Simulation Container */}
                            <div className="relative w-32 h-[32rem] bg-slate-900/80 border-2 border-purple-500/50 rounded-xl mb-8 shadow-2xl overflow-hidden">
                                <div className="absolute inset-0 grid grid-rows-4 gap-1 p-1">
                                    {[0,1,2,3].map(i => <div key={i} className="bg-slate-800/30 rounded-lg"></div>)}
                                </div>
                                
                                {/* Tiles */}
                                <div className="absolute inset-0 p-1">
                                    {grid.map(t => (
                                        <div 
                                            key={t.id} 
                                            className="absolute w-full h-1/4 p-1 transition-all duration-300"
                                            style={{ 
                                                top: `${t.y * 25}%`,
                                                zIndex: t.isDying ? 0 : 10
                                            }}
                                        >
                                            <TileComponent tile={t} gridSize={1} slideSpeed={200} themeId="DEFAULT" />
                                        </div>
                                    ))}
                                </div>

                                {/* Visual Guide Arrow */}
                                {step === 'INTERACTIVE' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                                    >
                                        <ArrowDown size={48} className="text-white/30" />
                                    </motion.div>
                                )}
                                
                                {/* Auto-Merge Indicator */}
                                {step === 'ANIMATING' && grid.length === 2 && grid[0].value === 4 && grid[1].value === 4 && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1.2, opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500 text-black font-black text-[10px] px-2 py-1 rounded rotate-[-10deg] shadow-lg z-30"
                                    >
                                        AUTO!
                                    </motion.div>
                                )}
                            </div>

                            {step === 'INTERACTIVE' && (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex flex-col items-center gap-2 text-white/50"
                                >
                                    <Hand size={32} className="animate-pulse" />
                                    <span className="text-xs font-bold tracking-[0.2em]">PRESS DOWN TO MERGE</span>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {step === 'SUCCESS' && (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6 z-10"
                        >
                            <Sparkles size={60} className="text-yellow-400 mx-auto animate-spin-slow" />
                            <h2 className="text-4xl font-black text-white fantasy-font drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                COMBO X2!
                            </h2>
                            <p className="text-slate-300 text-sm max-w-xs mx-auto">
                                Cascades occur <strong className="text-purple-400">automatically</strong> when falling tiles match.
                                <br/><br/>
                                They grant <strong className="text-yellow-400">Bonus Gold</strong> and <strong className="text-blue-400">Bonus XP</strong>.
                            </p>
                            <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                                <div className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-1">Tutorial Reward</div>
                                <div className="text-xl font-black text-yellow-400 flex items-center justify-center gap-2">
                                    +200 XP
                                </div>
                            </div>
                            <button 
                                onClick={onComplete}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black rounded-xl hover:scale-105 transition-transform shadow-lg"
                            >
                                CONTINUE
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
