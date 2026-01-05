
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getXpThreshold, getLevelRank, SHOP_ITEMS } from '../constants';
import { Trophy, Star, Store as StoreIcon, Coins, RefreshCw, Menu, Clover, Skull, Zap, Info, Flame, Hammer, Moon, Sun, Waves, Gem, Target, Shield, Swords, Clock, Crown, Sparkles } from 'lucide-react';
import { InventoryItem, Stage, GameMode, InputSettings, DailyModifier, AbilityState, AbilityType, ShopState, HeroClass } from '../types';
import { CountUp } from './CountUp';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useLootSystem } from './LootSystem';
import { getNextLevelXp, getPlayerProfile } from '../services/storageService';

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

// --- Sub-Components ---

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

interface InventorySlotProps {
    index: number;
    item?: InventoryItem;
    onUseItem: (item: InventoryItem) => void;
    itemFeedback?: { slot: number, status: 'SUCCESS' | 'ERROR', id: string };
    isLandscape?: boolean;
}

const InventorySlot: React.FC<InventorySlotProps> = ({ index, item, onUseItem, itemFeedback, isLandscape }) => {
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
      >
          {/* Success Flash */}
          <AnimatePresence>
              {feedback === 'SUCCESS' && (
                  <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 0.5 }} 
                      exit={{ opacity: 0 }} 
                      className="absolute inset-0 bg-green-400 z-20 pointer-events-none mix-blend-overlay" 
                  />
              )}
          </AnimatePresence>

          {/* Error Flash */}
          <AnimatePresence>
              {feedback === 'ERROR' && (
                  <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 0.3 }} 
                      exit={{ opacity: 0 }} 
                      className="absolute inset-0 bg-red-500 z-20 pointer-events-none mix-blend-overlay" 
                  />
              )}
          </AnimatePresence>

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
                      {/* Increased Icon Size */}
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
    if ((effectCounters['DEMON_CURSE'] || 0) > 0) buffs.push({ id: 'curse', icon: <Skull size={12} className="text-red-400" />, label: 'CURSE', count: effectCounters['DEMON_CURSE'], color: 'bg-red-900/40 border-red-500/30' });
    if ((effectCounters['LUCKY_DICE'] || 0) > 0) buffs.push({ id: 'dice', icon: <Coins size={12} className="text-blue-400" />, label: 'FATE', count: effectCounters['LUCKY_DICE'], color: 'bg-blue-900/40 border-blue-500/30' });
    if ((effectCounters['CHAIN_CATALYST'] || 0) > 0) buffs.push({ id: 'chain', icon: <Flame size={12} className="text-orange-400" />, label: 'CHAIN', count: effectCounters['CHAIN_CATALYST'], color: 'bg-orange-900/40 border-orange-500/30' });
    if ((effectCounters['MIDAS_POTION'] || 0) > 0) buffs.push({ id: 'midas', icon: <Coins size={12} className="text-yellow-400" />, label: 'MIDAS', count: effectCounters['MIDAS_POTION'], color: 'bg-yellow-900/40 border-yellow-500/30' });
    if ((effectCounters['SIEGE_BREAKER'] || 0) > 0) buffs.push({ id: 'siege', icon: <Hammer size={12} className="text-red-400" />, label: 'MIGHT', count: effectCounters['SIEGE_BREAKER'], color: 'bg-red-900/40 border-red-500/30' });
    if ((effectCounters['VOID_STONE'] || 0) > 0) buffs.push({ id: 'void', icon: <Moon size={12} className="text-purple-400" />, label: 'VOID', count: effectCounters['VOID_STONE'], color: 'bg-purple-900/40 border-purple-500/30' });
    if ((effectCounters['RADIANT_AURA'] || 0) > 0) buffs.push({ id: 'radiant', icon: <Sun size={12} className="text-amber-200" />, label: 'AURA', count: effectCounters['RADIANT_AURA'], color: 'bg-amber-900/40 border-amber-500/30' });
    if ((effectCounters['FLOW_STATE'] || 0) > 0) buffs.push({ id: 'flow', icon: <Waves size={12} className="text-cyan-400" />, label: 'FLOW', count: effectCounters['FLOW_STATE'], color: 'bg-cyan-900/40 border-cyan-500/30' });
    if ((effectCounters['HARMONIC_RESONANCE'] || 0) > 0) buffs.push({ id: 'harmony', icon: <Gem size={12} className="text-pink-400" />, label: 'ECHO', count: effectCounters['HARMONIC_RESONANCE'], color: 'bg-pink-900/40 border-pink-500/30' });

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

