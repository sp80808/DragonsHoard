
import React, { useState, useEffect, useMemo } from 'react';
import { SHOP_ITEMS, RECIPES, getItemDefinition } from '../constants';
import { ItemType, CraftingRecipe, InventoryItem, ShopState } from '../types';
import { Coins, X, Hammer, ShoppingBag, AlertCircle, Sparkles, Sword, Package, Check, Lock, RefreshCcw, Info, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { facebookService } from '../services/facebookService';
import { TiltContainer } from './TiltContainer';
import { audioService } from '../services/audioService';

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

const NavButton = ({ active, onClick, icon, label, color, isFocused }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color?: string, isFocused?: boolean }) => (
    <button 
        onClick={() => { audioService.playUIClick(); onClick(); }}
        onMouseEnter={() => audioService.playUIHover()}
        className={`flex items-center gap-2 md:gap-3 px-4 py-2 md:p-3 rounded-xl transition-all font-bold text-xs md:text-sm whitespace-nowrap w-full text-left
            ${active ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}
            ${isFocused ? 'ring-2 ring-yellow-400 z-10 scale-[1.02]' : ''}
        `}
    >
        <span className={`${active ? (color || 'text-yellow-500') : 'text-slate-600'}`}>{icon}</span>
        <span>{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-500 hidden md:block" />}
    </button>
);

export const Store: React.FC<StoreProps> = ({ gold, inventory, onClose, onBuy, onCraft, onUseItem, shopState }) => {
  const [tab, setTab] = useState<TabType>('ESSENTIALS');
  const [showFullModal, setShowFullModal] = useState(false);
  
  // Navigation State
  const [activeSection, setActiveSection] = useState<'SIDEBAR' | 'GRID'>('SIDEBAR');
  const [sidebarIndex, setSidebarIndex] = useState(0);
  const [gridIndex, setGridIndex] = useState(0);

  const tabs: TabType[] = ['ESSENTIALS', 'MAGIC', 'BATTLE', 'FORGE'];

  // Filter Items by Tab Category
  const currentItems = useMemo(() => {
      switch(tab) {
          case 'ESSENTIALS': return SHOP_ITEMS.filter(i => i.category === 'CONSUMABLE');
          case 'MAGIC': return SHOP_ITEMS.filter(i => i.category === 'MAGIC');
          case 'BATTLE': return SHOP_ITEMS.filter(i => i.category === 'BATTLE');
          case 'FORGE': return RECIPES;
          default: return [];
      }
  }, [tab]);

  // Sync tab with sidebar index
  useEffect(() => {
      setTab(tabs[sidebarIndex]);
      setGridIndex(0); // Reset grid selection when tab changes
  }, [sidebarIndex]);

  // Keyboard Navigation Logic
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (showFullModal) {
              if (e.key === 'Enter' || e.key === 'Escape') setShowFullModal(false);
              return;
          }

          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
              e.preventDefault();
          }

          if (activeSection === 'SIDEBAR') {
              if (e.key === 'ArrowUp' || e.key === 'w') {
                  setSidebarIndex(prev => (prev - 1 + tabs.length) % tabs.length);
                  audioService.playUIHover();
              } else if (e.key === 'ArrowDown' || e.key === 's') {
                  setSidebarIndex(prev => (prev + 1) % tabs.length);
                  audioService.playUIHover();
              } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'Enter') {
                  setActiveSection('GRID');
                  setGridIndex(0);
                  audioService.playUIHover();
              } else if (e.key === 'Escape') {
                  onClose();
              }
          } else {
              // GRID MODE
              const cols = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
              const maxIndex = currentItems.length - 1;

              if (e.key === 'ArrowUp' || e.key === 'w') {
                  if (gridIndex - cols >= 0) setGridIndex(prev => prev - cols);
                  audioService.playUIHover();
              } else if (e.key === 'ArrowDown' || e.key === 's') {
                  if (gridIndex + cols <= maxIndex) setGridIndex(prev => prev + cols);
                  audioService.playUIHover();
              } else if (e.key === 'ArrowLeft' || e.key === 'a') {
                  if (gridIndex % cols === 0) {
                      setActiveSection('SIDEBAR');
                  } else {
                      setGridIndex(prev => prev - 1);
                  }
                  audioService.playUIHover();
              } else if (e.key === 'ArrowRight' || e.key === 'd') {
                  if (gridIndex < maxIndex) setGridIndex(prev => prev + 1);
                  audioService.playUIHover();
              } else if (e.key === 'Enter') {
                  const item = currentItems[gridIndex];
                  if (tab === 'FORGE') {
                      handleCraftAttempt(item as CraftingRecipe);
                  } else {
                      const { stock, priceMultiplier } = getStockInfo((item as any).id);
                      handleBuyAttempt(item as any, Math.ceil((item as any).price * priceMultiplier), stock);
                  }
              } else if (e.key === 'Escape') {
                  setActiveSection('SIDEBAR');
                  audioService.playUIBack();
              }
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, sidebarIndex, gridIndex, currentItems, tab, showFullModal]);

  const handleBuyAttempt = (item: typeof SHOP_ITEMS[0], currentPrice: number, stock: number) => {
      if (gold < currentPrice || stock <= 0) {
          audioService.playInvalidMove();
          return;
      }
      if (inventory.length >= 3) {
          audioService.playInvalidMove();
          setShowFullModal(true);
          return;
      }
      
      facebookService.trackPixelEvent('Purchase', { 
          currency: 'GOLD', 
          value: currentPrice, 
          content_name: item.name, 
          content_id: item.id 
      });

      audioService.playUIConfirm();
      onBuy(item);
  };

  const handleCraftAttempt = (recipe: CraftingRecipe) => {
      const counts: Record<string, number> = {};
      inventory.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
      const hasIngredients = recipe.ingredients.every(ing => (counts[ing.type] || 0) >= ing.count);

      if (gold < recipe.goldCost || !hasIngredients) {
          audioService.playInvalidMove();
          return;
      }
      if (inventory.length >= 3) {
          audioService.playInvalidMove();
          setShowFullModal(true);
          return;
      }

      audioService.playUIConfirm();
      onCraft(recipe);
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
                <button onClick={() => { audioService.playUIBack(); onClose(); }} className="md:hidden p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700">
                    <X size={20} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-2 md:p-4 gap-2 custom-scrollbar">
                <NavButton active={tab === 'ESSENTIALS'} onClick={() => setSidebarIndex(0)} icon={<Package size={18}/>} label="Essentials" isFocused={activeSection === 'SIDEBAR' && sidebarIndex === 0} />
                <NavButton active={tab === 'MAGIC'} onClick={() => setSidebarIndex(1)} icon={<Sparkles size={18}/>} label="Runes & Magic" isFocused={activeSection === 'SIDEBAR' && sidebarIndex === 1} />
                <NavButton active={tab === 'BATTLE'} onClick={() => setSidebarIndex(2)} icon={<Sword size={18}/>} label="Weapons" isFocused={activeSection === 'SIDEBAR' && sidebarIndex === 2} />
                <div className="h-px w-full bg-slate-800 my-2 hidden md:block"></div>
                <NavButton active={tab === 'FORGE'} onClick={() => setSidebarIndex(3)} icon={<Hammer size={18}/>} label="The Forge" color="text-orange-400" isFocused={activeSection === 'SIDEBAR' && sidebarIndex === 3} />
            </nav>

            {/* Wallet (Bottom Sidebar) */}
            <div className="mt-auto p-6 bg-black/40 border-t border-slate-800 hidden md:block">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Your Wallet</div>
                <div className="text-3xl font-black text-yellow-400 flex items-center gap-2">
                    <Coins size={28} /> {gold.toLocaleString()}
                </div>
            </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar z-10 relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    {tab === 'FORGE' ? <Hammer size={24} className="text-orange-500"/> : <Package size={24} className="text-blue-500"/>}
                    {tab === 'FORGE' ? 'Artifact Forge' : 'Available Goods'}
                </h3>
                {/* Mobile Wallet */}
                <div className="md:hidden text-lg font-black text-yellow-400 flex items-center gap-2 bg-slate-900/80 px-3 py-1 rounded-full border border-yellow-500/30">
                    <Coins size={16} /> {gold.toLocaleString()}
                </div>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                {tab === 'FORGE' ? (
                    (currentItems as CraftingRecipe[]).map((recipe, idx) => {
                        const counts: Record<string, number> = {};
                        inventory.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
                        const hasIngredients = recipe.ingredients.every(ing => (counts[ing.type] || 0) >= ing.count);
                        const canAfford = gold >= recipe.goldCost;
                        const canCraft = hasIngredients && canAfford;
                        const isFocused = activeSection === 'GRID' && gridIndex === idx;

                        return (
                            <TiltContainer key={recipe.id} disabled={!canCraft}>
                                <div 
                                    onMouseEnter={() => { setActiveSection('GRID'); setGridIndex(idx); audioService.playUIHover(); }}
                                    className={`relative bg-slate-900 border rounded-xl p-4 flex flex-col h-full transition-all group
                                        ${canCraft ? 'border-orange-500/50' : 'border-slate-800'}
                                        ${isFocused ? 'ring-2 ring-yellow-400 scale-[1.02] shadow-xl z-10' : ''}
                                `}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-4xl">{recipe.icon}</div>
                                        <div className="text-xs font-bold bg-black/40 px-2 py-1 rounded text-orange-400 border border-orange-500/30">
                                            {recipe.goldCost} G
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <h4 className="font-bold text-white text-lg">{recipe.name}</h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-snug">{recipe.description}</p>
                                    </div>
                                    
                                    <div className="mt-auto space-y-3">
                                        <div className="space-y-1">
                                            {recipe.ingredients.map((ing, i) => {
                                                const have = counts[ing.type] || 0;
                                                const itemDef = getItemDefinition(ing.type);
                                                return (
                                                    <div key={i} className="flex justify-between text-xs">
                                                        <span className="text-slate-400">{itemDef?.name}</span>
                                                        <span className={have >= ing.count ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                                                            {have}/{ing.count}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => handleCraftAttempt(recipe)}
                                            disabled={!canCraft}
                                            className={`w-full py-2 rounded-lg font-bold text-sm transition-all
                                                ${canCraft ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                                            `}
                                        >
                                            CRAFT
                                        </button>
                                    </div>
                                </div>
                            </TiltContainer>
                        );
                    })
                ) : (
                    (currentItems as typeof SHOP_ITEMS).map((item, idx) => {
                        const { stock, priceMultiplier } = getStockInfo(item.id);
                        const price = Math.ceil(item.price * priceMultiplier);
                        const canAfford = gold >= price;
                        const hasStock = stock > 0;
                        const isFocused = activeSection === 'GRID' && gridIndex === idx;

                        return (
                            <TiltContainer key={item.id} disabled={!hasStock || !canAfford}>
                                <div 
                                    onMouseEnter={() => { setActiveSection('GRID'); setGridIndex(idx); audioService.playUIHover(); }}
                                    className={`relative bg-slate-900 border rounded-xl p-4 flex flex-col h-full transition-all group
                                        ${hasStock ? (canAfford ? 'border-slate-700 hover:border-slate-500' : 'border-red-900/50') : 'border-slate-800 opacity-50'}
                                        ${isFocused ? 'ring-2 ring-yellow-400 scale-[1.02] shadow-xl z-10' : ''}
                                `}>
                                    
                                    {stock <= 0 && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                                            <span className="text-red-500 font-black text-xl -rotate-12 border-4 border-red-500 px-4 py-1 rounded">SOLD OUT</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-start mb-4">
                                        <div className="text-4xl transform group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                                        <div className={`text-xs font-bold px-2 py-1 rounded border ${canAfford ? 'bg-black/40 text-yellow-400 border-yellow-500/30' : 'bg-red-900/20 text-red-400 border-red-500/30'}`}>
                                            {price} G
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <h4 className="font-bold text-white text-lg">{item.name}</h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-snug">{item.desc}</p>
                                    </div>
                                    
                                    <div className="mt-auto flex items-center justify-between gap-4">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                            Stock: {stock}
                                        </div>
                                        <button
                                            onClick={() => handleBuyAttempt(item, price, stock)}
                                            disabled={!canAfford || !hasStock}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex-1
                                                ${canAfford && hasStock ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                                            `}
                                        >
                                            BUY
                                        </button>
                                    </div>
                                </div>
                            </TiltContainer>
                        );
                    })
                )}
            </div>
        </div>

        {/* Desktop Close Button (Floating) - Z-Index Boosted */}
        <button 
            onClick={() => { audioService.playUIBack(); onClose(); }}
            className="absolute top-6 right-6 hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-black/40 px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 z-[100] cursor-pointer"
        >
            <ArrowLeft size={16} /> <span className="text-xs font-bold uppercase">Return to Game</span>
        </button>

        {/* Full Inventory Modal */}
        <AnimatePresence>
            {showFullModal && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-6"
                >
                    <div className="bg-slate-900 border border-red-500/50 rounded-2xl p-6 max-w-sm text-center shadow-2xl">
                        <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Inventory Full!</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            You can only carry 3 items. Use or discard an item to make space.
                        </p>
                        <button 
                            onClick={() => setShowFullModal(false)}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold"
                        >
                            UNDERSTOOD
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
  );
};
