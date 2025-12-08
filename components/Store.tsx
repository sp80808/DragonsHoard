
import React, { useState, useEffect } from 'react';
import { SHOP_ITEMS, RECIPES } from '../constants';
import { ItemType, CraftingRecipe, InventoryItem } from '../types';
import { Coins, X, Hammer, ShoppingBag, AlertCircle, Sparkles, Sword, Package, Check, Lock } from 'lucide-react';

interface StoreProps {
  gold: number;
  inventory: InventoryItem[];
  onClose: () => void;
  onBuy: (item: typeof SHOP_ITEMS[0]) => void;
  onCraft: (recipe: CraftingRecipe) => void;
  onUseItem: (item: InventoryItem) => void;
}

type TabType = 'ESSENTIALS' | 'MAGIC' | 'BATTLE' | 'FORGE';

export const Store: React.FC<StoreProps> = ({ gold, inventory, onClose, onBuy, onCraft, onUseItem }) => {
  const [tab, setTab] = useState<TabType>('ESSENTIALS');
  const [showFullModal, setShowFullModal] = useState(false);

  // Filter Items by Tab Category
  const getItemsForTab = () => {
      switch(tab) {
          case 'ESSENTIALS': return SHOP_ITEMS.filter(i => i.category === 'CONSUMABLE');
          case 'MAGIC': return SHOP_ITEMS.filter(i => i.category === 'MAGIC');
          case 'BATTLE': return SHOP_ITEMS.filter(i => i.category === 'BATTLE');
          default: return [];
      }
  };

  const handleBuyAttempt = (item: typeof SHOP_ITEMS[0], onSuccess: () => void, onError: () => void) => {
      if (gold < item.price) {
          onError();
          return;
      }
      if (inventory.length >= 3) {
          setShowFullModal(true);
          return;
      }
      onBuy(item);
      onSuccess();
  };

  const handleCraftAttempt = (recipe: CraftingRecipe, onSuccess: () => void, onError: () => void) => {
      // Check ingredients
      const counts: Record<string, number> = {};
      inventory.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
      const hasIngredients = recipe.ingredients.every(ing => (counts[ing.type] || 0) >= ing.count);

      if (gold < recipe.goldCost || !hasIngredients) {
          onError();
          return;
      }
      if (inventory.length >= 3) {
          setShowFullModal(true);
          return;
      }

      onCraft(recipe);
      onSuccess();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 md:p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-[#0b0f19] w-full max-w-4xl h-[90vh] md:h-[80vh] rounded-2xl border border-yellow-900/40 shadow-2xl flex flex-col md:flex-row relative overflow-hidden group">
        
        {/* Left Sidebar (Desktop) / Top Bar (Mobile) */}
        <div className="w-full md:w-64 bg-slate-900/90 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0 z-20">
             {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <div>
                    <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-600 flex items-center gap-2 fantasy-font drop-shadow-sm">
                        <ShoppingBag size={20} className="text-amber-500" /> MARKET
                    </h2>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 tracking-widest uppercase">The Dragon's Trade</div>
                </div>
                <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white p-2">
                    <X size={24} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 gap-2 custom-scrollbar">
                <NavButton active={tab === 'ESSENTIALS'} onClick={() => setTab('ESSENTIALS')} icon={<Package size={16}/>} label="Essentials" />
                <NavButton active={tab === 'MAGIC'} onClick={() => setTab('MAGIC')} icon={<Sparkles size={16}/>} label="Runes & Magic" />
                <NavButton active={tab === 'BATTLE'} onClick={() => setTab('BATTLE')} icon={<Sword size={16}/>} label="Battle Supplies" />
                <div className="h-px w-full bg-slate-800 my-1 hidden md:block"></div>
                <NavButton active={tab === 'FORGE'} onClick={() => setTab('FORGE')} icon={<Hammer size={16}/>} label="The Forge" color="text-orange-400" />
            </nav>

            {/* Wallet (Bottom Sidebar) */}
            <div className="mt-auto p-4 bg-slate-950/80 border-t border-slate-800 hidden md:block">
                <div className="text-xs text-slate-500 uppercase font-bold mb-1 tracking-widest">Your Treasury</div>
                <div className="text-2xl font-mono font-bold text-yellow-400 flex items-center gap-2 drop-shadow-md">
                    <Coins size={20} className="text-yellow-500" /> {gold.toLocaleString()}
                </div>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] relative">
             <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-black/80 pointer-events-none"></div>

             {/* Mobile Wallet & Close */}
             <div className="md:hidden p-3 bg-slate-950 flex justify-between items-center border-b border-slate-800 z-20">
                 <div className="text-yellow-400 font-mono font-bold flex items-center gap-2">
                    <Coins size={16} /> {gold.toLocaleString()}
                 </div>
             </div>

             {/* Close Button Desktop */}
             <button onClick={onClose} className="absolute top-4 right-4 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all hover:scale-110 z-30 border border-white/10">
                 <X size={18} />
             </button>

             {/* Scrollable Grid */}
             <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar z-10">
                 <div className="max-w-4xl mx-auto pb-12">
                     <div className="mb-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                         <h3 className="text-3xl font-black text-white fantasy-font mb-2 flex items-center gap-3 drop-shadow-lg">
                             {tab === 'ESSENTIALS' && <Package className="text-blue-400" size={28} />}
                             {tab === 'MAGIC' && <Sparkles className="text-purple-400" size={28} />}
                             {tab === 'BATTLE' && <Sword className="text-red-400" size={28} />}
                             {tab === 'FORGE' && <Hammer className="text-orange-400" size={28} />}
                             {tab === 'ESSENTIALS' ? 'Basic Supplies' : tab === 'MAGIC' ? 'Arcane Artifacts' : tab === 'BATTLE' ? 'Combat Gear' : 'Ancient Forge'}
                         </h3>
                         <p className="text-slate-400 text-sm font-medium pl-1">
                             {tab === 'ESSENTIALS' && "Potions and scrolls to aid your survival."}
                             {tab === 'MAGIC' && "Mystical runes to alter the laws of the dungeon."}
                             {tab === 'BATTLE' && "Weapons and brews to crush your enemies."}
                             {tab === 'FORGE' && "Craft powerful items from lesser components."}
                         </p>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* SHOP ITEMS RENDER */}
                        {tab !== 'FORGE' && getItemsForTab().map((item) => (
                             <StoreCard 
                                key={item.id}
                                item={item}
                                canAfford={gold >= item.price}
                                onAttemptBuy={(onSuccess, onError) => handleBuyAttempt(item, onSuccess, onError)}
                             />
                        ))}

                        {/* CRAFTING ITEMS RENDER */}
                        {tab === 'FORGE' && RECIPES.map((recipe) => {
                             // Check ingredients
                             const counts: Record<string, number> = {};
                             inventory.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
                             const hasIngredients = recipe.ingredients.every(ing => (counts[ing.type] || 0) >= ing.count);
                             const canAfford = gold >= recipe.goldCost && hasIngredients;

                             return (
                                 <StoreCard 
                                    key={recipe.id}
                                    recipe={recipe}
                                    canAfford={canAfford}
                                    inventoryCounts={counts}
                                    onAttemptBuy={(onSuccess, onError) => handleCraftAttempt(recipe, onSuccess, onError)}
                                    isCrafting
                                 />
                             );
                        })}
                     </div>
                 </div>
             </div>
        </div>

        {/* Inventory Full Modal Overlay */}
        {showFullModal && (
            <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="w-full max-w-sm bg-slate-900 border border-red-900 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-in zoom-in-95">
                    <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4 animate-bounce">
                        <AlertCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 fantasy-font">Backpack Full</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        You can only carry 3 items. Use one now to make space for your new purchase.
                    </p>
                    
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {inventory.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => { onUseItem(item); setShowFullModal(false); }}
                                className="bg-slate-800 border border-slate-700 hover:border-yellow-400 hover:bg-slate-700 p-3 rounded-xl flex flex-col items-center gap-2 transition-all group shadow-lg"
                            >
                                <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{item.icon}</span>
                                <span className="text-[10px] text-slate-300 font-bold truncate w-full uppercase tracking-wide">{item.name.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => setShowFullModal(false)}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors text-sm uppercase tracking-wide"
                    >
                        Cancel Transaction
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

// --- Sub Components ---

const NavButton = ({ active, onClick, icon, label, color = "text-yellow-400" }: any) => (
    <button 
        onClick={onClick}
        className={`px-4 py-3 md:py-4 rounded-xl flex items-center gap-3 transition-all duration-300 text-sm font-bold w-full relative overflow-hidden
            ${active 
                ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 text-white shadow-lg border-l-4 border-yellow-500 translate-x-1' 
                : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}
        `}
    >
        <span className={`relative z-10 transition-transform duration-300 ${active ? `${color} scale-110` : "text-slate-600 group-hover:scale-105"}`}>{icon}</span>
        <span className="whitespace-nowrap relative z-10">{label}</span>
        {active && <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>}
    </button>
);

interface StoreCardProps {
    item?: typeof SHOP_ITEMS[0];
    recipe?: CraftingRecipe;
    inventoryCounts?: Record<string, number>;
    canAfford: boolean;
    onAttemptBuy: (onSuccess: () => void, onError: () => void) => void;
    isCrafting?: boolean;
}

const StoreCard: React.FC<StoreCardProps> = ({ item, recipe, inventoryCounts, canAfford, onAttemptBuy, isCrafting }) => {
    const [state, setState] = useState<'IDLE' | 'SHAKE' | 'SUCCESS'>('IDLE');
    
    // Derived data
    const data = isCrafting && recipe ? {
        id: recipe.id,
        name: recipe.name,
        price: recipe.goldCost,
        icon: recipe.icon,
        desc: recipe.description
    } : item!;

    const handleClick = () => {
        if (state !== 'IDLE') return;

        onAttemptBuy(
            () => {
                setState('SUCCESS');
                setTimeout(() => setState('IDLE'), 1500);
            },
            () => {
                setState('SHAKE');
                setTimeout(() => setState('IDLE'), 500);
            }
        );
    };

    return (
        <button
            onClick={handleClick}
            className={`relative group flex flex-col items-start p-1 rounded-2xl transition-all duration-300 transform
                ${state === 'SHAKE' ? 'animate-shake' : ''}
                ${state === 'SUCCESS' ? 'scale-95 ring-4 ring-green-500/50' : 'hover:-translate-y-1 hover:shadow-2xl'}
                ${canAfford ? 'cursor-pointer' : 'cursor-not-allowed opacity-60 grayscale-[0.8]'}
            `}
        >
            {/* Card Background & Borders */}
            <div className={`absolute inset-0 rounded-2xl border transition-colors duration-300
                ${canAfford 
                    ? 'bg-slate-800/80 border-slate-700 group-hover:border-yellow-500/50 group-hover:bg-slate-800' 
                    : 'bg-slate-900/60 border-slate-800'}
            `}></div>
            
            {/* Hover Sheen Effect */}
            {canAfford && state === 'IDLE' && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:animate-[shimmer_1s_infinite]"></div>
                </div>
            )}

            {/* Inner Content */}
            <div className="relative z-10 w-full p-4 flex flex-col h-full">
                
                {/* Header: Icon & Price */}
                <div className="flex justify-between w-full mb-4">
                    <div className={`text-4xl w-16 h-16 flex items-center justify-center rounded-xl shadow-inner border border-white/5 transition-transform duration-500
                        ${canAfford ? 'bg-slate-900 group-hover:scale-110 group-hover:rotate-3' : 'bg-slate-950'}
                    `}>
                        {data.icon}
                    </div>
                    
                    <div className={`flex flex-col items-end`}>
                        <div className={`font-mono font-bold text-sm px-3 py-1.5 rounded-lg border shadow-sm
                            ${canAfford 
                                ? 'bg-yellow-900/20 text-yellow-400 border-yellow-700/30' 
                                : 'bg-red-900/20 text-red-500 border-red-900/30'}
                        `}>
                            {data.price} G
                        </div>
                    </div>
                </div>

                {/* Body: Name & Desc */}
                <div className="font-bold text-slate-200 text-lg mb-1 group-hover:text-yellow-200 transition-colors text-left font-serif tracking-wide">
                    {data.name}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed text-left font-medium min-h-[2.5em]">
                    {data.desc}
                </div>

                {/* Crafting Ingredients (If applicable) */}
                {isCrafting && recipe && inventoryCounts && (
                    <div className="w-full mt-4 pt-3 border-t border-slate-700/50 space-y-1">
                        {recipe.ingredients.map((ing, idx) => {
                            const has = inventoryCounts[ing.type] || 0;
                            const met = has >= ing.count;
                            return (
                                <div key={idx} className="flex justify-between text-[10px] items-center">
                                    <span className="text-slate-400">{SHOP_ITEMS.find(i => i.id === ing.type)?.name || ing.type}</span>
                                    <div className={`flex items-center gap-1 font-mono font-bold ${met ? 'text-green-400' : 'text-red-400'}`}>
                                        {met ? <Check size={10} /> : <Lock size={10} />}
                                        {has}/{ing.count}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Success Overlay */}
            {state === 'SUCCESS' && (
                <div className="absolute inset-0 z-20 rounded-2xl bg-slate-900/90 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                    <div className="relative">
                        <div className="absolute inset-0 bg-green-500 blur-xl opacity-50 animate-pulse"></div>
                        <Check size={48} className="text-green-400 relative z-10 animate-[bounce_0.5s_ease-out]" />
                    </div>
                    <div className="text-green-200 font-bold mt-2 text-sm tracking-widest uppercase animate-in slide-in-from-bottom-2">
                        {isCrafting ? 'Forged!' : 'Acquired!'}
                    </div>
                    {/* Floating Cost Text */}
                    <div className="absolute -top-10 text-red-400 font-bold font-mono animate-[floatUp_1s_ease-out_forwards]">
                        -{data.price} G
                    </div>
                </div>
            )}
        </button>
    );
};
