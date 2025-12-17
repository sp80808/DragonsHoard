
import React from 'react';
import { X, Trophy, Star, Shield, Lock, Unlock, Map, Coins, Zap, Swords, LayoutGrid, Ghost, Skull, Flame, Droplets, Settings, Sword, Heart } from 'lucide-react';
import { GameState } from '../types';
import { getLevelRank } from '../constants';

interface GameStatsModalProps {
  gameState: GameState;
  onClose: () => void;
  nextLevelXp: number;
}

export const GameStatsModal: React.FC<GameStatsModalProps> = ({ gameState, onClose, nextLevelXp }) => {
    const { level, xp, score, runStats, gold, stats, accountLevel } = gameState;
    const rank = getLevelRank(level);
    
    // Updated Unlocks Logic based on Account Level
    const UNLOCKS = [
        { level: 3, label: "Warrior Class", desc: "Start with a Bomb Scroll.", icon: <Swords size={16}/> },
        { level: 5, label: "Hard Mode & Rogue", desc: "Unlock tougher difficulty and the Rogue class.", icon: <Skull size={16}/> },
        { level: 8, label: "Undead Tileset", desc: "Unlock a spooky alternate look for enemies.", icon: <Ghost size={16}/> },
        { level: 10, label: "Mage Class", desc: "Unlock the Mage class.", icon: <Zap size={16}/> },
        { level: 12, label: "Boss Rush Mode", desc: "Battle bosses back-to-back in the arena.", icon: <LayoutGrid size={16}/> },
        { level: 15, label: "Infernal Tileset", desc: "Unlock the fiery demon theme.", icon: <Flame size={16}/> },
        { level: 15, label: "Reroll Feature", desc: "Ability to reroll the board when stuck.", icon: <LayoutGrid size={16}/> },
        { level: 20, label: "Paladin Class", desc: "Unlock the Paladin class.", icon: <Shield size={16}/> },
        { level: 25, label: "Aquatic Tileset", desc: "Unlock the monsters of the deep.", icon: <Droplets size={16}/> },
        { level: 30, label: "Void Realm", desc: "Enter the eldritch void dimension.", icon: <Map size={16}/> },
        { level: 35, label: "Cyberpunk Tileset", desc: "Unlock the neon city theme.", icon: <Zap size={16}/> },
        { level: 40, label: "Celestial Citadel", desc: "Ascend to the heavens.", icon: <Star size={16}/> },
        { level: 45, label: "Clockwork Tileset", desc: "Unlock the Steampunk theme.", icon: <Settings size={16}/> },
        { level: 50, label: "Celestial Tileset", desc: "Unlock the divine angel theme.", icon: <Star size={16}/> },
        { level: 55, label: "Ronin Tileset", desc: "Unlock the feudal Japan theme.", icon: <Sword size={16}/> },
        { level: 60, label: "Sugar Rush Tileset", desc: "Unlock the candy monster theme.", icon: <Heart size={16}/> },
    ];

    // Find the next unlock based on Account Level, not Run Level
    const nextUnlock = UNLOCKS.find(u => u.level > accountLevel);
    const xpPercent = Math.min(100, (xp / nextLevelXp) * 100);

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4">
             {/* Backdrop */}
             <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>

             {/* Modal */}
             <div className="relative w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95">
                 {/* Header */}
                 <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${rank.bg} flex items-center justify-center border border-slate-600`}>
                             <rank.icon size={20} className="text-white drop-shadow-md" />
                         </div>
                         <div>
                             <h2 className="text-lg font-bold text-white leading-none">{rank.title}</h2>
                             <div className="text-xs text-slate-400 font-mono">Level {level} Hero</div>
                         </div>
                     </div>
                     <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                         <X size={20} />
                     </button>
                 </div>

                 {/* Content */}
                 <div className="p-6 space-y-6">
                     
                     {/* Progression Section */}
                     <div>
                         <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                             <span>Experience Progress</span>
                             <span className="text-blue-400">{Math.floor(xp).toLocaleString()} / {nextLevelXp.toLocaleString()}</span>
                         </div>
                         <div className="h-4 bg-black rounded-full border border-slate-700 overflow-hidden relative">
                             <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 relative" style={{ width: `${xpPercent}%` }}>
                                 <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                             </div>
                         </div>
                     </div>

                     {/* Stats Grid */}
                     <div className="grid grid-cols-2 gap-3">
                         <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                             <div className="text-[10px] uppercase text-slate-500 font-bold">Current Score</div>
                             <div className="text-xl font-mono font-bold text-white flex items-center gap-2">
                                 <Trophy size={16} className="text-yellow-500" /> {score.toLocaleString()}
                             </div>
                         </div>
                         <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                             <div className="text-[10px] uppercase text-slate-500 font-bold">Gold Earned</div>
                             <div className="text-xl font-mono font-bold text-white flex items-center gap-2">
                                 <Coins size={16} className="text-amber-500" /> {runStats.goldEarned.toLocaleString()}
                             </div>
                         </div>
                         <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                             <div className="text-[10px] uppercase text-slate-500 font-bold">Total Turns</div>
                             <div className="text-xl font-mono font-bold text-white">
                                 {runStats.turnCount.toLocaleString()}
                             </div>
                         </div>
                         <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 flex flex-col gap-1">
                             <div className="text-[10px] uppercase text-slate-500 font-bold">Best Combo</div>
                             <div className="text-xl font-mono font-bold text-white">
                                 x{stats.highestCombo}
                             </div>
                         </div>
                     </div>

                     {/* Unlock Preview */}
                     <div className="pt-4 border-t border-slate-800">
                         <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Next Account Reward</h3>
                         {nextUnlock ? (
                             <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/30 p-4 rounded-xl flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center border border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                     <Lock size={18} />
                                 </div>
                                 <div>
                                     <div className="text-sm font-bold text-indigo-200">Account Level {nextUnlock.level}: {nextUnlock.label}</div>
                                     <div className="text-xs text-indigo-400/80 mt-1 leading-snug">{nextUnlock.desc}</div>
                                 </div>
                             </div>
                         ) : (
                             <div className="bg-gradient-to-r from-yellow-900/20 to-slate-900 border border-yellow-500/30 p-4 rounded-xl flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-yellow-900/50 flex items-center justify-center border border-yellow-500 text-yellow-300">
                                     <Star size={18} />
                                 </div>
                                 <div>
                                     <div className="text-sm font-bold text-yellow-200">Max Level Reached</div>
                                     <div className="text-xs text-yellow-400/80 mt-1">You are a legend of the dungeon.</div>
                                 </div>
                             </div>
                         )}
                         <div className="text-[10px] text-slate-500 text-center mt-2">Current Account Level: {accountLevel}</div>
                     </div>

                 </div>
             </div>
        </div>
    );
};
