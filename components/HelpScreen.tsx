
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Zap, Skull, Swords, Scroll, Coins, Trophy, Sparkles, Package, Sparkles as MagicIcon, Sword, Book, Eye, Feather, Ghost, Loader2 } from 'lucide-react';
import { SHOP_ITEMS, TILE_STYLES, STORY_ENTRIES, FALLBACK_BESTIARY_LORE } from '../constants';
import { TileType } from '../types';
import { getPlayerProfile } from '../services/storageService';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";

interface HelpScreenProps {
  onBack: () => void;
}

type TabType = 'GUIDE' | 'BESTIARY' | 'ITEMS' | 'LORE';

export const HelpScreen: React.FC<HelpScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabType>('GUIDE');
  const [unlockedLore, setUnlockedLore] = useState<string[]>([]);
  // Initialize with fallback lore to ensure it's never empty
  const [aiLore, setAiLore] = useState<Record<string, string>>(FALLBACK_BESTIARY_LORE);
  const [loadingLore, setLoadingLore] = useState(false);

  // Generate Monster List from Tile Styles (Powers of 2)
  const monsters = useMemo(() => Object.keys(TILE_STYLES).map(key => {
      const val = parseInt(key);
      const style = TILE_STYLES[val];
      return {
          value: val,
          ...style
      };
  }).sort((a,b) => a.value - b.value), []);

  useEffect(() => {
      const p = getPlayerProfile();
      setUnlockedLore(p.unlockedLore);

      // 1. Try to load cached lore
      try {
          const cached = localStorage.getItem('dragons_hoard_bestiary_lore');
          if (cached) {
              const parsed = JSON.parse(cached);
              // Merge fallback with cache to ensure no keys are missing
              setAiLore(prev => ({ ...prev, ...parsed }));
          } else {
              // 2. If no cache, trigger background generation immediately
              generateBestiaryLore();
          }
      } catch (e) {
          console.error("Failed to load cached lore", e);
      }
  }, []);

  const generateBestiaryLore = async () => {
      setLoadingLore(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const monsterNames = monsters.map(m => m.label).join(', ');
          
          const prompt = `
              You are the keeper of a dark fantasy dungeon bestiary. 
              Write short, evocative, gritty flavor text (max 15 words each) for the following monsters: ${monsterNames}.
              Focus on their appearance, smell, or danger.
              Return ONLY a JSON object where keys are the exact monster names provided (e.g. "SLIME", "RAT") and values are the descriptions.
              Do not use Markdown formatting.
          `;
          
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });
          
          if (response.text) {
              const data = JSON.parse(response.text);
              setAiLore(prev => {
                  const combined = { ...prev, ...data };
                  localStorage.setItem('dragons_hoard_bestiary_lore', JSON.stringify(combined));
                  return combined;
              });
          }
      } catch (e) {
          console.error("Failed to fetch lore, keeping fallback.", e);
          // Keep using fallback lore which is already in state
      } finally {
          setLoadingLore(false);
      }
  };

  const battleItems = SHOP_ITEMS.filter(i => i.category === 'BATTLE');
  const magicItems = SHOP_ITEMS.filter(i => i.category === 'MAGIC');
  const consumables = SHOP_ITEMS.filter(i => i.category === 'CONSUMABLE');

  const TabButton = ({ id, label, icon }: { id: TabType, label: string, icon: React.ReactNode }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2
            ${activeTab === id ? 'border-yellow-500 text-yellow-400 bg-slate-800/50' : 'border-transparent text-slate-500 hover:text-slate-300'}
        `}
      >
          {icon} <span className="hidden sm:inline">{label}</span>
      </button>
  );

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center bg-slate-950 text-slate-200 p-4 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="w-full max-w-3xl flex flex-col h-full bg-slate-900/80 rounded-xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/95">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500 fantasy-font flex items-center gap-2">
            <Book size={24} className="text-amber-500"/> Codex
          </h2>
          <div className="w-10"></div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900">
            <TabButton id="GUIDE" label="Gameplay Guide" icon={<Scroll size={16}/>} />
            <TabButton id="BESTIARY" label="Bestiary" icon={<Eye size={16}/>} />
            <TabButton id="ITEMS" label="Item Log" icon={<Package size={16}/>} />
            <TabButton id="LORE" label="Journal" icon={<Feather size={16}/>} />
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          
          {/* TAB: GUIDE */}
          {activeTab === 'GUIDE' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <section className="space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Swords size={20} className="text-blue-400" /> Core Mechanics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="bg-slate-800/50 p-4 rounded-xl border border-white/5"
                        >
                            <h4 className="font-bold text-slate-200 mb-2">Move & Merge</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Swipe or use Arrow Keys to move tiles. Merge matching monsters to <strong>EVOLVE</strong> them into stronger forms.
                                <br/><br/>
                                <span className="text-xs font-mono bg-black/30 p-1 rounded">Slime (2) + Slime (2) = Goblin (4)</span>
                            </p>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                            className="bg-slate-800/50 p-4 rounded-xl border border-white/5"
                        >
                            <h4 className="font-bold text-slate-200 mb-2">The Goal</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Build your score, earn Gold, and survive long enough to summon the <strong>Dragon God (2048)</strong>.
                            </p>
                        </motion.div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles size={20} className="text-purple-400" /> RPG Progression
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div 
                             initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                             className="bg-slate-800/50 p-4 rounded-xl border border-white/5"
                        >
                            <div className="text-indigo-400 font-bold mb-1 flex items-center gap-2"><Trophy size={16}/> XP & Levels</div>
                            <p className="text-xs text-slate-400">
                                Merges grant XP. Leveling up unlocks perks and expands the grid.
                            </p>
                        </motion.div>
                        <motion.div 
                             initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
                             className="bg-slate-800/50 p-4 rounded-xl border border-white/5"
                        >
                            <div className="text-yellow-400 font-bold mb-1 flex items-center gap-2"><Coins size={16}/> Gold & Shop</div>
                            <p className="text-xs text-slate-400">
                                Collect gold from high-level merges. Spend it on Runes and Potions.
                            </p>
                        </motion.div>
                        <motion.div 
                             initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
                             className="bg-slate-800/50 p-4 rounded-xl border border-white/5"
                        >
                            <div className="text-cyan-400 font-bold mb-1 flex items-center gap-2"><Zap size={16}/> Cascades</div>
                            <p className="text-xs text-slate-400">
                                (Lvl 10+) Chain reactions trigger combos for bonus multipliers.
                            </p>
                        </motion.div>
                    </div>
                </section>
            </div>
          )}

          {/* TAB: BESTIARY */}
          {activeTab === 'BESTIARY' && (
              <div className="space-y-6">
                  <div className="text-center mb-6">
                      <h3 className="text-2xl font-black text-white fantasy-font">Monster Log</h3>
                      <p className="text-slate-400 text-sm h-6">
                          {loadingLore ? (
                              <span className="flex items-center justify-center gap-2 animate-pulse text-yellow-500">
                                  <Loader2 size={14} className="animate-spin"/> Transcribing ancient knowledge...
                              </span>
                          ) : (
                              "Know your enemy."
                          )}
                      </p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {monsters.map((m, idx) => (
                          <motion.div 
                            key={m.value} 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
                            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group hover:border-slate-600 transition-colors shadow-lg hover:shadow-xl hover:shadow-purple-900/20"
                          >
                              {/* Monster Visual */}
                              <div className={`h-32 bg-gradient-to-br ${m.color} relative overflow-hidden flex items-center justify-center`}>
                                   {m.imageUrl ? (
                                       <img src={m.imageUrl} alt={m.label} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                   ) : (
                                       <Ghost size={48} className="text-white/20" />
                                   )}
                                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                              </div>
                              
                              {/* Info */}
                              <div className="p-3 bg-slate-900 relative">
                                  <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-white text-xs uppercase tracking-widest">{m.label}</span>
                                      <div className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-yellow-500 font-bold border border-slate-700">
                                          LVL {Math.log2(m.value)}
                                      </div>
                                  </div>
                                  <div className="text-[10px] text-slate-400 leading-tight border-t border-slate-800 pt-2 mt-2 h-10 overflow-hidden font-serif italic opacity-80">
                                      <span className="animate-in fade-in duration-500">
                                          {aiLore[m.label] || FALLBACK_BESTIARY_LORE[m.label] || "Unknown entity."}
                                      </span>
                                  </div>
                              </div>
                          </motion.div>
                      ))}
                  </div>
              </div>
          )}

          {/* TAB: ITEMS */}
          {activeTab === 'ITEMS' && (
              <div className="space-y-6">
                 {/* Battle Items */}
                 <div className="space-y-2">
                     <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2 border-b border-red-900/30 pb-2 mb-3">
                        <Sword size={14}/> Battle Gear
                     </h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {battleItems.map((item, idx) => (
                             <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}
                                className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-start gap-3 hover:border-red-900/50 transition-colors"
                             >
                                 <div className="text-2xl mt-0.5">{item.icon}</div>
                                 <div>
                                     <div className="font-bold text-slate-200 text-xs">{item.name}</div>
                                     <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                                 </div>
                             </motion.div>
                         ))}
                     </div>
                 </div>

                 {/* Magic Items */}
                 <div className="space-y-2">
                     <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 border-b border-purple-900/30 pb-2 mb-3">
                        <MagicIcon size={14}/> Arcane Magic
                     </h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {magicItems.map((item, idx) => (
                             <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}
                                className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-start gap-3 hover:border-purple-900/50 transition-colors"
                             >
                                 <div className="text-2xl mt-0.5">{item.icon}</div>
                                 <div>
                                     <div className="font-bold text-slate-200 text-xs">{item.name}</div>
                                     <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                                 </div>
                             </motion.div>
                         ))}
                     </div>
                 </div>

                 {/* Consumables */}
                 <div className="space-y-2">
                     <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-blue-900/30 pb-2 mb-3">
                        <Package size={14}/> Consumables
                     </h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                         {consumables.map((item, idx) => (
                             <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}
                                className="bg-slate-900/60 p-2 rounded-lg border border-slate-800 flex items-start gap-3 hover:border-blue-900/50 transition-colors"
                             >
                                 <div className="text-2xl mt-0.5">{item.icon}</div>
                                 <div>
                                     <div className="font-bold text-slate-200 text-xs">{item.name}</div>
                                     <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{item.desc}</div>
                                 </div>
                             </motion.div>
                         ))}
                     </div>
                 </div>
              </div>
          )}

          {/* TAB: LORE */}
          {activeTab === 'LORE' && (
              <div className="space-y-6">
                  <div className="text-center mb-6">
                      <h3 className="text-2xl font-black text-white fantasy-font">Adventurer's Journal</h3>
                      <p className="text-slate-400 text-sm">Secrets of the hoard.</p>
                  </div>
                  
                  <div className="space-y-4">
                      {STORY_ENTRIES.sort((a,b) => a.order - b.order).map((entry, idx) => {
                          const isUnlocked = unlockedLore.includes(entry.id);
                          return (
                              <motion.div 
                                key={entry.id} 
                                initial={{ opacity: 0, rotateX: -15 }}
                                whileInView={{ opacity: 1, rotateX: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                className={`rounded-xl border overflow-hidden ${isUnlocked ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-950/40 border-slate-800 border-dashed opacity-60'}`}
                              >
                                  {isUnlocked && entry.imageUrl && (
                                      <div className="h-32 w-full relative overflow-hidden bg-black/50">
                                          <img src={entry.imageUrl} alt={entry.title} className="w-full h-full object-cover opacity-60 hover:scale-105 transition-transform duration-700" />
                                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                      </div>
                                  )}
                                  <div className="p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className={`font-bold font-serif text-lg ${isUnlocked ? 'text-amber-200' : 'text-slate-600'}`}>
                                            {isUnlocked ? entry.title : "???"}
                                        </h4>
                                        {isUnlocked ? (
                                            <Feather size={14} className="text-amber-500 opacity-50"/>
                                        ) : (
                                            <div className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">LOCKED</div>
                                        )}
                                    </div>
                                    <div className={`text-sm leading-relaxed font-serif ${isUnlocked ? 'text-slate-300' : 'text-slate-700 blur-sm select-none'}`}>
                                        {isUnlocked ? entry.text : "The text is faded and unreadable. You must delve deeper to decipher it."}
                                    </div>
                                  </div>
                              </motion.div>
                          );
                      })}
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};
