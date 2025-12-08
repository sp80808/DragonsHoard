
import React from 'react';
import { motion } from 'framer-motion';
import { Tile, Cosmetic } from '../types';
import { TileComponent } from '../components/TileComponent';

interface GridProps {
  grid: Tile[];
  size: number;
  equippedCosmetics?: Cosmetic[];
}

export const Grid: React.FC<GridProps> = ({ grid, size, equippedCosmetics = [] }) => {
  // Create background cells
  const cells = Array.from({ length: size * size });

  return (
    <motion.div
      className="relative w-full"
      initial={{ x: 5 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
        {/* Ambient Glow behind Grid */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl"></div>

        <div className="relative w-full aspect-square bg-black/60 rounded-xl p-2 module-sample shadow-2xl overflow-hidden backdrop-blur-md vinyl-texture layered-depth-strong depth-focused acrylic-panel">
        {/* Background Grid */}
        <div 
            className="w-full h-full grid"
            style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
            }}
        >
            {cells.map((_, i) => (
            <div key={i} className="w-full h-full p-1">
                <div className="bg-slate-800/40 rounded-lg w-full h-full border border-slate-700/20 shadow-inner"></div>
            </div>
            ))}
        </div>

        {/* Floating Tiles Layer */}
        <div className="absolute inset-0 p-2 pointer-events-none">
            <div className="relative w-full h-full">
                {/* We map grid tiles here. The key is crucial for React to track movement animation */}
                {grid.map((tile) => (
                <TileComponent key={tile.id} tile={tile} gridSize={size} equippedCosmetics={equippedCosmetics} />
                ))}
            </div>
        </div>
        </div>
    </motion.div>
  );
};
