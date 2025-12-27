
import React, { useState, useMemo } from 'react';
import { Tile, TileType, GraphicsQuality } from '../types';
import { getTileStyle, BOSS_STYLE, FALLBACK_STYLE, RUNE_STYLES, BOSS_DEFINITIONS, STONE_STYLE } from '../constants';

interface TileProps {
  tile: Tile;
  gridSize: number;
  slideSpeed: number;
  themeId?: string;
  graphicsQuality?: GraphicsQuality;
  tilesetId?: string;
  lowPerformanceMode?: boolean; // Legacy prop
  onInteract?: () => void;
}

export const TileComponent = React.memo(({ tile, gridSize, slideSpeed, themeId, graphicsQuality = 'HIGH', tilesetId = 'DEFAULT', lowPerformanceMode, onInteract }: TileProps) => {
  // Backward compatibility
  const isLowQuality = graphicsQuality === 'LOW' || lowPerformanceMode === true;
  const isHighQuality = graphicsQuality === 'HIGH' && !lowPerformanceMode;

  const style = useMemo(() => {
      let s = getTileStyle(tile.value, themeId, tilesetId);
      
      if (tile.type === TileType.BOSS) {
          if (tile.bossThemeId && BOSS_DEFINITIONS[tile.bossThemeId]) {
              s = { ...BOSS_STYLE, ...BOSS_DEFINITIONS[tile.bossThemeId] };
          } else {
              s = BOSS_STYLE;
          }
      } else if (tile.type.startsWith('RUNE_')) {
          s = RUNE_STYLES[tile.type] || FALLBACK_STYLE;
      } else if (tile.type === TileType.STONE) {
          s = STONE_STYLE;
      }
      return s;
  }, [tile.value, tile.type, tile.bossThemeId, themeId, tilesetId]);

  const [imgError, setImgError] = useState(false);
  
  const size = 100 / gridSize;
  const xPos = tile.x * 100;
  const yPos = tile.y * 100;

  const isNewClass = !isLowQuality && tile.isNew ? 'tile-animation-enter' : '';
  const isDyingClass = tile.isDying ? 'tile-exit-animation' : ''; // New explicit exit animation
  
  let mergeClass = '';
  let shakeClass = '';
  let showShockwave = false;
  let showGodwave = false;
  let showRipple = false;

  if (tile.mergedFrom) {
      if (tile.mergedFrom[0] === 'damage') {
          mergeClass = 'hit-flash'; 
          shakeClass = !isLowQuality ? 'animate-shake-md' : '';
      } else {
          // Tiered Merge Animations
          if (!isLowQuality) {
              // Default
              mergeClass = 'tile-animation-merge';
              shakeClass = 'animate-shake-sm';
              showRipple = true;

              // Heavy (32 - 256)
              if (tile.value >= 32) {
                  mergeClass = 'tile-animation-merge-heavy';
                  showShockwave = isHighQuality;
                  shakeClass = 'animate-shake-md';
              }

              // Epic (512+)
              if (tile.value >= 512) {
                  mergeClass = 'tile-animation-merge-epic';
                  showGodwave = isHighQuality;
                  shakeClass = 'animate-shake-lg';
              }
          }
      }
  }

  const ringColorClass = style.ringColor || 'ring-cyan-400';
  const isCascadeClass = tile.isCascade 
    ? `ring-2 ${ringColorClass} ring-offset-1 ring-offset-black ${isLowQuality ? '' : 'animate-pulse'}` 
    : '';

  const isSlash = tile.mergedFrom && tile.value >= 32 && tile.mergedFrom[0] !== 'damage' ? 'slash-effect' : '';
  const healthPercent = tile.maxHealth ? Math.max(0, (tile.health || 0) / tile.maxHealth) * 100 : 0;
  const isHighTier = tile.value >= 128 && !isLowQuality;
  const isGodTier = tile.value >= 2048 && !isLowQuality;
  const isMetallic = tile.value >= 128; // Add gradient text for 128+

  const shadowColor = style.particleColor || '#000000';
  
  // Enhanced 3D Bezel with Color Depth (Only High/Med)
  const boxDepthStyle = isLowQuality ? {} : {
      boxShadow: isHighTier 
        ? `0 0 15px ${shadowColor}30, inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.4)`
        : `0 4px 12px ${shadowColor}40, inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.4)`
  };

  // Modern RPG Typography with potential metallic gradient
  const textGradientClass = isGodTier ? 'bg-gradient-to-b from-yellow-100 via-amber-200 to-yellow-500 text-transparent bg-clip-text' : 
                            isMetallic ? 'bg-gradient-to-b from-white via-slate-100 to-slate-400 text-transparent bg-clip-text' : 'text-white';

  const textStyle = {
      filter: isMetallic ? 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' : 'drop-shadow(0 3px 3px rgba(0,0,0,0.8))',
      WebkitTextStroke: isMetallic ? '0px' : '1px rgba(0,0,0,0.4)', 
      paintOrder: 'stroke fill'
  };

  // Living Tile Animation Class
  const livingClass = isHighQuality ? (isGodTier ? 'animate-living-fast' : isHighTier ? 'animate-living-slow' : '') : '';

  // Dying tiles should be behind normal ones to allow "merging into" effect
  const zIndex = tile.isDying ? 5 : 10;

  return (
    <div
      className={`absolute ease-in-out p-1 transition-transform will-change-transform cursor-pointer ${isDyingClass}`}
      onClick={(e) => {
          if (onInteract) {
              e.stopPropagation();
              onInteract();
          }
      }}
      style={{
        width: `${size}%`,
        height: `${size}%`,
        transform: `translate(${xPos}%, ${yPos}%)`,
        transitionDuration: `${slideSpeed}ms`,
        zIndex: zIndex
      }}
    >
      <div className={`w-full h-full relative ${isNewClass} ${mergeClass} group select-none`}>
        
        {/* Satisfying merge ripple - using border for cleaner expansion */}
        {showRipple && !isLowQuality && (
             <div className={`absolute inset-0 z-0 rounded-xl border-2 ${style.ringColor.replace('ring-', 'border-')} animate-ripple pointer-events-none mix-blend-screen`}></div>
        )}

        {showShockwave && (
             <div className="absolute inset-0 z-50 rounded-lg border-4 border-white/40 animate-[ping_0.4s_ease-out_1] pointer-events-none mix-blend-overlay"></div>
        )}
        
        {showGodwave && (
             <div className="absolute inset-0 z-[60] rounded-xl animate-godwave pointer-events-none mix-blend-screen"></div>
        )}

        <div className={`w-full h-full ${shakeClass}`}>
            <div 
                className={`w-full h-full rounded-lg overflow-hidden relative bg-[#0b0f19] ${isCascadeClass} ${isSlash}`}
                style={boxDepthStyle}
            >
                
                {/* Dynamic Shine/Facets for High Tiers */}
                {isHighQuality && isHighTier && (
                    <>
                        <div className="absolute inset-0 z-20 pointer-events-none facet-overlay rounded-lg"></div>
                        <div className="absolute inset-0 border border-white/20 rounded-lg z-20"></div>
                    </>
                )}

                {/* God Tier Pulse */}
                {isHighQuality && isGodTier && (
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-yellow-500/30 to-transparent animate-pulse mix-blend-overlay"></div>
                )}

                {/* Glow Container */}
                {isHighQuality && (
                    <div className={`absolute inset-0 transition-opacity duration-300 ${style.glow} opacity-30 group-hover:opacity-60`}></div>
                )}

                {/* Gradient Background with Living Animation */}
                <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-90 ${livingClass}`}></div>

                {/* Texture/Image */}
                {!imgError && style.imageUrl && (
                    <img 
                        src={style.imageUrl} 
                        alt={style.label}
                        loading="lazy" 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 opacity-60 mix-blend-overlay`}
                        onError={() => setImgError(true)}
                    />
                )}

                {/* Inner Border Highlight */}
                <div className={`absolute inset-0 border border-white/10 rounded-lg pointer-events-none`}></div>
                <div className={`absolute inset-0 border-2 ${style.ringColor.replace('ring-', 'border-')} opacity-20 rounded-lg mix-blend-screen`}></div>

                <div className="absolute inset-0 flex flex-col justify-between p-1 z-10">
                    {tile.value > 0 ? (
                        <>
                            <div className="flex-1 flex items-center justify-center pt-2 relative">
                                {/* Back Glow for Text readability */}
                                {isHighQuality && <div className="absolute inset-0 bg-radial-gradient from-black/60 to-transparent opacity-60 blur-md scale-75"></div>}
                                
                                <span 
                                    className={`fantasy-font font-black text-4xl sm:text-5xl lg:text-6xl leading-none z-20 tracking-wide ${textGradientClass}`}
                                    style={textStyle}
                                >
                                    {tile.value}
                                </span>
                            </div>
                            <div className="w-full flex justify-center pb-1">
                                <div className={`px-2 py-0.5 rounded-full ${isLowQuality ? 'bg-black/80' : 'bg-black/60 backdrop-blur-sm'} border border-white/10 shadow-lg`}>
                                    <span className="block text-[7px] sm:text-[8px] font-serif font-bold text-slate-200 uppercase tracking-[0.2em] leading-none text-shadow-sm">
                                        {style.label}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <span className="text-3xl sm:text-4xl filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] transform group-hover:scale-110 transition-transform duration-300 mb-1">
                                {style.icon === '💀' && style.label !== 'BOSS' ? '' : style.icon} 
                            </span>
                             <span className="text-[8px] sm:text-[10px] font-bold text-white/90 uppercase tracking-widest drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                                {style.label}
                            </span>
                        </div>
                    )}

                    {tile.type === TileType.BOSS && tile.health !== undefined && (
                        <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-gray-900/80 rounded-full overflow-hidden border border-red-900/50 shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-300"
                                style={{ width: `${healthPercent}%` }}
                            ></div>
                        </div>
                    )}
                </div>

                {isHighQuality && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/30 pointer-events-none rounded-lg"></div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
});
