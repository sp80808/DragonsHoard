import React, { useState } from 'react';
import { Tile, TileType } from '../types';
import { TILE_STYLES, BOSS_STYLE, FALLBACK_STYLE, RUNE_STYLES } from '../constants';

interface TileProps {
  tile: Tile;
  gridSize: number;
}

export const TileComponent: React.FC<TileProps> = ({ tile, gridSize }) => {
  let style = TILE_STYLES[tile.value] || FALLBACK_STYLE;
  if (tile.type === TileType.BOSS) {
      style = BOSS_STYLE;
  } else if (tile.type.startsWith('RUNE_')) {
      style = RUNE_STYLES[tile.type] || FALLBACK_STYLE;
  }

  const [imgError, setImgError] = useState(false);
  
  // Calculate position percentage relative to grid
  const size = 100 / gridSize;
  const xPos = tile.x * 100;
  const yPos = tile.y * 100;

  const isNewClass = tile.isNew ? 'tile-animation-enter' : '';
  
  // --- TIERED ANIMATION LOGIC ---
  let mergeClass = '';
  let shakeClass = '';
  let showShockwave = false; // Tier 2 (32+)
  let showGodwave = false;   // Tier 4 (512+)

  if (tile.mergedFrom) {
      if (tile.mergedFrom[0] === 'damage') {
          // Boss Hit: Violent shake + Red flash
          mergeClass = 'hit-flash'; 
          shakeClass = 'animate-shake-md';
      } else {
          // Base Merge: Standard Pop (Scale)
          mergeClass = 'tile-animation-merge';
          
          // Tier 1: Flash (All merges for satisfaction)
          mergeClass += ' upgrade-flash';
          
          // Base Shake: Subtle shake for all merges
          shakeClass = 'animate-shake-sm';

          // Tier 2: Visual Shockwave & Stronger Shake (Drake+ / 32+)
          if (tile.value >= 32) {
              showShockwave = true;
              shakeClass = 'animate-shake-md';
          }

          // Tier 4: Godwave & Heavy Shake (Legend+ / 512+)
          if (tile.value >= 512) {
              showGodwave = true;
              shakeClass = 'animate-shake-lg';
          }
      }
  }

  // Cascade Indicator
  const ringColorClass = style.ringColor || 'ring-cyan-400';
  const isCascadeClass = tile.isCascade ? `ring-2 ${ringColorClass} ring-offset-2 ring-offset-black animate-pulse` : '';

  // Slash Effect (Visual flair for high tiers)
  const isSlash = tile.mergedFrom && tile.value >= 32 && tile.mergedFrom[0] !== 'damage' ? 'slash-effect' : '';
  
  // Boss Health Calculation
  const healthPercent = tile.maxHealth ? Math.max(0, (tile.health || 0) / tile.maxHealth) * 100 : 0;

  // High Tier Pulsating Glow (Warm Golden + Tile Tint)
  const isHighTier = tile.value >= 512;
  const glowColor = style.particleColor || '#fbbf24'; // Fallback to amber

  return (
    <div
      className={`absolute transition-transform duration-200 ease-in-out z-10 p-1`}
      style={{
        width: `${size}%`,
        height: `${size}%`,
        transform: `translate(${xPos}%, ${yPos}%)`
      }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* 
        Animation Wrapper (Outer)
        - Handles Scale/Pop/Pulse animations. 
        - Separated from Shake to prevent Transform conflicts.
      */}
      <div className={`w-full h-full relative ${isNewClass} ${mergeClass} group select-none`}>
        
        {/* Tier 2: White Shockwave (Quick Ping) */}
        {showShockwave && (
             <div className="absolute inset-0 z-50 rounded-lg border-2 border-white/20 animate-[ping_0.3s_cubic-bezier(0,0,0.2,1)_1] pointer-events-none"></div>
        )}
        
        {/* Tier 4: Godwave (Expanding Golden Ring) */}
        {showGodwave && (
             <div className="absolute inset-0 z-[60] rounded-xl animate-godwave pointer-events-none"></div>
        )}

        {/* 
            Animation Wrapper (Inner)
            - Handles Shake/Vibration (Translate/Rotate).
        */}
        <div className={`w-full h-full ${shakeClass}`}>

            {/* 
                Content Wrapper 
                - Handles Image Clipping, Backgrounds, and Borders.
            */}
            <div className={`w-full h-full rounded-lg overflow-hidden shadow-2xl relative bg-[#0b0f19] ${isCascadeClass} ${isSlash}`}>
                
                {/* HIGH TIER GLOW: Pulsating Border */}
                {isHighTier && (
                    <div 
                        className="absolute inset-0 z-20 pointer-events-none rounded-lg animate-pulse"
                        style={{
                            boxShadow: `0 0 15px 1px rgba(251, 191, 36, 0.5), inset 0 0 10px 0px ${glowColor}`
                        }}
                    ></div>
                )}

                {/* Glow Container */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${style.glow} opacity-0 group-hover:opacity-100`}></div>

                {/* Background Gradient Fallback */}
                <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-80`}></div>

                {/* Background Image */}
                {!imgError && style.imageUrl && (
                    <img 
                        src={style.imageUrl} 
                        alt={style.label}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-60 mix-blend-overlay`}
                        onError={() => setImgError(true)}
                    />
                )}

                {/* Inner Bevel/Border */}
                <div className={`absolute inset-0 border-2 ${style.ringColor.replace('ring-', 'border-')} opacity-50 rounded-lg`}></div>

                {/* Tile Content (Classic RPG Look) */}
                <div className="absolute inset-0 flex flex-col justify-between p-1 z-10">
                    
                    {tile.value > 0 ? (
                        <>
                            {/* Prominent Number - Centered and HUGE */}
                            <div className="flex-1 flex items-center justify-center pt-2">
                                <span className="fantasy-font font-black text-white text-4xl sm:text-5xl lg:text-6xl drop-shadow-[0_4px_4px_rgba(0,0,0,1)] leading-none z-20">
                                    {tile.value}
                                </span>
                            </div>
                            
                            {/* Enemy Name - Bottom Anchored */}
                            <div className="w-full flex justify-center pb-1">
                                <div className="bg-black/60 border border-white/10 px-2 py-0.5 rounded backdrop-blur-[2px]">
                                    <span className="block text-[8px] sm:text-[9px] font-serif font-bold text-slate-200 uppercase tracking-widest leading-none">
                                        {style.label}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Boss/Rune Logic - Remains centered with icon
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] transform group-hover:scale-110 transition-transform duration-300 mb-1">
                                {style.icon}
                            </span>
                             <span className="text-[8px] sm:text-[10px] font-bold text-white/90 uppercase tracking-widest drop-shadow-md bg-black/30 px-2 rounded">
                                {style.label}
                            </span>
                        </div>
                    )}

                    {/* Boss Health Bar */}
                    {tile.type === TileType.BOSS && tile.health !== undefined && (
                        <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-black/80 rounded-full overflow-hidden border border-red-900/50">
                            <div 
                                className="h-full bg-red-600 transition-all duration-300"
                                style={{ width: `${healthPercent}%` }}
                            ></div>
                        </div>
                    )}
                </div>

                {/* Gloss Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

            </div>
        </div>
      </div>
    </div>
  );
};