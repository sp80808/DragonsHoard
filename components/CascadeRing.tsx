import React from 'react';

interface CascadeRingProps {
  cascadeCount: number;
  isActive: boolean;
  maxCascades?: number;
}

export const CascadeRing: React.FC<CascadeRingProps> = ({ 
  cascadeCount, 
  isActive,
  maxCascades = 8 
}) => {
  if (!isActive || cascadeCount === 0) return null;

  const getColor = () => {
    if (cascadeCount >= 7) return '#ffffff'; // White
    if (cascadeCount >= 5) return '#fbbf24'; // Gold
    if (cascadeCount >= 3) return '#a855f7'; // Purple
    return '#06b6d4'; // Cyan
  };

  const getMessage = () => {
    if (cascadeCount >= 7) return 'GODLIKE CASCADE!';
    if (cascadeCount >= 5) return 'AMAZING CASCADE!';
    if (cascadeCount >= 3) return 'NICE CASCADE!';
    return `CASCADE ×${cascadeCount}!`;
  };

  const progress = (cascadeCount / maxCascades) * 100;
  const color = getColor();

  return (
    <div className="fixed top-20 right-4 z-40 pointer-events-none animate-in fade-in slide-in-from-right-4">
      {/* Ring Container */}
      <div className="relative w-20 h-20">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgba(148, 163, 184, 0.2)"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${progress * 2.83} 283`}
            className="transition-all duration-300"
            style={{
              filter: `drop-shadow(0 0 8px ${color})`
            }}
          />
        </svg>
        
        {/* Cascade Count */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ color }}
        >
          <span className="text-2xl font-black glow-pulse">
            {cascadeCount}×
          </span>
        </div>
      </div>

      {/* Message */}
      <div 
        className="mt-2 text-center text-xs font-bold uppercase tracking-wider shimmer-highlight"
        style={{ color }}
      >
        {getMessage()}
      </div>

      {/* Multiplier Info */}
      <div className="mt-1 text-center text-xs text-slate-400">
        +{(cascadeCount * 10)}% Rewards
      </div>
    </div>
  );
};
