
import React, { useEffect, useState } from 'react';
import { Medal } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

interface MedalFeedProps {
    queue: { id: string, medal: Medal }[];
}

const MedalItem: React.FC<{ medal: Medal }> = ({ medal }) => {
    let rarityColor = 'border-slate-500 bg-slate-900/90 text-slate-200';
    let glow = '';

    switch (medal.rarity) {
        case 'COMMON': 
            rarityColor = 'border-slate-500 bg-slate-900/95 text-slate-200'; 
            break;
        case 'UNCOMMON': 
            rarityColor = 'border-green-500 bg-green-950/95 text-green-100'; 
            break;
        case 'RARE': 
            rarityColor = 'border-blue-500 bg-blue-950/95 text-blue-100'; 
            glow = 'shadow-[0_0_15px_rgba(59,130,246,0.3)]';
            break;
        case 'EPIC': 
            rarityColor = 'border-purple-500 bg-purple-950/95 text-purple-100'; 
            glow = 'shadow-[0_0_20px_rgba(168,85,247,0.4)]';
            break;
        case 'LEGENDARY': 
            rarityColor = 'border-yellow-500 bg-yellow-950/95 text-yellow-100'; 
            glow = 'shadow-[0_0_30px_rgba(234,179,8,0.5)]';
            break;
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.2 } }}
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border-2 ${rarityColor} ${glow} backdrop-blur-md shadow-lg`}
        >
            <div className="text-lg shrink-0 drop-shadow-md">
                {medal.icon}
            </div>
            <div className="flex flex-col min-w-0">
                <span className="font-black text-[10px] uppercase tracking-widest leading-none drop-shadow-sm">{medal.name}</span>
            </div>
        </motion.div>
    );
};

export const MedalFeed: React.FC<MedalFeedProps> = ({ queue }) => {
    // FIFO Queue: Show the first item (oldest). 
    // App.tsx removes index 0 after a timeout, causing index 1 to become index 0 and display next.
    const displayQueue = queue.slice(0, 1);

    // Z-index 30 puts it below HUD header (40) and Combo Meter
    return (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center w-auto">
            <AnimatePresence mode="wait">
                {displayQueue.map(({ id, medal }) => (
                    <MedalItem key={id} medal={medal} />
                ))}
            </AnimatePresence>
        </div>
    );
};
