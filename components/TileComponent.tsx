
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
  
  const xPos = (tile.x / gridSize) * 100;
  const yPos = (tile.y / gridSize) * 100;
  const size = 100 / gridSize;

  const isNewClass = tile.isNew ? 'tile-animation-enter' : '';
  
  // Determine animation type based on merge source
  let animationClass = '';
  if (tile.mergedFrom) {
      if (tile.mergedFrom[0] === 'damage') {
          // Boss took damage: Violent shake and red flash
          animationClass = 'hit-flash shake'; 
      } else {
          // Normal Merge: Pulse and glow
          animationClass = 'tile-animation-merge upgrade-flash';
      }
  }

  // Cascade Animation - Dynamic Ring Color
  const ringColorClass = style.ringColor || 'ring-cyan-400';
  const isCascadeClass = tile.isCascade ? `ring-2 ${ringColorClass} ring-offset-2 ring-offset-black animate-pulse` : '';

  // Slash effect for high level merges only
  const isSlash = tile.mergedFrom && tile.value >= 32 && tile.mergedFrom[0] !== 'damage' ? 'slash-effect' : '';
  
  return (
    <div
      className={`absolute transition-transform duration-200 ease-in-out z-10 p-1`}
      style={{
        width: `${size}%`,
        height: `${size}%`,
        transform: `translate(${tile.x * 100}%, ${tile.y * 100}%)`
      }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      <div
        className={`w-full h-full rounded-lg relative overflow-hidden shadow-2xl ${isNewClass} ${animationClass} ${isSlash} ${isCascadeClass} group select-none`}
      >
        {/* Glow Container */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${style.glow} opacity-0 group-hover:opacity-100`}></div>

        {/* Generative Background Image */}
        <div className={`absolute inset-0 bg-slate-900 bg-gradient-to-br ${style.color}`}>
             {!imgError && (
                 <img 
                    src={style.imageUrl} 
                    alt={style.label}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-80 mix-blend-overlay select-none"
                    loading="lazy"
                    onError={() => setImgError(true)}
                    draggable={false}
                 />
             )}
             
             {/* Gradient Overlays for Readability */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/80"></div>
             
             {/* Shine Effect */}
             <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-1 select-none">
            {/* Value (Hidden for Bosses) */}
            <span className={`font-serif font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-tighter
                ${gridSize > 5 ? 'text-lg' : 'text-3xl'}
                ${tile.value > 1000 ? 'text-yellow-200' : ''}
            `}>
                {tile.type !== TileType.BOSS && !tile.type.startsWith('RUNE_') ? tile.value : ''}
            </span>
            
            {/* Icon for Special Tiles */}
            {tile.type.startsWith('RUNE_') && (
                <div className="text-2xl md:text-3xl animate-pulse">{style.icon}</div>
            )}
            
            {/* Label */}
            <span className={`text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-200 font-bold mt-0.5 drop-shadow-md opacity-80`}>
                {style.label}
            </span>
        </div>

        {/* Boss Health Bar */}
        {tile.type === TileType.BOSS && tile.health !== undefined && tile.maxHealth !== undefined && (
             <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/20 z-20">
                 <div 
                    className="h-full bg-red-600 transition-all duration-300" 
                    style={{ width: `${(tile.health / tile.maxHealth) * 100}%` }}
                 />
             </div>
        )}

        {/* Special Indicators */}
        {tile.type === TileType.BOMB && <div className="absolute top-1 right-1 text-xs z-20 animate-pulse bg-red-500/80 rounded-full w-4 h-4 flex items-center justify-center">💣</div>}
        {tile.type === TileType.GOLDEN && <div className="absolute top-1 right-1 text-xs z-20 animate-pulse text-yellow-300">✨</div>}
        
        {/* Inner Border/Frame */}
        <div className={`absolute inset-0 border-2 border-white/10 rounded-lg pointer-events-none box-border`}></div>
      </div>
    </div>
  );
};
