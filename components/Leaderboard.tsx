
import React, { useEffect, useState } from 'react';
import { getHighscores } from '../services/gameLogic';
import { facebookService } from '../services/facebookService';
import { Trophy, ArrowLeft, Coins, Crown, Shield, Users, Globe, History, User, Swords, Zap, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroClass } from '../types';

interface LeaderboardProps {
  onBack: () => void;
}

// Helper to map class to icon
const getClassIcon = (heroClass?: string) => {
    switch (heroClass) {
        case HeroClass.WARRIOR: return <Swords size={14} />;
        case HeroClass.MAGE: return <Zap size={14} />;
        case HeroClass.ROGUE: return <Clock size={14} />;
        case HeroClass.PALADIN: return <Shield size={14} />;
        case HeroClass.DRAGON_SLAYER: return <Crown size={14} />;
        default: return <User size={14} />;
    }
};

const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 border border-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.5)] flex items-center justify-center text-white font-black text-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                1
            </div>
        );
    }
    if (rank === 2) {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 border border-slate-200 shadow-lg flex items-center justify-center text-white font-black text-sm">
                2
            </div>
        );
    }
    if (rank === 3) {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 border border-orange-200 shadow-lg flex items-center justify-center text-white font-black text-sm">
                3
            </div>
        );
    }
    return (
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">
            {rank}
        </div>
    );
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'FRIENDS' | 'HISTORY'>('GLOBAL');
  const [scores, setScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadScores();
  }, [activeTab]);

  const loadScores = async () => {
      setIsLoading(true);
      setScores([]); // Clear previous to prevent flashing

      if (activeTab === 'HISTORY') {
          const local = getHighscores();
          const formatted = local.map((entry, i) => ({
              ...entry,
              rank: i + 1,
              name: "You",
              isSelf: true
          }));
          setScores(formatted);
          setIsLoading(false);
          return;
      }

      // Fetch from Facebook
      const entries = await facebookService.getLeaderboardEntries('Global_Hoard_Rank', activeTab === 'GLOBAL' ? 'GLOBAL' : 'FRIENDS');
      
      const formatted = entries.map(entry => {
          let extra = {};
          try { extra = JSON.parse(entry.getExtraData() || '{}'); } catch(e) {}
          const player = entry.getPlayer();
          
          return {
              rank: entry.getRank(),
              name: player.getName(),
              photo: player.getPhoto(),
              score: entry.getScore(),
              level: (extra as any).level || 1,
              gold: (extra as any).gold || 0,
              heroClass: (extra as any).heroClass || 'ADVENTURER',
              date: (extra as any).date || Date.now(), 
              isSelf: player.getID() === facebookService.getPlayerID(),
              isFriend: activeTab === 'FRIENDS'
          };
      });
      
      setScores(formatted);
      setIsLoading(false);
  };

  const TabButton = ({ id, label, icon }: { id: typeof activeTab, label: string, icon: React.ReactNode }) => (
      <button 
          onClick={() => setActiveTab(id)}
          className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden
              ${activeTab === id 
                  ? 'bg-slate-800 text-yellow-400 shadow-lg border border-yellow-500/30' 
                  : 'bg-transparent text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}
          `}
      >
          <span className="relative z-10 flex items-center gap-2">{icon} {label}</span>
          {activeTab === id && (
              <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-yellow-900/20 to-transparent"
              />
          )}
      </button>
  );

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center bg-slate-950 text-slate-200 p-4 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="w-full max-w-2xl flex flex-col h-full relative z-10 bg-[#0b0f19] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none"></div>
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white relative z-10"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-500 to-yellow-600 fantasy-font drop-shadow-sm tracking-wide">
                HALL OF HEROES
              </h2>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold mt-1">Legends of the Dungeon</div>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-black/20 gap-2 border-b border-slate-800">
            <TabButton id="GLOBAL" label="GLOBAL" icon={<Globe size={16} />} />
            <TabButton id="FRIENDS" label="FRIENDS" icon={<Users size={16} />} />
            <TabButton id="HISTORY" label="HISTORY" icon={<History size={16} />} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gradient-to-b from-[#0b0f19] to-[#050505]">
          
          {isLoading ? (
              <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-800 border-t-yellow-500"></div>
              </div>
          ) : scores.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
              <Trophy size={64} className="mb-4 text-slate-800" />
              <p className="text-lg font-bold uppercase tracking-widest">No records found</p>
              {activeTab === 'GLOBAL' && !facebookService.isInstantMode() && (
                  <p className="text-xs mt-2 font-serif text-slate-500 max-w-xs text-center">Global leaderboards are only available on Facebook Instant Games.</p>
              )}
              {activeTab === 'HISTORY' && <p className="text-xs mt-2 font-serif italic">Be the first to claim glory.</p>}
            </div>
          ) : (
            <div className="space-y-3 pb-20">
                {/* List Header */}
                <div className="grid grid-cols-12 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">
                    <div className="col-span-2 text-center">Rank</div>
                    <div className="col-span-6">Hero</div>
                    <div className="col-span-4 text-right">Score</div>
                </div>

                <AnimatePresence mode="popLayout">
                    {scores.map((entry, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`group relative grid grid-cols-12 items-center p-3 rounded-xl border transition-all duration-300
                            ${entry.isSelf 
                                ? 'bg-gradient-to-r from-emerald-900/30 to-slate-900 border-emerald-500/30 hover:border-emerald-400/50' 
                                : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-600'}
                        `}
                      >
                        {/* Rank */}
                        <div className="col-span-2 flex justify-center">
                            <RankBadge rank={entry.rank} />
                        </div>

                        {/* Hero Info */}
                        <div className="col-span-6 flex items-center gap-3 overflow-hidden pl-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border shadow-inner
                                ${entry.isSelf ? 'bg-emerald-900/50 border-emerald-700' : 'bg-slate-800 border-slate-700'}
                            `}>
                                {entry.photo ? (
                                    <img src={entry.photo} className="w-full h-full object-cover" alt="Avatar"/>
                                ) : (
                                    <span className={entry.isSelf ? 'text-emerald-400' : 'text-slate-500'}>
                                        {getClassIcon(entry.heroClass)}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col min-w-0 justify-center">
                                <span className={`font-bold truncate text-sm flex items-center gap-1 ${entry.isSelf ? 'text-emerald-400' : 'text-slate-200'}`}>
                                    {entry.name || 'Unknown Hero'}
                                    {entry.isSelf && <span className="text-[9px] bg-emerald-900/80 px-1.5 rounded text-emerald-200 border border-emerald-500/30">YOU</span>}
                                </span>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                    <span className="flex items-center gap-0.5" title="Level"><Sparkles size={10} /> {entry.level}</span>
                                    <span className="w-px h-2 bg-slate-700"></span>
                                    <span className="flex items-center gap-0.5 uppercase">{entry.heroClass?.replace('_', ' ') || 'Hero'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Score Info */}
                        <div className="col-span-4 text-right flex flex-col justify-center">
                            <div className="font-mono font-black text-white text-base leading-none drop-shadow-md">
                                {entry.score.toLocaleString()}
                            </div>
                            <div className="flex justify-end items-center gap-3 mt-1 text-[10px]">
                                {entry.gold > 0 && (
                                    <span className="text-yellow-500 font-bold flex items-center gap-1 bg-black/30 px-1.5 rounded">
                                        <Coins size={10} /> {entry.gold?.toLocaleString()}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Interactive Highlight */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/5 rounded-xl pointer-events-none transition-colors"></div>
                      </motion.div>
                    ))}
                </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