// --- Exports ---

export const HUDHeader = React.memo(({ 
    score, 
    bestScore, 
    xp, 
    gold, 
    currentStage, 
    gameMode,
    accountLevel,
    settings,
    combo,
    activeModifiers,
    challengeTarget,
    effectCounters,
    onMenu,
    onOpenStats,
    isLandscape,
    showBuffs = true,
    selectedClass = HeroClass.ADVENTURER
}: HUDProps) => {
    const { registerTarget } = useLootSystem();
    const xpRef = useRef<HTMLDivElement>(null);
    const goldRef = useRef<HTMLSpanElement>(null);
    const xpControls = useAnimation();
    const goldControls = useAnimation();
    const flashControls = useAnimation(); 
    const isLowQuality = settings.graphicsQuality === 'LOW';
    const isClassic = gameMode === 'CLASSIC';

    // Toggle for XP Bar (Class vs Account)
    const [showClassProgress, setShowClassProgress] = useState(true);
    const [progressData, setProgressData] = useState({ current: 0, next: 1000, level: 1, label: 'Account' });

    useEffect(() => {
        const p = getPlayerProfile();
        
        // Calculate Account Progress
        const accBase = p.totalAccountXp;
        const accCurrent = accBase + xp;
        const accLevel = getLevelFromXp(accCurrent); // Helper defined below
        const accNext = getNextLevelXp(accLevel);
        const accPrev = getNextLevelXp(accLevel - 1);
        
        // Calculate Class Progress
        const classBase = p.classProgress[selectedClass]?.xp || 0;
        const classCurrent = classBase + xp; // XP gained this run applies to class too
        const clsLevel = getLevelFromXp(classCurrent);
        const clsNext = getNextLevelXp(clsLevel);
        const clsPrev = getNextLevelXp(clsLevel - 1);

        if (showClassProgress) {
            setProgressData({
                current: classCurrent - clsPrev,
                next: clsNext - clsPrev,
                level: clsLevel,
                label: selectedClass.replace('_', ' ')
            });
        } else {
            setProgressData({
                current: accCurrent - accPrev,
                next: accNext - accPrev,
                level: accLevel,
                label: 'Account'
            });
        }

    }, [xp, accountLevel, showClassProgress, selectedClass]);

    const xpProgress = Math.min(100, Math.max(0, (progressData.current / progressData.next) * 100));

    useEffect(() => {
        if (xpRef.current) registerTarget('XP', xpRef.current);
        if (goldRef.current) registerTarget('GOLD', goldRef.current);
    }, [registerTarget]);

    const prevXp = useRef(xp);
    const prevGold = useRef(gold);

    useEffect(() => {
      if (xp > prevXp.current) {
          xpControls.start({ 
              scale: [1, 1.05, 1], 
              filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
              transition: { duration: 0.2, ease: "easeOut" } 
          });
          
          if (!isLowQuality) {
              flashControls.start({ opacity: [0, 0.6, 0], transition: { duration: 0.4 } });
          }
      }
      prevXp.current = xp;
    }, [xp, xpControls, flashControls, isLowQuality]);
  
    useEffect(() => {
      if (gold > prevGold.current) {
          goldControls.start({ scale: [1, 1.2, 1], transition: { duration: 0.2 } });
      }
      prevGold.current = gold;
    }, [gold, goldControls]);

    const getClassIcon = () => {
        switch (selectedClass) {
            case HeroClass.WARRIOR: return <Swords size={10} className="text-red-400" />;
            case HeroClass.MAGE: return <Zap size={10} className="text-blue-400" />;
            case HeroClass.ROGUE: return <Clock size={10} className="text-green-400" />;
            case HeroClass.PALADIN: return <Shield size={10} className="text-yellow-400" />;
            case HeroClass.DRAGON_SLAYER: return <Crown size={10} className="text-orange-400" />;
            default: return <Shield size={10} className="text-slate-400" />;
        }
    };

    return (
        <div className="flex flex-col gap-2 w-full">
            {/* Top Header Row */}
            <div className={`relative flex flex-wrap justify-between items-center bg-slate-900/90 p-3 rounded-xl border border-slate-700 shadow-xl gap-2 ${isLowQuality ? '' : 'backdrop-blur-md'}`}>
                <div className="flex items-center gap-3 flex-1 min-w-[120px]">
                    <button onClick={onMenu} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white group relative">
                        <Menu size={20} />
                        {/* Pause Hint Tooltip */}
                        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black text-white text-[9px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Pause / Menu
                        </span>
                    </button>
                    <div>
                        <div className="flex items-center">
                            <h1 className="text-base sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 fantasy-font drop-shadow-sm whitespace-nowrap">
                                {gameMode === 'DAILY' ? 'Daily Run' : isClassic ? "Classic" : "Dragon's Hoard"}
                            </h1>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><Trophy size={12} /> <CountUp value={bestScore} /></span>
                            {!isClassic && (
                                <motion.span ref={goldRef} animate={goldControls} className="flex items-center gap-1 text-yellow-400 font-bold inline-block">
                                    <Coins size={12} /> <StatDisplay value={gold} suffix=" G" />
                                </motion.span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right pl-3 flex flex-col items-end justify-center min-w-[100px] z-10">
                {challengeTarget ? (
                    <div className="flex flex-col items-end animate-pulse">
                        <div className="text-[9px] text-red-400 uppercase tracking-wider font-black mb-0.5 drop-shadow-md flex items-center gap-1">
                            <Target size={10} /> BEAT {challengeTarget.name.toUpperCase()}
                        </div>
                        <div className="text-sm text-slate-300 font-mono font-bold">
                            {challengeTarget.score.toLocaleString()}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold mb-0.5 drop-shadow-md">Score</div>
                        <AnimatedScoreDisplay value={score} combo={combo} />
                    </>
                )}
                </div>
            </div>

            {/* Enhanced Level / XP Bar */}
            {!isClassic && (
                <div className="w-full px-1 relative group cursor-pointer" ref={xpRef} onClick={() => setShowClassProgress(!showClassProgress)}>
                    <div className="flex justify-between text-[9px] md:text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider px-1">
                        <span className="text-indigo-300 drop-shadow-md flex items-center gap-1">
                            {showClassProgress ? getClassIcon() : <Zap size={10} className="text-yellow-400" />} 
                            {progressData.label} Lvl {progressData.level}
                        </span>
                        <span className="font-mono text-slate-500">{Math.floor(progressData.current).toLocaleString()} / {Math.floor(progressData.next).toLocaleString()} XP</span>
                    </div>
                    {/* Updated height for mobile (h-2.5) vs desktop (md:h-5) */}
                    <div className="h-2.5 md:h-5 bg-slate-900/80 rounded-full border border-slate-700/80 overflow-hidden relative shadow-inner backdrop-blur-sm">
                        <div className="absolute inset-0 bg-indigo-950/30"></div>
                        <motion.div 
                            className={`h-full ${showClassProgress ? 'bg-gradient-to-r from-blue-600 to-indigo-400' : currentStage.barColor} relative`}
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress}%` }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[50%] skew-x-12 animate-[shimmer_2s_infinite_linear] opacity-50 mix-blend-overlay"></div>
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/60 blur-[2px] shadow-[0_0_10px_white]"></div>
                        </motion.div>
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_50%,transparent_50%)] bg-[length:4px_4px] opacity-20 pointer-events-none"></div>
                    </div>
                </div>
            )}

            {/* Modifiers */}
            {!isClassic && activeModifiers && activeModifiers.length > 0 && (
                <div className="relative flex justify-center min-h-[24px]">
                    <div className="flex flex-wrap gap-2 justify-center animate-in fade-in slide-in-from-top-1 overflow-x-auto p-1 no-scrollbar h-6">
                        {activeModifiers.map(mod => (
                            <div key={mod.id} className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded text-[10px] border border-slate-700">
                                <span>{mod.icon}</span>
                                <span className={`font-bold ${mod.color}`}>{mod.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Buff Bar (Conditional) */}
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
    settings
}: HUDProps) => {
    const isLowQuality = settings.graphicsQuality === 'LOW';

    // LAYOUT STRATEGY:
    // Portrait: Flex Row. Inventory (Left), Shop (Right). Fixed Height h-20/24.
    // Landscape: Flex Column. 
    //    - Max width constraint to stop it looking massive (max-w-[320px] or similar).
    //    - Inventory slots in a ROW (grid-cols-3) within the column, so they don't stack vertically and become huge.
    //    - Shop button below.

    if (isLandscape) {
        return (
            <div className="flex flex-col w-full max-w-[280px] lg:max-w-[320px] mx-auto gap-4 mt-auto">
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

                {/* Shop Button */}
                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenStore}
                    className="relative group flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 overflow-hidden w-full h-24 bg-slate-900 border-slate-700 hover:border-yellow-500 hover:bg-slate-800 shadow-lg shadow-yellow-900/5"
                >
                    <div className="relative z-10 flex flex-col items-center">
                        <StoreIcon size={32} className="text-yellow-500 mb-1 drop-shadow-md group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Shop</span>
                    </div>
                    {/* Sale Badge */}
                    {shopState && shopState.items && Object.values(shopState.items).some(i => i.priceMultiplier < 1) && (
                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold px-1 rounded-bl-md animate-pulse">
                            SALE
                        </div>
                    )}
                </motion.button>
            </div>
        );
    }

    // Portrait Mode (Original Layout)
    return (
        <div className="flex gap-2 w-full flex-row h-20 md:h-24 items-stretch">
            
            {/* Inventory Slots Section */}
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

            {/* Shop Button */}
            <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={onOpenStore}
                className="relative group flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200 overflow-hidden aspect-square h-full bg-slate-900 border-slate-700 hover:border-yellow-500 hover:bg-slate-800 shadow-lg shadow-yellow-900/5"
            >
                <div className="relative z-10 flex flex-col items-center">
                    <StoreIcon size={24} className="text-yellow-500 mb-1 drop-shadow-md group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Shop</span>
                </div>
                {/* Sale Badge */}
                {shopState && shopState.items && Object.values(shopState.items).some(i => i.priceMultiplier < 1) && (
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold px-1 rounded-bl-md animate-pulse">
                        SALE
                    </div>
                )}
            </motion.button>

        </div>
    );
});

// Backward compatibility default export
export const HUD = (props: HUDProps) => {
    return (
        <div className={`w-full mb-1 flex flex-col gap-2 relative z-20 ${props.isLandscape ? 'gap-6' : ''}`}>
            <HUDHeader {...props} />
            <HUDControls {...props} />
        </div>
    );
};

// --- Helper Functions ---
const getLevelFromXp = (xp: number) => {
    let level = 1;
    // Simple iterative check since threshold grows polynomially
    while (getXpThreshold(level) <= xp) {
        level++;
    }
    return level; // Level is the one we are *in* (passed threshold) or working *towards*? 
    // Usually: If XP > Threshold(1), we are level 2. 
    // getXpThreshold(1) = 1000. If we have 1500 XP, loop:
    // L=1, Thresh=1000 <= 1500? Yes. L=2.
    // L=2, Thresh=2800 <= 1500? No. Return 2.
    // Correct.
};
