
import React from 'react';
import { ArrowLeft, Zap, Skull, Swords, Scroll, Coins, Trophy, Sparkles, Package, Sparkles as MagicIcon, Sword } from 'lucide-react';
import { SHOP_ITEMS } from '../constants';

interface HelpScreenProps {
  onBack: () => void;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
  const battleItems = SHOP_ITEMS.filter(i => i.category === 'BATTLE');
  const magicItems = SHOP_ITEMS.filter(i => i.category === 'MAGIC');
  const consumables = SHOP_ITEMS.filter(i => i.category === 'CONSUMABLE');

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center bg-slate-950 text-slate-200 p-4 overflow-hidden">
      <div className="w-full max-w-3xl flex flex-col h-full bg-slate-900/50 rounded-xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/80">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500 fantasy-font">
            Dungeon Guide
          </h2>
          <div className="w-10"></div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
          
          {/* Section 1: The Basics */}
          <section className="space-y-4">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Swords size={20} className="text-blue-400" /> Core Mechanics
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                     <h4 className="font-bold text-slate-200 mb-2">Move & Merge</h4>
                     <p className="text-sm text-slate-400 leading-relaxed">
                         Swipe or use Arrow Keys to move tiles. Merge matching monsters to <strong>EVOLVE</strong> them into stronger forms.
                         <br/><br/>
                         <span className="text-xs font-mono bg-black/30 p-1 rounded">Slime (2) + Slime (2) = Goblin (4)</span>
                     </p>
                 </div>
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                     <h4 className="font-bold text-slate-200 mb-2">The Goal</h4>
                     <p className="text-sm text-slate-400 leading-relaxed">
                         Build your score, earn Gold, and survive long enough to summon the <strong>Dragon God (2048)</strong>.
                         The dungeon grid expands as you level up, giving you more space to maneuver.
                     </p>
                 </div>
             </div>
          </section>

          {/* Section 2: RPG Systems */}
          <section className="space-y-4">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Sparkles size={20} className="text-purple-400" /> RPG Progression
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                     <div className="text-indigo-400 font-bold mb-1 flex items-center gap-2"><Trophy size={16}/> XP & Levels</div>
                     <p className="text-xs text-slate-400">
                         Merges grant XP. Leveling up heals you, unlocks perks (like Rerolls), and expands the grid size (up to 8x8).
                     </p>
                 </div>
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                     <div className="text-yellow-400 font-bold mb-1 flex items-center gap-2"><Coins size={16}/> Gold & Shop</div>
                     <p className="text-xs text-slate-400">
                         Collect gold from high-level merges and bosses. Spend it in the Shop on Potions, Bombs, and Runes.
                     </p>
                 </div>
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                     <div className="text-cyan-400 font-bold mb-1 flex items-center gap-2"><Zap size={16}/> Cascades</div>
                     <p className="text-xs text-slate-400">
                         (Account Lvl 10+) Setting up chain reactions triggers automatic combos that grant bonus XP/Gold multipliers.
                     </p>
                 </div>
             </div>
          </section>

          {/* Section 3: Bosses */}
          <section className="space-y-4">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Skull size={20} className="text-red-500" /> Boss Battles
             </h3>
             <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl flex gap-4 items-start">
                 <div className="bg-red-900/20 p-3 rounded-lg">
                     <Skull size={32} className="text-red-500" />
                 </div>
                 <div>
                     <h4 className="font-bold text-red-200">Dangerous Foes</h4>
                     <p className="text-sm text-red-100/70 mt-1">
                         Bosses appear every 5 levels. They block movement and cannot be merged directly.
                     </p>
                     <p className="text-sm text-red-100/70 mt-2 font-bold">
                         How to Kill: Merge other tiles ADJACENT to the boss to deal damage.
                     </p>
                 </div>
             </div>
          </section>

          {/* Section 4: Item Encyclopedia */}
          <section className="space-y-6">
             <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                 <Scroll size={20} className="text-emerald-400" /> Shop Encyclopedia
             </h3>
             
             {/* Battle Items */}
             <div className="space-y-2">
                 <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <Sword size={14}/> Battle Gear
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     {battleItems.map(item => (
                         <div key={item.id} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-start gap-3 hover:border-red-900/50 transition-colors">
                             <div className="text-2xl mt-0.5">{item.icon}</div>
                             <div>
                                 <div className="font-bold text-slate-200 text-xs">{item.name}</div>
                                 <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Magic Items */}
             <div className="space-y-2">
                 <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                    <MagicIcon size={14}/> Arcane Magic
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     {magicItems.map(item => (
                         <div key={item.id} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-start gap-3 hover:border-purple-900/50 transition-colors">
                             <div className="text-2xl mt-0.5">{item.icon}</div>
                             <div>
                                 <div className="font-bold text-slate-200 text-xs">{item.name}</div>
                                 <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Consumables */}
             <div className="space-y-2">
                 <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Package size={14}/> Consumables
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     {consumables.map(item => (
                         <div key={item.id} className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-start gap-3 hover:border-blue-900/50 transition-colors">
                             <div className="text-2xl mt-0.5">{item.icon}</div>
                             <div>
                                 <div className="font-bold text-slate-200 text-xs">{item.name}</div>
                                 <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};
