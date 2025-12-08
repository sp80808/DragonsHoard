import React from 'react';

interface ComboCounterProps {
  combo: number;
  multiplier: number;
  isActive: boolean;
}

export const ComboCounter: React.FC<ComboCounterProps> = ({ combo, multiplier, isActive }) => {
  if (!isActive || combo < 2) return null;

  const getComboText = () => {
    if (combo >= 10) return 'GODLIKE!';
    if (combo >= 8) return 'AMAZING!';
    if (combo >= 5) return 'NICE!';
    return 'COMBO!';
  };

  const getComboColor = () => {
    if (combo >= 10) return 'from-yellow-400 to-red-500';
    if (combo >= 8) return 'from-orange-400 to-red-400';
    if (combo >= 5) return 'from-yellow-300 to-orange-400';
    return 'from-cyan-400 to-blue-400';
  };

  const getGlowColor = () => {
    if (combo >= 10) return 'shadow-yellow-500/80';
    if (combo >= 8) return 'shadow-orange-500/60';
    if (combo >= 5) return 'shadow-yellow-400/50';
    return 'shadow-cyan-400/40';
  };

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
      {/* Combo Ring */}
      <div className={`absolute inset-0 w-32 h-32 rounded-full border-2 border-transparent bg-gradient-to-r ${getComboColor()} bg-clip-border opacity-30 animate-pulse`} />

      {/* Combo Counter */}
      <div className={`relative w-32 h-32 flex flex-col items-center justify-center`}>
        <div className={`text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r ${getComboColor()} drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce`}>
          {combo}x
        </div>
        <div className={`text-sm font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${getComboColor()} drop-shadow-md mt-1`}>
          {getComboText()}
        </div>
      </div>

      {/* Multiplier Badge */}
      <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r ${getComboColor()} text-white text-xs font-bold shadow-lg ${getGlowColor()}`}>
        {multiplier.toFixed(1)}× Multiplier
      </div>

      {/* Particle Ring */}
      <div className="absolute inset-0 w-32 h-32 rounded-full">
        {Array.from({ length: combo }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gradient-to-r from-yellow-300 to-orange-400 animate-pulse"
            style={{
              left: `${16 + 14 * Math.cos((i / combo) * Math.PI * 2)}px`,
              top: `${16 + 14 * Math.sin((i / combo) * Math.PI * 2)}px`,
              animationDelay: `${i * 50}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
};
