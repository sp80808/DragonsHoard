
import React from 'react';
import { Tile, TileType } from '../types';
import { TILE_STYLES, FALLBACK_STYLE } from '../constants';

interface TileProps {
  tile: Tile;
  gridSize: number;
}

export const TileComponent: React.FC<TileProps> = ({ tile, gridSize }) => {
  const style = TILE_STYLES[tile.value] || FALLBACK_STYLE;
  
  const xPos = (tile.x / gridSize) * 100;
  const yPos = (tile.y / gridSize) * 100;
  const size = 100 / gridSize;

  const isNewClass = tile.isNew ? 'tile-animation-enter' : '';
  const isMergedClass = tile.mergedFrom ? 'tile-animation-merge' : '';
  
  return (
    <div
      className={`absolute transition-transform duration-200 ease-in-out z-10 p-1`}
      style={{
        width: `${size}%`,
        height: `${size}%`,
        transform: `translate(${xPos * gridSize}%, ${yPos * gridSize}%)`
      }}
    >
      <div
        className={`w-full h-full rounded-lg relative overflow-hidden shadow-lg ${isNewClass} ${isMergedClass} border-2 border-slate-900 group`}
      >
        {/* Generative Background Image */}
        <div className="absolute inset-0 bg-slate-900">
             <img 
                src={style.imageUrl} 
                alt={style.label}
                className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
             />
             <div className={`absolute inset-0 bg-gradient-to-t ${style.color} opacity-60 mix-blend-overlay`}></div>
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90"></div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
             {/* Value */}
            <span className={`font-serif font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] 
                ${gridSize > 5 ? 'text-xl' : 'text-3xl'}`}>
                {tile.value}
            </span>
            
            {/* Label */}
            <span className={`text-[10px] uppercase tracking-widest text-slate-300 font-bold mt-1 drop-shadow-md`}>
                {style.label}
            </span>
        </div>

        {/* Special Indicators */}
        {tile.type === TileType.BOMB && <div className="absolute top-1 right-1 text-xs z-20 animate-pulse">💣</div>}
        {tile.type === TileType.GOLDEN && <div className="absolute top-1 right-1 text-xs z-20 animate-pulse">✨</div>}
        
        {/* Frame Glow */}
        <div className={`absolute inset-0 border-2 border-white/10 rounded-lg pointer-events-none ${style.glow}`}></div>
      </div>
    </div>
  );
};
