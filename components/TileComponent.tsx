
import React, { useState, useMemo } from 'react';
import { Tile, TileType } from '../types';
import { getTileStyle, BOSS_STYLE, FALLBACK_STYLE, RUNE_STYLES, BOSS_DEFINITIONS } from '../constants';

interface TileProps {
  tile: Tile;
  gridSize: number;
  slideSpeed: number;
  themeId?: string;
  lowPerformanceMode?: boolean;
}

export const TileComponent = React.memo(({ tile, gridSize, slideSpeed, themeId, lowPerformanceMode }: TileProps) => {
  // Memoize style calculation to prevent re-computation on every render
  const style = useMemo(() => {
      let s = getTileStyle(tile.value, themeId);
      
      if (tile.type === TileType.BOSS) {
          if (tile.bossThemeId && BOSS_DEFINITIONS[tile.bossThemeId]) {
              s = { ...BOSS_STYLE, ...BOSS_DEFINITIONS[tile.bossThemeId] };
          } else {
              s = BOSS_STYLE;
          }
      } else if (tile.type.startsWith('RUNE_')) {
          s = RUNE_STYLES[tile.type] || FALLBACK_STYLE;
      }
      return s;
  }, [tile.value, tile.type, tile.bossThemeId, themeId]);

  const [imgError, setImgError] = useState(false);
  
  const size = 100 / gridSize;
  const xPos = tile.x * 100;
  const yPos = tile.y * 100;

  // Reduced animations in low performance mode
  const isNewClass = !lowPerformanceMode && tile.isNew ? 'tile-animation-enter' : '';
  
  let mergeClass = '';
  let shakeClass = '';
  let showShockwave = false;
  let showGodwave = false;

  if (tile.mergedFrom) {
      if (tile.mergedFrom[0] === 'damage') {
          mergeClass = 'hit-flash'; 
          shakeClass = !lowPerformanceMode ? 'animate-shake-md' : '';
      } else {
          mergeClass = !lowPerformanceMode ? 'tile-animation-merge' : '';
          // Only show complex flash overlays if performance allows
          if (!lowPerformanceMode) mergeClass += ' upgrade-flash';
          
          if (!lowPerformanceMode) shakeClass = 'animate-shake-sm';

          if (tile.value >= 32 && !lowPerformanceMode) {
              showShockwave = true;
              shakeClass = 'animate-shake-md';
          }

          if (tile.value >= 512 && !lowPerformanceMode) {
              showGodwave = true;
              shakeClass = 'animate-shake-lg';
          }
      }
  }

  const ringColorClass = style.ringColor || 'ring-cyan-400';
  // Pulse animation is CSS heavy, disable in low perf
  // Intensified cascade marker: ring-4 instead of ring-2
  const isCascadeClass = tile.isCascade 
    ? `ring-4 ${ringColorClass} ring-offset-2 ring-offset-black ${lowPerformanceMode ? '' : 'animate-pulse'}` 
    : '';

  const isSlash = tile.mergedFrom && tile.value >= 32 && tile.mergedFrom[0] !== 'damage' ? 'slash-effect' : '';
  const healthPercent = tile.maxHealth ? Math.max(0, (tile.health || 0) / tile.maxHealth) * 100 : 0;
  const isHighTier = tile.value >= 512 && !lowPerformanceMode;

  // Dynamic Shadow Calculation
  const shadowColor = style.particleColor || '#000000';
  // Deep base shadow + Subtle colored ambient shadow (Reduced opacity from 50 to 20 hex ~ 12%)
  const boxDepthStyle = {
      boxShadow: `0 10px 20px -5px rgba(0, 0, 0, 0.8), 0 0 12px -2px ${shadowColor}20`
  };

  // Heavy black outline for text
  const textOutlineStyle = {
      textShadow: '2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 1px 1px #000, -1px -1px #000, 1px -1px #000, -1px 1px #000'
  };

  return (
    <div
      className={`absolute ease-in-out z-10 p-1`}
      style={{
        width: `${size}%`,
        height: `${size}%`,
        transform: `translate(${xPos}%, ${yPos}%)`,
        transitionDuration: `${slideSpeed}ms`
      }}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className={`w-full h-full relative ${isNewClass} ${mergeClass} group select-none`}>
        
        {showShockwave && (
             <div className="absolute inset-0 z-50 rounded-lg border-2 border-white/20 animate-[ping_0.3s_cubic-bezier(0,0,0.2,1)_1] pointer-events-none"></div>
        )}
        
        {showGodwave && (
             <div className="absolute inset-0 z-[60] rounded-xl animate-godwave pointer-events-none"></div>
        )}

        <div className={`w-full h-full ${shakeClass}`}>
            <div 
                className={`w-full h-full rounded-lg overflow-hidden relative bg-[#0b0f19] ${isCascadeClass} ${isSlash}`}
                style={boxDepthStyle}
            >
                
                {isHighTier && (
                    <div className="absolute inset-0 z-20 pointer-events-none rounded-lg overflow-hidden">
                        <div className="absolute inset-0 border border-yellow-400/30 rounded-lg"></div>
                        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-[shimmer_4s_infinite_linear]"></div>
                    </div>
                )}

                {/* Glow Container - Expensive opacity transition */}
                {!lowPerformanceMode && (
                    <div className={`absolute inset-0 transition-opacity duration-300 ${style.glow} opacity-0 group-hover:opacity-100`}></div>
                )}

                <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-80`}></div>

                {!imgError && style.imageUrl && (
                    <img 
                        src={style.imageUrl} 
                        alt={style.label}
                        loading="lazy" 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-60 mix-blend-overlay`}
                        onError={() => setImgError(true)}
                    />
                )}

                <div className={`absolute inset-0 border-2 ${style.ringColor.replace('ring-', 'border-')} opacity-50 rounded-lg`}></div>

                <div className="absolute inset-0 flex flex-col justify-between p-1 z-10">
                    {tile.value > 0 ? (
                        <>
                            <div className="flex-1 flex items-center justify-center pt-2">
                                <span 
                                    className="fantasy-font font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-none z-20"
                                    style={textOutlineStyle}
                                >
                                    {tile.value}
                                </span>
                            </div>
                            <div className="w-full flex justify-center pb-1">
                                <div className={`px-2 py-0.5 rounded ${lowPerformanceMode ? 'bg-black/80' : 'bg-black/60 backdrop-blur-[2px]'} border border-white/10`}>
                                    <span className="block text-[8px] sm:text-[9px] font-serif font-bold text-slate-200 uppercase tracking-widest leading-none">
                                        {style.label}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] transform group-hover:scale-110 transition-transform duration-300 mb-1">
                                {style.icon === '💀' && style.label !== 'BOSS' ? '' : style.icon} 
                            </span>
                             <span className="text-[8px] sm:text-[10px] font-bold text-white/90 uppercase tracking-widest drop-shadow-md bg-black/30 px-2 rounded">
                                {style.label}
                            </span>
                        </div>
                    )}

                    {tile.type === TileType.BOSS && tile.health !== undefined && (
                        <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-black/80 rounded-full overflow-hidden border border-red-900/50">
                            <div 
                                className="h-full bg-red-600 transition-all duration-300"
                                style={{ width: `${healthPercent}%` }}
                            ></div>
                        </div>
                    )}
                </div>

                {!lowPerformanceMode && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
    // Custom comparison for performance optimization
    // Only re-render if tile properties that affect display change
    return (
        prev.tile.id === next.tile.id &&
        prev.tile.value === next.tile.value &&
        prev.tile.x === next.tile.x &&
        prev.tile.y === next.tile.y &&
        prev.tile.type === next.tile.type &&
        prev.tile.mergedFrom === next.tile.mergedFrom &&
        prev.tile.isNew === next.tile.isNew &&
        prev.tile.isCascade === next.tile.isCascade &&
        prev.tile.health === next.tile.health &&
        prev.gridSize === next.gridSize &&
        prev.slideSpeed === next.slideSpeed &&
        prev.themeId === next.themeId &&
        prev.lowPerformanceMode === next.lowPerformanceMode
    );
});
