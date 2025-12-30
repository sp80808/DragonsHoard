
import React from 'react';
import { DAILY_REWARDS, checkDailyLoginStatus } from '../services/storageService';
import { PlayerProfile } from '../types';
import { Check, Coins, Lock, Star, Sparkles, Gift } from 'lucide-react';
import { SHOP_ITEMS } from '../constants';
import { motion } from 'framer-motion';

interface Props {
    profile: PlayerProfile;
    onClaim: () => void;
}

export const DailyLoginModal: React.FC<Props> = ({ profile, onClaim }) => {
    const { streak, canClaim } = checkDailyLoginStatus(profile);
    const dayIndex = streak % 7; // Current day in the 7-day cycle (0-6)

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-500"></div>
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-5xl max-h-[95vh] bg-[#0b0f19] border border-yellow-600/30 rounded-3xl flex flex-col shadow-[0_0_60px_rgba(234,179,8,0.1)] overflow-hidden"
            >
                {/* Background FX */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-40 pointer-events-none"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-b from-yellow-900/20 to-transparent pointer-events-none"></div>

                {/* Content Scroll Wrapper */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 md:p-10 flex flex-col items-center">
                    
                    <div className="text-center mb-8 relative z-10">
                        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-600/50 text-yellow-400 text-[10px] font-bold uppercase tracking-widest">
                            <Sparkles size={12} /> Login Streak: {streak} Days
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-amber-300 to-amber-600 fantasy-font drop-shadow-sm tracking-tight mb-2">
                            THE DRAGON'S TRIBUTE
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base font-serif italic max-w-md mx-auto">
                            The hoard grows for those who return. Claim your daily allowance.
                        </p>
                    </div>

                    {/* Cards Container */}
                    <div className="w-full flex flex-wrap justify-center gap-3 md:gap-4 relative z-10 mb-8">
                        {DAILY_REWARDS.map((reward, idx) => {
                            const isPast = idx < dayIndex;
                            const isToday = idx === dayIndex;
                            const isFuture = idx > dayIndex;
                            const isGrandPrize = reward.day === 7;

                            return (
                                <div 
                                    key={reward.day}
                                    className={`
                                        relative flex flex-col items-center justify-between p-3 rounded-xl border-2 transition-all duration-300 group
                                        ${isGrandPrize ? 'w-full md:w-[160px] aspect-[2/1] md:aspect-[3/4]' : 'w-[calc(33%-8px)] md:w-[120px] aspect-[3/4]'}
                                        ${isPast ? 'bg-slate-900/40 border-slate-800 opacity-60' : ''}
                                        ${isToday ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)] scale-105 z-20 ring-2 ring-yellow-500/20' : ''}
                                        ${isFuture ? 'bg-slate-950/50 border-slate-800/80 opacity-80' : ''}
                                        ${isGrandPrize && !isPast ? 'border-amber-500/50 bg-gradient-to-br from-amber-900/20 to-black' : ''}
                                    `}
                                >
                                    {/* Header Day */}
                                    <div className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${isToday ? 'text-yellow-400' : 'text-slate-600'}`}>
                                        Day {reward.day}
                                    </div>

                                    {/* Icon / Content */}
                                    <div className="flex-1 flex flex-col items-center justify-center gap-1 w-full">
                                        {isFuture && !isGrandPrize ? (
                                            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                                                <Lock size={16} className="text-slate-700" />
                                            </div>
                                        ) : (
                                            <>
                                                {reward.gold > 0 && (
                                                    <div className="flex flex-col items-center">
                                                        <Coins size={isGrandPrize ? 28 : 20} className={isToday ? "text-yellow-400 animate-pulse" : "text-yellow-600"} />
                                                        <span className={`font-mono font-bold mt-1 ${isGrandPrize ? 'text-lg' : 'text-xs'} ${isToday ? 'text-white' : 'text-slate-400'}`}>{reward.gold}</span>
                                                    </div>
                                                )}
                                                {reward.item && (
                                                    <div className="flex flex-col items-center mt-2 relative">
                                                        <div className="text-2xl drop-shadow-md transform group-hover:scale-110 transition-transform">
                                                            {SHOP_ITEMS.find(i => i.id === reward.item)?.icon || '🎁'}
                                                        </div>
                                                        {isGrandPrize && <div className="absolute inset-0 bg-yellow-400/20 blur-xl animate-pulse"></div>}
                                                    </div>
                                                )}
                                                {reward.sp && (
                                                    <div className="flex items-center gap-1 mt-1 bg-purple-900/30 px-2 py-0.5 rounded border border-purple-500/30">
                                                        <Sparkles size={10} className="text-purple-400" />
                                                        <span className="text-[9px] text-purple-200 font-bold">1 SP</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Status Footer */}
                                    {isPast && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                                            <div className="bg-green-500 rounded-full p-1 shadow-lg">
                                                <Check size={16} className="text-white" strokeWidth={4} />
                                            </div>
                                        </div>
                                    )}
                                    {isToday && canClaim && (
                                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                                            <div className="text-[9px] bg-yellow-500 text-black font-black px-2 py-0.5 rounded shadow-lg animate-bounce whitespace-nowrap">
                                                CLAIM ME
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="sticky bottom-0 z-30 pb-2">
                        <button 
                            onClick={onClaim}
                            disabled={!canClaim}
                            className={`
                                relative overflow-hidden px-16 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all
                                ${canClaim 
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-[0_0_40px_rgba(234,179,8,0.4)] hover:scale-105 hover:shadow-[0_0_60px_rgba(234,179,8,0.6)] active:scale-95 group' 
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}
                            `}
                        >
                            {canClaim ? (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:animate-shimmer"></div>
                                    <Gift size={24} className="animate-bounce" /> CLAIM REWARD
                                </>
                            ) : (
                                <span className="flex items-center gap-2"><Check size={18} /> COME BACK TOMORROW</span>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
