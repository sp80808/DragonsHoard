
import React from 'react';
import { motion } from 'framer-motion';

export const ComboMeter = ({ combo, className }: { combo: number, className?: string }) => {
    if (combo < 2) return null;
    
    return (
        <motion.div 
            key="combo-meter"
            initial={{ scale: 0.5, opacity: 0, x: 20 }} 
            animate={{ 
                scale: 1, 
                opacity: 1, 
                x: 0,
                rotate: [0, -3, 3, 0] 
            }}
            exit={{ scale: 0.5, opacity: 0, x: 20, transition: { duration: 0.2 } }}
            transition={{
                rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                type: "spring", stiffness: 400, damping: 15
            }}
            className={`pointer-events-none origin-right ${className || ''}`}
        >
            <div className="relative group">
                {/* Fire FX */}
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="absolute inset-0 bg-orange-600 blur-md rounded-full"
                ></motion.div>
                
                {/* Meter Body */}
                <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 px-4 py-2 rounded-xl border-2 border-orange-500 shadow-xl flex items-center gap-3 transform -skew-x-6 backdrop-blur-md relative z-10">
                    <div className="flex flex-col items-end">
                        <motion.span 
                            key={combo}
                            initial={{ scale: 1.5, color: '#fff' }}
                            animate={{ scale: 1, color: 'transparent' }}
                            transition={{ duration: 0.2 }}
                            className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-500 to-red-600 fantasy-font leading-none drop-shadow-sm filter"
                        >
                            {combo}x
                        </motion.span>
                    </div>
                    <div className="h-8 w-px bg-white/10"></div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[9px] font-bold text-orange-200 uppercase opacity-80 tracking-widest">Combo</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Chain</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
