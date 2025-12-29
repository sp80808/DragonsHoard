
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getXpThreshold, getLevelRank, SHOP_ITEMS } from '../constants';
import { Trophy, Star, Store as StoreIcon, Coins, RefreshCw, Menu, Clover, Skull, Zap, Info, Flame, Hammer, Moon, Sun, Waves, Gem, Target } from 'lucide-react';
import { InventoryItem, Stage, GameMode, InputSettings, DailyModifier, AbilityState, AbilityType, ShopState } from '../types';
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
  rerolls: number;
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
  onReroll: () => void;
  onMenu: () => void;
  onOpenStats: () => void;
  itemFeedback?: { slot: number, status: 'SUCCESS' | 'ERROR', id: string };
  // Should ideally pass baselineAccountXp here if refactoring props, but we can stick to using profile or assume updated via parent
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

// Combo Meter - Anchored relative to the parent to prevent clipping/overlap
const ComboMeter = ({ combo }: { combo: number }) => {
    if (combo < 2) return null;
    
    return (
        <motion.div 
            key="combo-meter"
            initial={{ scale: 0.5, opacity: 0, y: -10 }}
            animate={{ 
                scale: 1, 
                opacity: 1, 
                y: 0,
                rotate: [0, -2, 2, 0] // Subtle shake loop
            }}
            exit={{ scale: 0.5, opacity: 0, y: 10, transition: { duration: 0.2 } }}
            transition={{
                rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                type: "spring", stiffness: 300, damping: 15
            }}
            className="absolute -bottom-6 right-2 z-50 pointer-events-none"
        >
            <div className="relative group">
                {/* Fire Effect behind - continuously pulsing */}
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="absolute inset-0 bg-orange-600 blur-md rounded-full"
                ></motion.div>
                
                <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 px-3 py-1 rounded-xl border-2 border-orange-500 shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center gap-2 transform -skew-x-6 backdrop-blur-md relative z-10">
                    <div className="flex flex-col items-end">
                        <motion.span 
                            key={combo}
                            initial={{ scale: 1.3, color: '#fff' }}
                            animate={{ scale: 1, color: 'transparent' }}
                            transition={{ duration: 0.2 }}
                            className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 fantasy-font leading-none drop-shadow-sm filter"
                        >
                            {combo}x
                        </motion.span>
                    </div>
                    <div className="h-6 w-px bg-white/10 mx-0.5"></div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[7px] font-bold text-orange-200 uppercase opacity-80 tracking-widest">Combo</span>
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Chain</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

interface InventorySlotProps {
    index: number;
    item?: InventoryItem;
    onUseItem: (item: InventoryItem) => void;
    itemFeedback?: { slot: number, status: 'SUCCESS' | 'ERROR', id: string };
}

const InventorySlot: React.FC<InventorySlotProps> = ({ index, item, onUseItem, itemFeedback }) => {
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
          className={`flex-1 h-12 md:h-14 bg-slate-900/50 border-2 rounded-lg relative flex items-center justify-center group overflow-hidden active:scale-95 transition-colors duration-200
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
                      className="w-full h-full flex items-center justify-center hover:bg-white/5 transition-colors relative z-10"
                  >
                      <span className="text-xl md:text-3xl drop-shadow-md transform group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span className="absolute bottom-0 right-1 text-[7px] md:text-[8px] text-slate-400 font-bold tracking-tighter opacity-70">{item.name.split(' ')[0]}</span>
                  </motion.button>
              ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20"><div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-700"></div></div>
              )}
          </AnimatePresence>
      </motion.div>
    );
};

export const HUD = React.memo(({ 
    score, 
    bestScore, 
    level, 
    xp, 
    gold, 
    inventory, 
    rerolls, 
    effectCounters, 
    currentStage, 
    gameMode,
    accountLevel,
    settings,
    combo,
    justLeveledUp,
    activeModifiers,
    shopState,
    challengeTarget,
    onOpenStore, 
    onUseItem, 
    onReroll, 
    onMenu,
    onOpenStats,
    itemFeedback
}: HUDProps) => {
  const { registerTarget } = useLootSystem();
  const xpRef = useRef<HTMLDivElement>(null);
  const goldRef = useRef<HTMLSpanElement>(null);
  const xpControls = useAnimation();
  const goldControls = useAnimation();
  const flashControls = useAnimation(); 
  const isLowQuality = settings.graphicsQuality === 'LOW';

  // XP Progress Calculation
  const [baselineXp, setBaselineXp] = useState(0);
  
  useEffect(() => {
      // Fetch initial account XP to accurately show progress
      // Use local state if prop not provided (though App.tsx handles this better now)
      const p = getPlayerProfile();
      setBaselineXp(p.totalAccountXp);
  }, []);

  // Use baselineXp from state (loaded on mount), but prioritize the state logic in App.tsx if passed
  // Since we don't pass baselineXp as a direct prop here in this interface, we approximate using the stored value
  // Ideally App.tsx passes `totalXP` but `xp` is run XP.
  // We use `baselineXp` (start of run) + `xp` (gained in run) to estimate total.
  // Note: if App.tsx levels up, `accountLevel` prop increases.
  
  const totalCurrentXp = baselineXp + xp;
  const nextLevelXp = getNextLevelXp(accountLevel);
  const prevLevelXp = accountLevel === 1 ? 0 : getNextLevelXp(accountLevel - 1);
  const xpProgress = Math.min(100, Math.max(0, ((totalCurrentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

  // --- SMART SHOP NOTIFICATION LOGIC ---
  const [badgeCount, setBadgeCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const prevBadgeCount = useRef(0);

  useEffect(() => {
      const affordableItems = SHOP_ITEMS.filter(item => {
          let price = item.price;
          if (shopState && shopState.items[item.id]) {
              price = Math.floor(item.price * shopState.items[item.id].priceMultiplier);
              if (shopState.items[item.id].stock <= 0) return false;
          }
          return gold >= price;
      });

      const count = affordableItems.length;
      
      if (count > prevBadgeCount.current) {
          setPulse(true);
          setTimeout(() => setPulse(false), 400); 
      }
      
      setBadgeCount(count);
      prevBadgeCount.current = count;
  }, [gold, shopState]);

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

  const isClassic = gameMode === 'CLASSIC';
  
  const isRerollUnlocked = level >= 15 && !isClassic;
  const canAffordReroll = rerolls > 0 || gold >= 50;
  const canReroll = isRerollUnlocked && canAffordReroll;

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

  const RerollButton = () => {
        if (!isRerollUnlocked) return null;
        return (
            <button 
                onClick={canReroll ? onReroll : undefined} 
                disabled={!canReroll} 
                className={`w-12 h-12 md:w-14 md:h-14 relative flex flex-col items-center justify-center rounded-lg border transition-all duration-75 shrink-0
                    ${!canReroll ? 'bg-slate-900/30 border-slate-800 opacity-50 cursor-not-allowed' : 
                    'bg-purple-900/20 border-purple-500/30 hover:bg-purple-900/40 hover:border-purple-400 active:scale-95 text-purple-200 shadow-lg'}
                `}
            >
                <RefreshCw size={16} className={canReroll ? "mb-0.5" : "opacity-50 mb-0.5"} />
                <span className="text-[7px] font-bold uppercase tracking-wider leading-none">
                    {rerolls > 0 ? `${rerolls}` : '50G'}
                </span>
            </button>
        )
  }

  return (
    <div className="w-full mb-1 flex flex-col gap-2 relative z-20">
      
      {/* Top Header Row with integrated Combo Meter */}
      <div className={`relative flex flex-wrap justify-between items-center bg-slate-900/90 p-3 rounded-xl border border-slate-700 shadow-xl gap-2 ${isLowQuality ? '' : 'backdrop-blur-md'}`}>
        
        {/* Combo Meter attached to header but hanging down */}
        <AnimatePresence>
            {combo >= 2 && <ComboMeter combo={combo} />}
        </AnimatePresence>

        <div className="flex items-center gap-3 flex-1 min-w-[120px]">
            <button onClick={onMenu} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                <Menu size={20} />
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
          <div className="w-full px-1 relative group cursor-pointer" ref={xpRef} onClick={onOpenStats}>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider px-1">
                  <span className="text-indigo-300 drop-shadow-md flex items-center gap-1">
                      <Zap size={10} className="text-yellow-400" /> Account Level {accountLevel}
                  </span>
                  <span className="font-mono text-slate-500">{Math.floor(totalCurrentXp - prevLevelXp).toLocaleString()} / {(nextLevelXp - prevLevelXp).toLocaleString()} XP</span>
              </div>
              <div className="h-4 md:h-6 bg-slate-900/80 rounded-full border border-slate-700/80 overflow-hidden relative shadow-inner backdrop-blur-sm">
                  {/* Deep Background Glow */}
                  <div className="absolute inset-0 bg-indigo-950/30"></div>
                  
                  {/* Fill Bar */}
                  <motion.div 
                      className={`h-full ${currentStage.barColor} relative`}
                      initial={{ width: 0 }}
                      animate={{ width: `${xpProgress}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  >
                      {/* Shimmer Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[50%] skew-x-12 animate-[shimmer_2s_infinite_linear] opacity-50 mix-blend-overlay"></div>
                      
                      {/* Leading Edge Glow */}
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/60 blur-[2px] shadow-[0_0_10px_white]"></div>
                  </motion.div>
                  
                  {/* Subtle Scanline Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_50%,transparent_50%)] bg-[length:4px_4px] opacity-20 pointer-events-none"></div>
              </div>
          </div>
      )}

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

      {/* Buff Bar */}
      <div className="flex gap-1 justify-center min-h-[20px]">
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

      {/* Inventory Bar */}
      <div className="flex gap-2 w-full">
          {Array.from({ length: 3 }).map((_, i) => (
              <InventorySlot 
                  key={i} 
                  index={i} 
                  item={inventory[i]} 
                  onUseItem={onUseItem} 
                  itemFeedback={itemFeedback}
              />
          ))}
          <RerollButton />
          <button 
              onClick={onOpenStore}
              className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-xl border-2 border-yellow-400/50 shadow-lg flex flex-col items-center justify-center relative group active:scale-95 transition-all
                  ${pulse ? 'animate-badge-pulse ring-2 ring-yellow-400 ring-offset-2 ring-offset-black' : ''}
              `}
          >
              <StoreIcon size={22} className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
              <span className="text-[7px] md:text-[8px] font-black text-white uppercase mt-0.5 tracking-wider">Shop</span>
              
              {/* Notification Badge */}
              <AnimatePresence>
                  {badgeCount > 0 && (
                      <motion.div 
                          key="badge"
                          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-slate-900 shadow-sm"
                      >
                          {badgeCount}
                      </motion.div>
                  )}
              </AnimatePresence>
          </button>
      </div>
    </div>
  );
});
