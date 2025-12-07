import React from 'react';
import { getXpThreshold } from '../constants';
import { Trophy, Star, Store as StoreIcon, Coins, RefreshCw, Menu, Clover, Skull } from 'lucide-react';
import { InventoryItem } from '../types';

interface HUDProps {
  score: number;
  bestScore: number;
  level: number;
  xp: number;
  gold: number;
  inventory: InventoryItem[];
  rerolls: number;
  effectCounters: Record<string, number>;
  onOpenStore: () => void;
  onUseItem: (item: InventoryItem) => void;
  onReroll: () => void;
  onMenu: () => void;
}

export const HUD: React.FC<HUDProps> = ({ score, bestScore, level, xp, gold, inventory, rerolls, effectCounters, onOpenStore, onUseItem, onReroll, onMenu }) => {
  const xpThreshold = getXpThreshold(level);
  const xpPercent = Math.min(100, (xp / xpThreshold) * 100);
  const canReroll = (level >= 15 && (rerolls > 0 || gold >= 50));

  // Determine visual theme based on level tier
  const getTheme = (lvl: number) => {
      if (lvl < 10) return {
          barGradient: "from-cyan-600 via-blue-500 to-indigo-500",
          borderColor: "border-slate-600",
          glowColor: "shadow-cyan-500/20",
          textColor: "text-cyan-200"
      };
      if (lvl < 20) return {
          barGradient: "from-purple-600 via-fuchsia-600 to-pink-500",
          borderColor: "border-purple-500/50",
          glowColor: "shadow-purple-500/30",
          textColor: "text-purple-200"
      };
      if (lvl < 30) return {
          barGradient: "from-amber-600 via-orange-500 to-yellow-400",
          borderColor: "border-amber-500/50",
          glowColor: "shadow-amber-500/30",
          textColor: "text-amber-200"
      };
      return {
          barGradient: "from-red-900 via-red-600 to-orange-500",
          borderColor: "border-red-500/50",
          glowColor: "shadow-red-500/40",
          textColor: "text-red-200"
      };
  };

  const theme = getTheme(level);
  const shimmerDuration = Math.max(1.0, 3.5 - (level * 0.05)) + 's';

  // Format active buffs for display
  const buffs = [];
  if ((effectCounters['LUCKY_LOOT'] || 0) > 0) buffs.push({ id: 'luck', icon: <Clover size={12} className="text-green-400" />, label: 'LUCK', count: effectCounters['LUCKY_LOOT'], color: 'bg-green-900/40 border-green-500/30' });
  if ((effectCounters['ASCENDANT_SPAWN'] || 0) > 0) buffs.push({ id: 'asc', icon: <Star size={12} className="text-yellow-400" />, label: 'RUNE', count: effectCounters['ASCENDANT_SPAWN'], color: 'bg-yellow-900/40 border-yellow-500/30' });
  if ((effectCounters['DEMON_CURSE'] || 0) > 0) buffs.push({ id: 'curse', icon: <Skull size={12} className="text-red-400" />, label: 'CURSE', count: effectCounters['DEMON_CURSE'], color: 'bg-red-900/40 border-red-500/30' });

  return (
    <div className="w-full mb-4 space-y-2">
      {/* Top Row: Title & Scores */}
      <div className="flex justify-between items-center bg-slate-900/90 p-3 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
            <button onClick={onMenu} className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white">
                <Menu size={20} />
            </button>
            <div>
            <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 fantasy-font drop-shadow-sm">
                Dragon's Hoard
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1"><Trophy size={10} /> {bestScore}</span>
                <span className="flex items-center gap-1 text-yellow-400 font-bold"><Coins size={10} /> {gold} G</span>
            </div>
            </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Score</div>
          <div className="text-2xl font-mono font-bold text-white leading-none">{score}</div>
        </div>
      </div>

      {/* Buffs Row (Conditional) */}
      {buffs.length > 0 && (
          <div className="flex gap-2 justify-center animate-in fade-in slide-in-from-top-1">
              {buffs.map(b => (
                  <div key={b.id} className={`px-2 py-1 rounded border flex items-center gap-2 ${b.color} shadow-sm backdrop-blur-sm`}>
                      {b.icon}
                      <span className="text-[9px] font-bold text-slate-200 tracking-wide">{b.label}</span>
                      <span className="text-[10px] font-mono text-white bg-black/40 px-1 rounded">{b.count}</span>
                  </div>
              ))}
          </div>
      )}

      {/* RPG Stats & Inventory Row */}
      <div className="flex gap-2 h-14">
        {/* XP Bar */}
        <div className={`flex-1 bg-slate-950/80 p-1.5 rounded-lg border ${theme.borderColor} relative flex flex-col justify-center shadow-lg transition-colors duration-500`}>
          <div className="flex justify-between items-end mb-1 px-1 z-10 relative">
             <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 flex items-center justify-center rounded bg-gradient-to-br ${theme.barGradient} text-[10px] font-bold text-white shadow-sm`}>
                    {level}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textColor}`}>Level</span>
             </div>
             <span className="text-[9px] font-mono text-slate-400">
                {Math.floor(xp)} <span className="text-slate-600">/</span> {xpThreshold} XP
             </span>
          </div>

          <div className="w-full h-4 bg-slate-900 rounded bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMGUxMTE3Ii8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxZTJmNDUiLz4KPC9zdmc+')] shadow-inner relative overflow-hidden ring-1 ring-white/5">
            <div 
              className={`h-full bg-gradient-to-r ${theme.barGradient} transition-all duration-500 ease-out relative shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
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
          className="w-14 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/50 rounded-lg flex flex-col items-center justify-center text-yellow-500 transition-colors group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-yellow-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <StoreIcon size={18} className="relative z-10" />
          <span className="text-[9px] font-bold mt-1 relative z-10">SHOP</span>
        </button>
      </div>

      {/* Inventory & Reroll Row */}
      <div className="flex gap-2">
        <div className="flex flex-1 gap-2">
            {[0, 1, 2].map((slotIndex) => {
                const item = inventory[slotIndex];
                return (
                    <div key={slotIndex} className="flex-1 h-12 bg-slate-900/50 border border-slate-800 rounded-lg relative flex items-center justify-center group overflow-hidden">
                        {item ? (
                            <button 
                                onClick={() => onUseItem(item)}
                                className="w-full h-full flex items-center justify-center hover:bg-white/5 transition-colors relative"
                            >
                                <span className="text-2xl drop-shadow-md transform group-hover:scale-110 transition-transform">{item.icon}</span>
                                <span className="absolute bottom-0 right-1 text-[8px] text-slate-400 font-bold tracking-tighter opacity-70">{item.name.split(' ')[0]}</span>
                            </button>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center opacity-20">
                                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        <button 
            onClick={canReroll ? onReroll : undefined}
            disabled={!canReroll}
            className={`w-14 h-12 rounded-lg flex flex-col items-center justify-center border transition-all relative
                ${canReroll 
                    ? 'bg-purple-900/30 hover:bg-purple-800/50 border-purple-500/50 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                    : 'bg-slate-900/30 border-slate-800 text-slate-700 opacity-50 cursor-not-allowed'}`}
        >
            <RefreshCw size={16} className={canReroll ? "" : "opacity-50"} />
            <div className="text-[8px] font-bold mt-1">
                {level < 15 ? 'Lvl 15' : (rerolls > 0 ? `Free: ${rerolls}` : '50G')}
            </div>
        </button>
      </div>
    </div>
  );
};