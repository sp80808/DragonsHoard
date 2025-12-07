
import React from 'react';
import { SHOP_ITEMS } from '../constants';
import { ItemType } from '../types';
import { Coins, X } from 'lucide-react';

interface StoreProps {
  gold: number;
  onClose: () => void;
  onBuy: (item: typeof SHOP_ITEMS[0]) => void;
}

export const Store: React.FC<StoreProps> = ({ gold, onClose, onBuy }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 w-full max-w-md rounded-xl border border-yellow-700/50 shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2 fantasy-font">
            <Coins size={20} /> Merchant's Wares
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Gold Display */}
        <div className="px-4 py-2 bg-slate-950 text-center text-yellow-400 font-mono border-b border-slate-800">
          Available Gold: {gold}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {SHOP_ITEMS.map((item) => {
            const canAfford = gold >= item.price;
            return (
              <button
                key={item.id}
                onClick={() => canAfford && onBuy(item)}
                className={`w-full flex items-center p-3 rounded-lg border transition-all relative overflow-hidden group
                  ${canAfford 
                    ? 'bg-slate-800 border-slate-600 hover:border-yellow-500 hover:bg-slate-700' 
                    : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'}`}
              >
                <div className="text-3xl mr-4 bg-slate-950 p-2 rounded-lg">{item.icon}</div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-slate-200">{item.name}</div>
                  <div className="text-xs text-slate-400">{item.desc}</div>
                </div>
                <div className={`font-mono font-bold ${canAfford ? 'text-yellow-400' : 'text-red-900'}`}>
                  {item.price} G
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 text-center text-xs text-slate-500 border-t border-slate-800">
          "No refunds in the dungeon..."
        </div>
      </div>
    </div>
  );
};
