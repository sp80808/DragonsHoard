
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getXpThreshold, getLevelRank, SHOP_ITEMS } from '../constants';
import { Trophy, Star, Store as StoreIcon, Coins, RefreshCw, Menu, Clover, Skull, Zap, Info, Flame, Hammer, Moon, Sun, Waves, Gem, Target } from 'lucide-react';
import { InventoryItem, Stage, GameMode, InputSettings, DailyModifier, AbilityState, AbilityType, ShopState } from '../types';
import { CountUp } from './CountUp';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useLootSystem } from './LootSystem';

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

const ComboMeter = ({ combo }: { combo: number }) => {
    if (combo < 2) return null;
    return (
        <div className="absolute top-0 left-0 right-0 z-20 flex justify-center -mt-6 pointer-events-none">
            <div className="bg-slate-900/90 px-4 py-1 rounded-full border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-baseline gap-2 transform -rotate-2 animate-in slide-in-from-top-4 duration-200">
                <span className="fantasy-font text-xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-200 to-yellow-500 drop-shadow-sm filter">
                    x{combo}
                </span>
                <span className="text-[10px] font-black italic tracking-[0.2em] text-yellow-600 uppercase">
                    COMBO
                </span>
            </div>
        </div>
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
        // More reactive animation: Bulge out
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
  const xpThreshold = getXpThreshold(level);
  const xpPercent = Math.min(100, (xp / xpThreshold) * 100);
  
  const isRerollUnlocked = level >= 15 && !isClassic;
  const canAffordReroll = rerolls > 0 || gold >= 50;
  const canReroll = isRerollUnlocked && canAffordReroll;

  const barGradient = currentStage.barColor || "from-cyan-600 via-blue-500 to-indigo-500";
  const accentColor = currentStage.colorTheme || "text-slate-200";
  const shimmerDuration = Math.max(1.0, 3.5 - (level * 0.05)) + 's';
  const rank = getLevelRank(level);
  const RankIcon = rank.icon;

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
                className={`w-10 h-10 md:w-12 md:h-12 relative flex flex-col items-center justify-center rounded-lg border transition-all duration-75 shrink-0
                    ${!canReroll ? 'bg-slate-900/30 border-slate-800 opacity-50 cursor-not-allowed' : 
                    'bg-purple-900/20 border-purple-500/30 hover:bg-purple-900/40 hover:border-purple-400 active:scale-95 text-purple-200 shadow-lg'}
                `}
            >
                <RefreshCw size={14} className={canReroll ? "mb-0.5" : "opacity-50 mb-0.5"} />
                <span className="text-[7px] font-bold uppercase tracking-wider leading-none">
                    {rerolls > 0 ? `${rerolls}` : '50G'}
                </span>
            </button>
        )
  }

  return (
    <div className="w-full mb-1 md:mb-2 space-y-1 md:space-y-2">
      <div className={`flex flex-wrap justify-between items-center bg-slate-900/90 p-2 rounded-xl border border-slate-700 shadow-xl gap-2 ${isLowQuality ? '' : 'backdrop-blur-md'}`}>
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-[120px]">
            <button onClick={onMenu} className="p-1.5 md:p-2 -ml-1 md:-ml-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                <Menu size={18} className="md:w-5 md:h-5" />
            </button>
            <div>
                <div className="flex items-center">
                    <h1 className="text-xs sm:text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 fantasy-font drop-shadow-sm whitespace-nowrap">
                        {gameMode === 'DAILY' ? 'Daily Run' : isClassic ? "Classic" : "Dragon's Hoard"}
                    </h1>
                </div>
                <div className="flex items-center gap-3 text-[9px] md:text-xs text-slate-400 mt-0.5 md:mt-1">
                    <span className="flex items-center gap-1"><Trophy size={10} /> <CountUp value={bestScore} /></span>
                    {!isClassic && (
                        <motion.span ref={goldRef} animate={goldControls} className="flex items-center gap-1 text-yellow-400 font-bold inline-block">
                            <Coins size={10} /> <StatDisplay value={gold} suffix=" G" />
                        </motion.span>
                    )}
                </div>
            </div>
        </div>
        <div className="text-right pl-3 flex flex-col items-end justify-center min-w-[100px]">
          {challengeTarget ? (
              <div className="flex flex-col items-end animate-pulse">
                  <div className="text-[9px] text-red-400 uppercase tracking-wider font-black mb-0.5 drop-shadow-md flex items-center gap-1">
                      <Target size={10} /> BEAT {challengeTarget.name.toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-300 font-mono font-bold">
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

      {!isClassic && (
          <div className="relative">
              <ComboMeter combo={combo} />
              <div className="flex flex-wrap gap-2 justify-center animate-in fade-in slide-in-from-top-1 overflow-x-auto p-1 no-scrollbar mt-1">
                  {activeModifiers && activeModifiers.map(