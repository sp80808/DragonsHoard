
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
  isFrozen?: boolean; // New prop for hitstop
}

export const TileComponent = React.memo(({ tile, gridSize, slideSpeed, themeId, graphicsQuality = 'HIGH', tilesetId = 'DEFAULT', lowPerformanceMode, onInteract, isFrozen = false }: TileProps) => {
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
  
  if (tile.x === undefined || tile.y === undefined) return null; // Safety check

  const size = 100 / gridSize;
  const xPos = tile.x * 100;
  const yPos = tile.y * 100;

  // UPDATED: Using 'animate-spawn-tint' for dynamic color spawn
  // If frozen, we suppress animations to keep it static
  const isNewClass = !isLowQuality && tile.isNew && !tile.mergedFrom && !isFrozen ? 'animate-spawn-tint' : '';
  const isDyingClass = tile.isDying && !isFrozen ? 'tile-exit-animation' : ''; 
  
  const animDelay = (tile.isNew || tile.mergedFrom) ? `${Math.max(100, slideSpeed * 0.9)}ms` : '0ms';

  let mergeClass = '';
  let shakeClass = '';
  let showShockwave = false;
  let showGodwave = false;
  let showRipple = false;

  if (tile.mergedFrom) {
      if (tile.mergedFrom[0] === 'damage') {
          mergeClass = 'hit-flash'; 
          shakeClass = !isLowQuality && !isFrozen ? 'animate-shake-md' : '';
      } else if (!isFrozen) { // Only apply merge animations if not frozen
          // Tiered Merge Animations
          if (!isLowQuality) {
              mergeClass = 'tile-animation-merge';
              shakeClass = 'animate-shake-sm';
              showRipple = true;

              if (tile.value >= 64) {
                  mergeClass = 'tile-animation-merge-mid';
                  shakeClass = 'animate-shake-md';
              }
              if (tile.value >= 256) {
                  mergeClass = 'tile-animation-merge-high';
                  showShockwave = isHighQuality;
                  shakeClass = 'animate-shake-md';
                  showRipple = false; 
              }
              if (tile.value >= 1024) {
                  mergeClass = 'tile-animation-merge-epic';
                  showShockwave = true;
                  shakeClass = 'animate-shake-lg';
              }
              if (tile.value >= 2048) {
                  mergeClass = 'tile-animation-merge-god';
                  showGodwave = true;
                  shakeClass = 'animate-shake-lg';
              }
          }
      }
  }

  const ringColorClass = style.ringColor || 'ring-cyan-400';
  const isCascadeClass = tile.isCascade 
    ? `ring-2 ${ringColorClass} ring-offset-1 ring-offset-black ${isLowQuality || isFrozen ? '' : 'animate-pulse'}` 
    : '';

  const isSlash = tile.mergedFrom && tile.value >= 32 && tile.mergedFrom[0] !== 'damage' ? 'slash-effect' : '';
  const healthPercent = tile.maxHealth ? Math.max(0, (tile.health || 0) / tile.maxHealth) * 100 : 0;
  const isHighTier = tile.value >= 128 && !isLowQuality;
  const isGodTier = tile.value >= 2048 && !isLowQuality;
  const isMetallic = tile.value >= 128;

  const shadowColor = style.particleColor || '#ffffff';
  
  // Inject the specific tile color into CSS variable for the animation to use
  const dynamicStyle = {
      '--tile-color': shadowColor,
      width: `${size}%`,
      height: `${size}%`,
      transform: `translate(${xPos}%, ${yPos}%)`,
      // Instant transition if frozen to snap to place, otherwise smooth slide
      transitionDuration: isFrozen ? '0ms' : `${slideSpeed}ms`, 
      zIndex: tile.isDying ? 5 : 10,
      // If frozen, pause all child animations or remove them? Removing via class is safer.
  } as React.CSSProperties;

  const boxDepthStyle = isLowQuality ? {} : {
      boxShadow: isHighTier 
        ? `0 0 15px ${shadowColor}30, inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.4)`
        : `0 4px 12px ${shadowColor}40, inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -2px 0 rgba(0, 0, 0, 0.4)`
  };

  const textGradientClass = isGodTier ? 'bg-gradient-to-b from-yellow-100 via-amber-200 to-yellow-500 text-transparent bg-clip-text' : 
                            isMetallic ? 'bg-gradient-to-b from-white via-slate-100 to-slate-400 text-transparent bg-clip-text' : 'text-white';

  const textStyle = {
      filter: isMetallic ? 'drop-shadow(0 2px 2px rgba(0,0,0,0.8))' : 'drop-shadow(0 3px 3px rgba(0,0,0,0.8))',
      WebkitTextStroke: isMetallic ? '0px' : '1px rgba(0,0,0,0.4)', 
      paintOrder: 'stroke fill'
  };

  const livingClass = isHighQuality && !isFrozen ? (isGodTier ? 'animate-living-fast' : isHighTier ? 'animate-living-slow' : '') : '';

  return (
    <div
      className={`absolute ease-in-out p-1 transition-transform will-change-transform cursor-pointer`}
      onClick={(e) => {
          if (onInteract) {
              e.stopPropagation();
              onInteract();
          }
      }}
      style={dynamicStyle}
    >
      <div 
        className={`w-full h-full relative ${isNewClass} ${isDyingClass} ${mergeClass} group select-none`}
        style={{ animationDelay: animDelay }}
      >
        
        {/* NEW SPAWN FLASH: Dynamic Color Tint */}
        {tile.isNew && !tile.mergedFrom && !isLowQuality && !isFrozen && (
            <div 
                className="absolute inset-[-20%] animate-summon-flash z-50 pointer-events-none rounded-full mix-blend-screen blur-md"
                style={{ animationDelay: animDelay }}
            ></div>
        )}

        {/* Boss Spawn Effect: Lightning & Flash */}
        {tile.type === TileType.BOSS && tile.isNew && !isLowQuality && !isFrozen && (
             <div className="absolute inset-0 z-50 pointer-events-none overflow-visible">
                 <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-1 h-[140%] bg-cyan-200 blur-[2px] animate-[lightning_0.4s_ease-out_forwards]"></div>
                 <div className="absolute inset-0 bg-white/80 animate-[flash_0.6s_ease-out_forwards] rounded-lg mix-blend-overlay"></div>
             </div>
        )}

        {/* Boss Damage Red Flash Overlay */}
        {tile.type === TileType.BOSS && tile.mergedFrom && tile.mergedFrom[0] === 'damage' && !isFrozen && (
             <div 
                className="absolute inset-0 z-[60] rounded-lg animate-[summonFlash_0.15s_ease-out_forwards] pointer-events-none mix-blend-hard-light"
                style={{ '--tile-color': '#ef4444' } as React.CSSProperties}
             ></div>
        )}

        {/* Satisfying merge ripple */}
        {showRipple && !isLowQuality && !isFrozen && (
             <div className={`absolute inset-0 z-0 rounded-xl border-2 ${style.ringColor.replace('ring-', 'border-')} animate-ripple pointer-events-none mix-blend-screen`}></div>
        )}

        {showShockwave && !isFrozen && (
             <div className="absolute inset-0 z-50 rounded-lg border-4 border-white/40 animate-[ping_0.4s_ease-out_1] pointer-events-none mix-blend-overlay"></div>
        )}
        
        {showGodwave && !isFrozen && (
             <div className="absolute inset-0 z-[60] rounded-xl animate-godwave pointer-events-none mix-blend-screen"></div>
        )}

        <div className={`w-full h-full ${shakeClass}`}>
            <div 
                className={`w-full h-full rounded-lg overflow-hidden relative bg-[#0b0f19] ${isCascadeClass} ${isSlash}`}
                style={boxDepthStyle}
            >
                {/* Hitstop Glare: Visual tension during freeze */}
                {isFrozen && (
                    <div className="absolute inset-0 bg-white/20 z-50 mix-blend-overlay"></div>
                )}

                {/* Dynamic Shine/Facets for High Tiers */}
                {isHighQuality && isHighTier && (
                    <>
                        <div className="absolute inset-0 z-20 pointer-events-none facet-overlay rounded-lg"></div>
                        <div className="absolute inset-0 border border-white/20 rounded-lg z-20"></div>
                    </>
                )}

                {/* God Tier Pulse */}
                {isHighQuality && isGodTier && !isFrozen && (
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
                                    className={`fantasy-font font-black text-3xl sm:text-4xl lg:text-5xl leading-none z-20 tracking-wide ${textGradientClass}`}
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
