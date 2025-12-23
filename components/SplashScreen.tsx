
import React, { useEffect, useState } from 'react';
import { HeroClass, GameMode, PlayerProfile, Difficulty } from '../types';
import { Trophy, Settings, Swords, Play, Skull, Palette, Grid, HelpCircle, Star, Calendar, RefreshCcw, ChevronRight, Users, ChevronDown, Gamepad2, Award } from 'lucide-react';
import { getPlayerProfile, getNextLevelXp } from '../services/storageService';
import { generateDailyModifiers } from '../services/gameLogic';
import { AnimatePresence, motion } from 'framer-motion';

interface SplashScreenProps {
  onStart: (heroClass: HeroClass, mode: GameMode, seed?: number, difficulty?: Difficulty, tileset?: string) => void;
  onContinue: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenGrimoire: () => void;
  hasSave: boolean;
}

const MenuButton = ({ onClick, label, icon, primary = false, subtitle, color = 'blue' }: { onClick: () => void, label: string, icon: React.ReactNode, primary?: boolean, subtitle?: string, color?: string }) => {
    const baseColor = primary ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white';
    const hoverColor = primary ? 'hover:bg-yellow-500' : '';
    
    return (
        <button 
            onClick={onClick}
            className={`w-full group relative flex items-center p-4 rounded-xl border-2 transition-all duration-300 transform active:scale-[0.98] shadow-lg
                ${baseColor} ${hoverColor}
            `}
        >
            <div className={`p-2 rounded-lg bg-black/20 mr-4 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                {icon}
            </div>
            <div className="flex flex-col items-start flex-1">
                <span className="font-black uppercase tracking-wide text-sm md:text-base leading-none mb-1">{label}</span>
                {subtitle && <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{subtitle}</span>}
            </div>
            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
        </button>
    );
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, onContinue, onOpenLeaderboard, onOpenSettings, onOpenHelp, onOpenGrimoire, hasSave }) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [showProfileStats, setShowProfileStats] = useState(false);
  
  useEffect(() => {
    setProfile(getPlayerProfile());
  }, []);

  const handleStartGame = () => {
      onStart(HeroClass.ADVENTURER, 'RPG', undefined, 'NORMAL', profile?.activeTilesetId);
  };

  const handleDaily = () => {
      const today = new Date();
      const seed = parseInt(`${today.getFullYear()}${today.getMonth() + 1}${today.getDate()}`);
      onStart(HeroClass.ADVENTURER, 'DAILY', seed, 'NORMAL', profile?.activeTilesetId);
  };

  const handleVersus = () => {
      onStart(HeroClass.ADVENTURER, 'VERSUS', undefined, 'NORMAL', profile?.activeTilesetId);
  };

  return (
    <div className="absolute inset-0 z-50 flex bg-[#050505] overflow-hidden font-sans">
      
      {/* LEFT COLUMN: HERO ART (Desktop) / HEADER (Mobile) */}
      <div className="flex-1 md:flex-[1.2] relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center p-8">
          {/* Animated Background - Using Textless Prompt */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-[40s] scale-110 animate-[pulse_15s_ease-in-out_infinite]"
            style={{ backgroundImage: `url('https://image.pollinations.ai/prompt/mysterious%20dark%20fantasy%20dungeon%20entrance%20environment%20art%20no%20text%20scenery?width=1024&height=1024&nologo=true&seed=99')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 md:bg-gradient-to-r md:from-transparent md:to-[#0b0f15]"></div>
          
          {/* Logo Content */}
          <div className="relative z-10 text-center flex flex-col items-center">
              <div className="mb-6 relative">
                  <Skull size={80} className="text-red-600 relative z-10 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)] animate-float" />
                  <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse"></div>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-orange-400 to-red-700 fantasy-font tracking-tighter drop-shadow-2xl leading-[0.8]">
                  DRAGON'S<br/>HOARD
              </h1>
              
              <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-orange-500 to-transparent mt-6 mb-3 rounded-full shadow-[0_0_15px_orange]"></div>
              
              <p className="text-orange-200/70 font-serif italic text-sm md:text-lg tracking-[0.4em] uppercase drop-shadow-md">
                  Roguelike Puzzle RPG
              </p>

              {/* Version Tag */}
              <div className="mt-8 text-[10px] text-slate-500 font-mono border border-slate-700/50 px-2 py-1 rounded bg-black/40 backdrop-blur-sm">
                  v0.9.7 BETA
              </div>
          </div>

          {/* Footer - Restored */}
          <div className="absolute bottom-4 text-center z-10">
              <a href="https://instagram.com/sp8m8" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-600 hover:text-red-400 transition-colors font-bold uppercase tracking-widest opacity-70 hover:opacity-100">
                  Made with &lt;3 by Sp8
              </a>
          </div>
      </div>

      {/* RIGHT COLUMN: MENU */}
      <div className="flex-1 relative bg-[#0b0f15] flex flex-col border-l border-slate-800 shadow-2xl z-20">
          
          {/* Profile Header */}
          <div className="relative border-b border-slate-800/50 bg-slate-900/50 z-20">
              <div className="p-6 flex justify-between items-center">
                  {profile && (
                      <button 
                        onClick={() => setShowProfileStats(!showProfileStats)}
                        className="flex items-center gap-3 text-left hover:bg-slate-800/50 -ml-2 p-2 rounded-xl transition-all group"
                      >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-blue-900 flex items-center justify-center border-2 border-slate-700 shadow-inner group-hover:border-indigo-400 transition-colors relative">
                              <span className="font-black text-lg text-white">{profile.accountLevel}</span>
                              {showProfileStats && <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>}
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 group-hover:text-indigo-300">
                                Account Level <ChevronDown size={10} className={`transition-transform ${showProfileStats ? 'rotate-180' : ''}`} />
                              </span>
                              <span className="text-xs font-mono text-white font-bold">{Math.floor(profile.totalAccountXp).toLocaleString()} XP</span>
                          </div>
                      </button>
                  )}
                  <div className="flex gap-2">
                      <button onClick={onOpenSettings} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                          <Settings size={20} />
                      </button>
                  </div>
              </div>

              {/* Collapsible Stats Panel */}
              <AnimatePresence>
                  {showProfileStats && profile && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-950/80 border-t border-slate-800 overflow-hidden"
                      >
                          <div className="p-4 grid grid-cols-2 gap-4">
                              <div className="col-span-2">
                                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-1">
                                      <span>Progress to Level {profile.accountLevel + 1}</span>
                                      <span>{Math.floor((profile.totalAccountXp / getNextLevelXp(profile.accountLevel)) * 100)}%</span>
                                  </div>
                                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                      <div 
                                        className="h-full bg-gradient-to-r from-indigo-600 to-blue-500" 
                                        style={{ width: `${(profile.totalAccountXp / getNextLevelXp(profile.accountLevel)) * 100}%` }}
                                      ></div>
                                  </div>
                              </div>
                              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center gap-3">
                                  <Gamepad2 size={16} className="text-slate-500" />
                                  <div>
                                      <div className="text-[10px] text-slate-500 uppercase font-bold">Games Played</div>
                                      <div className="text-sm font-mono text-white font-bold">{profile.gamesPlayed}</div>
                                  </div>
                              </div>
                              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 flex items-center gap-3">
                                  <Award size={16} className="text-yellow-600" />
                                  <div>
                                      <div className="text-[10px] text-slate-500 uppercase font-bold">High Score</div>
                                      <div className="text-sm font-mono text-white font-bold">{profile.highScore.toLocaleString()}</div>
                                  </div>
                              </div>
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col justify-center gap-4">
              
              {hasSave ? (
                  <MenuButton onClick={onContinue} label="Continue Journey" icon={<Play fill="currentColor" />} primary subtitle="Resume your last run" />
              ) : (
                  <MenuButton onClick={handleStartGame} label="New Adventure" icon={<Swords />} primary subtitle="Start a fresh run" />
              )}

              <div className="grid grid-cols-2 gap-3 mt-2">
                  <button onClick={handleDaily} className="bg-indigo-900/20 hover:bg-indigo-900/40 border border-indigo-500/30 hover:border-indigo-500/60 p-4 rounded-xl flex flex-col items-center gap-2 transition-all group">
                      <Calendar size={24} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-indigo-100 uppercase">Daily Run</span>
                  </button>
                  <button onClick={handleVersus} className="bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 hover:border-red-500/60 p-4 rounded-xl flex flex-col items-center gap-2 transition-all group">
                      <Users size={24} className="text-red-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-red-100 uppercase">Versus</span>
                  </button>
              </div>

              <div className="h-px bg-slate-800 w-full my-2"></div>

              <MenuButton onClick={onOpenLeaderboard} label="Hall of Heroes" icon={<Trophy />} subtitle="Global Leaderboards" />
              
              <div className="flex gap-3">
                  <button onClick={onOpenGrimoire} className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-600 p-3 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase">
                      <Palette size={16} /> Collection
                  </button>
                  <button onClick={onOpenHelp} className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-600 p-3 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase">
                      <HelpCircle size={16} /> Codex
                  </button>
              </div>

          </div>
      </div>
    </div>
  );
};
