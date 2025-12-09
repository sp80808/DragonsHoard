
import React, { useMemo, useEffect, useRef } from 'react';
import { Tile } from '../types';
import { TileComponent } from './TileComponent';
import { TILE_STYLES, BOSS_STYLE, RUNE_STYLES, FALLBACK_STYLE } from '../constants';

interface GridProps {
  grid: Tile[];
  size: number;
  mergeEvents: { id: string, x: number, y: number, value: number, type: string }[];
}

export const Grid: React.FC<GridProps> = ({ grid, size, mergeEvents }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number>();

  // Memoize background cells
  const backgroundCells = useMemo(() => {
      const cells = Array.from({ length: size * size });
      return (
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
      );
  }, [size]);

  // Particle System Logic
  useEffect(() => {
      if (mergeEvents.length === 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cellSize = rect.width / size;

      mergeEvents.forEach(evt => {
           let style: any = TILE_STYLES[evt.value] || FALLBACK_STYLE;
           if (evt.type === 'BOSS') style = BOSS_STYLE;
           else if (evt.type.startsWith('RUNE')) style = RUNE_STYLES[evt.type];
           
           const color = style?.particleColor || '#ffffff';
           
           // Spawn Sparks on Perimeter (Edges) rather than center
           for (let i = 0; i < 12; i++) {
               // Determine random point on perimeter
               const side = Math.floor(Math.random() * 4);
               let offsetX = 0, offsetY = 0;
               const jitter = Math.random() * 8 - 4; // Slight irregularity
               
               if (side === 0) { // Top
                   offsetX = Math.random() * cellSize;
                   offsetY = jitter;
               } else if (side === 1) { // Right
                   offsetX = cellSize + jitter;
                   offsetY = Math.random() * cellSize;
               } else if (side === 2) { // Bottom
                   offsetX = Math.random() * cellSize;
                   offsetY = cellSize + jitter;
               } else { // Left
                   offsetX = jitter;
                   offsetY = Math.random() * cellSize;
               }

               const spawnX = (evt.x * cellSize) + offsetX;
               const spawnY = (evt.y * cellSize) + offsetY;

               // Velocity generally outward from center of tile + random drift
               // Center of tile
               const centerX = (evt.x * cellSize) + (cellSize / 2);
               const centerY = (evt.y * cellSize) + (cellSize / 2);
               
               const dx = spawnX - centerX;
               const dy = spawnY - centerY;
               const len = Math.sqrt(dx*dx + dy*dy) || 1;
               const nx = dx / len;
               const ny = dy / len;

               const speed = Math.random() * 1.5 + 0.5;

               particlesRef.current.push({
                   x: spawnX,
                   y: spawnY,
                   vx: nx * speed,
                   vy: ny * speed,
                   life: 1.0,
                   decay: Math.random() * 0.03 + 0.02,
                   color: color,
                   size: Math.random() * 3 + 2,
                   rotation: Math.random() * Math.PI
               });
           }
      });

  }, [mergeEvents, size]);

  // Animation Loop
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle Resize
      const resize = () => {
          const parent = canvas.parentElement;
          if (parent) {
              canvas.width = parent.clientWidth;
              canvas.height = parent.clientHeight;
          }
      };
      resize();
      window.addEventListener('resize', resize);

      const render = () => {
          if (!ctx || !canvas) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Update and Draw Particles
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
              const p = particlesRef.current[i];
              p.x += p.vx;
              p.y += p.vy;
              p.life -= p.decay;
              
              // Apply Friction (Drag) to keep particles local
              p.vx *= 0.9;
              p.vy *= 0.9;
              
              if (p.life <= 0) {
                  particlesRef.current.splice(i, 1);
                  continue;
              }

              ctx.globalAlpha = p.life;
              ctx.fillStyle = p.color;
              
              // Draw Spark / Star Shape
              ctx.save();
              ctx.translate(p.x, p.y);
              // Slight rotation for visual interest
              ctx.rotate(p.life * 2 + p.rotation); 
              
              ctx.beginPath();
              // 4-Point Star (Spark)
              const s = p.size;
              ctx.moveTo(0, -s);
              ctx.quadraticCurveTo(s * 0.2, -s * 0.2, s, 0);
              ctx.quadraticCurveTo(s * 0.2, s * 0.2, 0, s);
              ctx.quadraticCurveTo(-s * 0.2, s * 0.2, -s, 0);
              ctx.quadraticCurveTo(-s * 0.2, -s * 0.2, 0, -s);
              ctx.closePath();
              ctx.fill();
              
              ctx.restore();
          }

          animationFrameRef.current = requestAnimationFrame(render);
      };

      render();

      return () => {
          window.removeEventListener('resize', resize);
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
  }, []);

  return (
    <div className="relative w-full">
        {/* Ambient Glow behind Grid */}
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl animate-pulse"></div>
        
        <div className="relative w-full aspect-square bg-black/80 rounded-xl p-2 border-2 border-slate-700/50 shadow-2xl overflow-hidden backdrop-blur-md">
            {/* Background Grid Layer */}
            {backgroundCells}

            {/* Floating Tiles Layer */}
            <div className="absolute inset-0 p-2 pointer-events-none z-10">
                <div className="relative w-full h-full">
                    {grid.map((tile) => (
                    <TileComponent key={tile.id} tile={tile} gridSize={size} />
                    ))}
                </div>
            </div>

            {/* Particle Overlay */}
            <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none w-full h-full"></canvas>
        </div>
    </div>
  );
};
