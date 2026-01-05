
import React, { useEffect, useState } from 'react';
import { GameState, PlayerProfile, HeroClass, UnlockReward } from '../types';
import { finalizeRun, getNextLevelXp } from '../services/storageService';
import { generateFallbackStory } from '../services/gameLogic';
import { MEDALS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { facebookService } from '../services/facebookService';
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
  Sparkles as SparklesIcon,
  Medal as MedalIcon,
  Ghost, Flame, Droplets, Zap, Star, Settings, Sword, Heart, Unlock, Palette,
  Feather, MessageCircle
} from 'lucide-react';
import { useMenuNavigation } from '../hooks/useMenuNavigation';

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
  const [newUnlocks, setNewUnlocks] = useState<UnlockReward[]>([]);
  
  // Story Generation State
  const [story, setStory] = useState<string>('');
  const [isStoryLoading, setIsStoryLoading] = useState(false);

  // Auto-save on mount
  useEffect(() => {
    const { profile: newProfile, leveledUp: isLevelUp, xpGained, newUnlocks: unlocks } = finalizeRun(gameState);
    setProfile(newProfile);
    setLeveledUp(isLevelUp);
    setRunXp(xpGained);
    setNewUnlocks(unlocks);
    
    // Animate XP bar starting from previous amount
    const prevTotal = newProfile.totalAccountXp - xpGained;
    setDisplayedXp(prevTotal);
    
    // Trigger animation after a brief delay for visual impact
    setTimeout(() => {
        setDisplayedXp(newProfile.totalAccountXp);
    }, 500);

    generateStory();

  }, []);

  const generateStory = async () => {
      try {
          setIsStoryLoading(true);
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          
          const prompt = `
            Write a very short, dark fantasy obituary (max 2 sentences) for a ${gameState.selectedClass} named "The Hero" who died in the ${gameState.currentStage.name}.
            
            Run Stats:
            - Reached Account Level: ${profile?.accountLevel || gameState.level}
            - Bosses Slain: ${gameState.runStats.bossesDefeated}
            - Gold Hoarded: ${gameState.runStats.goldEarned}
            - Highest Combo: ${gameState.stats.highestCombo}
            
            Tone: Somber, epic, slightly poetic. Focus on their demise or their greed. Do not use hashtags.
          `;

          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
          });

          if (response.text) {
              setStory(response.text.trim());
          }
      } catch (error) {
          console.error("Failed to generate story, using fallback.");
          setStory(generateFallbackStory(gameState));
      } finally {
          setIsStoryLoading(false);
      }
  };

  const handleChallenge = () => {
      facebookService.challengeFriend(gameState.score, gameState.selectedClass);
  };

  const actions = [
      { id: 'RESTART', action: onRestart },
      { id: 'SCORES', action: onShowLeaderboard },
      { id: 'HOME', action: onHome }
  ];

  const { selectedIndex, setSelectedIndex } = useMenuNavigation(
      actions.length,
      (index) => actions[index].action(),
      true,
      'VERTICAL'
  );

  if (!profile) return null;

  const nextLevelXp = getNextLevelXp(profile.accountLevel);
  const prevLevelXp = getNextLevelXp(profile.accountLevel - 1);
  
  // XP Calculations
  const xpForThisLevel = nextLevelXp - (profile.accountLevel === 1 ? 0 : prevLevelXp);
  const xpIntoLevel = profile.totalAccountXp - (profile.accountLevel === 1 ? 0 : prevLevelXp);
  const prevXpIntoLevel = displayedXp - (profile.accountLevel === 1 ? 0 : prevLevelXp);

  // Percentages for animation
  const displayPercent = Math.min(100, Math.max(0, (prevXpIntoLevel / xpForThisLevel) * 100));
  const finalPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpForThisLevel) * 100)); // unused variable but kept for reference logic

  // Determine Class Icon
  const icons: Record<HeroClass, React.ElementType> = {
      [HeroClass.ADVENTURER]: Shield,
      [HeroClass.WARRIOR]: Swords,
      [HeroClass.ROGUE]: Clock, 
      [HeroClass.MAGE]: SparklesIcon,
      [HeroClass.PALADIN]: Shield,
      [HeroClass.DRAGON_SLAYER]: Swords
  };
  const HeroIcon = icons[(gameState.selectedClass || HeroClass.ADVENTURER) as HeroClass];

  // Get Earned Medals for Display
  const earnedMedalIds = [...new Set(gameState.runStats.medalsEarned || [])]; 
  const earnedMedals = earnedMedalIds.map((id) => MEDALS[id as string]).filter(Boolean);

  const getRewardIcon = (type: string, id: string) => {
      if (type === 'CLASS') return <Shield size={18} />;
      if (type === 'FEATURE') return <LayoutGrid size={18} />;
      if (type === 'TILESET') {
          if (id.includes('UNDEAD')) return <Ghost size={18} />;
          if (id.includes('INFERNAL')) return <Flame size={18} />;
          if (id.includes('AQUATIC')) return <Droplets size={18} />;
          if (id.includes('CYBER')) return <Zap size={18} />;
          if (id.includes('CELESTIAL')) return <Star size={18} />;
          return <Palette size={18} />;
      }
      return <Unlock size={18} />;
  };

  const getFocusClass = (idx: number) => selectedIndex === idx ? 'ring-2 ring-yellow-400 scale-[1.02] z-10' : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 overflow-hidden">
      {/* Dynamic Background Overlay */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-1000"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(69,10,10,0.8)_100%)] pointer-events-none animate-pulse"></div>
      
      {/* Main Card Container */}
      <div className="relative w-full max-w-5xl bg-[#08080a] border border-red-900/30 rounded-none md:rounded-3xl shadow-[0_0_100px_rgba(220,20,60,0.2)] overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col h-full md:h-auto md:max-h-[90vh]">
        
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_20px_rgba(220,38,38,0.5)] z-20"></div>

        {/* UNIFIED SCROLL CONTAINER (Mobile: Single Scroll, Desktop: Split Flex) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden custom-scrollbar">

            {/* LEFT COLUMN: THE OBITUARY (Run Stats) */}
            <div className="w-full md:w-7/12 p-4 md:p-8 flex flex-col relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] md:overflow-y-auto custom-scrollbar shrink-0">
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-black/95 z-0"></div>

            <div className="relative z-10 flex flex-col h-full items-center text-center">
                
                {/* Header - Compact on Mobile */}
                <div className="mb-4 md:mb-6 animate-in slide-in-from-top-8 duration-700 w-full pt-4 md:pt-0">
                    <Skull size={48} className="text-red-600 mx-auto mb-2 md:mb-3 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] animate-pulse md:w-16 md:h-16" />
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-950 fantasy-font tracking-tighter drop-shadow-lg scale-y-110 break-words leading-tight px-4">
                        VANQUISHED
                    </h1>
                    <div className="h-px w-16 md:w-24 bg-red-900/50 mx-auto mt-2 md:mt-4 mb-2"></div>
                    <p className="text-red-400/60 font-serif italic text-[10px] md:text-xs tracking-[0.3em] uppercase">
                        Your journey ends here
                    </p>
                </div>

                {/* Main Score Display */}
                <div className="w-full bg-slate-900/50 border border-red-900/20 rounded-2xl p-3 md:p-4 mb-4 backdrop-blur-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-red-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-[0.2em] font-bold mb-1 relative z-10">Final Score</div>
                    <div className="text-4xl md:text-5xl fantasy-font font-black text-white drop-shadow-md relative z-10 tracking-wide">
                        {gameState.score.toLocaleString()}
                    </div>
                    {gameState.score > profile.highScore && (
                        <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 text-[10px] font-bold animate-bounce shadow-[0_0_15px_rgba(234,179,8,0.3)] relative z-10">
                            <Trophy size={10} /> NEW HIGH SCORE
                        </div>
                    )}
                </div>

                {/* Grid of Stats */}
                <div className="w-full grid grid-cols-2 gap-2 mb-4 md:mb-6">
                    <DeathStat label="Gold Plundered" value={gameState.runStats.goldEarned} icon={<Coins size={14} className="text-yellow-500"/>} />
                    <DeathStat label="Depth Reached" value={gameState.runStats.stageReached} icon={<Map size={14} className="text-emerald-500"/>} />
                    <DeathStat label="Turns Survived" value={gameState.runStats.turnCount} icon={<Clock size={14} className="text-blue-500"/>} />
                    <DeathStat label="Highest Combo" value={`x${gameState.stats.highestCombo}`} icon={<LayoutGrid size={14} className="text-purple-500"/>} />
                </div>

                {/* Medals Section */}
                {earnedMedals.length > 0 && (
                    <div className="w-full text-left mb-6 bg-slate-900/30 rounded-xl p-3 border border-white/5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2 pl-1">
                            <MedalIcon size={12} /> Honors Earned
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {earnedMedals.map((medal, idx) => (
                                <div 
                                    key={idx} 
                                    className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-2 py-1.5 rounded-lg text-xs text-slate-300 animate-in zoom-in slide-in-from-bottom-2 fill-mode-backwards"
                                    style={{ animationDelay: `${500 + (idx * 50)}ms` }}
                                >
                                    <span className="text-yellow-500">{medal.icon}</span>
                                    <span className="font-bold text-[10px] uppercase tracking-wide">{medal.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-auto flex gap-4 w-full pt-2">
                    <button 
                            onClick={handleChallenge}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-105 shadow-lg shadow-blue-900/20"
                    >
                        <MessageCircle size={16} /> CHALLENGE FRIENDS
                    </button>
                </div>
            </div>
            </div>

            {/* RIGHT COLUMN: THE LEGACY (Progression) */}
            <div className="w-full md:w-5/12 bg-slate-950 border-t md:border-t-0 md:border-l border-red-900/30 relative flex flex-col md:overflow-y-auto custom-scrollbar shrink-0">
                
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent pointer-events-none"></div>

                <div className="relative z-10 flex-1 p-4 md:p-8 flex flex-col justify-start">
                    
                    {/* Hero Avatar (Grayscale for death) */}
                    <div className="flex items-center gap-4 mb-6 md:mb-8 group">
                        <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 shadow-xl relative shrink-0">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 rounded-full"></div>
                            <HeroIcon size={32} className="text-slate-200 relative z-10" />
                        </div>
                        <div>
                            <div className="text-slate-500 font-black uppercase text-[10px] tracking-[0.25em]">{gameState.selectedClass}</div>
                            <div className="text-white font-black text-xl">Account Level {profile.accountLevel}</div>
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div className="w-full space-y-2 mb-6">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide">
                            <span>XP Gained</span>
                            <span className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">+{runXp.toLocaleString()}</span>
                        </div>

                        <div className="h-6 bg-black rounded-full border border-slate-800 relative overflow-hidden shadow-inner">
                            {/* Fill Animation */}
                            <div 
                                className="h-full bg-gradient-to-r from-blue-900 via-indigo-700 to-indigo-500 transition-all duration-[1500ms] ease-out relative"
                                style={{ width: `${displayPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:20px_20px] animate-[shimmer_1s_infinite_linear]"></div>
                                <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay"></div>
                            </div>
                            
                            {/* Text Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-white drop-shadow-md z-10 mix-blend-plus-lighter">
                                {Math.floor(xpIntoLevel).toLocaleString()} / {xpForThisLevel.toLocaleString()} XP
                            </div>
                        </div>
                    </div>

                    {/* Rewards List */}
                    <div className="w-full mb-6">
                        {leveledUp && newUnlocks.length > 0 ? (
                            <div className="space-y-3">
                                <h3 className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2 pb-2 border-b border-yellow-500/20">
                                    <Trophy size={14} className="animate-bounce" /> New Discoveries
                                </h3>
                                {newUnlocks.map((reward, i) => (
                                    <div key={i} className="flex flex-col bg-slate-900/80 border border-yellow-500/30 p-3 rounded-xl animate-in slide-in-from-right-4 fill-mode-backwards hover:bg-slate-800 transition-colors" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-yellow-400 border border-slate-700 shrink-0 shadow-inner">
                                                {getRewardIcon(reward.type, reward.id)}
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Unlocked at Level {reward.level}</div>
                                                <div className="text-yellow-100 font-bold text-sm">{reward.label}</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-[10px] text-slate-400 leading-tight bg-black/30 p-2 rounded border border-white/5 font-serif italic">
                                            "{reward.desc}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : leveledUp ? (
                            <div className="w-full py-6 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-500/30 rounded-xl text-center animate-in zoom-in slide-in-from-bottom-2 duration-500">
                                <span className="text-yellow-400 font-black text-sm flex items-center justify-center gap-2">
                                    <Trophy size={16} /> LEVEL UP!
                                </span>
                                <div className="text-[10px] text-yellow-200/60 mt-1">Keep growing to unlock new powers.</div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center opacity-30 text-xs text-slate-500 font-serif italic text-center py-4">
                                No new discoveries this run.<br/>Press on, adventurer.
                            </div>
                        )}
                    </div>

                    {/* AI Story Section */}
                    <div className="mb-6 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 min-h-[80px] flex flex-col justify-center relative overflow-hidden group hover:bg-slate-900/80 transition-colors">
                        <Feather size={60} className="absolute -right-4 -bottom-4 text-slate-800 opacity-20 rotate-[-20deg]" />
                        {isStoryLoading ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
                                <Feather size={12} className="animate-bounce" /> Etching your tale...
                            </div>
                        ) : story ? (
                            <div className="relative z-10 animate-in fade-in duration-1000">
                                <p className="font-serif italic text-slate-400 text-xs leading-relaxed text-justify">
                                    "{story}"
                                </p>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-600 italic">History has forgotten you...</div>
                        )}
                    </div>

                    {/* DESKTOP ACTIONS (Hidden on Mobile) */}
                    <div className="mt-auto space-y-3 hidden md:block">
                        <button 
                            onClick={onRestart}
                            onMouseEnter={() => setSelectedIndex(0)}
                            className={`w-full group relative py-4 bg-gradient-to-r from-red-800 to-red-600 hover:from-red-700 hover:to-red-500 text-white font-black text-lg rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.3)] hover:shadow-[0_0_50px_rgba(220,38,38,0.5)] transition-all overflow-hidden border border-red-500/20 ${getFocusClass(0)}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] group-hover:animate-shimmer"></div>
                            <span className="relative z-10 flex items-center justify-center gap-3 tracking-wider">
                                <Swords size={20} /> RISE AGAIN
                            </span>
                        </button>

                        <div className="flex gap-3">
                            <button 
                                onClick={onShowLeaderboard}
                                onMouseEnter={() => setSelectedIndex(1)}
                                className={`flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${getFocusClass(1)}`}
                            >
                                <Trophy size={16} /> SCORES
                            </button>
                            <button 
                                onClick={onHome}
                                onMouseEnter={() => setSelectedIndex(2)}
                                className={`flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${getFocusClass(2)}`}
                            >
                                <Home size={16} /> MENU
                            </button>
                        </div>
                    </div>
                    
                    {/* SPACER for Mobile Fixed Footer */}
                    <div className="h-32 md:hidden"></div>

                </div>
            </div>
        </div>

        {/* MOBILE FIXED ACTION BAR */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-slate-950/95 to-transparent z-50 flex flex-col gap-2 backdrop-blur-sm border-t border-red-900/30">
            <button 
                onClick={onRestart}
                className={`w-full group relative py-3 bg-gradient-to-r from-red-800 to-red-600 active:scale-95 text-white font-black text-lg rounded-xl shadow-lg transition-all overflow-hidden border border-red-500/20 ${getFocusClass(0)}`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-[shimmer_2s_infinite_linear] opacity-30"></div>
                <span className="relative z-10 flex items-center justify-center gap-2 tracking-wider">
                    <Swords size={18} /> RISE AGAIN
                </span>
            </button>
            <div className="flex gap-2">
                <button 
                    onClick={onShowLeaderboard}
                    className={`flex-1 py-3 bg-slate-900 text-slate-400 border border-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${getFocusClass(1)}`}
                >
                    <Trophy size={14} /> SCORES
                </button>
                <button 
                    onClick={onHome}
                    className={`flex-1 py-3 bg-slate-900 text-slate-400 border border-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${getFocusClass(2)}`}
                >
                    <Home size={14} /> MENU
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

// Helper for Stats - UPDATED: Removed font-mono, added fantasy-font for numbers
const DeathStat = ({ label, value, icon }: any) => (
    <div 
        className={`border border-white/5 bg-slate-900/40 p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105 hover:bg-white/5`}
    >
        <div className="text-slate-500 uppercase tracking-wider text-[8px] font-bold">{label}</div>
        <div className="text-white font-bold text-sm flex items-center gap-1.5 fantasy-font tracking-wide">
            {icon} {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
    </div>
);
