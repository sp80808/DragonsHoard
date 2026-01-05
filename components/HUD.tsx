
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getXpThreshold, getLevelRank, SHOP_ITEMS } from '../constants';
import { Trophy, Star, Store as StoreIcon, Coins, RefreshCw, Menu, Clover, Skull, Zap, Info, Flame, Hammer, Moon, Sun, Waves, Gem, Target, Shield, Swords, Clock, Crown, Sparkles, Wand, User } from 'lucide-react';
import { InventoryItem, Stage, GameMode, InputSettings, DailyModifier, AbilityState, AbilityType, ShopState, HeroClass } from '../types';
import { CountUp } from './CountUp';
import { motion, AnimatePresence, useAnimation, useSpring, useTransform } from 'framer-motion';
import { useLootSystem } from './LootSystem';
import { getNextLevelXp, getPlayerProfile } from '../services/storageService';
import { audioService } from '../services/audioService';

interface HUDProps {
  score: number;
  bestScore: number;
  level: number;
  xp: number;
  gold: number;
  inventory: InventoryItem[];
  effectCounters: Record<string, number>;
  currentStage: Stage;
  gameMode: GameMode;
  accountLevel: number;
  settings: InputSettings;
  combo: number;
  justLeveledUp?: boolean;
  activeModifiers?: DailyModifier[];
  shopState?: ShopState; 
  challengeTarget?: { score: number, name: string } | null;
  onOpenStore: () => void;
  onUseItem: (item: InventoryItem) => void;
  onMenu: () => void;
  onOpenStats: () => void;
  itemFeedback?: { slot: number, status: 'SUCCESS' | 'ERROR', id: string };
  isLandscape?: boolean;
  showBuffs?: boolean;
  selectedClass?: HeroClass;
}

