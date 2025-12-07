
import React, { useState } from 'react';
import { SHOP_ITEMS, RECIPES } from '../constants';
import { ItemType, CraftingRecipe, InventoryItem } from '../types';
import { Coins, X, Hammer, ShoppingBag } from 'lucide-react';

interface StoreProps {
  gold: number;
  inventory: InventoryItem[]; // Needed for crafting
  onClose: () => void;
  onBuy: (item: typeof SHOP_ITEMS[0]) => void;
  onCraft: (recipe: CraftingRecipe) => void;
}

export const Store: React.FC<StoreProps> = ({ gold, inventory, onClose, onBuy, onCraft }) => {
  const [tab, setTab] = useState<'BUY' | 'CRAFT'>('BUY');

  // Helper to check if player has ingredients
  const canCraft = (recipe: CraftingRecipe) => {
    if (gold < recipe.goldCost) return false;
    // Check ingredients
    const counts: Record<string, number> = {};
    inventory.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
    
    return recipe.ingredients.every(ing => (counts[ing.type] || 0) >= ing.count);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 w-full max-w-md rounded-xl border border-yellow-700/50 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2 fantasy-font">
            <Coins size={20} /> Marketplace
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button 
            onClick={() => setTab('BUY')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors
              ${tab === 'BUY' ? 'bg-slate-800 text-yellow-400 border-b-2 border-yellow-500' : 'text-slate-500 hover:bg-slate-800/50'}`}
          >
            <ShoppingBag size={16} /> Merchant
          </button>
          <button 
            onClick={() => setTab('CRAFT')}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors
              ${tab === 'CRAFT' ? 'bg-slate-800 text-orange-400 border-b-2 border-orange-500' : 'text-slate-500 hover:bg-slate-800/50'}`}
          >
            <Hammer size={16} /> Forge
          </button>
        </div>

        {/* Gold Display */}
        <div className="px-4 py-2 bg-slate-950 text-center text-yellow-400 font-mono border-b border-slate-800">
          Available Gold: {gold}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {tab === 'BUY' && (
            SHOP_ITEMS.map((item) => {
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
            })
          )}

          {tab === 'CRAFT' && (
             RECIPES.map((recipe) => {
               const affordable = canCraft(recipe);
               
               // Count user ingredients
               const userIngs: Record<string, number> = {};
               inventory.forEach(i => userIngs[i.type] = (userIngs[i.type] || 0) + 1);

               return (
                <button
                  key={recipe.id}
                  onClick={() => affordable && onCraft(recipe)}
                  className={`w-full flex flex-col p-3 rounded-lg border transition-all relative overflow-hidden group
                    ${affordable 
                      ? 'bg-slate-800 border-slate-600 hover:border-orange-500 hover:bg-slate-700' 
                      : 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'}`}
                >
                   <div className="flex items-center w-full mb-2">
                        <div className="text-3xl mr-4 bg-slate-950 p-2 rounded-lg">{recipe.icon}</div>
                        <div className="flex-1 text-left">
                            <div className="font-bold text-slate-200">{recipe.name}</div>
                            <div className="text-xs text-slate-400">{recipe.description}</div>
                        </div>
                        <div className={`font-mono font-bold ${gold >= recipe.goldCost ? 'text-yellow-400' : 'text-red-900'}`}>
                            {recipe.goldCost} G
                        </div>
                   </div>

                   {/* Recipe Ingredients Status */}
                   <div className="w-full flex gap-2 text-xs bg-black/30 p-2 rounded">
                       {recipe.ingredients.map((ing, idx) => {
                           const has = userIngs[ing.type] || 0;
                           const name = SHOP_ITEMS.find(i => i.id === ing.type)?.name || ing.type;
                           const met = has >= ing.count;
                           return (
                               <div key={idx} className={`${met ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                                   {met ? '✓' : '✗'} {ing.count}x {name}
                               </div>
                           );
                       })}
                   </div>
                </button>
               )
             })
          )}
        </div>

        <div className="p-4 text-center text-xs text-slate-500 border-t border-slate-800">
          {tab === 'BUY' ? '"No refunds in the dungeon..."' : '"Ancient magic requires sacrifice..."'}
        </div>
      </div>
    </div>
  );
};
