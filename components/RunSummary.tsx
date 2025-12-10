
import React, { useEffect, useState } from 'react';
import { GameState, PlayerProfile, HeroClass } from '../types';
import { finalizeRun, getNextLevelXp } from '../services/storageService';
import { 
  Trophy, 
  Play, 
  Skull, 
  Swords, 
  Coins, 
  Map, 
  LayoutGrid,
  Home,
  Shield,
  Clock,
  ChevronRight,
  Share2
} from 'lucide-react';

interface Props {
  gameState: GameState;
  onRestart: () => void;
  onShowLeaderboard: () => void;
  onHome: () => void;
}

export const RunSummary: React.FC<Props> = ({ gameState, onRestart, onShowLeaderboard, onHome }) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [leveledUp, setLeveledUp] = useState(false);
  const [displayedXp, setDisplayedXp] = useState(0);
  const [runXp, setRunXp] = useState(0);

  // Auto-save on mount
  useEffect(() => {
    const { profile: newProfile, leveledUp: isLevelUp, xpGained } = finalizeRun(gameState);
    setProfile(newProfile);
    setLeveledUp(isLevelUp);
    setRunXp(xpGained);
    
    // Animate XP bar starting from previous amount
    const prevTotal = newProfile.totalAccountXp - xpGained;
    setDisplayedXp(prevTotal);
    
    // Trigger animation after a brief delay for visual impact
    setTimeout(() => {
        setDisplayedXp(newProfile.totalAccountXp);
    }, 500);

  }, []);

  if (!profile) return null;

  const nextLevelXp = getNextLevelXp(profile.accountLevel);
  const prevLevelXp = getNextLevelXp(profile.accountLevel - 1);
  
  // XP Calculations
  const xpForThisLevel = nextLevelXp - (profile.accountLevel === 1 ? 0 : prevLevelXp);
  const xpIntoLevel = profile.totalAccountXp - (profile.accountLevel === 1 ? 0 : prevLevelXp);
  const prevXpIntoLevel = displayedXp - (profile.accountLevel === 1 ? 0 : prevLevelXp);

  // Percentages for animation
  const displayPercent = Math.min(100, Math.max(0, (prevXpIntoLevel / xpForThisLevel) * 100));
  const finalPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpForThisLevel) * 100));

  // Determine Class Icon
  const HeroIcon = {
      [HeroClass.ADVENTURER]: Shield,
      [HeroClass.WARRIOR]: Swords,
      [HeroClass.ROGUE]: Clock, // Placeholder
      [HeroClass.MAGE]: SparklesIcon,
      [HeroClass.PALADIN]: Shield
  }[gameState.selectedClass || HeroClass.ADVENTURER];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Dynamic Background Overlay */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md animate-in fade-in duration-1000"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-red-950/40 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Main Card Container */}
      <div className="relative w-full max-w-5xl bg-[#08080a] border border-red-900/30 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row h-auto max-h-[90vh]">
        
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_20px_rgba(220,38,38,0.5)] z-20"></div>

        {/* LEFT COLUMN: THE OBITUARY (Run Stats) */}
        <div className="w-full md:w-7/12 p-6 md:p-10 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
           {/* Dark Gradient Overlay */}
           <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-black/95 z-0"></div>

           <div className="relative z-10 flex flex-col h-full items-center text-center">
              
              {/* Header */}
              <div className="mb-8 animate-in slide-in-from-top-8 duration-700">
                  <Skull size={64} className="text-red-600 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse" />
                  <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-950 fantasy-font tracking-tighter drop-shadow-sm">
                    VANQUISHED
                  </h1>
                  <p className="text-red-400/60 font-serif italic text-sm mt-2 tracking-widest uppercase">
                    Your journey ends here
                  </p>
              </div>

              {/* Main Score Display */}
              <div className="w-full bg-slate-900/50 border border-white/5 rounded-2xl p-6 mb-6 backdrop-blur-sm">
                  <div className="text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">Final Score</div>
                  <div className="text-4xl md:text-5xl font-mono font-bold text-white drop-shadow-md">
                      {gameState.score.toLocaleString()}
                  </div>
                  {gameState.score > profile.highScore && (
                      <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-xs font-bold animate-pulse">
                          <Trophy size={12} /> NEW HIGH SCORE
                      </div>
                  )}
              </div>

              {/* Grid of Stats */}
              <div className="w-full grid grid-cols-2 gap-3 mb-6">
                  <DeathStat 
                    label="Gold Plundered" 
                    value={gameState.runStats.goldEarned} 
                    icon={<Coins size={14} className="text-yellow-500"/>}
                    delay={100}
                  />
                  <DeathStat 
                    label="Depth Reached" 
                    value={gameState.runStats.stageReached} 
                    icon={<Map size={14} className="text-emerald-500"/>}
                    delay={200}
                  />
                  <DeathStat 
                    label="Turns Survived" 
                    value={gameState.runStats.turnCount} 
                    icon={<Clock size={14} className="text-blue-500"/>}
                    delay={300}
                  />
                  <DeathStat 
                    label="Highest Combo" 
                    value={`x${gameState.stats.highestCombo}`} 
                    icon={<LayoutGrid size={14} className="text-purple-500"/>}
                    delay={400}
                  />
              </div>

              <div className="mt-auto flex gap-4 w-full">
                   <button 
                        className="flex-1 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        onClick={() => {
                            // Dummy Share Logic
                            alert("Copied score to clipboard!");
                        }}
                   >
                       <Share2 size={16} /> SHARE DEATH
                   </button>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: THE LEGACY (Progression) */}
        <div className="w-full md:w-5/12 bg-slate-950 border-t md:border-t-0 md:border-l border-red-900/30 relative flex flex-col">
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent pointer-events-none"></div>

            <div className="relative z-10 flex-1 p-8 flex flex-col justify-center">
                
                {/* Hero Avatar (Grayscale for death) */}
                <div className="flex flex-col items-center mb-8">
                     <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center mb-3 grayscale opacity-70">
                        <HeroIcon size={40} className="text-slate-400" />
                     </div>
                     <div className="text-slate-500 font-bold uppercase text-xs tracking-widest">{gameState.selectedClass}</div>
                     <div className="text-white font-bold text-lg">Account Level {profile.accountLevel}</div>
                </div>

                {/* XP Bar */}
                <div className="w-full space-y-3 mb-8">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                        <span>XP Gained</span>
                        <span className="text-green-400">+{runXp.toLocaleString()}</span>
                    </div>

                    <div className="h-6 bg-black rounded-full border border-slate-800 relative overflow-hidden">
                        {/* Fill Animation */}
                        <div 
                            className="h-full bg-gradient-to-r from-blue-900 to-indigo-600 transition-all duration-[1500ms] ease-out relative"
                            style={{ width: `${displayPercent}%` }}
                        >
                            {/* If we reached the target, show full width briefly then reset if needed, but for simplicity we show progress to next level */}
                             <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                        </div>
                        
                        {/* Text Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow-md">
                            {Math.floor(xpIntoLevel)} / {xpForThisLevel} XP
                        </div>
                    </div>

                    {leveledUp && (
                        <div className="w-full py-2 bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 rounded-lg text-center">
                            <span className="text-yellow-400 font-bold text-xs flex items-center justify-center gap-2 animate-bounce">
                                <Trophy size={12} /> LEVEL UP!
                            </span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="mt-auto space-y-3">
                    <button 
                        onClick={onRestart}
                        className="w-full group relative py-4 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-black text-lg rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_50px_rgba(220,38,38,0.6)] transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] group-hover:animate-shimmer"></div>
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            <Swords size={20} /> RISE AGAIN
                        </span>
                    </button>

                    <div className="flex gap-3">
                        <button 
                            onClick={onShowLeaderboard}
                            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                            <Trophy size={16} /> LEADERBOARD
                        </button>
                        <button 
                            onClick={onHome}
                            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                            <Home size={16} /> MENU
                        </button>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

// Helper for Stats
const DeathStat = ({ label, value, icon, delay }: any) => (
    <div 
        className="bg-slate-900/40 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1 animate-in zoom-in-50 fill-mode-backwards"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">{label}</div>
        <div className="text-white font-bold text-lg flex items-center gap-2">
            {value}
        </div>
    </div>
);

// Fallback Icon
const SparklesIcon = ({size, className}: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 9h4"/><path d="M3 5h4"/></svg>;