const AnimatedScoreDisplay = ({ value, combo }: { value: number, combo: number }) => {
    const [prevValue, setPrevValue] = useState(value);
    const [diff, setDiff] = useState(0);

    useEffect(() => {
        if (value > prevValue) {
            setDiff(value - prevValue);
            setPrevValue(value);
        }
    }, [value]);

    let textColor = "text-white";
    if (combo >= 10) textColor = "text-fuchsia-400";
    else if (combo >= 5) textColor = "text-orange-500";
    else if (combo >= 2) textColor = "text-yellow-400";

    return (
        <div className="relative inline-block">
            <span 
                className={`inline-block ${textColor} fantasy-font font-black tracking-wide text-3xl md:text-4xl transition-colors duration-300`}
                style={{ 
                    textShadow: '3px 0 0 #000, -3px 0 0 #000, 0 3px 0 #000, 0 -3px 0 #000, 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' 
                }}
            >
                <CountUp value={value} />
            </span>
            <AnimatePresence>
                {diff > 0 && (
                    <motion.span
                        key={value} 
                        initial={{ opacity: 1, y: 0, scale: 1 }}
                        animate={{ opacity: 0, y: -20, scale: 1.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute top-0 right-0 text-yellow-300 font-bold text-sm pointer-events-none"
                        style={{ textShadow: '1px 1px 0 #000' }}
                    >
                        +{diff}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
};

const DynamicXPBar = ({ current, max, height = 4 }: { current: number, max: number, height?: number }) => {
    const percent = Math.min(100, Math.max(0, (current / max) * 100));
    
    // Smooth spring animation for the bar width
    const widthSpring = useSpring(percent, { stiffness: 60, damping: 15, mass: 0.5 });
    const widthPercent = useTransform(widthSpring, (v) => `${v}%`);

    return (
        <div className={`relative w-full bg-slate-900 rounded-full border border-slate-700 overflow-hidden shadow-inner`} style={{ height: `${height}px` }}>
            {/* Background Track Pattern */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px)' }}></div>
            
            {/* Main Fill Bar */}
            <motion.div 
                className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400"
                style={{ width: widthPercent }}
            >
                {/* Internal Shimmer */}
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] -skew-x-12 animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }}></div>
            </motion.div>

            {/* Leading Edge Glow */}
            <motion.div 
                className="absolute top-0 bottom-0 w-[2px] bg-white blur-[2px] z-10"
                style={{ left: widthPercent }}
            />
            <motion.div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full blur-md opacity-60 z-20"
                style={{ left: widthPercent, x: '-50%' }}
            />
        </div>
    );
};

const StatDisplay = ({ value, className, prefix = '', suffix = '' }: { value: number, className?: string, prefix?: string, suffix?: string }) => {
    const [highlight, setHighlight] = useState(false);
    const prevValue = useRef(value);

    useEffect(() => {
        if (value !== prevValue.current) {
            setHighlight(true);
            const timer = setTimeout(() => {
                setHighlight(false), 200
            });
            prevValue.current = value;
            return () => clearTimeout(timer);
        }
    }, [value]);

    return (
        <span className={`inline-block transition-all duration-200 ${highlight ? 'scale-125 text-yellow-300 brightness-150' : ''} ${className}`}>
            <CountUp value={value} prefix={prefix} />{suffix}
        </span>
    );
};

const InventorySlot: React.FC<any> = ({ index, item, onUseItem, itemFeedback, isLandscape }) => {
    const [feedback, setFeedback] = useState<'SUCCESS' | 'ERROR' | null>(null);
    
    useEffect(() => {
        if (itemFeedback && itemFeedback.slot === index) {
            setFeedback(itemFeedback.status);
            const t = setTimeout(() => setFeedback(null), 500);
            return () => clearTimeout(t);
        }
    }, [itemFeedback, index]);

    return (
      <motion.div 
          animate={feedback === 'SUCCESS' ? { scale: [1, 1.1, 1], borderColor: '#4ade80' } : feedback === 'ERROR' ? { x: [-5, 5, -5, 5, 0], borderColor: '#ef4444' } : { scale: 1, x: 0, borderColor: '#1e293b' }}
          transition={{ duration: 0.3 }}
          className={`flex-1 w-full aspect-square bg-slate-900/50 border-2 rounded-xl relative flex items-center justify-center group overflow-hidden active:scale-95 transition-colors duration-200 shadow-lg
              ${feedback === 'ERROR' ? 'bg-red-900/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}
              ${feedback === 'SUCCESS' ? 'bg-green-900/20 shadow-[0_0_15px_rgba(74,222,128,0.3)]' : 'border-slate-800 hover:border-slate-600'}
          `}
          onMouseEnter={() => item && audioService.playUIHover()}
      >
          <div className="absolute top-0 left-0 bg-slate-800/90 px-1.5 py-0.5 rounded-br-md text-[8px] md:text-[10px] font-mono text-slate-500 border-r border-b border-slate-700/50 z-10 font-bold">
              {index + 1}
          </div>
          <AnimatePresence mode='wait'>
              {item ? (
                  <motion.button 
                      key={item.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0, filter: 'brightness(2)' }}
                      onClick={() => onUseItem(item)} 
                      className="w-full h-full flex flex-col items-center justify-center hover:bg-white/5 transition-colors relative z-10 pt-1"
                  >
                      <span className="text-3xl md:text-4xl lg:text-5xl drop-shadow-md transform group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span className="text-[7px] md:text-[9px] text-slate-400 font-bold tracking-tighter opacity-70 mt-[-2px]">{item.name.split(' ')[0]}</span>
                  </motion.button>
              ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20"><div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-slate-700"></div></div>
              )}
          </AnimatePresence>
      </motion.div>
    );
};

export const BuffDisplay: React.FC<{ effectCounters: Record<string, number>, className?: string }> = ({ effectCounters, className }) => {
    const buffs = [];
    if ((effectCounters['LUCKY_LOOT'] || 0) > 0) buffs.push({ id: 'luck', icon: <Clover size={12} className="text-green-400" />, label: 'LUCK', count: effectCounters['LUCKY_LOOT'], color: 'bg-green-900/40 border-green-500/30' });
    if ((effectCounters['ASCENDANT_SPAWN'] || 0) > 0) buffs.push({ id: 'asc', icon: <Star size={12} className="text-yellow-400" />, label: 'RUNE', count: effectCounters['ASCENDANT_SPAWN'], color: 'bg-yellow-900/40 border-yellow-500/30' });
    if ((effectCounters['CHAIN_CATALYST'] || 0) > 0) buffs.push({ id: 'chain', icon: <Flame size={12} className="text-orange-400" />, label: 'CHAIN', count: effectCounters['CHAIN_CATALYST'], color: 'bg-orange-900/40 border-orange-500/30' });
    if ((effectCounters['MIDAS_POTION'] || 0) > 0) buffs.push({ id: 'midas', icon: <Coins size={12} className="text-yellow-400" />, label: 'MIDAS', count: effectCounters['MIDAS_POTION'], color: 'bg-yellow-900/40 border-yellow-500/30' });
    if ((effectCounters['SIEGE_BREAKER'] || 0) > 0) buffs.push({ id: 'siege', icon: <Hammer size={12} className="text-red-400" />, label: 'MIGHT', count: effectCounters['SIEGE_BREAKER'], color: 'bg-red-900/40 border-red-500/30' });
    if ((effectCounters['VOID_STONE'] || 0) > 0) buffs.push({ id: 'void', icon: <Moon size={12} className="text-purple-400" />, label: 'VOID', count: effectCounters['VOID_STONE'], color: 'bg-purple-900/40 border-purple-500/30' });
    if ((effectCounters['RADIANT_AURA'] || 0) > 0) buffs.push({ id: 'radiant', icon: <Sun size={12} className="text-amber-200" />, label: 'AURA', count: effectCounters['RADIANT_AURA'], color: 'bg-amber-900/40 border-amber-500/30' });
    if ((effectCounters['FLOW_STATE'] || 0) > 0) buffs.push({ id: 'flow', icon: <Waves size={12} className="text-cyan-400" />, label: 'FLOW', count: effectCounters['FLOW_STATE'], color: 'bg-cyan-900/40 border-cyan-500/30' });
    
    if (buffs.length === 0) return null;
    return (
        <div className={`flex gap-1 flex-wrap ${className || 'justify-center min-h-[20px]'}`}>
            {buffs.map(buff => (
                <div key={buff.id} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border ${buff.color} animate-in zoom-in`}>
                    {buff.icon}
                    <div className="flex flex-col leading-none">
                        <span className="text-[8px] font-bold opacity-70">{buff.label}</span>
                        <span className="text-[10px] font-black">{buff.count}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const HUDHeader = React.memo(({ score, bestScore, xp, gold, currentStage, gameMode, accountLevel, settings, combo, activeModifiers, challengeTarget, effectCounters, onMenu, onOpenStats, isLandscape, showBuffs = true, selectedClass = HeroClass.ADVENTURER }: HUDProps) => {
    
    const xpRef = useRef<HTMLDivElement>(null);
    const goldRef = useRef<HTMLSpanElement>(null);
    
    // XP Bar Calculation
    const nextLevelXp = getNextLevelXp(accountLevel);
    const prevLevelXp = getNextLevelXp(accountLevel - 1);
    const xpForThisLevel = nextLevelXp - (accountLevel === 1 ? 0 : prevLevelXp);
    
    const [profileXp, setProfileXp] = useState(0);
    
    useEffect(() => {
        const p = getPlayerProfile();
        setProfileXp(p.totalAccountXp + xp); // Base + Current Run Gain
    }, [xp]);

    const xpProgress = Math.max(0, profileXp - (accountLevel === 1 ? 0 : prevLevelXp));

    return (
        <div className={`flex flex-col gap-2 w-full ${isLandscape ? 'h-full justify-between pb-6' : ''}`}>
            {/* Top Header Row */}
            <div className={`relative flex ${isLandscape ? 'flex-col items-start gap-4' : 'flex-wrap justify-between items-center gap-2'} bg-slate-900/90 p-3 rounded-xl border border-slate-700 shadow-xl ${settings.graphicsQuality === 'LOW' ? '' : 'backdrop-blur-md'} ${isLandscape ? 'w-full' : ''}`}>
                
                {/* Title Section */}
                <div className={`flex items-center gap-3 ${isLandscape ? 'w-full' : 'flex-1 min-w-[120px]'}`}>
                    <button 
                        onClick={() => { audioService.playUIClick(); onMenu(); }} 
                        onMouseEnter={() => audioService.playUIHover()}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white group relative shrink-0"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-base sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 fantasy-font drop-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">
                                {gameMode === 'DAILY' ? 'Daily Run' : gameMode === 'GAUNTLET' ? 'The Gauntlet' : "Dragon's Hoard"}
                            </h1>
                            <div className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap shrink-0">
                                Lvl {accountLevel}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1 shrink-0"><Trophy size={12} /> <CountUp value={bestScore} /></span>
                            <span className="flex items-center gap-1 text-yellow-400 font-bold inline-block shrink-0">
                                <Coins size={12} /> <StatDisplay value={gold} suffix=" G" />
                            </span>
                        </div>
                    </div>
                </div>

                {/* Score & XP Section */}
                <div className={`${isLandscape ? 'w-full pl-3 pr-2 border-t border-slate-800 pt-3' : 'text-right pl-3 flex flex-col items-end justify-center min-w-[100px] z-10'}`}>
                    <div className={`${isLandscape ? 'flex justify-between items-end mb-2' : ''}`}>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5 drop-shadow-md">Score</div>
                        <AnimatedScoreDisplay value={score} combo={combo} />
                    </div>
                    
                    {/* Dynamic XP Bar */}
                    <div className={`mt-1 ${isLandscape ? 'w-full' : 'absolute bottom-0 left-0 right-0'}`}>
                        <div className={`${isLandscape ? 'flex justify-between text-[8px] text-blue-300 font-mono mb-1' : 'hidden'}`}>
                            <span>XP</span>
                            <span>{Math.floor(xpProgress)} / {xpForThisLevel}</span>
                        </div>
                        <DynamicXPBar 
                            current={xpProgress} 
                            max={xpForThisLevel} 
                            height={isLandscape ? 6 : 4} // Slightly thicker in landscape sidebar
                        />
                    </div>
                </div>
            </div>
            
            {showBuffs && <BuffDisplay effectCounters={effectCounters} />}
        </div>
    );
});

export const HUDControls = React.memo(({ 
    inventory, 
    onOpenStore, 
    onUseItem, 
    gold, 
    itemFeedback,
    isLandscape,
    shopState,
    settings,
    selectedClass = HeroClass.ADVENTURER
}: HUDProps) => {
    
    if (isLandscape) {
        return (
            <div className="flex flex-col w-full mx-auto gap-4 mt-auto">
                {/* Inventory Slots (Horizontal Row within Sidebar) */}
                <div className="flex gap-2 w-full aspect-[3/1]">
                    {[0, 1, 2].map(i => (
                        <InventorySlot 
                            key={i} 
                            index={i} 
                            item={inventory[i]} 
                            onUseItem={onUseItem} 
                            itemFeedback={itemFeedback}
                            isLandscape={true}
                        />
                    ))}
                </div>

                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { audioService.playUIClick(); onOpenStore(); }}
                    onMouseEnter={() => audioService.playUIHover()}
                    className="relative group flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 overflow-hidden w-full h-24 bg-slate-900 border-slate-700 hover:border-yellow-500 hover:bg-slate-800 shadow-lg shadow-yellow-900/5"
                >
                    <div className="relative z-10 flex flex-col items-center">
                        <StoreIcon size={32} className="text-yellow-500 mb-1 drop-shadow-md group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Shop</span>
                    </div>
                </motion.button>
            </div>
        );
    }

    // Portrait Mode
    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 w-full flex-row h-20 md:h-24 items-stretch">
                <div className="flex gap-2 flex-1">
                    {[0, 1, 2].map(i => (
                        <InventorySlot 
                            key={i} 
                            index={i} 
                            item={inventory[i]} 
                            onUseItem={onUseItem} 
                            itemFeedback={itemFeedback}
                            isLandscape={false}
                        />
                    ))}
                </div>
                
                {/* Wider Shop Button */}
                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { audioService.playUIClick(); onOpenStore(); }}
                    onMouseEnter={() => audioService.playUIHover()}
                    className="w-1/3 relative group flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 overflow-hidden bg-slate-900 border-slate-700 hover:border-yellow-500 hover:bg-slate-800 shadow-lg shadow-yellow-900/5"
                >
                    <div className="relative z-10 flex flex-col items-center">
                        <StoreIcon size={24} className="text-yellow-500 mb-1 drop-shadow-md group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Shop</span>
                    </div>
                </motion.button>
            </div>
        </div>
    );
});

export const HUD = (props: HUDProps) => {
    return (
        <div className={`w-full mb-1 flex flex-col gap-2 relative z-20 ${props.isLandscape ? 'gap-6 h-full justify-between' : ''}`}>
            <HUDHeader {...props} />
            <HUDControls {...props} />
        </div>
    );
};
