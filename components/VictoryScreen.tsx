
import React, { useEffect, useState } from 'react';
import { GameState, HeroClass } from '../types';
import { unlockClass } from '../services/storageService';
import { Trophy, Swords, Crown, Play, Home, Coins, Clock, LayoutGrid, Unlock } from 'lucide-react';
import { useMenuNavigation } from '../hooks/useMenuNavigation';

interface VictoryScreenProps {
  gameState: GameState;
  onContinue: () => void;
  onHome: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ gameState, onContinue, onHome }) => {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
      // Trigger unlock logic once on mount
      // We unlock the Dragon Slayer class for beating the game (reaching 2048)
      const isNewUnlock = unlockClass(HeroClass.DRAGON_SLAYER);
      if (isNewUnlock) {
          setUnlocked(true);
      }
  }, []);

  const actions = [
      { id: 'CONTINUE', action: onContinue },
      { id: 'HOME', action: onHome }
  ];

  const { selectedIndex, setSelectedIndex } = useMenuNavigation(
      actions.length,
      (index) => actions[index].action(),
      true,
      'VERTICAL'
  );

  const getFocusClass = (idx: number) => selectedIndex === idx ? 'ring-2 ring-yellow-400 scale-[1.02] z-10 shadow-xl' : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Dynamic Background Overlay */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-1000"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-yellow-950/40 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Victory Particles/Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/10 blur-[100px] animate-pulse"></div>
      </div>

      {/* Main Card Container */}
      <div className="relative w-full max-w-4xl bg-[#0a0800] border border-yellow-500/50 rounded-3xl shadow-[0_0_100px_rgba(234,179,8,0.3)] overflow-hidden animate-in zoom-in-95 duration-700 flex flex-col md:flex-row h-auto max-h-[90vh]">
        
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_20px_rgba(250,204,21,0.8)] z-20"></div>

        {/* LEFT COLUMN: THE GLORY */}
        <div className="w-full md:w-6/12 p-8 md:p-12 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] justify-center items-center text-center">
           {/* Dark Gradient Overlay */}
           <div className="absolute inset-0 bg-gradient-to-b from-yellow-950/80 to-black/90 z-0"></div>

           <div className="relative z-10 flex flex-col items-center">
              <Crown size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-bounce" />
              
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-yellow-600 fantasy-font tracking-tighter drop-shadow-sm mb-2">
                VICTORY
              </h1>
              
              <p className="text-yellow-200/60 font-serif italic text-sm tracking-widest uppercase mb-8">
                 The Dragon God is Born
              </p>

              {/* Main Score Display */}
              <div className="w-full bg-yellow-900/10 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent translate-x-[-100%] group-hover:animate-shimmer"></div>
                  <div className="text-xs text-yellow-500 uppercase tracking-[0.2em] font-bold mb-2">Final Score</div>
                  <div className="text-4xl md:text-5xl fantasy-font font-black text-white drop-shadow-md tracking-wide">
                      {gameState.score.toLocaleString()}
                  </div>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: REWARDS & ACTIONS */}
        <div className="w-full md:w-6/12 bg-slate-950 border-t md:border-t-0 md:border-l border-yellow-900/30 relative flex flex-col p-8">
            
            <div className="flex-1 flex flex-col justify-center space-y-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <VictoryStat label="Gold Earned" value={gameState.runStats.goldEarned} icon={<Coins size={14} className="text-yellow-400"/>} />
                    <VictoryStat label="Turns Taken" value={gameState.runStats.turnCount} icon={<Clock size={14} className="text-blue-400"/>} />
                    <VictoryStat label="Highest Combo" value={`x${gameState.stats.highestCombo}`} icon={<LayoutGrid size={14} className="text-purple-400"/>} />
                    <VictoryStat label="Level Reached" value={gameState.level} icon={<Trophy size={14} className="text-orange-400"/>} />
                </div>

                {/* Unlock Notification */}
                {unlocked && (
                    <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/50 p-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-right-8 delay-300 duration-500">
                        <div className="w-12 h-12 rounded-full bg-indigo-900 flex items-center justify-center border-2 border-indigo-400 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                            <Unlock size={20} />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wide mb-1">New Class Unlocked</div>
                            <div className="text-lg font-black text-white fantasy-font tracking-wide">DRAGON SLAYER</div>
                            <div className="text-[10px] text-indigo-200/60 mt-0.5">Start with Siege Breaker & Glass Cannon perks.</div>
                        </div>
                    </div>
                )}

                {!unlocked && (
                    <div className="text-center text-slate-500 text-xs italic py-4">
                        You have proven your worth. Continue to earn more glory.
                    </div>
                )}

                {/* Actions */}
                <div className="mt-auto space-y-3 pt-4">
                    <button 
                        onClick={onContinue}
                        onMouseEnter={() => setSelectedIndex(0)}
                        className={`w-full group relative py-4 bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_40px_rgba(234,179,8,0.5)] transition-all overflow-hidden ${getFocusClass(0)}`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] group-hover:animate-shimmer"></div>
                        <span className="relative z-10 flex items-center justify-center gap-2 uppercase tracking-wide">
                            <Play size={20} fill="currentColor" /> Continue Endless
                        </span>
                    </button>

                    <button 
                        onClick={onHome}
                        onMouseEnter={() => setSelectedIndex(1)}
                        className={`w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-widest ${getFocusClass(1)}`}
                    >
                        <Home size={16} /> Return to Menu
                    </button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

// Helper for Stats - UPDATED: Removed font-mono, added fantasy-font for numbers
const VictoryStat = ({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
        <div className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">{label}</div>
        <div className="text-white font-bold text-base flex items-center gap-2 fantasy-font tracking-wide">
            {icon} {value}
        </div>
    </div>
);
