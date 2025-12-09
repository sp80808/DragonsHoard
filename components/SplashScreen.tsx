
import React, { useEffect, useState } from 'react';
import { Play, Trophy, Settings, Scroll, CheckCircle2, Circle, ChevronLeft, ChevronRight, Lock, Swords, Grid, BookOpen } from 'lucide-react';
import { getPlayerProfile, getNextLevelXp } from '../services/storageService';
import { PlayerProfile, HeroClass, GameMode } from '../types';
import { getLevelRank } from '../constants';

interface SplashScreenProps {
  onStart: (selectedClass: HeroClass, mode: GameMode) => void;
  onContinue: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  hasSave: boolean;
}

const CLASS_DESCRIPTIONS: Record<HeroClass, { title: string, desc: string, icon: string, color: string, bg: string }> = {
    [HeroClass.ADVENTURER]: { title: 'Adventurer', desc: 'Balanced stats. A reliable start.', icon: '🛡️', color: 'text-slate-300', bg: 'from-slate-800 to-slate-900' },
    [HeroClass.WARRIOR]: { title: 'Warrior', desc: 'Starts with a Purge Scroll. Built for combat.', icon: '⚔️', color: 'text-red-400', bg: 'from-red-900/40 to-slate-900' },
    [HeroClass.ROGUE]: { title: 'Rogue', desc: 'Starts with a Reroll Token. Tricks up the sleeve.', icon: '🗡️', color: 'text-green-400', bg: 'from-green-900/40 to-slate-900' },
    [HeroClass.MAGE]: { title: 'Mage', desc: 'Starts with an XP Potion. Quick learner.', icon: '🔮', color: 'text-blue-400', bg: 'from-blue-900/40 to-slate-900' },
    [HeroClass.PALADIN]: { title: 'Paladin', desc: 'Starts with a Golden Rune. Divine favor.', icon: '✨', color: 'text-yellow-400', bg: 'from-yellow-900/40 to-slate-900' },
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, onContinue, onOpenLeaderboard, onOpenSettings, onOpenHelp, hasSave }) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const [shakeError, setShakeError] = useState(false);

  useEffect(() => {
    setProfile(getPlayerProfile());
  }, []);

  if (!profile) return null;

  // XP Calc
  const nextLevelXp = getNextLevelXp(profile.accountLevel);
  const prevLevelXp = getNextLevelXp(profile.accountLevel - 1);
  const xpForLevel = nextLevelXp - (profile.accountLevel === 1 ? 0 : prevLevelXp);
  const xpIntoLevel = profile.totalAccountXp - (profile.accountLevel === 1 ? 0 : prevLevelXp);
  const xpPercent = Math.min(100, Math.max(0, (xpIntoLevel / xpForLevel) * 100));

  // Class Selection Logic
  const allClasses = Object.values(HeroClass);
  const currentClass = allClasses[selectedClassIndex];
  const isLocked = !profile.unlockedClasses.includes(currentClass);
  const classInfo = CLASS_DESCRIPTIONS[currentClass];

  // Rank Info
  const rank = getLevelRank(profile.accountLevel);
  const RankIcon = rank.icon;

  const nextClass = () => setSelectedClassIndex((prev) => (prev + 1) % allClasses.length);
  const prevClass = () => setSelectedClassIndex((prev) => (prev - 1 + allClasses.length) % allClasses.length);

  const handleStartAttempt = () => {
      if (isLocked) {
          setShakeError(true);
          setTimeout(() => setShakeError(false), 500);
          return;
      }
      onStart(currentClass, 'RPG');
  };

  return (
    <div className="absolute inset-0 z-50 bg-black overflow-y-auto overflow-x-hidden select-none font-sans">
      {/* Background */}
      <div 
        className="fixed inset-0 opacity-40 animate-[pulse_10s_ease-in-out_infinite]"
        style={{
            backgroundImage: `url('https://image.pollinations.ai/prompt/dark fantasy dragon hoard dungeon treasure pile cinematic lighting atmospheric?width=1024&height=1024&nologo=true')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'scale(1.1)'
        }}
      />
      <div className="fixed inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
      
      {/* Main Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 lg:gap-16 animate-in fade-in slide-in-from-bottom-4 duration-700 my-auto">
          
          {/* Left Column: Title & Actions */}
          <div className="flex-1 flex flex-col justify-center items-center lg:items-start space-y-6 lg:space-y-10">
              <div className="text-center lg:text-left space-y-2 pt-8 lg:pt-0">
                  <h1 className="text-5xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-amber-500 to-red-700 fantasy-font drop-shadow-[0_4px_10px_rgba(0,0,0,1)] tracking-tighter leading-none">
                  DRAGON'S<br/>HOARD
                  </h1>
                  <p className="text-slate-400 tracking-[0.4em] text-xs lg:text-sm uppercase font-bold pl-1">Roguelite Puzzle RPG</p>
              </div>

              <div className="flex flex-col gap-3 lg:gap-4 w-full max-w-sm">
                  {hasSave && (
                      <button 
                          onClick={onContinue}
                          className="w-full py-4 bg-slate-800/60 backdrop-blur-md hover:bg-slate-700/80 border border-slate-600/50 text-slate-200 font-bold rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 duration-200 shadow-lg"
                      >
                          <Play size={24} className="text-green-400" /> CONTINUE RUN
                      </button>
                  )}

                  <button 
                      onClick={handleStartAttempt}
                      className={`w-full py-5 font-bold rounded-xl border flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-2xl active:scale-95 duration-200 relative overflow-hidden
                          ${isLocked 
                              ? 'bg-slate-900/80 border-slate-800 text-slate-500 cursor-not-allowed' 
                              : 'bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-white border-yellow-500/50 shadow-amber-900/30'}
                          ${shakeError ? 'animate-shake border-red-500 text-red-400 bg-red-900/20' : ''}
                      `}
                  >
                       <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                      {isLocked ? <Lock size={24} /> : <Swords size={24} fill="currentColor" className="opacity-80" />} 
                      <span className="tracking-wide">START NEW RUN</span>
                  </button>

                  <button 
                      onClick={() => onStart(HeroClass.ADVENTURER, 'CLASSIC')}
                      className="w-full py-3 bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                  >
                      <Grid size={18} /> Classic Mode <span className="text-[10px] uppercase bg-slate-800 px-1 rounded text-slate-500 ml-1">No RPG</span>
                  </button>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                      <button onClick={onOpenLeaderboard} className="py-3 bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 transition-all hover:scale-105 active:scale-95">
                          <Trophy size={18} /> <span className="text-[10px] md:text-sm font-bold">Scores</span>
                      </button>
                      <button onClick={onOpenSettings} className="py-3 bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 transition-all hover:scale-105 active:scale-95">
                          <Settings size={18} /> <span className="text-[10px] md:text-sm font-bold">Config</span>
                      </button>
                      <button onClick={onOpenHelp} className="py-3 bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/60 text-slate-400 hover:text-white rounded-xl flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 transition-all hover:scale-105 active:scale-95">
                          <BookOpen size={18} /> <span className="text-[10px] md:text-sm font-bold">Guide</span>
                      </button>
                  </div>
              </div>
          </div>

          {/* Right Column: Glassmorphism Hub */}
          <div className="flex-1 flex flex-col gap-4 lg:gap-6 w-full max-w-md mx-auto justify-center pb-8 lg:pb-0">
              
              {/* Profile Card - RPG RANK STYLE */}
              <div className={`bg-slate-950/80 border ${rank.border} rounded-3xl p-0 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-opacity-100 border-opacity-30 transition-all duration-500`}>
                  {/* Card Header Background */}
                  <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${rank.bg} opacity-20`}></div>
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

                  <div className="flex flex-col items-center p-8 relative z-10">
                      {/* Rank Icon Container */}
                      <div className="w-24 h-24 mb-4 relative flex items-center justify-center shrink-0">
                          {/* Animated Glow behind Badge */}
                          <div className={`absolute inset-0 rounded-full blur-xl opacity-60 animate-pulse ${rank.bg}`}></div>
                          
                          {/* The Badge */}
                          <div className={`relative w-full h-full bg-slate-900 rounded-full border-4 flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] ${rank.border}`}>
                              <RankIcon size={48} className={`${rank.color} drop-shadow-[0_0_10px_currentColor]`} strokeWidth={1.5} />
                              
                              {/* Level Badge */}
                              <div className="absolute -bottom-3 bg-slate-950 border border-slate-700 px-3 py-1 rounded-full text-sm font-bold text-white shadow-lg flex items-center gap-1">
                                  <span className="text-slate-400 text-[10px] uppercase">Lvl</span> {profile.accountLevel}
                              </div>
                          </div>
                      </div>

                      {/* Rank Text Details */}
                      <div className="text-center">
                          <div className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-bold mb-1">Current Rank</div>
                          <div className={`text-4xl font-black ${rank.color} tracking-tight fantasy-font drop-shadow-md`}>
                              {rank.title}
                          </div>
                      </div>
                  </div>
                  
                  {/* Detailed XP Bar */}
                  <div className="bg-slate-900/80 border-t border-white/5 p-6">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-2 font-mono font-bold tracking-wider">
                          <span>XP PROGRESS</span>
                          <span>{Math.floor(xpIntoLevel)} / {Math.floor(xpForLevel)}</span>
                      </div>
                      
                      <div className="h-4 bg-black rounded-full overflow-hidden border border-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] relative">
                           {/* Background Strips */}
                           <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#fff_5px,#fff_6px)]"></div>
                           
                           {/* Fill */}
                           <div 
                                className={`h-full relative shadow-[0_0_15px_currentColor] transition-all duration-1000 ease-out ${rank.bg}`} 
                                style={{ width: `${xpPercent}%` }}
                           >
                              <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                              <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/70 shadow-[0_0_10px_white]"></div>
                           </div>
                      </div>
                      
                      {/* Next Reward Hint */}
                      <div className="mt-4 flex justify-between items-center">
                          <div className="text-[10px] text-slate-500">Games Played: <span className="text-slate-300">{profile.gamesPlayed}</span></div>
                          <div className="text-[10px] text-slate-500">
                              Next Rank: <span className="text-slate-300 font-bold">Level {Math.ceil((profile.accountLevel + 1) / 10) * 10}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Daily Bounties */}
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 lg:p-6 backdrop-blur-xl shadow-2xl flex-1 flex flex-col relative min-h-[160px]">
                  <h3 className="text-amber-500 font-bold uppercase tracking-[0.15em] text-xs mb-4 flex items-center gap-2 relative z-10">
                      <Scroll size={14} /> Daily Bounties
                  </h3>
                  <div className="space-y-3 flex-1 relative z-10">
                      {profile.activeBounties.map((bounty) => (
                          <div key={bounty.id} className="flex items-center gap-3 p-2 lg:p-3 rounded-xl bg-slate-950/40 border border-white/5">
                              <div className={`p-1.5 rounded-full ${bounty.isCompleted ? 'text-green-400 bg-green-900/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]' : 'text-slate-600 bg-slate-900'}`}>
                                  {bounty.isCompleted ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                              </div>
                              <div className="flex-1">
                                  <div className={`text-xs lg:text-sm font-medium ${bounty.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                      {bounty.description}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Reward: <span className="text-amber-500">{bounty.rewardXp} XP</span></div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Class Selector */}
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 lg:p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${classInfo.bg} opacity-20 pointer-events-none transition-colors duration-500`}></div>
                  
                  <div className="flex items-center justify-between mb-4 relative z-10">
                      <button onClick={prevClass} className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-90"><ChevronLeft size={20} className="text-slate-400" /></button>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Starting Class</span>
                      <button onClick={nextClass} className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-90"><ChevronRight size={20} className="text-slate-400" /></button>
                  </div>

                  <div className="text-center py-2 transition-all duration-300 relative z-10">
                      <div className="text-4xl lg:text-5xl mb-4 animate-bounce drop-shadow-lg">{isLocked ? '🔒' : classInfo.icon}</div>
                      <h3 className={`text-xl lg:text-2xl font-black fantasy-font mb-2 ${isLocked ? 'text-slate-600' : classInfo.color} drop-shadow-md`}>
                          {classInfo.title}
                      </h3>
                      <p className="text-xs lg:text-sm text-slate-400 h-10 flex items-center justify-center font-medium leading-relaxed px-4">
                          {isLocked ? `Unlocks at Account Level ${
                              currentClass === HeroClass.WARRIOR ? 3 :
                              currentClass === HeroClass.ROGUE ? 5 :
                              currentClass === HeroClass.MAGE ? 10 : 20
                          }` : classInfo.desc}
                      </p>
                  </div>
              </div>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <a 
                href="https://instagram.com/sp8m8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-indigo-400 transition-colors font-mono tracking-widest flex items-center justify-center gap-1 group"
            >
                Made with <span className="text-red-500 group-hover:animate-ping">&lt;3</span> by Harry Speight
            </a>
        </div>
      </div>
    </div>
  );
};
