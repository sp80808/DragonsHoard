
import React from 'react';
import { Play, Trophy, Settings, Palette } from 'lucide-react';

interface SplashScreenProps {
  onStart: () => void;
  onContinue: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
  onOpenCosmetics: () => void;
  hasSave: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onStart, onContinue, onOpenLeaderboard, onOpenSettings, onOpenCosmetics, hasSave }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Background with slow zoom */}
      <div 
        className="absolute inset-0 opacity-40 animate-[pulse_10s_ease-in-out_infinite]"
        style={{
            backgroundImage: `url('https://image.pollinations.ai/prompt/dark fantasy dragon hoard dungeon treasure pile cinematic lighting atmospheric?width=1024&height=1024&nologo=true')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: 'scale(1.1)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-amber-500 to-red-600 fantasy-font drop-shadow-[0_4px_10px_rgba(0,0,0,1)] text-center mb-2 tracking-wider">
          DRAGON'S<br/>HOARD
        </h1>
        <p className="text-slate-400 tracking-[0.2em] text-sm md:text-base mb-12 uppercase font-serif">
          The Dungeon Awaits
        </p>
        
        <div className="flex flex-col gap-4 w-64">
          {hasSave && (
            <button 
                onClick={onContinue}
                className="w-full py-4 bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-white font-bold rounded-lg border border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2 transition-all transform hover:scale-105"
            >
                <Play size={20} fill="currentColor" /> CONTINUE
            </button>
          )}

          <button 
            onClick={onStart}
            className={`w-full py-4 font-bold rounded-lg border flex items-center justify-center gap-2 transition-all transform hover:scale-105
                ${hasSave 
                    ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800' 
                    : 'bg-gradient-to-r from-amber-700 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 text-white border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.4)]'}
            `}
          >
            {hasSave ? "NEW GAME" : <><Play size={20} fill="currentColor" /> NEW GAME</>}
          </button>

          <div className="flex gap-4">
              <button
                onClick={onOpenLeaderboard}
                className="flex-1 py-3 bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-yellow-400 hover:border-yellow-500 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Trophy size={18} /> Scores
              </button>
              <button
                onClick={onOpenSettings}
                className="flex-1 py-3 bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:border-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Settings size={18} /> Settings
              </button>
            </div>

            <button
              onClick={onOpenCosmetics}
              className="w-full py-3 bg-purple-900/80 border border-purple-700 text-purple-300 hover:text-purple-100 hover:border-purple-500 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Palette size={18} /> Cosmetics
            </button>
        </div>

        <div className="mt-16 text-xs text-slate-600 font-mono">v1.3.0 // React 2048 RPG</div>
      </div>
    </div>
  );
};
