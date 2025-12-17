
import React, { useMemo, useEffect, useRef } from 'react';
import { Tile, LootEvent } from '../types';
import { TileComponent } from './TileComponent';
import { TILE_STYLES, BOSS_STYLE, RUNE_STYLES, FALLBACK_STYLE, STONE_STYLE } from '../constants';
import { Coins } from 'lucide-react';

interface GridProps {
  grid: Tile[];
  size: number;
  mergeEvents: { id: string, x: number, y: number, value: number, type: string }[];
  lootEvents: LootEvent[];
  slideSpeed: number;
  themeId?: string;
  lowPerformanceMode?: boolean;
  combo: number;
  tilesetId?: string;
}

export const Grid = React.memo(({ grid, size, mergeEvents, lootEvents, slideSpeed, themeId, lowPerformanceMode, combo, tilesetId = 'DEFAULT' }: GridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic Background Style based on Combo
  const ambientGlowClass = useMemo(() => {
      if (combo >= 10) return "from-fuchsia-600/30 via-cyan-500/30 to-white/10 animate-pulse duration-75";
      if (combo >= 5) return "from-red-600/20 via-orange-600/20 to-yellow-600/10 animate-pulse duration-150";
      if (combo >= 2) return "from-yellow-600/15 via-orange-600/15 to-transparent animate-pulse duration-300";
      // Default: Static, dark, subtle. No blue pulse.
      return "from-slate-900/40 to-slate-800/40";
  }, [combo]);

  // Memoize background cells
  const backgroundCells = useMemo(() => {
      const cells = Array.from({ length: size * size });
      return (
        <div 
            className="w-full h-full grid gap-1 sm:gap-2 relative z-10"
            style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
            }}
        >
            {cells.map((_, i) => (
            <div key={i} className="w-full h-full aspect-square">
                <div className="w-full h-full bg-[#080a0f] rounded-lg border border-white/5 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-800/20"></div>
                </div>
            </div>
            ))}
        </div>
      );
  }, [size]);

  // Particle System Logic
  useEffect(() => {
      // If Low Performance Mode is on, skip particle generation entirely
      if (lowPerformanceMode || mergeEvents.length === 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cellSize = rect.width / size;

      mergeEvents.forEach(evt => {
           let style: any = TILE_STYLES[evt.value] || FALLBACK_STYLE;
           if (evt.type === 'BOSS') style = BOSS_STYLE;
           else if (evt.type === 'STONE') style = STONE_STYLE;
           else if (evt.type.startsWith('RUNE')) style = RUNE_STYLES[evt.type];
           
           const color = style?.particleColor || '#ffffff';
           
           // Boost particle count based on combo
           const comboMultiplier = Math.min(3, 1 + (combo * 0.2));
           const particleCount = Math.floor(10 * comboMultiplier); // Increased count

           for (let i = 0; i < particleCount; i++) {
               const side = Math.floor(Math.random() * 4);
               let offsetX = 0, offsetY = 0;
               const jitter = Math.random() * 8 - 4; 
               
               if (side === 0) { offsetX = Math.random() * cellSize; offsetY = jitter; } 
               else if (side === 1) { offsetX = cellSize + jitter; offsetY = Math.random() * cellSize; } 
               else if (side === 2) { offsetX = Math.random() * cellSize; offsetY = cellSize + jitter; } 
               else { offsetX = jitter; offsetY = Math.random() * cellSize; }

               const spawnX = (evt.x * cellSize) + offsetX;
               const spawnY = (evt.y * cellSize) + offsetY;

               const centerX = (evt.x * cellSize) + (cellSize / 2);
               const centerY = (evt.y * cellSize) + (cellSize / 2);
               
               const dx = spawnX - centerX;
               const dy = spawnY - centerY;
               const len = Math.sqrt(dx*dx + dy*dy) || 1;
               const nx = dx / len;
               const ny = dy / len;

               const speed = (Math.random() * 1.5 + 0.5) * comboMultiplier;

               particlesRef.current.push({
                   x: spawnX,
                   y: spawnY,
                   vx: nx * speed,
                   vy: ny * speed,
                   life: 1.0,
                   decay: Math.random() * 0.04 + 0.04,
                   color: color,
                   size: Math.random() * 2 + 1,
                   rotation: Math.random() * Math.PI
               });
           }
      });

  }, [mergeEvents, size, lowPerformanceMode, combo]);

  // Animation Loop
  useEffect(() => {
      // If Low Perf, don't run loop
      if (lowPerformanceMode) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

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

          // Additive blending makes overlapping particles glow
          ctx.globalCompositeOperation = 'lighter';

          if (particlesRef.current.length === 0) {
              animationFrameRef.current = requestAnimationFrame(render);
              return;
          }

          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
              const p = particlesRef.current[i];
              p.x += p.vx;
              p.y += p.vy;
              p.life -= p.decay;
              p.vx *= 0.92;
              p.vy *= 0.92;
              
              if (p.life <= 0) {
                  particlesRef.current.splice(i, 1);
                  continue;
              }

              // Twinkle effect
              const flicker = Math.random() > 0.8 ? 1.5 : 1.0;
              ctx.globalAlpha = Math.min(1, p.life * p.life * flicker);
              ctx.fillStyle = p.color;
              
              ctx.save();
              ctx.translate(p.x, p.y);
              ctx.rotate(p.life * 2 + p.rotation); 
              
              ctx.beginPath();
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
          // Reset composite operation if needed for other draws (though we only draw particles here)
          ctx.globalCompositeOperation = 'source-over';
          animationFrameRef.current = requestAnimationFrame(render);
      };

      render();

      return () => {
          window.removeEventListener('resize', resize);
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
  }, [lowPerformanceMode]);

  return (
    <div 
        ref={containerRef}
        className="relative w-full aspect-square group mx-auto"
    >
        {/* Ambient Glow - Disable in Low Perf */}
        {!lowPerformanceMode && (
            <div className={`absolute -inset-4 bg-gradient-to-r ${ambientGlowClass} rounded-3xl blur-2xl -z-10 transition-colors duration-500`}></div>
        )}
        
        {/* Grid Container */}
        <div className={`relative w-full h-full bg-black/90 rounded-xl p-1 sm:p-2 border-2 border-slate-700/50 shadow-2xl overflow-hidden ${lowPerformanceMode ? '' : 'backdrop-blur-md'}`}>
            
            {/* Subtle Grid Pattern Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" 
                 style={{ 
                     backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)',
                     backgroundSize: '20px 20px' 
                 }}>
            </div>

            {/* Background Grid Layer */}
            {backgroundCells}

            {/* Floating Tiles Layer */}
            <div className="absolute inset-0 p-1 sm:p-2 pointer-events-none z-10">
                <div className="relative w-full h-full">
                    {grid.map((tile) => (
                    <TileComponent 
                        key={tile.id} 
                        tile={tile} 
                        gridSize={size} 
                        slideSpeed={slideSpeed} 
                        themeId={themeId} 
                        lowPerformanceMode={lowPerformanceMode}
                        tilesetId={tilesetId}
                    />
                    ))}
                </div>
            </div>
            
            {/* Loot Indicators Layer */}
            <div className="absolute inset-0 p-1 sm:p-2 pointer-events-none z-30 overflow-hidden">
                <div className="relative w-full h-full">
                    {lootEvents.map((loot) => {
                         const tileSize = 100 / size;
                         const top = loot.y * tileSize;
                         const left = loot.x * tileSize;
                         
                         return (
                             <div 
                                key={loot.id}
                                className="absolute flex flex-col items-center justify-center animate-[floatUp_1s_ease-out_forwards]"
                                style={{
                                    width: `${tileSize}%`,
                                    height: `${tileSize}%`,
                                    top: `${top}%`,
                                    left: `${left}%`
                                }}
                             >
                                 <div className={`
                                     flex items-center gap-1 px-2 py-1 rounded-full border shadow-lg ${lowPerformanceMode ? '' : 'backdrop-blur-md'}
                                     ${loot.type === 'GOLD' 
                                        ? 'bg-yellow-900/80 border-yellow-500 text-yellow-300' 
                                        : 'bg-indigo-900/80 border-indigo-500 text-indigo-200'}
                                 `}>
                                     {loot.type === 'GOLD' ? <Coins size={14} className="text-yellow-400" /> : <span className="text-base">{loot.icon}</span>}
                                     <span className="text-xs font-bold whitespace-nowrap">
                                         {loot.type === 'GOLD' ? `+${loot.value} G` : 'Item!'}
                                     </span>
                                 </div>
                             </div>
                         );
                    })}
                </div>
            </div>

            {/* Particle Overlay - Only if not low performance */}
            {!lowPerformanceMode && (
                <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none w-full h-full"></canvas>
            )}
        </div>
    </div>
  );
});
