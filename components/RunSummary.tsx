
import React, { useEffect, useState } from 'react';
import { GameState, PlayerProfile } from '../types';
import { finalizeRun, getNextLevelXp } from '../services/storageService';
import { 
  Trophy, 
  Zap, 
  Play, 
  Skull, 
  Swords, 
  Coins, 
  Map, 
  BarChart3, 
  ArrowUpCircle,
  Sparkles,
  LayoutGrid,
  Home
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
    }, 300);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
      {/* Dynamic Background Overlay */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-in fade-in duration-500"></div>
      
      {/* Main Card Container */}
      <div className="relative w-[95%] md:w-full max-w-4xl bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
        
        {/* Decorative Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.5)] z-20"></div>

        {/* LEFT COLUMN: The "Report" (Stats) */}
        <div className="flex-1 p-4 md:p-8 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed overflow-y-auto">
           {/* Background Texture Overlay */}
           <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 to-black/90 z-0"></div>

           <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="text-center mb-4 md:mb-8 relative shrink-0">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
                      <Skull size={140} className="text-red-500" />
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 via-red-600 to-red-900 fantasy-font drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
                    DEFEAT
                  </h2>
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-red-800 to-transparent mx-auto my-2"></div>
                  <p className="text-slate-400 font-serif italic text-xs md:text-base tracking-wide">
                    The dungeon claims another soul...
                  </p>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-1 gap-2 md:gap-3 content-start">
                  <StatCard 
                    icon={<BarChart3 size={16} className="text-blue-400" />} 
                    label="Final Score" 
                    value={gameState.score.toLocaleString()} 
                    isPrimary 
                  />
                  
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <StatCard 
                        icon={<Swords size={16} className="text-red-400" />} 
                        label="Apex Predator" 
                        value={gameState.runStats.highestMonster} 
                        subValue={`Rank ${gameState.runStats.highestTile}`}
                    />
                    <StatCard 
                        icon={<Map size={16} className="text-emerald-400" />} 
                        label="Depth Reached" 
                        value={gameState.runStats.stageReached} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <StatCard 
                        icon={<LayoutGrid size={16} className="text-purple-400" />} 
                        label="Cascades" 
                        value={gameState.runStats.cascadesTriggered} 
                    />
                    <StatCard 
                        icon={<Zap size={16} className="text-orange-400" />} 
                        label="Power Ups" 
                        value={gameState.runStats.powerUpsUsed} 
                    />
                  </div>

                  <StatCard 
                    icon={<Coins size={16} className="text-yellow-400" />} 
                    label="Gold Plundered" 
                    value={`+${gameState.runStats.goldEarned}`} 
                    color="text-yellow-400"
                    bg="bg-yellow-900/10 border-yellow-700/30"
                  />
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: The "Progress" (Meta) */}
        <div className="flex-1 relative bg-slate-950 border-t md:border-t-0 md:border-l border-white/5 flex flex-col overflow-y-auto custom-scrollbar shrink-0 md:shrink">
            {/* Arcane Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 pointer-events-none"></div>

            <div className="relative z-10 flex-1 p-4 md:p-8 flex flex-col justify-center items-center">
                
                {/* Level Badge */}
                <div className="relative mb-4 md:mb-6 group">
                    <div className="absolute inset-0 bg-blue-500 blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
                    <div className="w-24 h-24 md:w-32 md:h-32 relative flex items-center justify-center">
                         <div className="absolute inset-0 bg-slate-900 border-2 border-indigo-500/50 rotate-45 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-md"></div>
                         <div className="absolute inset-2 bg-gradient-to-br from-indigo-950 to-slate-950 rotate-45 rounded-lg border border-white/10"></div>
                         
                         <div className="relative z-10 text-center">
                             <div className="text-[8px] md:text-[10px] uppercase tracking-widest text-indigo-300 font-bold mb-1">Level</div>
                             <div className="text-4xl md:text-6xl font-black text-white drop-shadow-lg fantasy-font leading-none">{profile.accountLevel}</div>
                         </div>
                    </div>
                    {leveledUp && (
                        <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-[10px] md:text-xs px-2 py-1 md:px-3 rounded-full shadow-lg animate-bounce z-20 border border-white/20">
                            LEVEL UP!
                        </div>
                    )}
                </div>

                {/* XP Bar Section */}
                <div className="w-full max-w-xs space-y-2 mb-4 md:mb-8">
                    <div className="flex justify-between items-end text-xs font-bold tracking-wide">
                        <span className="text-slate-400">Current XP</span>
                        <span className="text-indigo-300">{Math.floor(displayPercent)}%</span>
                    </div>
                    
                    {/* The Bar */}
                    <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] relative">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-500 transition-all duration-[2000ms] ease-out relative"
                            style={{ width: `${displayPercent}%` }}
                        >
                            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-shimmer"></div>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-start text-[10px] text-slate-500 font-mono mt-2">
                        <span>{Math.floor(xpIntoLevel)} / {xpForThisLevel}</span>
                        <div className="flex items-center gap-1 text-green-400 animate-pulse">
                            <ArrowUpCircle size={10} />
                            <span>+{runXp.toLocaleString()} XP Gained</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="p-4 md:p-8 bg-slate-900/50 backdrop-blur-sm border-t border-white/5 flex flex-col gap-2 md:gap-3 shrink-0">
                 <button 
                    onClick={onRestart}
                    className="w-full py-3 md:py-4 relative group overflow-hidden rounded-xl bg-gradient-to-r from-red-800 to-red-600 text-white font-bold shadow-[0_4px_20px_rgba(220,38,38,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] border border-red-500/30"
                >
                    <div className="relative flex items-center justify-center gap-2 tracking-widest text-sm md:text-base">
                        <Play fill="currentColor" size={18} /> PLAY AGAIN
                    </div>
                </button>
                
                <div className="flex gap-2 md:gap-3">
                    <button 
                        onClick={onShowLeaderboard}
                        className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs md:text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <Trophy size={16} /> SCORES
                    </button>
                    <button 
                        onClick={onHome}
                        className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs md:text-sm font-bold flex items-center justify-center gap-2"
                    >
                        <Home size={16} /> MENU
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Stats
const StatCard = ({ icon, label, value, subValue, isPrimary, color = "text-white", bg = "bg-slate-800/40 border-white/5" }: any) => (
    <div className={`flex items-center justify-between p-2 md:p-3 rounded-xl border ${bg} ${isPrimary ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-white/10 shadow-lg' : ''}`}>
        <div className="flex items-center gap-2 md:gap-3">
            <div className={`p-1.5 md:p-2 rounded-lg bg-slate-950 border border-white/5 ${isPrimary ? 'shadow-inner' : ''}`}>
                {icon}
            </div>
            <div>
                <div className="text-[9px] md:text-[10px] text-slate-500 uppercase tracking-wider font-bold">{label}</div>
                {subValue && <div className="text-[9px] md:text-[10px] text-slate-400">{subValue}</div>}
            </div>
        </div>
        <div className={`font-mono font-bold ${isPrimary ? 'text-xl md:text-2xl' : 'text-xs md:text-sm'} ${color} drop-shadow-sm`}>
            {value}
        </div>
    </div>
);
