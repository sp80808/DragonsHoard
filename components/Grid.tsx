
import React, { useMemo, useEffect, useRef } from 'react';
import { Tile, LootEvent, GraphicsQuality } from '../types';
import { TileComponent } from './TileComponent';
import { TILE_STYLES, BOSS_STYLE, RUNE_STYLES, FALLBACK_STYLE, STONE_STYLE } from '../constants';
import { Coins, Star } from 'lucide-react';
import { useLootSystem } from './LootSystem';
import { AnimatePresence, motion } from 'framer-motion';

interface GridProps {
  grid: Tile[];
  size: number;
  mergeEvents: { id: string, x: number, y: number, value: number, type: string }[];
  lootEvents: LootEvent[];
  slideSpeed: number;
  themeId?: string;
  graphicsQuality?: GraphicsQuality;
  combo: number;
  tilesetId?: string;
  lowPerformanceMode?: boolean; // Legacy
  onTileClick?: (id: string, row: number) => void;
  isHitstopping?: boolean; // New prop for hitstop
}

export const Grid = React.memo(({ grid, size, mergeEvents, lootEvents, slideSpeed, themeId, graphicsQuality = 'HIGH', combo, tilesetId = 'DEFAULT', lowPerformanceMode, onTileClick, isHitstopping = false }: GridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { spawnLoot } = useLootSystem();

  // Backward compatibility logic
  const isLowQuality = graphicsQuality === 'LOW' || lowPerformanceMode === true;
  const isMediumQuality = graphicsQuality === 'MEDIUM';

  // Dynamic Background Style based on Combo
  const ambientGlowClass = useMemo(() => {
      if (isLowQuality) return "";
      if (combo >= 10) return "from-fuchsia-600/30 via-cyan-500/30 to-white/10 animate-pulse duration-75";
      if (combo >= 5) return "from-red-600/20 via-orange-600/20 to-yellow-600/10 animate-pulse duration-150";
      if (combo >= 2) return "from-yellow-600/15 via-orange-600/15 to-transparent animate-pulse duration-300";
      return "from-slate-900/40 to-slate-800/40";
  }, [combo, isLowQuality]);

  // ... (Keep existing backgroundCells and useEffects for Loot/Particles) ...
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

  // Trigger Loot Particles
  useEffect(() => {
      if (!containerRef.current || lootEvents.length === 0 || isLowQuality) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const padding = 8; // approx p-2
      const availableWidth = rect.width - (padding * 2);
      // const availableHeight = rect.height - (padding * 2); // Unused
      const cellSize = availableWidth / size;

      lootEvents.forEach(loot => {
          if (loot.type === 'XP' || loot.type === 'GOLD') {
              const spawnX = rect.left + padding + (loot.x * cellSize) + (cellSize / 2);
              const spawnY = rect.top + padding + (loot.y * cellSize) + (cellSize / 2);
              
              // Mock a DOMRect for the source
              const sourceRect = {
                  left: spawnX, top: spawnY, width: 0, height: 0, right: spawnX, bottom: spawnY, x: spawnX, y: spawnY, toJSON: () => {}
              } as DOMRect;

              spawnLoot(loot.type, sourceRect, 6);
          }
      });
  }, [lootEvents, size, isLowQuality, spawnLoot]);

  useEffect(() => {
      if (isLowQuality || mergeEvents.length === 0) return;
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
           
           // Determine Particle Config based on Value Tier
           let particleCount = 10;
           let speedMultiplier = 1;
           let sizeBase = 2;
           let ringEffect = false;

           if (evt.value >= 2048) { // GOD TIER
               particleCount = 50;
               speedMultiplier = 2.5;
               sizeBase = 4;
               ringEffect = true;
           } else if (evt.value >= 512) { // LEGENDARY
               particleCount = 30;
               speedMultiplier = 1.8;
               sizeBase = 3;
               ringEffect = true;
           } else if (evt.value >= 128) { // HIGH
               particleCount = 20;
               speedMultiplier = 1.4;
               sizeBase = 2.5;
           } else if (evt.value >= 32) { // MID
               particleCount = 15;
               speedMultiplier = 1.2;
           }

           // Boost particle count for combos
           let comboMultiplier = Math.min(2, 1 + (combo * 0.2));
           particleCount = Math.floor(particleCount * comboMultiplier);
           
           if (isMediumQuality) particleCount = Math.floor(particleCount * 0.6);

           const spawnX = (evt.x * cellSize) + (cellSize / 2);
           const spawnY = (evt.y * cellSize) + (cellSize / 2);

           // Main Burst
           for (let i = 0; i < particleCount; i++) {
               const angle = Math.random() * Math.PI * 2;
               // High tier particles move faster outward
               const velocity = (Math.random() * 4 + 2) * speedMultiplier; 
               
               particlesRef.current.push({
                   x: spawnX, 
                   y: spawnY, 
                   vx: Math.cos(angle) * velocity, 
                   vy: Math.sin(angle) * velocity, 
                   life: 1.0,
                   decay: Math.random() * 0.03 + 0.02, 
                   color: color, 
                   size: Math.random() * sizeBase + 1, 
                   rotation: Math.random() * Math.PI,
                   type: 'NORMAL'
               });
           }

           // Shockwave Ring (for High/God tiers)
           if (ringEffect && !isMediumQuality) {
               const ringCount = 20;
               for (let i = 0; i < ringCount; i++) {
                   const angle = (i / ringCount) * Math.PI * 2;
                   const speed = 6 * speedMultiplier;
                   particlesRef.current.push({
                       x: spawnX,
                       y: spawnY,
                       vx: Math.cos(angle) * speed,
                       vy: Math.sin(angle) * speed,
                       life: 0.8,
                       decay: 0.04,
                       color: '#ffffff',
                       size: 3,
                       rotation: angle,
                       type: 'RING' // Special type to potentially render differently
                   });
               }
           }
      });
  }, [mergeEvents, size, isLowQuality, isMediumQuality, combo]);

  useEffect(() => {
      if (isLowQuality) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const resize = () => {
          const parent = canvas.parentElement;
          if (parent) { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; }
      };
      resize();
      window.addEventListener('resize', resize);
      const render = () => {
          if (!ctx || !canvas) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'lighter';
          if (particlesRef.current.length === 0) { animationFrameRef.current = requestAnimationFrame(render); return; }
          for (let i = particlesRef.current.length - 1; i >= 0; i--) {
              const p = particlesRef.current[i];
              
              // Physics with friction
              p.x += p.vx; 
              p.y += p.vy; 
              p.vx *= 0.9; // Friction
              p.vy *= 0.9; // Friction
              
              p.life -= p.decay;
              
              if (p.life <= 0) { particlesRef.current.splice(i, 1); continue; }
              
              const flicker = Math.random() > 0.8 ? 1.5 : 1.0;
              ctx.globalAlpha = Math.min(1, p.life * p.life * flicker);
              ctx.fillStyle = p.color;
              
              ctx.save();
              ctx.translate(p.x, p.y); 
              ctx.rotate(p.life * 2 + p.rotation); 
              
              ctx.beginPath();
              
              if (p.type === 'RING') {
                  // Ring particles are dashes
                  ctx.rect(-p.size * 2, -p.size/2, p.size*4, p.size);
              } else {
                  // Star shape for more sparkle
                  const s = p.size * p.life; 
                  ctx.moveTo(0, -s); 
                  ctx.quadraticCurveTo(s * 0.5, -s * 0.5, s, 0); 
                  ctx.quadraticCurveTo(s * 0.5, s * 0.5, 0, s); 
                  ctx.quadraticCurveTo(-s * 0.5, s * 0.5, -s, 0); 
                  ctx.quadraticCurveTo(-s * 0.5, -s * 0.5, 0, -s);
              }
              
              ctx.closePath(); 
              ctx.fill(); 
              ctx.restore();
          }
          ctx.globalCompositeOperation = 'source-over';
          animationFrameRef.current = requestAnimationFrame(render);
      };
      render();
      return () => {
          window.removeEventListener('resize', resize);
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
  }, [isLowQuality]);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
        <div ref={containerRef} className="relative aspect-square max-h-full max-w-full m-auto group will-change-transform">
            {!isLowQuality && <div className={`absolute -inset-4 bg-gradient-to-r ${ambientGlowClass} rounded-3xl blur-2xl -z-10 transition-colors duration-500`}></div>}
            
            {/* Main Grid Container */}
            <div className={`relative w-full h-full bg-black/90 rounded-xl p-1 sm:p-2 border-2 border-slate-700/50 shadow-2xl overflow-hidden ${isLowQuality ? '' : 'backdrop-blur-md'}`}>
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                {backgroundCells}

                <div className="absolute inset-0 p-1 sm:p-2 z-10">
                    <div className="relative w-full h-full">
                        {grid.map((tile) => (
                        <TileComponent 
                        key={tile.id} 
                        tile={tile} 
                        gridSize={size} 
                        slideSpeed={slideSpeed} 
                        themeId={themeId} 
                        graphicsQuality={graphicsQuality} 
                        tilesetId={tilesetId} 
                        onInteract={onTileClick ? () => onTileClick(tile.id, tile.y) : undefined}
                        isFrozen={isHitstopping}
                        />
                        ))}
                    </div>
                </div>
                
                {!isLowQuality && <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none w-full h-full"></canvas>}
            </div>

            {/* Floating Text Layer - Uses Framer Motion for Smooth Travel Exit */}
            <div className="absolute inset-0 p-1 sm:p-2 pointer-events-none z-50">
                <div className="relative w-full h-full">
                    <AnimatePresence>
                        {lootEvents.map((loot) => {
                                const tileSize = 100 / size;
                                const top = loot.y * tileSize;
                                const left = loot.x * tileSize;
                                
                                let content = null;

                                if (loot.type === 'XP') {
                                    content = (
                                        <div className="fantasy-font font-black text-lg md:text-2xl text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] stroke-black" style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}>
                                            +{loot.value} XP
                                        </div>
                                    );
                                } else if (loot.type === 'GOLD') {
                                    content = (
                                        <div className="fantasy-font font-black text-lg md:text-2xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] flex items-center gap-1" style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}>
                                            +{loot.value} G
                                        </div>
                                    );
                                } else {
                                    // Item
                                    content = (
                                        <div className="flex items-center gap-1 px-2 py-1 rounded-full border shadow-lg bg-indigo-900/80 border-indigo-500 text-indigo-200 backdrop-blur-md">
                                            <span className="text-base">{loot.icon}</span>
                                            <span className="text-xs font-black whitespace-nowrap">{loot.value}</span>
                                        </div>
                                    );
                                }

                                return (
                                    <motion.div 
                                        key={loot.id} 
                                        initial={{ opacity: 0, y: 10, scale: 0.5 }}
                                        animate={{ opacity: 1, y: 0, scale: 1.2 }}
                                        exit={{ opacity: 0, y: -50, scale: 0.8, transition: { duration: 0.6, ease: "easeIn" } }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className="absolute flex flex-col items-center justify-center z-50" 
                                        style={{ width: `${tileSize}%`, height: `${tileSize}%`, top: `${top}%`, left: `${left}%` }}
                                    >
                                        {content}
                                    </motion.div>
                                );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    </div>
  );
});
