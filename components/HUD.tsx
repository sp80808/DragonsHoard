
import React, { useState } from 'react';
import { getXpThreshold } from '../constants';
import { Trophy, Star, Store as StoreIcon, Coins, RefreshCw, Menu, Clover, Skull, Zap, Info, HelpCircle, Flame, Hammer } from 'lucide-react';
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

  const buffs = [];
  if ((effectCounters['LUCKY_LOOT'] || 0) > 0) buffs.push({ id: 'luck', icon: <Clover size={12} className="text-green-400" />, label: 'LUCK', count: effectCounters['LUCKY_LOOT'], color: 'bg-green-900/40 border-green-500/30' });
  if ((effectCounters['ASCENDANT_SPAWN'] || 0) > 0) buffs.push({ id: 'asc', icon: <Star size={12} className="text-yellow-400" />, label: 'RUNE', count: effectCounters['ASCENDANT_SPAWN'], color: 'bg-yellow-900/40 border-yellow-500/30' });
  if ((effectCounters['DEMON_CURSE'] || 0) > 0) buffs.push({ id: 'curse', icon: <Skull size={12} className="text-red-400" />, label: 'CURSE', count: effectCounters['DEMON_CURSE'], color: 'bg-red-900/40 border-red-500/30' });
  
  // New Buffs
  if ((effectCounters['LUCKY_DICE'] || 0) > 0) buffs.push({ id: 'dice', icon: <Coins size={12} className="text-blue-400" />, label: 'FATE', count: effectCounters['LUCKY_DICE'], color: 'bg-blue-900/40 border-blue-500/30' });
  if ((effectCounters['CHAIN_CATALYST'] || 0) > 0) buffs.push({ id: 'chain', icon: <Flame size={12} className="text-orange-400" />, label: 'CHAIN', count: effectCounters['CHAIN_CATALYST'], color: 'bg-orange-900/40 border-orange-500/30' });
  if ((effectCounters['MIDAS_POTION'] || 0) > 0) buffs.push({ id: 'midas', icon: <Coins size={12} className="text-yellow-400" />, label: 'MIDAS', count: effectCounters['MIDAS_POTION'], color: 'bg-yellow-900/40 border-yellow-500/30' });
  if ((effectCounters['SIEGE_BREAKER'] || 0) > 0) buffs.push({ id: 'siege', icon: <Hammer size={12} className="text-red-400" />, label: 'MIGHT', count: effectCounters['SIEGE_BREAKER'], color: 'bg-red-900/40 border-red-500/30' });

  // Tooltip Helper Component
  const MicroTooltip = ({ id, icon, title, content, side = 'left' }: { id: string, icon: React.ReactNode, title: string, content: React.ReactNode, side?: 'left' | 'right' }) => {
      if (!settings.enableTooltips) return null;
      
      const isOpen = activeTooltip === id;
      return (
          <div className="relative inline-flex items-center ml-1">
              <button 
                  onClick={(e) => toggleTooltip(id, e)}
                  className={`p-0.5 rounded-full hover:bg-white/10 transition-colors ${isOpen ? 'text-white bg-white/10' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  {icon}
              </button>
              
              {isOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveTooltip(null)}></div>
                    <div className={`absolute top-full ${side === 'left' ? 'left-0' : 'right-0'} mt-2 w-56 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-2xl z-50 backdrop-blur-md text-left animate-in fade-in zoom-in-95 duration-200`}>
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
    <div className="w-full mb-2 md:mb-4 space-y-1.5 md:space-y-2">
      {/* Top Row: Title & Scores */}
      <div className="flex flex-wrap justify-between items-center bg-slate-900/90 p-2 md:p-3 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md gap-2">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-[140px]">
            <button onClick={onMenu} className="p-1.5 md:p-2 -ml-1 md:-ml-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                <Menu size={20} />
            </button>
            <div>
                <div className="flex items-center">
                    <h1 className="text-base sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 fantasy-font drop-shadow-sm whitespace-nowrap">
                        {isClassic ? "Classic Mode" : "Dragon's Hoard"}
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
                
                <div className="flex items-center gap-3 text-[10px] md:text-xs text-slate-400 mt-0.5 md:mt-1">
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
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Score</div>
          <div className="text-xl md:text-2xl font-mono font-bold text-white leading-none">{score}</div>
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
        <div className="flex gap-2 h-10 md:h-14">
            {/* XP Bar */}
            <div className={`flex-1 bg-slate-950/80 p-1 md:p-1.5 rounded-lg border border-slate-700 relative flex flex-col justify-center shadow-lg transition-colors duration-500`}>
                <div className="flex justify-between items-end mb-0.5 md:mb-1 px-1 z-10 relative">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded bg-gradient-to-br ${barGradient} text-[9px] md:text-[10px] font-bold text-white shadow-sm`}>
                            {level}
                        </div>
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${accentColor} hidden xs:inline`}>Level</span>
                        
                        {/* Progression Tooltip */}
                        <MicroTooltip 
                            id="progression-help"
                            icon={<Info size={10} />}
                            title="Progression & Grid"
                            content={
                                <div className="space-y-2">
                                    <p>Gain XP to Level Up. Leveling heals you and unlocks perks.</p>
                                    <p className="text-indigo-300 font-bold border-t border-slate-800 pt-1">
                                        Grid Expands every 5 Levels!
                                    </p>
                                    <p className="text-purple-300 font-bold">
                                        New Stages unlock as you level deeper.
                                    </p>
                                </div>
                            }
                        />
                    </div>
                    <span className={`text-[8px] md:text-[9px] font-mono ${accentColor} opacity-80`}>
                        {Math.floor(xp)} / {xpThreshold}
                    </span>
                </div>

                <div className="w-full h-3 md:h-4 bg-slate-900 rounded bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMGUxMTE3Ii8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxZTJmNDUiLz4KPC9zdmc+')] shadow-inner relative overflow-hidden ring-1 ring-white/5">
                    <div 
                        className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-500 ease-out relative shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                        style={{ width: `${xpPercent}%` }}
                    >
                        <div 
                            className="absolute inset-0 w-full h-full"
                            style={{ 
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.1) 60%, transparent)',
                                animation: `shimmer ${shimmerDuration} infinite linear`
                            }}
                        ></div>
                        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white/80 blur-[2px] shadow-[0_0_8px_white]"></div>
                    </div>
                </div>
            </div>

            {/* Store Button */}
            <button 
                onClick={onOpenStore}
                className="w-12 md:w-14 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/50 rounded-lg flex flex-col items-center justify-center text-yellow-500 transition-colors group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-yellow-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <StoreIcon size={16} className="relative z-10" />
                <span className="text-[8px] md:text-[9px] font-bold mt-0.5 md:mt-1 relative z-10">SHOP</span>
            </button>
        </div>

        {/* Inventory & Reroll Row */}
        <div className="flex gap-2 h-10 md:h-12">
            <div className="flex flex-1 gap-2">
                {[0, 1, 2].map((slotIndex) => {
                    const item = inventory[slotIndex];
                    return (
                        <div key={slotIndex} className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg relative flex items-center justify-center group overflow-hidden">
                            {item ? (
                                <button 
                                    onClick={() => onUseItem(item)}
                                    className="w-full h-full flex items-center justify-center hover:bg-white/5 transition-colors relative"
                                >
                                    <span className="text-xl md:text-2xl drop-shadow-md transform group-hover:scale-110 transition-transform">{item.icon}</span>
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
                className={`w-12 md:w-14 rounded-lg flex flex-col items-center justify-center border transition-all relative
                    ${canReroll 
                        ? 'bg-purple-900/30 hover:bg-purple-800/50 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                        : 'bg-slate-900/30 border-slate-800 text-slate-700 opacity-50 cursor-not-allowed'}
                `}
            >
                <RefreshCw size={14} className={canReroll ? "" : "opacity-50"} />
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
