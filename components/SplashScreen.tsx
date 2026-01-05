
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { HeroClass, GameMode, PlayerProfile, Difficulty } from '../types';
import { Trophy, Settings, Swords, Play, Skull, Palette, Grid, HelpCircle, Star, Calendar, RefreshCcw, ChevronRight, Users, ChevronDown, Gamepad2, Award, Lock, User, Maximize, Facebook, Heart } from 'lucide-react';
import { getPlayerProfile, getNextLevelXp } from '../services/storageService';
import { generateDailyModifiers } from '../services/gameLogic';
import { facebookService } from '../services/facebookService';
import { AnimatePresence, motion } from 'framer-motion';
import { genUrl } from '../constants';
import { useFullscreen } from '../hooks/useFullscreen';
import { useOrientation } from '../hooks/useOrientation';
import { useMenuNavigation } from '../hooks/useMenuNavigation';

interface SplashScreenProps {
  onStart: (heroClass: HeroClass, mode: GameMode, seed?: number, difficulty?: Difficulty, tileset?: string) => void;
  onContinue: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenGrimoire: () => void;
  onOpenVersus: () => void;
  hasSave: boolean;
}

const GoldDust = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const particles: any[] = [];
        const particleCount = 40;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = "#FFD700";

            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            requestAnimationFrame(render);
        };
        render();

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10 opacity-60 mix-blend-screen" />;
};

