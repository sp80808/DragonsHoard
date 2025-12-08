
import React, { useState, useEffect } from 'react';
import { SHOP_ITEMS, RECIPES } from '../constants';
import { ItemType, CraftingRecipe, InventoryItem } from '../types';
import { Coins, X, Hammer, ShoppingBag, AlertCircle, Check } from 'lucide-react';

interface StoreProps {
  gold: number;
  inventory: InventoryItem[];
  onClose: () => void;
  onBuy: (item: typeof SHOP_ITEMS[0]) => void;
  onCraft: (recipe: CraftingRecipe) => void;
  onUseItem: (item: InventoryItem) => void;
}

export const Store: React.FC<StoreProps> = ({ gold, inventory, onClose, onBuy, onCraft, onUseItem }) => {
  const [tab, setTab] = useState<'BUY' | 'CRAFT'>('BUY');
  const [showFullModal, setShowFullModal] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Helper to check if player has ingredients
  const canCraft = (recipe: CraftingRecipe) => {
    if (gold < recipe.goldCost) return false;
    const counts: Record<string, number> = {};
    inventory.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
    return recipe.ingredients.every(ing => (counts[ing.type] || 0) >= ing.count);
  };

  const handleBuyAttempt = (item: typeof SHOP_ITEMS[0]) => {
      if (inventory.length >= 3) {
          setShowFullModal(true);
          return;
      }
      onBuy(item);
      triggerSuccess(item.id);
  };

  const handleCraftAttempt = (recipe: CraftingRecipe) => {
      // Logic check: Crafting usually consumes items, so inventory full might not be an issue 
      // UNLESS the ingredients don't free up a slot (e.g. 1 ingredient -> 1 result, net 0 change)
      // Or if recipe uses gold only (not implemented yet). 
      // Most recipes here use 2 items to make 1, so it frees space.
      // But let's check if the net result exceeds limit (unlikely with 2->1).
      // However, if we add recipes that are 0 items -> 1 item, we need check.
      // Current recipes are 2->1. So inventory will decrease by 1. Safe.
      
      onCraft(recipe);
      triggerSuccess(recipe.id);
  };

  const triggerSuccess = (id: string) => {
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 1500);
  };

  const handleUseItem = (item: InventoryItem) => {
      onUseItem(item);
      // If inventory drops below 3 (which it will), close modal
      if (inventory.length - 1 < 3) {
          setShowFullModal(false);
      }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 w-full max-w-md rounded-xl border border-yellow-700/50 shadow-2xl flex flex-col max-h-[85vh] relative acrylic-panel layered-depth depth-focused">
        
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
              const isSuccess = successId === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => canAfford && handleBuyAttempt(item)}
                  className={`w-full flex items-center p-3 rounded-lg border transition-all relative overflow-hidden group
                    ${canAfford 
                      ? 'bg-slate-800 border-slate-600 hover:border-yellow-500 hover:bg-slate-700' 
                      : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'}
                    ${isSuccess ? 'border-green-500 bg-green-900/20' : ''}
                  `}
                >
                  {isSuccess && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 animate-in fade-in duration-200">
                          <div className="text-green-400 font-bold flex items-center gap-2 text-lg transform scale-110">
                              <Check size={24} /> Purchased!
                          </div>
                      </div>
                  )}

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
               const isSuccess = successId === recipe.id;

               // Count user ingredients
               const userIngs: Record<string, number> = {};
               inventory.forEach(i => userIngs[i.type] = (userIngs[i.type] || 0) + 1);

               return (
                <button
                  key={recipe.id}
                  onClick={() => affordable && handleCraftAttempt(recipe)}
                  className={`w-full flex flex-col p-3 rounded-lg border transition-all relative overflow-hidden group
                    ${affordable 
                      ? 'bg-slate-800 border-slate-600 hover:border-orange-500 hover:bg-slate-700' 
                      : 'bg-slate-900/50 border-slate-800 opacity-60 cursor-not-allowed'}
                     ${isSuccess ? 'border-green-500 bg-green-900/20' : ''}
                  `}
                >
                   {isSuccess && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 animate-in fade-in duration-200">
                          <div className="text-green-400 font-bold flex items-center gap-2 text-lg transform scale-110">
                              <Hammer size={24} /> Crafted!
                          </div>
                      </div>
                   )}

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

        {/* Inventory Full Modal Overlay */}
        {showFullModal && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200 rounded-xl">
                <div className="w-full space-y-4 text-center">
                    <div className="mx-auto w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center text-red-500 mb-2">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Inventory Full!</h3>
                    <p className="text-slate-400 text-sm">
                        You can only carry 3 items. Use an item now to make space, or cancel the purchase.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        {inventory.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => handleUseItem(item)}
                                className="bg-slate-800 border border-slate-600 hover:border-yellow-400 hover:bg-slate-700 p-2 rounded-lg flex flex-col items-center gap-1 transition-all group"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                <span className="text-[10px] text-slate-300 font-bold truncate w-full">{item.name.split(' ')[0]}</span>
                                <div className="text-[9px] text-yellow-500 font-bold uppercase mt-1 px-1 bg-yellow-900/20 rounded">
                                    USE
                                </div>
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => setShowFullModal(false)}
                        className="w-full py-3 mt-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors"
                    >
                        Cancel Purchase
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
