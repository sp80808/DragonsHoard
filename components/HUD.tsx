
import React from 'react';
import { getXpThreshold } from '../constants';
import { Trophy, Star, Sparkles, Store as StoreIcon, Coins } from 'lucide-react';
import { InventoryItem } from '../types';

interface HUDProps {
  score: number;
  bestScore: number;
  level: number;
  xp: number;
  gold: number;
  inventory: InventoryItem[];
  onRestart: () => void;
  onOpenStore: () => void;
  onUseItem: (item: InventoryItem) => void;
}

export const HUD: React.FC<HUDProps> = ({ score, bestScore, level, xp, gold, inventory, onRestart, onOpenStore, onUseItem }) => {
  const xpThreshold = getXpThreshold(level);
  const xpPercent = Math.min(100, (xp / xpThreshold) * 100);

  return (
    <div className="w-full mb-4 space-y-3">
      {/* Top Row: Title & Scores */}
      <div className="flex justify-between items-center bg-slate-900/90 p-3 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-500 fantasy-font drop-shadow-sm">
            Dragon's Hoard
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            <span className="flex items-center gap-1"><Trophy size={10} /> Best: {bestScore}</span>
            <span className="flex items-center gap-1 text-yellow-400 font-bold"><Coins size={10} /> {gold} G</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Score</div>
          <div className="text-2xl font-mono font-bold text-white leading-none">{score}</div>
        </div>
      </div>

      {/* RPG Stats & Inventory Row */}
      <div className="flex gap-2 h-14">
        {/* XP Bar */}
        <div className="flex-1 bg-slate-900/80 p-2 rounded-lg border border-slate-700 relative overflow-hidden flex flex-col justify-center">
          <div className="flex justify-between text-[10px] font-bold text-cyan-300 mb-1 z-10 relative">
            <span className="flex items-center gap-1"><Star size={10}/> Lvl {level}</span>
            <span>{Math.floor(xpPercent)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Store Button */}
        <button 
          onClick={onOpenStore}
          className="w-14 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-700/50 rounded-lg flex flex-col items-center justify-center text-yellow-500 transition-colors"
        >
          <StoreIcon size={18} />
          <span className="text-[9px] font-bold mt-1">SHOP</span>
        </button>
      </div>

      {/* Inventory Slots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((slotIndex) => {
            const item = inventory[slotIndex];
            return (
                <div key={slotIndex} className="flex-1 h-12 bg-slate-900/50 border border-slate-800 rounded-lg relative flex items-center justify-center group">
                    {item ? (
                        <button 
                            onClick={() => onUseItem(item)}
                            className="w-full h-full flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors relative"
                        >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="absolute bottom-0 right-1 text-[8px] text-slate-400">{item.name.split(' ')[0]}</span>
                        </button>
                    ) : (
                        <span className="text-slate-800 text-xs">Empty</span>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};
