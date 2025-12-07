
import React from 'react';
import { Tile } from '../types';
import { TileComponent } from './TileComponent';

interface GridProps {
  grid: Tile[];
  size: number;
}

export const Grid: React.FC<GridProps> = ({ grid, size }) => {
  // Create background cells
  const cells = Array.from({ length: size * size });

  return (
    <div className="relative w-full">
        {/* Ambient Glow behind Grid */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl animate-pulse"></div>
        
        <div className="relative w-full aspect-square bg-black/80 rounded-xl p-2 border-2 border-slate-700/50 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Background Grid */}
        <div 
            className="w-full h-full grid gap-1 sm:gap-2"
            style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
            }}
        >
            {cells.map((_, i) => (
            <div key={i} className="w-full h-full">
                <div className="w-full h-full bg-[#151921] rounded-lg border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-800/30"></div>
                </div>
            </div>
            ))}
        </div>

        {/* Floating Tiles Layer */}
        <div className="absolute inset-0 p-2 pointer-events-none">
            <div className="relative w-full h-full">
                {/* We map grid tiles here. The key is crucial for React to track movement animation */}
                {grid.map((tile) => (
                <TileComponent key={tile.id} tile={tile} gridSize={size} />
                ))}
            </div>
        </div>
        </div>
    </div>
  );
};
