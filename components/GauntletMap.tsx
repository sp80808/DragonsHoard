
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { GauntletState, GauntletNode } from '../types';
import { Skull, Tent, ShoppingBag, Gift, ArrowUp, Lock, Check, Map as MapIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    state: GauntletState;
    onSelectNode: (nodeId: string) => void;
}

const NodeIcon = ({ type, status }: { type: GauntletNode['type'], status: string }) => {
    let icon = <Skull size={20} />;
    let color = 'text-slate-500';
    let bg = 'bg-slate-900';
    let border = 'border-slate-700';
    let shadow = '';

    if (type === 'ELITE') icon = <Skull size={24} className="text-red-500" />;
    else if (type === 'REST') icon = <Tent size={20} className="text-blue-400" />;
    else if (type === 'SHOP') icon = <ShoppingBag size={20} className="text-yellow-400" />;
    else if (type === 'TREASURE') icon = <Gift size={20} className="text-purple-400" />;
    else if (type === 'BOSS') icon = <Skull size={32} className="text-red-600" />;
    else if (type === 'START') icon = <ArrowUp size={24} className="text-green-400" />;

    if (status === 'COMPLETED') {
        color = 'text-slate-600';
        bg = 'bg-slate-900';
        border = 'border-slate-700';
        icon = <Check size={20} />;
    } else if (status === 'AVAILABLE') {
        color = 'text-white';
        bg = 'bg-slate-800';
        border = 'border-yellow-500';
        shadow = 'shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-pulse';
    } else if (status === 'LOCKED') {
        color = 'text-slate-700';
        bg = 'bg-black';
        border = 'border-slate-800';
        icon = <Lock size={14} />;
    } else if (status === 'SKIPPED') {
        color = 'text-slate-800';
        bg = 'bg-black';
        border = 'border-slate-800';
        icon = <div className="w-2 h-2 rounded-full bg-slate-800"></div>; // Small dot for skipped
    }

    return (
        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center ${bg} ${border} ${color} ${shadow} transition-all duration-300 relative z-10 hover:scale-110`}>
            {icon}
        </div>
    );
};

export const GauntletMap: React.FC<Props> = ({ state, onSelectNode }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const maxTier = useMemo(() => Math.max(...state.map.map(n => n.tier)), [state.map]);
    
    // Auto-scroll to current tier on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const currentYPct = 90 - (state.currentTier / maxTier) * 80;
            // Approximate scroll position: Bottom of container is Tier 0.
            // We want to center the view on current tier.
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            
            // Map percentage (10% top to 90% bottom) to scroll pixels
            // 90% -> ScrollTop Max
            // 10% -> ScrollTop 0
            
            // Simple logic: Scroll to bottom initially (Tier 0), then adjust up
            const targetScroll = scrollHeight - clientHeight - ((state.currentTier / maxTier) * (scrollHeight - clientHeight));
            
            container.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
    }, [state.currentTier, maxTier]);

    const getCoordinates = (node: GauntletNode) => {
        // Group by Tier to find horizontal distribution
        const peers = state.map.filter(n => n.tier === node.tier).sort((a,b) => a.x - b.x);
        const index = peers.findIndex(n => n.id === node.id);
        const count = peers.length;
        
        // Horizontal: Centered distribution (20% padding on sides)
        // 1 node: 50%
        // 2 nodes: 35%, 65%
        // 3 nodes: 25%, 50%, 75%
        const x = count === 1 ? 50 : 25 + (index / (count - 1)) * 50;
        
        // Vertical: Tier 0 at bottom (90%), Max Tier at top (10%)
        const y = 90 - (node.tier / maxTier) * 80;
        
        return { x, y };
    };

    const renderConnections = () => {
        return state.map.map(node => {
            const { x: x1, y: y1 } = getCoordinates(node);
            
            return node.parents.map(parentId => {
                const parent = state.map.find(p => p.id === parentId);
                if (!parent) return null;
                const { x: x2, y: y2 } = getCoordinates(parent);

                const isPathActive = (node.status === 'COMPLETED' || node.status === 'AVAILABLE') && parent.status === 'COMPLETED';
                const isPathSkipped = node.status === 'SKIPPED' || parent.status === 'SKIPPED';

                let stroke = '#1e293b'; // slate-800
                let width = 2;
                let dash = '0';
                let opacity = 1;

                if (isPathActive) {
                    stroke = '#eab308'; // yellow-500
                    width = 3;
                } else if (isPathSkipped) {
                    stroke = '#0f172a'; // slate-900
                    width = 1;
                    opacity = 0.5;
                } else {
                    dash = '4 4';
                }

                return (
                    <motion.path
                        key={`${parent.id}-${node.id}`}
                        d={`M ${x2} ${y2} C ${x2} ${y2 + (y1-y2)/2}, ${x1} ${y1 - (y1-y2)/2}, ${x1} ${y1}`}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={width}
                        strokeDasharray={dash}
                        opacity={opacity}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        vectorEffect="non-scaling-stroke" // Keeps line width constant on scale
                    />
                );
            });
        });
    };

    return (
        <div className="absolute inset-0 z-50 bg-[#050505] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center z-20 shadow-xl shrink-0">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 fantasy-font flex items-center gap-2">
                        <MapIcon size={24} className="text-red-500"/> THE GAUNTLET
                    </h2>
                    <div className="text-xs text-slate-500 font-mono mt-1">Floor {state.currentTier + 1} / {maxTier + 1}</div>
                </div>
                <div className="flex gap-2">
                    {state.artifacts.map((art, i) => (
                        <div key={i} className="w-10 h-10 bg-slate-800 rounded-lg border border-slate-600 flex items-center justify-center text-xl shadow-lg" title={art.name}>
                            {art.icon}
                        </div>
                    ))}
                </div>
            </div>

            {/* Scrollable Map Container */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <div className="relative w-full max-w-3xl mx-auto min-h-[1200px]" style={{ height: '150vh' }}>
                    
                    {/* SVG Layer for Connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {renderConnections()}
                    </svg>

                    {/* Nodes Layer */}
                    {state.map.map(node => {
                        const coords = getCoordinates(node);
                        return (
                            <motion.div
                                key={node.id}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: node.tier * 0.1, type: "spring" }}
                            >
                                <button
                                    disabled={node.status !== 'AVAILABLE'}
                                    onClick={() => onSelectNode(node.id)}
                                    className={`flex flex-col items-center gap-2 group ${node.status === 'AVAILABLE' ? 'cursor-pointer' : 'cursor-default'}`}
                                >
                                    <NodeIcon type={node.type} status={node.status} />
                                    {node.status === 'AVAILABLE' && (
                                        <span className="text-[10px] bg-black/80 px-2 py-0.5 rounded text-white font-bold uppercase tracking-wider border border-yellow-500/50 shadow-lg group-hover:scale-110 transition-transform">
                                            {node.type}
                                        </span>
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                    
                    {/* Boss Label */}
                    <div className="absolute top-[5%] left-1/2 -translate-x-1/2 text-red-900/20 font-black text-9xl fantasy-font pointer-events-none select-none">
                        BOSS
                    </div>
                    
                    {/* Start Label */}
                    <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 text-slate-800 font-black text-6xl fantasy-font pointer-events-none select-none">
                        START
                    </div>

                </div>
            </div>
        </div>
    );
};
