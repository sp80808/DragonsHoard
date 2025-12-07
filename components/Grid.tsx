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
    <div className="relative w-full aspect-square bg-slate-900/80 rounded-xl p-2 border-2 border-slate-700 shadow-2xl overflow-hidden backdrop-blur-sm">
      {/* Background Grid */}
      <div 
        className="w-full h-full grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg w-full h-full border border-slate-700/30"></div>
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
  );
};