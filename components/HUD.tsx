

import React, { useState } from 'react';
import { getXpThreshold, getLevelRank } from '../constants';
import { Trophy, Star, Store as StoreIcon, Coins, RefreshCw, Menu, Clover, Skull, Zap, Info, HelpCircle, Flame, Hammer, Moon, Sun } from 'lucide-react';
import { InventoryItem, Stage, GameMode, InputSettings } from '../types';

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
  onOpenStore: () => void;
  onUseItem: (item: InventoryItem) => void;
  onReroll: () => void;
  onMenu: () => void;
}

export const HUD: React.FC<HUDProps> = ({ 
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
    onOpenStore, 
    onUseItem, 
    onReroll, 
    onMenu 
}) => {
  // Generic Tooltip State
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleTooltip = (id: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setActiveTooltip(prev => prev === id ? null : id);
  }
  
  const isClassic = gameMode === 'CLASSIC';
  const xpThreshold = getXpThreshold(level);
  const xpPercent = Math.min(100, (xp / xpThreshold) * 100);
  const canReroll = (level >= 15 && (rerolls > 0 || gold >= 50)) && !isClassic;

  // Use stage-specific gradient or fallback
  const barGradient = currentStage.barColor || "from-cyan-600 via-blue-500 to-indigo-500";
  // Use stage-specific text color theme or fallback
  const accentColor = currentStage.colorTheme || "text-slate-200";

  const shimmerDuration = Math.max(1.0, 3.5 - (level * 0.05)) + 's';

  const isCascadeUnlocked = accountLevel >= 10;
  const isCascadeActive = isCascadeUnlocked && !isClassic;

  // Rank Icon for HUD
  const rank = getLevelRank(level);
  const RankIcon = rank.icon;

  const buffs = [];
  if ((effectCounters['LUCKY_LOOT'] || 0) > 0) buffs.push({ id: 'luck', icon: <Clover size={12} className="text-green-400" />, label: 'LUCK', count: effectCounters['LUCKY_LOOT'], color: 'bg-green-900/40 border-green-500/30' });
  if ((effectCounters['ASCENDANT_SPAWN'] || 0) > 0) buffs.push({ id: 'asc', icon: <Star size={12} className="text-yellow-400" />, label: 'RUNE', count: effectCounters['ASCENDANT_SPAWN'], color: 'bg-yellow-900/40 border-yellow-500/30' });
  if ((effectCounters['DEMON_CURSE'] || 0) > 0) buffs.push({ id: 'curse', icon: <Skull size={12} className="text-red-400" />, label: 'CURSE', count: effectCounters['DEMON_CURSE'], color: 'bg-red-900/40 border-red-500/30' });
  
  // New Buffs
  if ((effectCounters['LUCKY_DICE'] || 0) > 0) buffs.push({ id: 'dice', icon: <Coins size={12} className="text-blue-400" />, label: 'FATE', count: effectCounters['LUCKY_DICE'], color: 'bg-blue-900/40 border-blue-500/30' });
  if ((effectCounters['CHAIN_CATALYST'] || 0) > 0) buffs.push({ id: 'chain', icon: <Flame size={12} className="text-orange-400" />, label: 'CHAIN', count: effectCounters['CHAIN_CATALYST'], color: 'bg-orange-900/40 border-orange-500/30' });
  if ((effectCounters['MIDAS_POTION'] || 0) > 0) buffs.push({ id: 'midas', icon: <Coins size={12} className="text-yellow-400" />, label: 'MIDAS', count: effectCounters['MIDAS_POTION'], color: 'bg-yellow-900/40 border-yellow-500/30' });
  if ((effectCounters['SIEGE_BREAKER'] || 0) > 0) buffs.push({ id: 'siege', icon: <Hammer size={12} className="text-red-400" />, label: 'MIGHT', count: effectCounters['SIEGE_BREAKER'], color: 'bg-red-900/40 border-red-500/30' });
  
  // New Additions
  if ((effectCounters['VOID_STONE'] || 0) > 0) buffs.push({ id: 'void', icon: <Moon size={12} className="text-purple-400" />, label: 'VOID', count: effectCounters['VOID_STONE'], color: 'bg-purple-900/40 border-purple-500/30' });
  if ((effectCounters['RADIANT_AURA'] || 0) > 0) buffs.push({ id: 'radiant', icon: <Sun size={12} className="text-amber-200" />, label: 'AURA', count: effectCounters['RADIANT_AURA'], color: 'bg-amber-900/40 border-amber-500/30' });


  // Tooltip Helper Component
  const MicroTooltip = ({ id, icon, title, content, side = 'left' }: { id: string, icon: React.ReactNode, title: string, content: React.ReactNode, side?: 'left' | 'right' }) => {
      if (!settings.enableTooltips) return null;
      
      const isOpen = activeTooltip === id;
      return (
          <div className="relative inline-flex items-center ml-1 z-50">
              <button 
                  onClick={(e) => toggleTooltip(id, e)}
                  className={`p-0.5 rounded-full hover:bg-white/10 transition-colors ${isOpen ? 'text-white bg-white/10' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  {icon}
              </button>
              
              {isOpen && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setActiveTooltip(null)}></div>
                    <div className={`absolute top-full ${side === 'left' ? 'left-0' : 'right-0'} mt-2 w-56 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-2xl z-[100] backdrop-blur-md text-left animate-in fade-in zoom-in-95 duration-200`}>
                        <h4 className="text-xs font-bold text-white mb-2 pb-2 border-b border-slate-800 flex items-center gap-2">
                           {title}
                        </h4>
                        <div className="text-[10px] text-slate-300 leading-relaxed font-sans">
                            {content}
                        </div>
                        {/* Arrow */}
                        <div className={`absolute -top-1 ${side === 'left' ? 'left-2' : 'right-2'} w-2 h-2 bg-slate-900 border-t border-l border-slate-700 transform rotate-45`}></div>
                    </div>
                  </>
              )}
          </div>
      );
  };

  return (
    <div className="w-full mb-1 md:mb-2 space-y-1 md:space-y-2">
      {/* Top Row: Title & Scores */}
      <div className="flex flex-wrap justify-between items-center bg-slate-900/90 p-2 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md gap-2">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-[120px]">
            <button onClick={onMenu} className="p-1.5 md:p-2 -ml-1 md:-ml-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                <Menu size={18} className="md:w-5 md:h-5" />
            </button>
            <div>
                <div className="flex items-center">
                    <h1 className="text-xs sm:text-lg md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 fantasy-font drop-shadow-sm whitespace-nowrap">
                        {isClassic ? "Classic" : "Dragon's Hoard"}
                    </h1>
                    {/* Monster Evolution Tooltip */}
                    {!isClassic && (
                        <MicroTooltip 
                            id="evolution-help"
                            icon={<Info size={12} />}
                            title="Monster Evolution"
                            content={
                                <span>
                                    Merge two identical monsters to <strong>Evolve</strong> them into a stronger form. 
                                    <br/><br/>
                                    Higher ranks = More Gold, XP, and Score. 
                                    <br/>
                                    Target: Create the <strong>Dragon God (2048)</strong>.
                                </span>
                            }
                        />
                    )}
                </div>
                
                <div className="flex items-center gap-3 text-[9px] md:text-xs text-slate-400 mt-0.5 md:mt-1">
                    <span className="flex items-center gap-1"><Trophy size={10} /> {bestScore}</span>
                    {!isClassic && <span className="flex items-center gap-1 text-yellow-400 font-bold"><Coins size={10} /> {gold} G</span>}
                    
                    {/* Cascade Indicator */}
                    <div className="relative flex items-center">
                        <div className={`flex items-center gap-1 ${isCascadeActive ? 'text-cyan-400' : 'text-slate-600'} transition-colors ml-1`}>
                            <Zap size={10} className={isCascadeActive ? "fill-cyan-400/20" : ""} />
                            <span className="hidden xs:inline font-bold">Chain</span>
                        </div>
                        
                        <MicroTooltip 
                            id="cascade-help"
                            icon={<HelpCircle size={10} />}
                            title="Auto-Cascade System"
                            content={
                                <div className="space-y-2">
                                    <p>Automatic chain reactions triggered after your move.</p>
                                    <div className="flex justify-between border-t border-slate-800 pt-1">
                                        <span>Reward:</span> <span className="text-yellow-400 font-bold">+10% XP/Gold</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Unlock:</span> <span className={isCascadeUnlocked ? "text-green-400" : "text-red-400"}>Level 10</span>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
        <div className="text-right pl-2 border-l border-slate-700/50">
          <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Score</div>
          <div className="text-lg md:text-2xl font-mono font-bold text-white leading-none">{score}</div>
        </div>
      </div>

      {/* Buffs Row */}
      {!isClassic && buffs.length > 0 && (
          <div className="flex gap-2 justify-center animate-in fade-in slide-in-from-top-1 overflow-x-auto p-1 no-scrollbar">
              {buffs.map(b => (
                  <div key={b.id} className={`px-2 py-1 rounded border flex items-center gap-2 ${b.color} shadow-sm backdrop-blur-sm whitespace-nowrap`}>
                      {b.icon}
                      <span className="text-[9px] font-bold text-slate-200 tracking-wide">{b.label}</span>
                      <span className="text-[10px] font-mono text-white bg-black/40 px-1 rounded">{b.count}</span>
                  </div>
              ))}
          </div>
      )}

      {/* RPG Stats & Inventory Row */}
      {!isClassic && (
      <>
        <div className="flex gap-2 h-9 md:h-14">
            {/* XP Bar Container */}
            <div className={`flex-1 bg-[#0a0c10] p-1 rounded-lg border border-slate-700 relative flex items-center shadow-lg overflow-visible group pl-4`}>
                
                {/* Level Badge - Hexagonal Banner Style */}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 z-20 filter drop-shadow-xl hover:scale-105 transition-transform duration-300">
                     <div 
                        className={`w-10 h-12 md:w-14 md:h-16 ${rank.bg} flex items-center justify-center relative`}
                        style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
                     >
                          {/* Inner Border */}
                          <div 
                            className="absolute inset-[2px] bg-slate-900 z-0" 
                            style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
                          ></div>
                          
                          {/* Rank Icon Content */}
                          <div className="relative z-10 flex flex-col items-center justify-center -mt-1">
                              <RankIcon size={14} className={`${rank.color} mb-0.5 filter drop-shadow-[0_0_5px_currentColor] md:w-[18px] md:h-[18px]`} />
                              <span className="text-[10px] md:text-sm font-black text-white leading-none font-mono">{level}</span>
                          </div>

                          {/* Top Shine */}
                          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-20" style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}></div>
                     </div>
                </div>

                {/* Progress Bar Area - Magic Vial Style */}
                <div className="flex-1 flex flex-col justify-center pl-8 md:pl-10 pr-1 h-full relative">
                    <div className="flex justify-between items-center mb-0.5 z-10">
                        <div className="flex items-center gap-1">
                             <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400`}>XP</span>
                             <MicroTooltip 
                                id="progression-help"
                                icon={<Info size={10} />}
                                title="Progression System"
                                content={
                                    <div className="space-y-2">
                                        <p>Level up to heal & unlock perks.</p>
                                        <p className="text-indigo-300 font-bold border-t border-slate-800 pt-1">
                                            Grid Expands every 5 Levels!
                                        </p>
                                    </div>
                                }
                            />
                        </div>
                        <span className={`text-[8px] md:text-[9px] font-mono ${accentColor} opacity-90`}>
                            {Math.floor(xp)} / {xpThreshold}
                        </span>
                    </div>

                    <div className="w-full h-2 md:h-4 bg-black/80 rounded-full border border-slate-700/80 relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,1)]">
                        {/* Fluid Fill */}
                        <div 
                            className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
                            style={{ width: `${xpPercent}%` }}
                        >
                            {/* Bubbles / Shimmer */}
                            <div 
                                className="absolute inset-0 w-full h-full opacity-50"
                                style={{ 
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4) 50%, transparent)',
                                    animation: `shimmer ${shimmerDuration} infinite linear`
                                }}
                            ></div>
                        </div>
                        
                        {/* Glass Reflection Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Store Button */}
            <button 
                onClick={onOpenStore}
                className="w-10 md:w-14 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/50 rounded-lg flex flex-col items-center justify-center text-yellow-500 transition-colors group relative overflow-hidden shrink-0"
            >
                <div className="absolute inset-0 bg-yellow-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <StoreIcon size={14} className="relative z-10 md:w-4 md:h-4" />
                <span className="text-[7px] md:text-[9px] font-bold mt-0.5 md:mt-1 relative z-10">SHOP</span>
            </button>
        </div>

        {/* Inventory & Reroll Row */}
        <div className="flex gap-2 h-9 md:h-12">
            <div className="flex flex-1 gap-2">
                {[0, 1, 2].map((slotIndex) => {
                    const item = inventory[slotIndex];
                    return (
                        <div key={slotIndex} className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg relative flex items-center justify-center group overflow-hidden">
                            {/* Hotkey Indicator - Always Visible */}
                            <div className="absolute top-0 left-0 bg-slate-800/90 px-1 py-0.5 rounded-br-md text-[8px] md:text-[9px] font-mono text-slate-500 border-r border-b border-slate-700/50 z-10">
                                {slotIndex + 1}
                            </div>

                            {item ? (
                                <button 
                                    onClick={() => onUseItem(item)}
                                    className="w-full h-full flex items-center justify-center hover:bg-white/5 transition-colors relative"
                                >
                                    <span className="text-lg md:text-2xl drop-shadow-md transform group-hover:scale-110 transition-transform">{item.icon}</span>
                                    <span className="absolute bottom-0 right-1 text-[7px] md:text-[8px] text-slate-400 font-bold tracking-tighter opacity-70">{item.name.split(' ')[0]}</span>
                                </button>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center opacity-20">
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-700"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <button 
                onClick={canReroll ? onReroll : undefined}
                disabled={!canReroll}
                className={`w-10 md:w-14 rounded-lg flex flex-col items-center justify-center border transition-all relative shrink-0
                    ${canReroll 
                        ? 'bg-purple-900/30 hover:bg-purple-800/50 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                        : 'bg-slate-900/30 border-slate-800 text-slate-700 opacity-50 cursor-not-allowed'}
                `}
            >
                <RefreshCw size={12} className={canReroll ? "md:w-3.5 md:h-3.5" : "opacity-50"} />
                <div className="text-[7px] md:text-[8px] font-bold mt-0.5 md:mt-1">
                    {level < 15 ? 'Lvl 15' : (rerolls > 0 ? `Free: ${rerolls}` : '50G')}
                </div>
            </button>
        </div>
      </>
      )}
    </div>
  );
};
