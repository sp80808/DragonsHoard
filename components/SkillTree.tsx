
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Lock, Check, Zap, Swords, Shield, Coins, Crown } from 'lucide-react';
import { CLASS_SKILL_TREES } from '../constants';
import { getPlayerProfile } from '../services/storageService';
import { SkillNodeDefinition, PlayerProfile, HeroClass } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { facebookService } from '../services/facebookService';
import { audioService } from '../services/audioService';

interface SkillTreeProps {
  onBack: () => void;
}

export const SkillTree: React.FC<SkillTreeProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [selectedClass, setSelectedClass] = useState<HeroClass>(HeroClass.ADVENTURER);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    setProfile(getPlayerProfile());
  }, []);

  const handleUnlock = (nodeId: string) => {
      if (!profile) return;
      
      const node = CLASS_SKILL_TREES[selectedClass].find(n => n.id === nodeId);
      if (!node) return;

      const classData = profile.classProgress[selectedClass];
      
      if (classData.skillPoints >= node.cost && classData.level >= node.reqLevel) {
          const updatedClassData = {
              ...classData,
              skillPoints: classData.skillPoints - node.cost,
              unlockedNodes: [...(classData.unlockedNodes || []), nodeId]
          };

          const newProfile = { 
              ...profile,
              classProgress: {
                  ...profile.classProgress,
                  [selectedClass]: updatedClassData
              }
          };
          
          setProfile(newProfile);
          // Persist
          localStorage.setItem('dragons_hoard_profile', JSON.stringify(newProfile));
          facebookService.saveData('dragons_hoard_profile', newProfile);
          
          // Audio Feedback
          audioService.playLevelUp();
          audioService.playZap(2);
      } else {
          // Failure sound
          audioService.playCrunch();
      }
  };

  const getStatus = (node: SkillNodeDefinition) => {
      if (!profile) return 'LOCKED';
      const classData = profile.classProgress[selectedClass];
      
      const unlocked = classData?.unlockedNodes?.includes(node.id);
      if (unlocked) return 'UNLOCKED';
      
      const parentUnlocked = !node.parentId || classData?.unlockedNodes?.includes(node.parentId);
      if (parentUnlocked) return 'AVAILABLE';
      
      return 'LOCKED';
  };

  const getClassIcon = (cls: HeroClass) => {
      switch (cls) {
          case HeroClass.WARRIOR: return <Swords size={16} />;
          case HeroClass.MAGE: return <Zap size={16} />;
          case HeroClass.ROGUE: return <Coins size={16} />;
          case HeroClass.PALADIN: return <Shield size={16} />;
          case HeroClass.DRAGON_SLAYER: return <Crown size={16} />;
          default: return <Star size={16} />;
      }
  };

  if (!profile) return null;

  const currentTree = CLASS_SKILL_TREES[selectedClass];
  const classProgress = profile.classProgress[selectedClass];

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center bg-slate-950 text-slate-200 p-4 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="w-full max-w-5xl flex flex-col md:flex-row h-full bg-slate-900/90 rounded-xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Sidebar Class Selector */}
        <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-bold text-white fantasy-font">Mastery</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {profile.unlockedClasses.map(cls => (
                    <button
                        key={cls}
                        onClick={() => { setSelectedClass(cls); setSelectedNodeId(null); audioService.playMove(); }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left group
                            ${selectedClass === cls ? 'bg-indigo-900/30 border border-indigo-500/50 text-white' : 'hover:bg-slate-900 text-slate-400'}
                        `}
                    >
                        <div className={`p-1.5 rounded-md ${selectedClass === cls ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-white'}`}>
                            {getClassIcon(cls)}
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-bold uppercase tracking-wide">{cls.replace('_', ' ')}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                                Lvl {profile.classProgress[cls]?.level || 1} • {profile.classProgress[cls]?.skillPoints || 0} SP
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* Tree Container */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-black/40">
            
            {/* Header for Active Class */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-indigo-500 fantasy-font uppercase tracking-widest drop-shadow-md">
                    {selectedClass.replace('_', ' ')}
                </h3>
                <div className="text-xs text-indigo-300 font-mono mt-1">
                    Available Skill Points: <span className="text-yellow-400 font-bold text-base">{classProgress?.skillPoints || 0}</span>
                </div>
            </div>

            {/* SVG Layer for Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#854d0e" />
                        <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                </defs>
                {currentTree.map(node => {
                    if (!node.parentId) return null;
                    const parent = currentTree.find(p => p.id === node.parentId);
                    if (!parent) return null;

                    const isParentUnlocked = classProgress?.unlockedNodes?.includes(parent.id);
                    const isNodeUnlocked = !!classProgress?.unlockedNodes?.includes(node.id);
                    
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
                {currentTree.map(node => {
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
                                onClick={() => { setSelectedNodeId(node.id); audioService.playMove(); }}
                                isSelected={selectedNodeId === node.id}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Detail Overlay */}
            <AnimatePresence mode='wait'>
            {selectedNodeId && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-indigo-500/30 p-6 shadow-2xl z-30 flex flex-col md:flex-row justify-between items-center gap-4"
                >
                    {(() => {
                        const node = currentTree.find(n => n.id === selectedNodeId);
                        if (!node) return null;
                        const status = getStatus(node);
                        const points = classProgress?.skillPoints || 0;
                        const level = classProgress?.level || 1;
                        
                        const levelReqMet = level >= node.reqLevel;
                        const canBuy = status === 'AVAILABLE' && points >= node.cost && levelReqMet;

                        return (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className={`p-4 rounded-xl border-2 ${status === 'UNLOCKED' ? 'bg-yellow-900/20 border-yellow-500 text-yellow-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}>
                                        {React.cloneElement(node.icon as React.ReactElement, { size: 32 })}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-xl mb-1">{node.title}</h3>
                                        <p className="text-sm text-slate-400 leading-snug max-w-md">{node.description}</p>
                                        <div className="flex gap-4 mt-2">
                                            <span className={`text-xs font-bold uppercase tracking-wider ${levelReqMet ? 'text-green-400' : 'text-red-400'}`}>
                                                Req. Level {node.reqLevel}
                                            </span>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${points >= node.cost ? 'text-green-400' : 'text-red-400'}`}>
                                                Cost: {node.cost} SP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {status === 'UNLOCKED' ? (
                                        <div className="px-6 py-3 bg-green-900/30 text-green-400 border border-green-600 rounded-xl font-bold text-base flex items-center gap-2">
                                            <Check size={20} /> MASTERED
                                        </div>
                                    ) : status === 'LOCKED' ? (
                                        <div className="px-6 py-3 bg-slate-800 text-slate-500 border border-slate-700 rounded-xl font-bold text-base flex items-center gap-2 opacity-50 cursor-not-allowed">
                                            <Lock size={20} /> LOCKED
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleUnlock(node.id)}
                                            disabled={!canBuy}
                                            className={`px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all shadow-lg
                                                ${canBuy 
                                                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white border border-yellow-400 animate-pulse hover:scale-105 active:scale-95' 
                                                    : 'bg-slate-800 text-red-400 border border-red-900 cursor-not-allowed opacity-70'}
                                            `}
                                        >
                                            UNLOCK
                                        </button>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </motion.div>
            )}
            </AnimatePresence>
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
            className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center relative transition-all duration-300 z-10
                ${isSelected ? 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-slate-900 scale-110' : ''}
                ${isUnlocked 
                    ? 'bg-yellow-900/80 border-yellow-400 text-yellow-100 shadow-[0_0_20px_rgba(250,204,21,0.6)]' 
                    : isAvailable 
                        ? 'bg-slate-800 border-slate-500 text-slate-300 hover:border-white hover:bg-slate-700 hover:text-white' 
                        : 'bg-slate-950 border-slate-800 text-slate-700 cursor-not-allowed opacity-60'}
            `}
        >
            {isUnlocked && <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-pulse"></div>}
            <div className="relative z-10">{React.cloneElement(node.icon as React.ReactElement, { size: 24 })}</div>
            
            {/* Cost Badge */}
            {!isUnlocked && isAvailable && (
                <div className="absolute -bottom-2 bg-black border border-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md whitespace-nowrap">
                    {node.cost} SP
                </div>
            )}
        </motion.button>
    );
};
