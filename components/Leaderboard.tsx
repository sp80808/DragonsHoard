
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { getHighscores } from '../services/gameLogic';
import { Trophy, ArrowLeft, Star, Coins } from 'lucide-react';

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setScores(getHighscores());
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center bg-slate-950 text-slate-200 p-4 overflow-hidden">
      <div className="w-full max-w-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold text-yellow-500 fantasy-font flex items-center gap-2">
            <Trophy className="text-yellow-600" /> Hall of Heroes
          </h2>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-xl module-workflow shadow-2xl p-4">
          {scores.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <Trophy size={48} className="mb-4 opacity-20" />
              <p>No legends recorded yet.</p>
              <p className="text-sm mt-2">Play to earn your place!</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-3 pl-2">Rank</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Details</th>
                  <th className="pb-3 text-right pr-2">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {scores.map((entry, idx) => (
                  <tr key={idx} className="group hover:bg-white/5 transition-colors border-b border-slate-800/50">
                    <td className="py-4 pl-2 font-mono text-slate-400 font-bold w-16">
                      {idx === 0 && <span className="text-yellow-400">1st</span>}
                      {idx === 1 && <span className="text-slate-300">2nd</span>}
                      {idx === 2 && <span className="text-orange-400">3rd</span>}
                      {idx > 2 && `#${idx + 1}`}
                    </td>
                    <td className="py-4 font-bold text-xl text-white">
                      {entry.score.toLocaleString()}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Star size={10} className="text-cyan-400"/> Lvl {entry.level}</span>
                        <span className="flex items-center gap-1"><Coins size={10} className="text-yellow-400"/> {entry.gold} G</span>
                      </div>
                    </td>
                    <td className="py-4 text-right pr-2 text-slate-500 text-xs">
                       {new Date(entry.date).toLocaleDateString()}
                    </td>
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
