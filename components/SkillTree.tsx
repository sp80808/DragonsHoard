
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Lock, Check } from 'lucide-react';
import { SKILL_TREE } from '../constants';
import { getPlayerProfile } from '../services/storageService';
import { SkillNodeDefinition, PlayerProfile } from '../types';
import { motion } from 'framer-motion';
import { facebookService } from '../services/facebookService';

interface SkillTreeProps {
  onBack: () => void;
}

export const SkillTree: React.FC<SkillTreeProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    setProfile(getPlayerProfile());
  }, []);

  const handleUnlock = (nodeId: string) => {
      if (!profile) return;
      const node = SKILL_TREE.find(n => n.id === nodeId);
      if (!node) return;

      if (profile.skillPoints >= node.cost) {
          const newProfile = { 
              ...profile, 
              skillPoints: profile.skillPoints - node.cost,
              unlockedSkills: [...(profile.unlockedSkills || []), nodeId]
          };
          
          setProfile(newProfile);
          // Persist
          localStorage.setItem('dragons_hoard_profile', JSON.stringify(newProfile));
          facebookService.saveData('dragons_hoard_profile', newProfile);
      }
  };

  const getStatus = (node: SkillNodeDefinition) => {
      if (!profile) return 'LOCKED';
      const unlocked = profile.unlockedSkills?.includes(node.id) || node.id === 'ROOT';
      if (unlocked) return 'UNLOCKED';
      
      const parentUnlocked = !node.parentId || profile.unlockedSkills?.includes(node.parentId) || node.parentId === 'ROOT';
      if (parentUnlocked) return 'AVAILABLE';
      
      return 'LOCKED';
  };

  if (!profile) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center bg-slate-950 text-slate-200 p-4 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="w-full max-w-4xl flex flex-col h-full bg-slate-900/90 rounded-xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900 z-10">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500 fantasy-font">
                Astral Mastery
              </h2>
              <div className="text-xs text-slate-400 font-mono">Available Points: <span className="text-yellow-400 font-bold">{profile.skillPoints}</span></div>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Tree Container */}
        <div className="flex-1 relative overflow-hidden bg-black/40">
            {/* SVG Layer for Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#854d0e" />
                        <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                </defs>
                {SKILL_TREE.map(node => {
                    if (!node.parentId) return null;
                    const parent = SKILL_TREE.find(p => p.id === node.parentId);
                    if (!parent) return null;

                    const isParentUnlocked = profile.unlockedSkills?.includes(parent.id) || parent.id === 'ROOT';
                    const isNodeUnlocked = !!profile.unlockedSkills?.includes(node.id);
                    
                    // Connection State
                    const isActive = !!isParentUnlocked;
                    const isFullyActive = isNodeUnlocked;

                    return (
                        <ConnectionLine 
                            key={`${parent.id}-${node.id}`}
                            x1={parent.x} y1={parent.y}
                            x2={node.x} y2={node.y}
                            active={isActive}
                            fullyActive={isFullyActive}
                        />
                    );
                })}
            </svg>

            {/* Nodes Layer */}
            <div className="absolute inset-0 z-10">
                {SKILL_TREE.map(node => {
                    const status = getStatus(node);
                    return (
                        <div 
                            key={node.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        >
                            <SkillNode 
                                node={node} 
                                status={status} 
                                onClick={() => setSelectedNodeId(node.id)}
                                isSelected={selectedNodeId === node.id}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Detail Overlay */}
            {selectedNodeId && (
                <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-700 p-4 rounded-xl shadow-2xl z-20 animate-in slide-in-from-bottom-10 fade-in flex justify-between items-center">
                    {(() => {
                        const node = SKILL_TREE.find(n => n.id === selectedNodeId);
                        if (!node) return null;
                        const status = getStatus(node);
                        const canBuy = status === 'AVAILABLE' && profile.skillPoints >= node.cost;

                        return (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg border-2 ${status === 'UNLOCKED' ? 'bg-yellow-900/20 border-yellow-500 text-yellow-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                                        {node.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{node.title}</h3>
                                        <p className="text-sm text-slate-400">{node.description}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {status === 'UNLOCKED' ? (
                                        <div className="px-4 py-2 bg-green-900/30 text-green-400 border border-green-600 rounded-lg font-bold text-sm flex items-center gap-2">
                                            <Check size={16} /> MASTERED
                                        </div>
                                    ) : status === 'LOCKED' ? (
                                        <div className="px-4 py-2 bg-slate-800 text-slate-500 border border-slate-700 rounded-lg font-bold text-sm flex items-center gap-2">
                                            <Lock size={16} /> LOCKED
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleUnlock(node.id)}
                                            disabled={!canBuy}
                                            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg
                                                ${canBuy 
                                                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white border border-yellow-400 animate-pulse' 
                                                    : 'bg-slate-800 text-red-400 border border-red-900 cursor-not-allowed opacity-70'}
                                            `}
                                        >
                                            UNLOCK ({node.cost} SP)
                                        </button>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for animated lines
const ConnectionLine: React.FC<{ x1: number, y1: number, x2: number, y2: number, active: boolean, fullyActive: boolean }> = ({ x1, y1, x2, y2, active, fullyActive }) => {
    return (
        <>
            {/* Background Line (Inactive) */}
            <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="#1e293b" strokeWidth="4" />
            
            {/* Animated Foreground Line */}
            <motion.line 
                x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} 
                stroke={fullyActive ? "#facc15" : "#4b5563"} 
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: active ? 1 : 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {/* Glowing Pulse if fully active */}
            {fullyActive && (
                <motion.line 
                    x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} 
                    stroke="#fef08a" 
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    animate={{ strokeDashoffset: [0, -20] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="opacity-50"
                />
            )}
        </>
    );
};

const SkillNode = ({ node, status, onClick, isSelected }: { node: SkillNodeDefinition, status: string, onClick: () => void, isSelected: boolean }) => {
    const isUnlocked = status === 'UNLOCKED';
    const isAvailable = status === 'AVAILABLE';

    return (
        <motion.button 
            onClick={onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 flex items-center justify-center relative transition-all duration-300 z-10
                ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}
                ${isUnlocked 
                    ? 'bg-yellow-900/80 border-yellow-400 text-yellow-100 shadow-[0_0_15px_rgba(250,204,21,0.5)]' 
                    : isAvailable 
                        ? 'bg-slate-800 border-slate-500 text-slate-300 hover:border-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-700 cursor-not-allowed'}
            `}
        >
            {isUnlocked && <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-pulse"></div>}
            <div className="relative z-10">{node.icon}</div>
            
            {/* Cost Badge */}
            {!isUnlocked && isAvailable && (
                <div className="absolute -bottom-2 bg-black border border-slate-600 px-1.5 rounded-full text-[9px] font-bold text-white">
                    {node.cost}
                </div>
            )}
        </motion.button>
    );
};
