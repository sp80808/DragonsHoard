
import React, { useEffect, useState, useRef } from 'react';
import { HeroClass, GameMode, PlayerProfile, DailyBounty, Difficulty } from '../types';
import { Trophy, Settings, BookOpen, Swords, Play, Maximize, Minimize, CheckCircle, Circle, Skull, RefreshCw, Calendar, Zap, LayoutGrid, Ghost } from 'lucide-react';
import { getPlayerProfile } from '../services/storageService';
import { DAILY_MODIFIERS } from '../constants';
import { generateDailyModifiers } from '../services/gameLogic';
import { useLootSystem } from './LootSystem';

interface SplashScreenProps {
  onStart: (heroClass: HeroClass, mode: GameMode, seed?: number, difficulty?: Difficulty, tileset?: string) => void;
  onContinue: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  hasSave: boolean;
}

const SecondaryBtn = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="flex-1 py-3 bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/50 rounded-lg text-slate-400 hover:text-white flex flex-col items-center justify-center gap-1 transition-all group backdrop-blur-sm hover:border-slate-600"
    >
        <span className="group-hover:scale-110 transition-transform relative z-10 opacity-80 group-hover:opacity-100">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest relative z-10">{label}</span>
    </button>
);

const TexturedButton = ({ 
    onClick, 
    gradient, 
    border, 
    shadow, 
    icon: Icon, 
    label, 
    subLabel 
}: { 
    onClick: () => void, 
    gradient: string, 
    border: string, 
    shadow: string, 
    icon?: any, 
    label: string, 
    subLabel?: string 
}) => (
    <button 
        onClick={onClick}
        className={`w-full relative group overflow-hidden rounded-xl border ${border} ${shadow} transition-all hover:scale-[1.01] active:scale-[0.99]`}
    >
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-80 transition-opacity group-hover:opacity-100`}></div>
        
        {/* Texture Overlay - Reduced Opacity */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/binding-dark.png')] mix-blend-overlay pointer-events-none"></div>
        
        {/* Shine Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10 py-4 px-6 flex flex-col items-center justify-center gap-0.5">
            <div className="flex items-center gap-3 text-white font-black text-lg tracking-wide uppercase drop-shadow-md">
                {Icon && <Icon size={20} className="filter drop-shadow-sm opacity-90" />} 
                {label}
            </div>
            {subLabel && (
                <div className="text-[10px] text-white/60 font-serif tracking-[0.25em] uppercase font-bold pt-1">
                    {subLabel}
                </div>
            )}
        </div>
    </button>
);

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, onContinue, onOpenLeaderboard, onOpenSettings, onOpenHelp, hasSave }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [dailyModifiers, setDailyModifiers] = useState<any[]>([]);
  const [dailySeed, setDailySeed] = useState(0);
  
  // Game Setup State
  const [difficulty, setDifficulty] = useState<Difficulty>('NORMAL');
  const [tileset, setTileset] = useState<string>('DEFAULT');

  // Loot System for Bounty Claims
  const { spawnLoot } = useLootSystem();

  useEffect(() => {
    // Load profile for bounties
    setProfile(getPlayerProfile());

    // Generate Daily Seed
    const today = new Date();
    const seed = parseInt(`${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`);
    setDailySeed(seed);
    setDailyModifiers(generateDailyModifiers(seed));

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const handleClaimBounty = (e: React.MouseEvent, bountyId: string, rewardXp: number) => {
    // This is purely visual here, as the actual logic runs in storageService/gameLogic
    // But we trigger the visual flyout
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    spawnLoot('XP', rect, 8);
    // In a real app, you'd dispatch an action to update the state immediately or wait for animation
  };

  const unlockedHardMode = profile?.unlockedFeatures?.includes('HARD_MODE');
  const unlockedUndeadSet = profile?.unlockedFeatures?.includes('TILESET_UNDEAD');
  const unlockedBossRush = profile?.unlockedFeatures?.includes('MODE_BOSS_RUSH');

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 overflow-hidden bg-black">
      {/* Background Image Layer with Blend */}
      <div 
        className="absolute inset-0 opacity-30 bg-cover bg-center mix-blend-overlay animate-[pulse_10s_ease-in-out_infinite]"
        style={{ backgroundImage: `url('https://image.pollinations.ai/prompt/dark%20fantasy%20dungeon%20entrance%20torches%20stone%20walls%20rpg?width=1024&height=1024&nologo=true&seed=999')` }}
      ></div>
      
      {/* Texture Overlay - Reduced Opacity */}
      <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
      
      {/* Vignette & Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-900/80 to-black/95"></div>
      
      {/* Fullscreen Toggle */}
      <button 
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-50 p-2 text-slate-500 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors border border-white/5"
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      {/* Decorative Runes - Made very subtle */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
         <div className="absolute top-10 left-10 text-8xl animate-pulse font-serif">ᚠ</div>
         <div className="absolute bottom-20 right-10 text-8xl animate-pulse delay-700 font-serif">ᚢ</div>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700 max-h-full overflow-y-auto overflow-x-hidden pb-10 no-scrollbar">
          
          {/* Logo / Header - Increased padding to prevent clipping */}
          <div className="text-center mt-8 relative shrink-0 p-4">
              <div className="absolute -inset-10 bg-orange-500/5 blur-3xl rounded-full pointer-events-none"></div>
              
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-orange-300 to-red-500 fantasy-font tracking-tight filter drop-shadow-xl relative z-10 pb-2">
                  DRAGON'S<br/>HOARD
              </h1>
              
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent mx-auto my-4"></div>
              
              <p className="text-slate-400 font-serif italic text-xs tracking-[0.4em] uppercase opacity-70">
                  Roguelike Puzzle RPG
              </p>
          </div>

          {/* Setup Toggles (If features unlocked) */}
          {(unlockedHardMode || unlockedUndeadSet) && (
              <div className="w-full bg-slate-900/30 border border-slate-800/50 rounded-xl p-3 backdrop-blur-sm flex justify-center gap-4 shrink-0">
                  {unlockedHardMode && (
                      <button 
                        onClick={() => setDifficulty(d => d === 'NORMAL' ? 'HARD' : 'NORMAL')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${difficulty === 'HARD' ? 'bg-red-900/50 border-red-500 text-red-100' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
                      >
                          <Skull size={14} /> {difficulty === 'HARD' ? 'HARD MODE' : 'NORMAL'}
                      </button>
                  )}
                  {unlockedUndeadSet && (
                      <button 
                        onClick={() => setTileset(t => t === 'DEFAULT' ? 'UNDEAD' : 'DEFAULT')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${tileset === 'UNDEAD' ? 'bg-purple-900/50 border-purple-500 text-purple-100' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
                      >
                          <Ghost size={14} /> {tileset === 'UNDEAD' ? 'UNDEAD SET' : 'DEFAULT SET'}
                      </button>
                  )}
              </div>
          )}

          {/* Daily Bounties Widget - Simplified Visuals */}
          {profile && (
              <div className="w-full bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 backdrop-blur-sm animate-in slide-in-from-bottom-2 shrink-0">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                      <span className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-widest flex items-center gap-2">
                          <Skull size={12} /> Daily Bounties
                      </span>
                      <span className="text-[9px] text-slate-600 font-mono">Resets in 24h</span>
                  </div>
                  <div className="space-y-2">
                      {profile.activeBounties.map((bounty: DailyBounty) => (
                          <div key={bounty.id} className="flex items-center justify-between text-xs group">
                              <span className={`flex items-center gap-3 ${bounty.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300 group-hover:text-slate-200 transition-colors'}`}>
                                  {bounty.isCompleted ? <CheckCircle size={12} className="text-green-500/70"/> : <Circle size={12} className="text-slate-700"/>}
                                  {bounty.description}
                              </span>
                              {bounty.isCompleted ? (
                                  <button 
                                    className="text-[10px] text-green-500/50 font-mono cursor-default"
                                    onClick={(e) => handleClaimBounty(e, bounty.id, bounty.rewardXp)} // Visual feedback even if already claimed
                                  >
                                    Claimed
                                  </button>
                              ) : (
                                  <span className="text-[10px] text-yellow-500/60 font-mono">+{bounty.rewardXp} XP</span>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* Main Actions */}
          <div className="w-full space-y-4 px-2 shrink-0 pb-6">
              {hasSave && (
                  <TexturedButton 
                      onClick={onContinue}
                      label="Continue Journey"
                      subLabel="Resume Game"
                      icon={Play}
                      gradient="from-emerald-900 to-emerald-800"
                      border="border-emerald-500/30"
                      shadow="shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  />
              )}

              <TexturedButton 
                  onClick={() => onStart(HeroClass.ADVENTURER, 'RPG', undefined, difficulty, tileset)}
                  label="New Adventure"
                  subLabel="Enter the Dungeon"
                  icon={Swords}
                  gradient="from-red-900 to-orange-900"
                  border="border-red-500/30"
                  shadow="shadow-[0_0_20px_rgba(220,38,38,0.1)]"
              />
              
              {/* Daily Dungeon Button - Cleaner Look */}
              <button 
                  onClick={() => onStart(HeroClass.ADVENTURER, 'DAILY', dailySeed, difficulty, tileset)}
                  className="w-full relative group overflow-hidden rounded-xl border border-indigo-500/30 shadow-lg hover:shadow-indigo-500/10 transition-all bg-slate-900/60 hover:bg-slate-800"
              >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 py-3 px-5 flex items-center justify-between">
                      <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2 text-indigo-200 font-bold text-sm uppercase tracking-wide group-hover:text-white transition-colors">
                              <Calendar size={16} className="text-indigo-400" /> Daily Dungeon
                          </div>
                          <div className="text-[9px] text-indigo-400/60 font-mono mt-1 flex gap-2">
                              {dailyModifiers.slice(0,2).map((mod: any) => (
                                  <span key={mod.id} className="flex items-center gap-1">
                                      {mod.icon} {mod.name}
                                  </span>
                              ))}
                          </div>
                      </div>
                      <div className="text-indigo-500/30 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
                          <Zap size={18} />
                      </div>
                  </div>
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => onStart(HeroClass.ADVENTURER, 'CLASSIC', undefined, difficulty, tileset)}
                    className="group py-4 bg-slate-900/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
                  >
                      <span className="text-slate-400 font-bold text-xs group-hover:text-white transition-colors">CLASSIC</span>
                      <span className="text-[9px] text-slate-600 tracking-wider">NO RPG</span>
                  </button>

                  {unlockedBossRush ? (
                      <button 
                        onClick={() => onStart(HeroClass.ADVENTURER, 'BOSS_RUSH', undefined, difficulty, tileset)}
                        className="group py-4 bg-red-900/20 hover:bg-red-900/30 border border-red-500/30 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
                      >
                          <span className="text-red-300 font-bold text-xs group-hover:text-white transition-colors flex items-center gap-1">
                              <Skull size={12}/> BOSS RUSH
                          </span>
                          <span className="text-[9px] text-red-500/60 tracking-wider">ARENA</span>
                      </button>
                  ) : (
                      <button 
                        onClick={() => onStart(HeroClass.ADVENTURER, 'VERSUS')}
                        className="group py-4 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-500/30 rounded-xl transition-all flex flex-col items-center justify-center gap-1"
                      >
                          <span className="text-purple-300 font-bold text-xs group-hover:text-white transition-colors flex items-center gap-1">
                              <Swords size={12}/> VERSUS
                          </span>
                          <span className="text-[9px] text-purple-500/60 tracking-wider">LOCAL PVP</span>
                      </button>
                  )}
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-2 w-full pt-4 border-t border-white/5">
                  <SecondaryBtn icon={<Trophy size={14} />} label="Legends" onClick={onOpenLeaderboard} />
                  <SecondaryBtn icon={<Settings size={14} />} label="Config" onClick={onOpenSettings} />
                  <SecondaryBtn icon={<BookOpen size={14} />} label="Codex" onClick={onOpenHelp} />
              </div>
          </div>

          <div className="md:hidden text-center opacity-20 text-[9px] uppercase tracking-widest pb-4 shrink-0">
              <span className="text-slate-500">v0.9.7</span>
          </div>
      </div>
    </div>
  );
};
