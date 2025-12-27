
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { getHighscores } from '../services/gameLogic';
import { facebookService } from '../services/facebookService';
import { Trophy, ArrowLeft, Star, Coins, Clock, Shield, Users, Globe } from 'lucide-react';

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'FRIENDS'>('GLOBAL');
  const [scores, setScores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadScores();
  }, [activeTab]);

  const loadScores = async () => {
      setIsLoading(true);
      if (activeTab === 'GLOBAL') {
          // In a real production app, "GLOBAL" would be a database call.
          // For now, it falls back to the Local Highscores stored in GameLogic
          setScores(getHighscores());
      } else {
          // Fetch Friends from Facebook Context
          const entries = await facebookService.getConnectedLeaderboard('Global_Hoard_Rank');
          const formatted = entries.map(entry => {
              // Parse extra data if it exists
              let extra = {};
              try { extra = JSON.parse(entry.getExtraData() || '{}'); } catch(e) {}
              
              return {
                  rank: entry.getRank(),
                  name: entry.getPlayer().getName(),
                  photo: entry.getPlayer().getPhoto(),
                  score: entry.getScore(),
                  level: (extra as any).level || 1,
                  // Friends leaderboard returns raw FB objects, so we adapt them for display
                  isFriend: true
              };
          });
          setScores(formatted);
      }
      setIsLoading(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center bg-slate-950 text-slate-200 p-4 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="w-full max-w-3xl flex flex-col h-full relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pt-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold text-yellow-500 fantasy-font flex items-center gap-2 drop-shadow-md">
            <Trophy className="text-yellow-600" /> Hall of Heroes
          </h2>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-4">
            <button 
                onClick={() => setActiveTab('GLOBAL')}
                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'GLOBAL' ? 'bg-yellow-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500'}`}
            >
                <Globe size={14} /> GLOBAL LEGENDS
            </button>
            <button 
                onClick={() => setActiveTab('FRIENDS')}
                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all ${activeTab === 'FRIENDS' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500'}`}
            >
                <Users size={14} /> FRIENDS & ALLIES
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-900/80 rounded-xl border border-slate-800 shadow-2xl p-4 backdrop-blur-md relative">
          
          {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-yellow-500"></div>
              </div>
          )}

          {scores.length === 0 && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Trophy size={48} className="mb-4 opacity-20" />
              <p>No legends recorded yet.</p>
              <p className="text-sm mt-2">Play to earn your place!</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900/95 z-10">
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700 shadow-sm">
                  <th className="pb-3 pl-3 pt-2">Rank</th>
                  <th className="pb-3 pt-2">Hero</th>
                  <th className="pb-3 pt-2">Score</th>
                  {activeTab === 'GLOBAL' && <th className="pb-3 pt-2">Stats</th>}
                  {activeTab === 'GLOBAL' && <th className="pb-3 pt-2 text-right pr-3">Date</th>}
                </tr>
              </thead>
              <tbody className="text-sm">
                {scores.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-white/5 transition-colors border-b border-slate-800/50">
                    <td className="py-4 pl-3 font-mono text-slate-400 font-bold w-16">
                      {(entry.rank || idx + 1) === 1 && <span className="text-yellow-400 text-lg">🥇</span>}
                      {(entry.rank || idx + 1) === 2 && <span className="text-slate-300 text-lg">🥈</span>}
                      {(entry.rank || idx + 1) === 3 && <span className="text-orange-400 text-lg">🥉</span>}
                      {(entry.rank || idx + 1) > 3 && `#${entry.rank || idx + 1}`}
                    </td>
                    <td className="py-4">
                        <div className="flex items-center gap-3">
                            {entry.photo && (
                                <img src={entry.photo} className="w-8 h-8 rounded-full border border-slate-600" alt="Avatar"/>
                            )}
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-200">{entry.name || entry.heroClass || 'Adventurer'}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Lvl {entry.level}</span>
                            </div>
                        </div>
                    </td>
                    <td className="py-4 font-bold text-lg text-white font-mono">
                      {entry.score.toLocaleString()}
                    </td>
                    
                    {activeTab === 'GLOBAL' && (
                        <>
                            <td className="py-4">
                            <div className="flex flex-col gap-1 text-xs text-slate-400">
                                <span className="flex items-center gap-1"><Coins size={10} className="text-yellow-400"/> {entry.gold?.toLocaleString() || 0} G</span>
                                {entry.turns && <span className="flex items-center gap-1"><Clock size={10} className="text-blue-400"/> {entry.turns} Turns</span>}
                            </div>
                            </td>
                            <td className="py-4 text-right pr-3 text-slate-500 text-xs font-mono">
                            {entry.date ? new Date(entry.date).toLocaleDateString() : '-'}
                            </td>
                        </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
