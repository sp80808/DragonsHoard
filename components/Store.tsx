
import React, { useState, useEffect } from 'react';
import { SHOP_ITEMS, RECIPES } from '../constants';
import { ItemType, CraftingRecipe, InventoryItem, ShopState } from '../types';
import { Coins, X, Hammer, ShoppingBag, AlertCircle, Sparkles, Sword, Package, Check, Lock, RefreshCcw, Info, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { facebookService } from '../services/facebookService';
import { TiltContainer } from './TiltContainer';

interface StoreProps {
  gold: number;
  inventory: InventoryItem[];
  onClose: () => void;
  onBuy: (item: typeof SHOP_ITEMS[0]) => void;
  onCraft: (recipe: CraftingRecipe) => void;
  onUseItem: (item: InventoryItem) => void;
  shopState: ShopState;
}

type TabType = 'ESSENTIALS' | 'MAGIC' | 'BATTLE' | 'FORGE';

export const Store: React.FC<StoreProps> = ({ gold, inventory, onClose, onBuy, onCraft, onUseItem, shopState }) => {
  const [tab, setTab] = useState<TabType>('ESSENTIALS');
  const [showFullModal, setShowFullModal] = useState(false);

  // Calculate loot probability stats
  const lootableItems = SHOP_ITEMS.filter(i => i.category !== 'BATTLE');
  const lootableCount = lootableItems.length;
  const dropChancePercent = Math.round((1 / lootableCount) * 100);

  // Filter Items by Tab Category
  const getItemsForTab = () => {
      switch(tab) {
          case 'ESSENTIALS': return SHOP_ITEMS.filter(i => i.category === 'CONSUMABLE');
          case 'MAGIC': return SHOP_ITEMS.filter(i => i.category === 'MAGIC');
          case 'BATTLE': return SHOP_ITEMS.filter(i => i.category === 'BATTLE');
          default: return [];
      }
  };

  const handleBuyAttempt = (item: typeof SHOP_ITEMS[0], currentPrice: number, stock: number, onSuccess: () => void, onError: () => void) => {
      if (gold < currentPrice || stock <= 0) {
          onError();
          return;
      }
      if (inventory.length >= 3) {
          setShowFullModal(true);
          return;
      }
      
      // TRACKING
      facebookService.trackPixelEvent('Purchase', { 
          currency: 'GOLD', 
          value: currentPrice, 
          content_name: item.name, 
          content_id: item.id 
      });

      onBuy(item);
      onSuccess();
  };

  const handleCraftAttempt = (recipe: CraftingRecipe, onSuccess: () => void, onError: () => void) => {
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

  const getStockInfo = (itemId: string) => {
      return shopState?.items[itemId] || { stock: 1, priceMultiplier: 1.0 };
  };

  return (
    <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-50 flex flex-col md:flex-row bg-[#0b0f19] text-slate-200 font-sans"
    >
        {/* BACKGROUND AMBIENCE */}
        <div className="absolute inset-0 pointer-events-none z-0">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40"></div>
             <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0f1219] to-black"></div>
             <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-amber-900/10 blur-[100px] rounded-full mix-blend-screen"></div>
             <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-900/10 blur-[80px] rounded-full mix-blend-screen"></div>
        </div>

        {/* LEFT SIDEBAR (Desktop) / TOP NAV (Mobile) */}
        <div className="w-full md:w-72 bg-slate-900/95 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0 z-20 backdrop-blur-md shadow-2xl">
             {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-800 flex justify-between items-center bg-black/20">
                <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-600 flex items-center gap-2 fantasy-font drop-shadow-sm tracking-wide">
                        <ShoppingBag size={24} className="text-amber-500" /> MARKET
                    </h2>
                    <div className="text-[10px] text-slate-500 font-mono mt-1 tracking-widest uppercase flex items-center gap-1">
                        <RefreshCcw size={10} /> Restock: {shopState.turnsUntilRestock}
                    </div>
                </div>
                <button onClick={onClose} className="md:hidden p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700">
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-4 gap-2 custom-scrollbar">
                <NavButton active={tab === 'ESSENTIALS'} onClick={() => setTab('ESSENTIALS')} icon={<Package size={18}/>} label="Essentials" />
                <NavButton active={tab === 'MAGIC'} onClick={() => setTab('MAGIC')} icon={<Sparkles size={18}/>} label="Runes & Magic" />
                <NavButton active={tab === 'BATTLE'} onClick={() => setTab('BATTLE')} icon={<Sword size={18}/>} label="Battle Supplies" />
                <div className="h-px w-full bg-slate-800 my-2 hidden md:block"></div>
                <NavButton active={tab === 'FORGE'} onClick={() => setTab('FORGE')} icon={<Hammer size={18}/>} label="The Forge" color="text-orange-400" />
            </nav>

            {/* Wallet (Bottom Sidebar) */}
            <div className="mt-auto p-6 bg-black/40 border-t border-slate-800 hidden md:block">
                <div className="text-xs text-slate-500 uppercase font-bold mb-2 tracking-widest">Your Treasury</div>
                <div className="text-3xl font-mono font-bold text-yellow-400 flex items-center gap-3 drop-shadow-md">
                    <Coins size={28} className="text-yellow-500" /> {gold.toLocaleString()}
                </div>
            </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col h-full relative z-10 overflow-hidden" style={{ perspective: "1000px" }}>
             
             {/* Top Bar (Desktop) */}
             <div className="hidden md:flex justify-between items-center p-6 pb-2">
                 <div className="flex flex-col">
                    <h3 className="text-4xl font-black text-white fantasy-font mb-1 flex items-center gap-3 drop-shadow-lg">
                        {tab === 'ESSENTIALS' && <Package className="text-blue-400" size={32} />}
                        {tab === 'MAGIC' && <Sparkles className="text-purple-400" size={32} />}
                        {tab === 'BATTLE' && <Sword className="text-red-400" size={32} />}
                        {tab === 'FORGE' && <Hammer className="text-orange-400" size={32} />}
                        {tab === 'ESSENTIALS' ? 'Basic Supplies' : tab === 'MAGIC' ? 'Arcane Artifacts' : tab === 'BATTLE' ? 'Combat Gear' : 'Ancient Forge'}
                    </h3>
                    <p className="text-slate-400 text-sm font-medium pl-1">
                        {tab === 'ESSENTIALS' && "Potions and scrolls to aid your survival."}
                        {tab === 'MAGIC' && "Mystical runes to alter the laws of the dungeon."}
                        {tab === 'BATTLE' && "Weapons and brews to crush your enemies."}
                        {tab === 'FORGE' && "Craft powerful items from lesser components."}
                    </p>
                 </div>

                 {/* Desktop Close */}
                 <button 
                    onClick={onClose} 
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all hover:scale-105 border border-slate-700 font-bold uppercase tracking-wider text-sm"
                >
                     <ArrowLeft size={18} /> Return to Game
                 </button>
             </div>

             {/* Mobile Wallet Strip */}
             <div className="md:hidden px-4 py-2 bg-black/60 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm sticky top-0 z-30">
                 <div className="text-xs text-slate-400 font-bold uppercase">Treasury</div>
                 <div className="text-yellow-400 font-mono font-bold flex items-center gap-2">
                    <Coins size={14} /> {gold.toLocaleString()}
                 </div>
             </div>

             {/* Scrollable Grid */}
             <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                 <div className="max-w-[1600px] mx-auto pb-20">
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        <AnimatePresence mode="popLayout">
                        {/* SHOP ITEMS RENDER */}
                        {tab !== 'FORGE' && getItemsForTab().map((item, idx) => {
                             const { stock, priceMultiplier } = getStockInfo(item.id);
                             const currentPrice = Math.floor(item.price * priceMultiplier);
                             
                             return (
                                 <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                                    layout
                                 >
                                    <TiltContainer className="h-full">
                                        <StoreCard 
                                            item={item}
                                            price={currentPrice}
                                            stock={stock}
                                            canAfford={gold >= currentPrice && stock > 0}
                                            onAttemptBuy={(onSuccess, onError) => handleBuyAttempt(item, currentPrice, stock, onSuccess, onError)}
                                            dropChance={dropChancePercent}
                                        />
                                    </TiltContainer>
                                 </motion.div>
                             );
                        })}

                        {/* CRAFTING ITEMS RENDER */}
                        {tab === 'FORGE' && RECIPES.map((recipe, idx) => {
                             const counts: Record<string, number> = {};
                             inventory.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
                             const hasIngredients = recipe.ingredients.every(ing => (counts[ing.type] || 0) >= ing.count);
                             const canAfford = gold >= recipe.goldCost && hasIngredients;

                             return (
                                 <motion.div
                                    key={recipe.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                                    layout
                                 >
                                    <TiltContainer className="h-full">
                                        <StoreCard 
                                            recipe={recipe}
                                            canAfford={canAfford}
                                            inventoryCounts={counts}
                                            onAttemptBuy={(onSuccess, onError) => handleCraftAttempt(recipe, onSuccess, onError)}
                                            isCrafting
                                            stock={999}
                                            price={recipe.goldCost}
                                        />
                                    </TiltContainer>
                                 </motion.div>
                             );
                        })}
                        </AnimatePresence>
                     </div>
                 </div>
             </div>
        </div>

        {/* Inventory Full Modal Overlay */}
        {showFullModal && (
            <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
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

    </motion.div>
  );
};

const NavButton = ({ active, onClick, icon, label, color = "text-yellow-400" }: any) => (
    <button 
        onClick={onClick}
        className={`px-4 py-3 md:py-5 md:px-6 md:rounded-l-none rounded-xl flex items-center gap-3 transition-all duration-300 text-sm font-bold w-full relative overflow-hidden md:border-r-0
            ${active 
                ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 text-white shadow-lg md:border-l-4 border-yellow-500 translate-x-1 md:translate-x-0' 
                : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}
        `}
    >
        <span className={`relative z-10 transition-transform duration-300 ${active ? `${color} scale-110` : "text-slate-600 group-hover:scale-105"}`}>{icon}</span>
        <span className="whitespace-nowrap relative z-10 hidden md:inline">{label}</span>
        <span className="whitespace-nowrap relative z-10 md:hidden">{label.split(' ')[0]}</span>
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
    stock?: number;
    price?: number;
    dropChance?: number;
}

const StoreCard: React.FC<StoreCardProps> = ({ item, recipe, inventoryCounts, canAfford, onAttemptBuy, isCrafting, stock = 99, price = 0, dropChance }) => {
    const [state, setState] = useState<'IDLE' | 'SHAKE' | 'SUCCESS'>('IDLE');
    const [showInfo, setShowInfo] = useState(false);
    
    const data = isCrafting && recipe ? {
        id: recipe.id,
        name: recipe.name,
        price: price,
        icon: recipe.icon,
        desc: recipe.description
    } : { ...item!, price: price };

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
            className={`relative w-full group flex flex-col items-start p-1 rounded-2xl transition-all duration-300 transform h-full min-h-[220px] bg-slate-900/40
                ${state === 'SHAKE' ? 'animate-shake' : ''}
                ${state === 'SUCCESS' ? 'scale-95 ring-4 ring-green-500/50' : ''}
                ${canAfford ? 'cursor-pointer' : 'cursor-not-allowed opacity-60 grayscale-[0.8]'}
            `}
        >
            {/* Card Background & Borders */}
            <div className={`absolute inset-0 rounded-2xl border transition-colors duration-300
                ${canAfford 
                    ? 'bg-slate-800/60 border-slate-700/50 group-hover:border-yellow-500/50 group-hover:bg-slate-800' 
                    : 'bg-slate-900/60 border-slate-800'}
            `}></div>
            
            {/* Hover Sheen Effect */}
            {canAfford && state === 'IDLE' && (
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 group-hover:animate-[shimmer_1s_infinite]"></div>
                </div>
            )}

            {/* Info Button */}
            {!isCrafting && (
                <div 
                    onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo); }}
                    className="absolute top-2 right-2 z-30 p-2 rounded-full bg-slate-900/50 hover:bg-slate-700 text-slate-500 hover:text-blue-300 transition-colors border border-transparent hover:border-blue-500/30"
                >
                    <Info size={16} />
                </div>
            )}

            {/* Info Overlay */}
            {showInfo && (
                <div 
                    className="absolute inset-0 z-40 bg-slate-950/95 rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-200 backdrop-blur-sm"
                    onClick={(e) => { e.stopPropagation(); setShowInfo(false); }}
                >
                    <h4 className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                        <Info size={14} className="text-blue-400"/> Item Details
                    </h4>
                    
                    {item?.category === 'BATTLE' ? (
                        <div className="space-y-1">
                            <div className="text-red-400 font-bold text-xs uppercase tracking-wider">Shop Exclusive</div>
                            <div className="text-[10px] text-slate-500">Cannot be found in chests.</div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="text-green-400 font-bold text-xs uppercase tracking-wider">Lootable</div>
                            <div className="text-xs text-slate-300">
                                Drop Chance: <span className="font-mono text-yellow-400 font-bold">{dropChance}%</span>
                            </div>
                            <div className="text-[9px] text-slate-500 italic mt-1">(Probability per Item Drop)</div>
                        </div>
                    )}
                    
                    <div className="mt-4 text-[9px] text-slate-600 font-bold uppercase tracking-widest border-t border-slate-800 pt-2 w-full">
                        Tap to Close
                    </div>
                </div>
            )}

            {/* Inner Content */}
            <div className="relative z-10 w-full p-5 flex flex-col h-full">
                
                {/* Header: Icon & Price */}
                <div className="flex justify-between w-full mb-4 items-start">
                    <div className={`text-4xl w-16 h-16 flex items-center justify-center rounded-xl shadow-inner border border-white/5 transition-transform duration-500
                        ${canAfford ? 'bg-slate-900/80 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-slate-900' : 'bg-slate-950'}
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
                        {stock <= 0 && (
                            <div className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-widest bg-red-950 px-2 py-0.5 rounded">
                                Sold Out
                            </div>
                        )}
                        {stock > 0 && !isCrafting && (
                             <div className="text-[10px] font-bold text-slate-500 mt-1">
                                Stock: {stock}
                             </div>
                        )}
                    </div>
                </div>

                {/* Body: Name & Desc */}
                <div className="font-bold text-slate-200 text-lg mb-1 group-hover:text-yellow-200 transition-colors text-left font-serif tracking-wide pr-6">
                    {data.name}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed text-left font-medium">
                    {data.desc}
                </div>

                {/* Crafting Ingredients (If applicable) */}
                {isCrafting && recipe && inventoryCounts && (
                    <div className="w-full mt-auto pt-4 border-t border-slate-700/50 space-y-2">
                        {recipe.ingredients.map((ing, idx) => {
                            const has = inventoryCounts[ing.type] || 0;
                            const met = has >= ing.count;
                            return (
                                <div key={idx} className="flex justify-between text-[10px] items-center bg-black/20 p-1.5 rounded">
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
