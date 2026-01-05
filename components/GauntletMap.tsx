
import React from 'react';
import { GauntletState, GauntletNode } from '../types';
import { Skull, Tent, ShoppingBag, Gift, ArrowUp, Lock, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    state: GauntletState;
    onSelectNode: (nodeId: string) => void;
}

const NodeIcon = ({ type, status }: { type: GauntletNode['type'], status: string }) => {
    let icon = <Skull size={20} />;
    let color = 'text-slate-500';
    let bg = 'bg-slate-900';

    if (type === 'ELITE') icon = <Skull size={24} className="text-red-500" />;
    if (type === 'REST') icon = <Tent size={20} className="text-blue-400" />;
    if (type === 'SHOP') icon = <ShoppingBag size={20} className="text-yellow-400" />;
    if (type === 'TREASURE') icon = <Gift size={20} className="text-purple-400" />;
    if (type === 'BOSS') icon = <Skull size={32} className="text-red-600" />;
    if (type === 'START') icon = <ArrowUp size={24} className="text-green-400" />;

    if (status === 'COMPLETED') {
        color = 'text-slate-600';
        bg = 'bg-slate-800 border-slate-700';
        icon = <Check size={20} />;
    } else if (status === 'AVAILABLE') {
        color = 'text-white';
        bg = 'bg-slate-800 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse';
    } else if (status === 'LOCKED') {
        color = 'text-slate-700';
        bg = 'bg-black border-slate-800';
        icon = <Lock size={16} />;
    } else if (status === 'SKIPPED') {
        color = 'text-slate-800';
        bg = 'bg-black opacity-50';
    }

    return (
        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${bg} ${color} transition-all duration-300 relative z-10`}>
            {icon}
        </div>
    );
};

export const GauntletMap: React.FC<Props> = ({ state, onSelectNode }) => {
    // Determine SVG Lines
    const renderLines = () => {
        const lines: React.ReactElement[] = [];
        const layerHeight = 80;
        const nodeWidth = 100; // Roughly spaced

        state.map.forEach(node => {
            node.parents.forEach(parentId => {
                const parent = state.map.find(p => p.id === parentId);
                if (parent) {
                    // Coordinates relative to container center logic would be ideal, 
                    // but simple Flexbox alignment makes absolute SVG coords tricky.
                    // Instead, we render nodes in a Flex grid and use logic to infer connection visibility?
                    // No, SVG overlay is best.
                    
                    // Simplified: Just render layer rows.
                }
            });
        });
        return null; // Skipping complex SVG lines for this iteration to fit in single component
    };

    // Group by Tier
    const tiers: GauntletNode[][] = [];
    state.map.forEach(node => {
        if (!tiers[node.tier]) tiers[node.tier] = [];
        tiers[node.tier].push(node);
    });

    return (
        <div className="absolute inset-0 z-50 bg-[#050505] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-20 shadow-xl">
                <div>
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 fantasy-font">
                        THE GAUNTLET
                    </h2>
                    <div className="text-xs text-slate-500 font-mono">Depth {state.currentTier + 1}</div>
                </div>
                <div className="flex gap-2">
                    {state.artifacts.map((art, i) => (
                        <div key={i} className="w-8 h-8 bg-slate-800 rounded border border-slate-600 flex items-center justify-center text-lg" title={art.name}>
                            {art.icon}
                        </div>
                    ))}
                </div>
            </div>

            {/* Scrollable Map Area (Bottom to Top) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col-reverse items-center py-10 relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                
                {tiers.map((nodes, tierIdx) => (
                    <div key={tierIdx} className="w-full flex justify-center gap-16 py-8 relative">
                        {/* Connecting Lines Hint (Visual only, dashed line to next tier) */}
                        {tierIdx < tiers.length - 1 && (
                            <div className="absolute top-0 left-0 right-0 h-full pointer-events-none opacity-20">
                                {/* Can't easily draw diagonal lines without absolute coords, stick to vertical flow */}
                            </div>
                        )}

                        {nodes.map(node => (
                            <motion.button
                                key={node.id}
                                disabled={node.status !== 'AVAILABLE'}
                                onClick={() => onSelectNode(node.id)}
                                whileHover={node.status === 'AVAILABLE' ? { scale: 1.1 } : {}}
                                className={`flex flex-col items-center gap-2 ${node.status === 'AVAILABLE' ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <NodeIcon type={node.type} status={node.status} />
                                {node.status === 'AVAILABLE' && (
                                    <span className="text-[10px] bg-black/80 px-2 py-0.5 rounded text-white font-bold uppercase tracking-wider">
                                        {node.type}
                                    </span>
                                )}
                            </motion.button>
                        ))}
                    </div>
                ))}
                
                {/* Start Point Marker */}
                <div className="text-slate-600 text-xs font-mono mb-4">ENTRANCE</div>
            </div>
        </div>
    );
};
