
import React, { useEffect, useState } from 'react';
import { Play, Trophy, Settings, Scroll, CheckCircle2, Circle, ChevronLeft, ChevronRight, Lock, Swords, Grid, BookOpen, Shield, Star, Crown, Zap, Flame, X, Skull, Coins, LayoutGrid } from 'lucide-react';
import { getPlayerProfile, getNextLevelXp } from '../services/storageService';
import { PlayerProfile, HeroClass, GameMode } from '../types';
import { getLevelRank } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onStart: (selectedClass: HeroClass, mode: GameMode) => void;
  onContinue: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  hasSave: boolean;
}

const CLASS_DESCRIPTIONS: Record<HeroClass, { title: string, desc: string, icon: string, color: string, bg: string, accent: string }> = {
    [HeroClass.ADVENTURER]: { title: 'Adventurer', desc: 'Balanced stats. A reliable start.', icon: '🛡️', color: 'text-slate-200', bg: 'from-slate-800 to-slate-900', accent: 'border-slate-500' },
    [HeroClass.WARRIOR]: { title: 'Warrior', desc: 'Starts with a Purge Scroll. Built for combat.', icon: '⚔️', color: 'text-red-400', bg: 'from-red-950 to-slate-950', accent: 'border-red-600' },
    [HeroClass.ROGUE]: { title: 'Rogue', desc: 'Starts with a Reroll Token. Tricks up the sleeve.', icon: '🗡️', color: 'text-emerald-400', bg: 'from-emerald-950 to-slate-950', accent: 'border-emerald-600' },
    [HeroClass.MAGE]: { title: 'Mage', desc: 'Starts with an XP Potion. Quick learner.', icon: '🔮', color: 'text-blue-400', bg: 'from-blue-950 to-slate-950', accent: 'border-blue-600' },
    [HeroClass.PALADIN]: { title: 'Paladin', desc: 'Starts with a Golden Rune. Divine favor.', icon: '✨', color: 'text-amber-300', bg: 'from-amber-950 to-slate-950', accent: 'border-amber-500' },
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, onContinue, onOpenLeaderboard, onOpenSettings, onOpenHelp, hasSave }) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const [shakeError, setShakeError] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

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
    // ROOT: min-h-[100dvh] allows scrolling if content is too tall. Flex column ensures footer is pushed down.
    <div className="min-h-[100dvh] w-full bg-[#050505] relative overflow-x-hidden flex flex-col font-sans text-slate-200 selection:bg-amber-500/30">
      
      {/* --- LAYER 1: ATMOSPHERIC BACKGROUND (Fixed) --- */}
      <div className="fixed inset-0 z-0">
          <div 
            className="absolute inset-0 opacity-30 animate-[pulse_12s_ease-in-out_infinite]"
            style={{
                backgroundImage: `url('https://image.pollinations.ai/prompt/dark fantasy ancient stone dungeon texture obsidian walls cinematic lighting dramatic shadows?width=1024&height=1024&nologo=true')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: 'scale(1.05)'
            }}
          />
          {/* Noise Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/stardust.png')` }}></div>
          
          {/* Deep Vignette & Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)] pointer-events-none" />
      </div>

      {/* --- LAYER 2: SCROLLABLE CONTENT --- */}
      <div className="relative z-10 w-full flex-1 flex flex-col">
        
        {/* TOP BAR: Player Badge */}
        <div className="w-full flex justify-between items-start p-4 md:p-8 shrink-0">
            {/* Left: Version / Minimal Brand */}
            <div className="hidden md:block opacity-30 text-[10px] uppercase tracking-[0.3em]">
                v2.4.0 <span className="text-amber-500">Early Access</span>
            </div>

            {/* Right: Player Badge (Clickable) */}
            <button 
                onClick={() => setShowLedger(true)}
                className="group relative bg-black/60 backdrop-blur-xl border border-white/10 hover:border-amber-500/50 rounded-full pr-6 pl-2 py-2 flex items-center gap-3 transition-all duration-300 hover:bg-black/80 ml-auto md:ml-0 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
            >
                <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(251,191,36,0)] group-hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-shadow duration-500"></div>
                
                {/* Rank Icon */}
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-slate-800 to-black border border-slate-700 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform`}>
                    <RankIcon size={16} className={`${rank.color} relative z-10 md:w-5 md:h-5`} />
                    <div className={`absolute inset-0 opacity-20 ${rank.bg}`}></div>
                </div>

                {/* Info */}
                <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${rank.color}`}>{rank.title}</span>
                        <span className="text-[9px] md:text-[10px] text-slate-500 font-mono">Lvl {profile.accountLevel}</span>
                    </div>
                    {/* XP Bar Micro */}
                    <div className="w-20 md:w-24 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                        <div 
                            className={`h-full ${rank.bg} brightness-150 shadow-[0_0_5px_currentColor]`} 
                            style={{ width: `${xpPercent}%` }}
                        />
                    </div>
                </div>
            </button>
        </div>

        {/* CENTER: Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
            
            {/* HERO TITLE */}
            <div className="text-center mb-6 md:mb-8 relative shrink-0">
                <div className="absolute -inset-10 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-red-700 fantasy-font drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-tighter leading-none relative z-10">
                    DRAGON'S<br/>HOARD
                </h1>
                <div className="h-px w-24 md:w-32 bg-gradient-to-r from-transparent via-amber-700 to-transparent mx-auto mt-2 md:mt-4"></div>
            </div>

            {/* CLASS SELECTOR CAROUSEL */}
            <div className="relative w-full max-w-lg mb-4 flex items-center justify-center gap-2 md:gap-4 shrink-0">
                <button onClick={prevClass} className="p-2 md:p-3 rounded-full hover:bg-white/5 text-slate-600 hover:text-amber-400 transition-colors"><ChevronLeft size={24} /></button>
                
                {/* 
                    Card Container 
                    - Auto height to fit content (top icon to bottom text)
                    - Reduced padding and aspect ratio constraints
                */}
                <div className={`
                    relative w-48 sm:w-64 md:w-72 
                    h-auto
                    py-6 md:py-8
                    rounded-2xl border-2 transition-all duration-300 bg-black/80 backdrop-blur-md overflow-hidden group shadow-2xl flex flex-col
                    ${isLocked ? 'border-slate-800 grayscale' : `${classInfo.accent} shadow-${classInfo.color}/10`}
                    ${shakeError ? 'animate-shake' : ''}
                `}>
                    {/* Class Card Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${classInfo.bg} opacity-30 group-hover:opacity-50 transition-opacity`}></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center">
                        <div className={`text-5xl md:text-6xl mb-2 md:mb-3 transition-transform duration-500 group-hover:scale-110 drop-shadow-xl ${isLocked ? 'opacity-50' : ''}`}>
                            {isLocked ? '🔒' : classInfo.icon}
                        </div>
                        <h3 className={`text-lg md:text-xl font-black uppercase tracking-wide mb-1 ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                            {classInfo.title}
                        </h3>
                        <p className="text-[10px] md:text-xs text-slate-400 font-medium leading-relaxed max-w-[90%]">
                            {isLocked ? `Unlocks at Account Level ${
                              currentClass === HeroClass.WARRIOR ? 3 :
                              currentClass === HeroClass.ROGUE ? 5 :
                              currentClass === HeroClass.MAGE ? 10 : 20
                            }` : classInfo.desc}
                        </p>
                    </div>
                </div>

                <button onClick={nextClass} className="p-2 md:p-3 rounded-full hover:bg-white/5 text-slate-600 hover:text-amber-400 transition-colors"><ChevronRight size={24} /></button>
            </div>
        </div>

        {/* RIGHT SIDE: Floating Quest Log (Desktop Only) */}
        <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 right-8 w-64 perspective-[1000px]">
             <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-5 transform rotate-y-[-5deg] hover:rotate-y-0 transition-transform duration-500 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
                    <Scroll size={16} className="text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Daily Bounties</h3>
                </div>
                
                <div className="space-y-3">
                    {profile.activeBounties.map(b => (
                        <div key={b.id} className="group relative p-3 bg-slate-900/50 border border-white/5 hover:border-amber-500/30 rounded-lg transition-all duration-300 hover:bg-slate-800 hover:translate-x-1 cursor-default">
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 ${b.isCompleted ? 'text-green-500' : 'text-slate-600 group-hover:text-amber-500'}`}>
                                    {b.isCompleted ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                </div>
                                <div>
                                    <div className={`text-xs font-medium mb-1 ${b.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-white'}`}>
                                        {b.description}
                                    </div>
                                    <div className="text-[10px] font-mono text-amber-500/80">
                                        {b.rewardXp} XP
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      </div>

      {/* --- LAYER 3: STATIC FOOTER (MOBILE/DESKTOP ACTIONS) --- */}
      <div className="w-full z-50 p-4 shrink-0 bg-gradient-to-t from-black via-black/95 to-transparent mt-auto">
          <div className="max-w-xs mx-auto w-full flex flex-col gap-3">
              
              {/* PRIMARY CTA */}
              <button 
                  onClick={handleStartAttempt}
                  className={`w-full py-4 relative group overflow-hidden rounded-xl transition-all duration-300 shadow-xl
                      ${isLocked ? 'cursor-not-allowed opacity-50 grayscale' : 'hover:scale-105 hover:shadow-[0_0_30px_rgba(234,88,12,0.4)]'}
                  `}
              >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-700 via-orange-600 to-red-700 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10 flex items-center justify-center gap-3 font-black text-white tracking-widest uppercase text-sm drop-shadow-md">
                      <Swords size={20} className={` ${isLocked ? '' : 'animate-pulse'}`} />
                      <span>Start New Run</span>
                  </div>
              </button>

              {hasSave && (
                  <button 
                      onClick={onContinue}
                      className="w-full py-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/50 hover:border-green-500/50 text-slate-300 hover:text-green-400 font-bold rounded-lg flex items-center justify-center gap-2 transition-all backdrop-blur-md group text-sm"
                  >
                      <Play size={16} className="group-hover:fill-current" /> Continue Journey
                  </button>
              )}

              {/* Secondary Actions */}
              <div className="flex gap-2 w-full">
                  <SecondaryBtn icon={<Trophy size={16} />} label="Scores" onClick={onOpenLeaderboard} />
                  <SecondaryBtn icon={<Settings size={16} />} label="Config" onClick={onOpenSettings} />
                  <SecondaryBtn icon={<BookOpen size={16} />} label="Guide" onClick={onOpenHelp} />
              </div>
          </div>

          <div className="md:hidden text-center opacity-30 text-[9px] uppercase tracking-widest mt-4">
              <span className="text-slate-500">Made with &lt;3 by Harry Speight</span>
          </div>
      </div>

      {/* --- HERO'S LEDGER MODAL --- */}
      <HeroLedgerModal 
        isOpen={showLedger} 
        onClose={() => setShowLedger(false)} 
        profile={profile} 
        rank={rank}
        xpPercent={xpPercent}
        xpIntoLevel={xpIntoLevel}
        xpForLevel={xpForLevel}
      />

    </div>
  );
};

// Sub-component for small buttons
const SecondaryBtn = ({ icon, label, onClick }: any) => (
    <button 
        onClick={onClick}
        className="flex-1 py-3 bg-black/40 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg text-slate-500 hover:text-white flex flex-col items-center justify-center gap-1 transition-all group backdrop-blur-sm"
    >
        <span className="group-hover:-translate-y-0.5 transition-transform">{icon}</span>
        <span className="text-[8px] font-bold uppercase tracking-wide">{label}</span>
    </button>
);

// --- HERO LEDGER COMPONENT ---
const HeroLedgerModal = ({ isOpen, onClose, profile, rank, xpPercent, xpIntoLevel, xpForLevel }: any) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                        className="relative w-full max-w-lg bg-[#0a0c10] border-2 border-amber-500/50 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden"
                    >
                        {/* Decorative Header Bar */}
                        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                        
                        <div className="p-6 md:p-8 relative">
                             <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                                 <X size={24} />
                             </button>

                             {/* Header Section */}
                             <div className="flex flex-col items-center mb-8">
                                 <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-black border-2 border-amber-500/50 flex items-center justify-center shadow-lg mb-3">
                                     <rank.icon size={36} className={`${rank.color} drop-shadow-[0_0_10px_currentColor]`} />
                                 </div>
                                 <h2 className={`text-2xl font-black uppercase tracking-wider ${rank.color}`}>{rank.title}</h2>
                                 <div className="text-slate-500 font-mono text-xs">Level {profile.accountLevel}</div>
                             </div>

                             {/* XP Progress */}
                             <div className="mb-8">
                                 <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                                     <span>Experience</span>
                                     <span className="text-amber-400">{Math.floor(xpIntoLevel)} / {xpForLevel}</span>
                                 </div>
                                 <div className="h-3 bg-slate-900 rounded-full border border-slate-700 overflow-hidden">
                                     <div className={`h-full ${rank.bg} brightness-125`} style={{ width: `${xpPercent}%` }}></div>
                                 </div>
                             </div>

                             {/* Stats Grid (Mocked for Demo as per request) */}
                             <div className="grid grid-cols-2 gap-3 mb-8">
                                 <StatBox label="Highest Score" value={profile.highScore.toLocaleString()} icon={<Trophy size={14} className="text-yellow-500"/>} />
                                 <StatBox label="Gold Hoarded" value={(profile.gamesPlayed * 320).toLocaleString()} icon={<Coins size={14} className="text-amber-400"/>} />
                                 <StatBox label="Dragons Slain" value={(Math.floor(profile.gamesPlayed / 2)).toString()} icon={<Skull size={14} className="text-red-500"/>} />
                                 <StatBox label="Highest Combo" value="x12" icon={<LayoutGrid size={14} className="text-purple-400"/>} />
                             </div>

                             {/* Recent History */}
                             <div>
                                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-1">Recent History</h3>
                                 <div className="space-y-2">
                                     <HistoryItem result="DEFEAT" floor="Floor 4" time="2h ago" color="text-red-500" />
                                     <HistoryItem result="VICTORY" floor="Floor 12" time="1d ago" color="text-green-500" />
                                     <HistoryItem result="DEFEAT" floor="Floor 7" time="2d ago" color="text-red-500" />
                                 </div>
                             </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const StatBox = ({ label, value, icon }: any) => (
    <div className="bg-slate-900/50 border border-white/5 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wide flex items-center gap-1">{icon} {label}</div>
        <div className="text-white font-mono font-bold text-lg">{value}</div>
    </div>
);

const HistoryItem = ({ result, floor, time, color }: any) => (
    <div className="flex justify-between items-center text-xs p-2 hover:bg-white/5 rounded transition-colors">
        <span className={`font-bold ${color}`}>{result}</span>
        <span className="text-slate-300">{floor}</span>
        <span className="text-slate-600 font-mono">{time}</span>
    </div>
);
