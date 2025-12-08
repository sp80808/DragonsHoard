import React from 'react';
import { DailyChallenge } from '../types';
import { CheckCircle2, Circle } from 'lucide-react';

interface DailyChallengesPanelProps {
  challenges: DailyChallenge[];
  onClose: () => void;
}

export const DailyChallengesPanel: React.FC<DailyChallengesPanelProps> = ({ challenges, onClose }) => {
  const completedCount = challenges.filter(c => c.completed).length;
  const totalReward = challenges.reduce((sum, c) => sum + (c.reward.gold || 0) + (c.reward.xp || 0), 0);

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'progression': return '📈';
      case 'combat': return '⚔️';
      case 'economy': return '💰';
      case 'gameplay': return '🎮';
      case 'speed': return '⚡';
      case 'endurance': return '🛡️';
      default: return '🎯';
    }
  };

  const getChallengeColor = (type: string) => {
    switch (type) {
      case 'progression': return 'from-cyan-600 to-blue-600';
      case 'combat': return 'from-red-600 to-orange-600';
      case 'economy': return 'from-yellow-600 to-amber-600';
      case 'gameplay': return 'from-purple-600 to-pink-600';
      case 'speed': return 'from-green-600 to-emerald-600';
      case 'endurance': return 'from-indigo-600 to-purple-600';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 w-full max-w-md rounded-xl border border-yellow-700/50 shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-yellow-500 flex items-center gap-2 fantasy-font">
              📅 Daily Challenges
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors text-2xl">
              ✕
            </button>
          </div>
          <div className="text-xs text-slate-400">
            {completedCount}/{challenges.length} Completed • Resets in 24h
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
              style={{ width: `${(completedCount / challenges.length) * 100}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 mt-1 text-center">
            {completedCount === challenges.length ? '✨ All Challenges Complete!' : `${challenges.length - completedCount} remaining`}
          </div>
        </div>

        {/* Challenges List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className={`p-3 rounded-lg border transition-all ${
                challenge.completed
                  ? 'bg-green-900/20 border-green-600/50'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon & Checkbox */}
                <div className="flex-shrink-0 mt-0.5">
                  {challenge.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                {/* Challenge Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{getChallengeIcon(challenge.type)}</span>
                    <h3 className={`font-bold text-sm ${challenge.completed ? 'text-green-400 line-through' : 'text-slate-200'}`}>
                      {challenge.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">
                    {challenge.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                    <div 
                      className={`h-full bg-gradient-to-r ${getChallengeColor(challenge.type)} transition-all duration-300`}
                      style={{ width: `${Math.min(100, (challenge.current / challenge.target) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {challenge.current} / {challenge.target}
                  </div>
                </div>

                {/* Reward */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-xs font-bold text-yellow-400">
                    {challenge.reward.gold && `${challenge.reward.gold}G`}
                  </div>
                  <div className="text-xs font-bold text-cyan-400">
                    {challenge.reward.xp && `${challenge.reward.xp}XP`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-950/50">
          <div className="text-center text-xs text-slate-500 mb-3">
            Total Rewards: <span className="text-yellow-400 font-bold">{totalReward}</span> combined
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