const MenuButton = ({ onClick, label, icon, primary = false, subtitle, color = 'blue', disabled = false, isLandscape, isFocused, onMouseEnter }: { onClick: () => void, label: string, icon: React.ReactNode, primary?: boolean, subtitle?: string, color?: string, disabled?: boolean, isLandscape?: boolean, isFocused?: boolean, onMouseEnter?: () => void }) => {
    const baseColor = disabled 
        ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-70' 
        : primary 
            ? 'bg-yellow-600 border-yellow-500 text-white' 
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white';
    
    const hoverColor = primary && !disabled ? 'hover:bg-yellow-500' : '';
    const focusRing = isFocused && !disabled ? 'ring-2 ring-yellow-400 scale-[1.02] z-20 shadow-xl' : '';
    
    // Conditional styling for short landscape mode (mobile rotated) vs desktop landscape
    const landscapeCompact = isLandscape ? 'max-h-[500px]:p-2 max-h-[500px]:min-h-[50px]' : '';
    
    return (
        <button 
            onClick={!disabled ? onClick : undefined}
            onMouseEnter={onMouseEnter}
            disabled={disabled}
            className={`w-full group relative flex items-center p-3 md:p-4 rounded-xl border-2 transition-all duration-100 transform ${!disabled ? 'active:scale-95 shadow-lg' : ''}
                ${baseColor} ${hoverColor} ${focusRing} ${landscapeCompact}
            `}
        >
            <div className={`p-2 rounded-lg bg-black/20 mr-3 md:mr-4 transition-transform ${!disabled ? 'group-hover:scale-110 group-hover:rotate-3' : ''} ${isLandscape ? 'max-h-[500px]:mr-2 max-h-[500px]:p-1.5' : ''}`}>
                {disabled ? <Lock size={20} /> : icon}
            </div>
            <div className="flex flex-col items-start">
                <span className={`font-black text-sm md:text-base uppercase tracking-wider ${isFocused && !disabled ? 'text-yellow-200' : ''}`}>{label}</span>
                {subtitle && <span className="text-[10px] md:text-xs opacity-60 font-medium">{subtitle}</span>}
            </div>
            {!disabled && (
                <div className={`absolute right-4 opacity-0 transition-all ${isFocused ? 'opacity-100 translate-x-0' : 'group-hover:opacity-100 group-hover:translate-x-0 -translate-x-4'}`}>
                    <ChevronRight size={20} className={primary ? "text-white" : "text-yellow-500"} />
                </div>
            )}
        </button>
    );
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, onContinue, onOpenLeaderboard, onOpenSettings, onOpenHelp, onOpenGrimoire, onOpenVersus, hasSave }) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [showClassSelect, setShowClassSelect] = useState(false);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const isLandscape = useOrientation('AUTO');

  useEffect(() => {
      setProfile(getPlayerProfile());
  }, []);

  const unlockedBossRush = profile?.unlockedFeatures.includes('MODE_BOSS_RUSH');
  const dailyMods = useMemo(() => generateDailyModifiers(Date.now()), []);

  // --- MENU DATA STRUCTURE ---
  const mainMenuItems = useMemo(() => {
      const items = [];
      if (hasSave) items.push({ id: 'CONTINUE', label: 'Continue Journey', subtitle: 'Resume your quest', icon: <Play fill="currentColor" />, action: onContinue, primary: true });
      items.push({ id: 'NEW_GAME', label: 'New Game', subtitle: 'Start a fresh run', icon: <Swords />, action: () => setShowClassSelect(true), primary: !hasSave });
      
      // Daily
      items.push({ 
          id: 'DAILY', 
          label: 'Daily Challenge', 
          subtitle: 'Unique modifiers every 24h', 
          icon: <Calendar />, 
          action: () => onStart(HeroClass.ADVENTURER, 'DAILY', undefined, 'NORMAL', profile?.activeTilesetId),
          color: 'purple'
      });

      // Boss Rush
      if (unlockedBossRush) {
          items.push({
              id: 'BOSS_RUSH',
              label: 'Boss Rush',
              subtitle: 'Face the gauntlet',
              icon: <Skull />,
              action: () => onStart(HeroClass.ADVENTURER, 'BOSS_RUSH', undefined, 'NORMAL', profile?.activeTilesetId),
              color: 'red'
          });
      }

      // Secondary
      items.push({ id: 'LEADERBOARD', label: 'Hall of Heroes', icon: <Trophy />, action: onOpenLeaderboard });
      items.push({ id: 'GRIMOIRE', label: 'Grimoire', subtitle: 'Themes & Medals', icon: <Palette />, action: onOpenGrimoire });
      items.push({ id: 'CODEX', label: 'Codex', icon: <HelpCircle />, action: onOpenHelp });
      
      // Versus (Desktop only mostly, but logic handles availability)
      if (window.innerWidth > 768) {
          items.push({ id: 'VERSUS', label: 'Versus Mode', subtitle: 'Local Multiplayer', icon: <Gamepad2 />, action: onOpenVersus });
      }

      items.push({ id: 'SETTINGS', label: 'Settings', icon: <Settings />, action: onOpenSettings });

      return items;
  }, [hasSave, unlockedBossRush, profile, onContinue, onStart, onOpenLeaderboard, onOpenGrimoire, onOpenHelp, onOpenVersus, onOpenSettings]);

  // Main Menu Navigation
  const { selectedIndex: menuIndex, setSelectedIndex: setMenuIndex } = useMenuNavigation(
      mainMenuItems.length, 
      (index) => mainMenuItems[index].action(),
      !showClassSelect
  );

  // Class Selection Navigation
  const classes = [HeroClass.ADVENTURER, HeroClass.WARRIOR, HeroClass.ROGUE, HeroClass.MAGE, HeroClass.PALADIN, HeroClass.DRAGON_SLAYER];
  const { selectedIndex: classIndex, setSelectedIndex: setClassIndex } = useMenuNavigation(
      classes.length,
      (index) => {
          const cls = classes[index];
          if (profile?.unlockedClasses.includes(cls)) {
              onStart(cls, 'RPG', undefined, 'NORMAL', profile?.activeTilesetId);
          }
      },
      showClassSelect,
      'HORIZONTAL' // Grid-like navigation handled as flat list with wrap? Actually 2x3 grid is visual, 1D logic is fine for basic support.
  );

  const renderClassButton = (cls: HeroClass, idx: number) => {
      const isUnlocked = profile?.unlockedClasses.includes(cls);
      const isFocused = showClassSelect && classIndex === idx;
      
      let icon = <User />;
      let desc = "Balanced stats.";
      if (cls === HeroClass.WARRIOR) { icon = <Swords />; desc = "Starts with Bomb Scroll."; }
      if (cls === HeroClass.ROGUE) { icon = <Lock />; desc = "Starts with Reroll Token."; }
      if (cls === HeroClass.MAGE) { icon = <Star />; desc = "Starts with XP Potion."; }
      if (cls === HeroClass.PALADIN) { icon = <Award />; desc = "Starts with Golden Rune."; }
      if (cls === HeroClass.DRAGON_SLAYER) { icon = <Skull />; desc = "Siege Breaker & Glass Cannon."; }

      const classLvl = profile?.classProgress?.[cls]?.level || 1;

      return (
          <button
              key={cls}
              disabled={!isUnlocked}
              onClick={() => onStart(cls, 'RPG', undefined, 'NORMAL', profile?.activeTilesetId)}
              onMouseEnter={() => setClassIndex(idx)}
              className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 
                  ${isUnlocked 
                      ? (isFocused ? 'bg-slate-800 border-yellow-400 scale-105 shadow-xl ring-2 ring-yellow-500/30' : 'bg-slate-900 border-slate-700 hover:border-slate-500 hover:bg-slate-800')
                      : 'bg-black/40 border-slate-800 opacity-50 cursor-not-allowed'}
              `}
          >
              <div className={`mb-2 ${isUnlocked ? (isFocused ? 'text-yellow-400' : 'text-slate-200') : 'text-slate-600'}`}>
                  {icon}
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-300">{cls.replace('_', ' ')}</div>
              
              {isUnlocked && (
                  <div className="text-[9px] font-mono text-indigo-400 mt-1 font-bold">Lvl {classLvl}</div>
              )}

              <div className="text-[10px] text-slate-500 text-center mt-1 leading-tight h-6">{isUnlocked ? desc : "Locked"}</div>
              
              {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-[1px]">
                      <Lock size={24} className="text-slate-600" />
                  </div>
              )}
          </button>
      );
  };

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden flex flex-col">
      <GoldDust />
      
      {/* Background Layer with improved mixing */}
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://image.pollinations.ai/prompt/mysterious%20dark%20fantasy%20dungeon%20entrance%20environment%20art%20no%20text%20scenery?width=1024&height=1024&nologo=true&seed=99')] bg-cover bg-center"></div>
          {/* Lighter gradient mask to blend image naturally instead of overwriting it */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/60 to-black/90 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-black/40"></div> 
      </div>

      <div className="relative z-20 flex-1 flex flex-col md:flex-row landscape:flex-row max-w-7xl mx-auto w-full h-full overflow-hidden">
          
          {/* Left Panel: Brand */}
          <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 text-center md:text-left md:items-start landscape:text-left landscape:items-start shrink-0">
              <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-600/30 text-yellow-500 text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-1000">
                  <Star size={12} fill="currentColor" /> Season 1: Awakening
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-400 to-amber-700 fantasy-font drop-shadow-2xl tracking-tighter mb-4 animate-in zoom-in-50 duration-700">
                  DRAGON'S<br/>HOARD
              </h1>
              <p className="text-slate-300 max-w-md text-sm md:text-lg font-medium leading-relaxed mb-8 animate-in slide-in-from-left-4 delay-200 duration-700 drop-shadow-md">
                  Merge tiles, slay beasts, and amass a fortune in this rogue-lite puzzle RPG.
              </p>
              
              <div className="flex gap-4 animate-in fade-in delay-500 duration-700 justify-center md:justify-start landscape:justify-start">
                  <div className="text-center">
                      <div className="text-2xl font-black text-white">{profile?.accountLevel || 1}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Level</div>
                  </div>
                  <div className="w-px h-10 bg-slate-500/50"></div>
                  <div className="text-center">
                      <div className="text-2xl font-black text-yellow-500">{profile?.highScore.toLocaleString() || 0}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Best Score</div>
                  </div>
                  <div className="w-px h-10 bg-slate-500/50"></div>
                  <div className="text-center">
                      <div className="text-2xl font-black text-indigo-400">{profile?.gamesPlayed || 0}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Runs</div>
                  </div>
              </div>
          </div>

          {/* Right Panel: Menu */}
          <div className="flex-1 w-full max-w-md md:max-w-lg bg-black/60 backdrop-blur-lg border-t md:border-t-0 landscape:border-t-0 md:border-l landscape:border-l border-white/10 flex flex-col relative transition-all h-full">
              
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex flex-col items-center">
                  <AnimatePresence mode='wait'>
                      {!showClassSelect ? (
                          <motion.div 
                              key="main-menu"
                              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                              className="space-y-3 md:space-y-4 w-full my-auto max-w-sm"
                          >
                              {mainMenuItems.map((item, idx) => (
                                  <MenuButton 
                                      key={item.id}
                                      {...item}
                                      onClick={() => {
                                          setMenuIndex(idx);
                                          item.action();
                                      }}
                                      isLandscape={isLandscape}
                                      isFocused={menuIndex === idx}
                                      onMouseEnter={() => setMenuIndex(idx)}
                                  />
                              ))}
                          </motion.div>
                      ) : (
                          <motion.div 
                              key="class-select"
                              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                              className="space-y-6 w-full my-auto"
                          >
                              <div className="flex items-center gap-4 mb-4">
                                  <button onClick={() => setShowClassSelect(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                                      <ChevronDown className="rotate-90" />
                                  </button>
                                  <div>
                                      <h2 className="text-xl font-black text-white uppercase tracking-wider">Select Class</h2>
                                      <p className="text-xs text-slate-400">Choose your hero</p>
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                  {classes.map((cls, idx) => renderClassButton(cls, idx))}
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>

              {/* Pinned Footer */}
              <div className="p-4 md:p-8 pt-0 mt-auto shrink-0 opacity-60 hover:opacity-100 transition-opacity border-t border-white/5">
                  <div className="flex justify-between items-center mb-3 pt-3">
                      <button onClick={toggleFullscreen} className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2 hover:text-white transition-colors">
                          <Maximize size={12}/> {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                      </button>
                      <div className="text-[10px] text-slate-600 font-mono">v1.3.0</div>
                  </div>
                  <a 
                      href="https://instagram.com/sp8m8" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-slate-500 hover:text-pink-400 font-mono text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                      Made with <Heart size={10} className="animate-pulse" fill="currentColor" /> by sp8
                  </a>
              </div>

          </div>
      </div>
    </div>
  );
};
