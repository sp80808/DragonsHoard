import React from 'react';
import { SessionStats } from '../types';
import { X } from 'lucide-react';

interface StatsModalProps {
  stats: SessionStats;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
  const sessionDuration = stats.endTime 
    ? Math.floor((stats.endTime - stats.startTime) / 1000)
    : Math.floor(Date.now() - stats.startTime) / 1000;
  
  const minutes = Math.floor(sessionDuration / 60);
  const seconds = Math.floor(sessionDuration % 60);

  const getStatColor = (value: number, threshold: number) => {
    if (value >= threshold * 1.5) return 'text-yellow-400';
    if (value >= threshold) return 'text-cyan-400';
    return 'text-slate-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 w-full max-w-md rounded-xl border border-cyan-700/50 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-cyan-400 fantasy-font">Session Stats</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-6 space-y-4">
          
          {/* Row 1: Core Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Merges</div>
              <div className={`text-2xl font-bold ${getStatColor(stats.totalMerges, 50)}`}>
                {stats.totalMerges}
              </div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Highest Combo</div>
              <div className={`text-2xl font-bold ${getStatColor(stats.highestCombo, 5)}`}>
                {stats.highestCombo}x
              </div>
            </div>
          </div>

          {/* Row 2: Resources */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Gold Earned</div>
              <div className={`text-2xl font-bold ${getStatColor(stats.goldEarned, 5000)}`}>
                {(stats.goldEarned / 1000).toFixed(1)}K
              </div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">XP Gained</div>
              <div className={`text-2xl font-bold ${getStatColor(stats.xpGained, 10000)}`}>
                {(stats.xpGained / 1000).toFixed(1)}K
              </div>
            </div>
          </div>

          {/* Row 3: Combat & Items */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bosses Defeated</div>
              <div className={`text-2xl font-bold ${getStatColor(stats.bossesDefeated, 3)}`}>
                {stats.bossesDefeated}
              </div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Items Used</div>
              <div className={`text-2xl font-bold ${getStatColor(stats.itemsUsed, 2)}`}>
                {stats.itemsUsed}
              </div>
            </div>
          </div>

          {/* Row 4: Progression */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Highest Level</div>
              <div className="text-2xl font-bold text-yellow-400">
                {stats.highestLevel}
              </div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Duration</div>
              <div className="text-2xl font-bold text-purple-400">
                {minutes}:{seconds.toString().padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          {/* Performance Rating */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 p-4 rounded-lg border border-slate-700">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Performance</div>
            <div className="flex items-center gap-2">
              {stats.highestLevel >= 20 && <span className="text-lg">🔥</span>}
              {stats.highestCombo >= 8 && <span className="text-lg">⚡</span>}
              {stats.bossesDefeated >= 3 && <span className="text-lg">⚔️</span>}
              {stats.goldEarned >= 50000 && <span className="text-lg">💰</span>}
              {stats.itemsUsed >= 3 && <span className="text-lg">🎁</span>}
              {stats.highestLevel >= 30 && <span className="text-lg">👑</span>}
            </div>
            <div className="text-xs text-slate-400 mt-2">
              {stats.highestLevel >= 30 ? "Legendary Session!" : 
               stats.highestLevel >= 20 ? "Excellent Run!" :
               stats.highestLevel >= 10 ? "Great Session!" :
               "Good Effort!"}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-950/50">
          <button
            onClick={onClose}
            className="w-full py-2 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-300 font-bold rounded-lg transition-colors border border-cyan-700/50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
