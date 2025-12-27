
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DynamicBackgroundProps {
  score: number;
}

type Biome = 'OUTSKIRTS' | 'THRESHOLD' | 'HALL' | 'LIBRARY' | 'HOARD' | 'ABYSS';

const BIOMES: { id: Biome; threshold: number; colors: string[]; name: string }[] = [
  { id: 'ABYSS', threshold: 25000, colors: ['#020617', '#1e1b4b', '#4c1d95'], name: 'The Eternal Void' },
  { id: 'HOARD', threshold: 15000, colors: ['#451a03', '#b45309', '#f59e0b'], name: 'The Dragon\'s Hoard' },
  { id: 'LIBRARY', threshold: 8000, colors: ['#2e1065', '#581c87', '#9333ea'], name: 'The Whispering Archive' },
  { id: 'HALL', threshold: 3000, colors: ['#1e1b4b', '#312e81', '#4c1d95'], name: 'The Echoing Hall' },
  { id: 'THRESHOLD', threshold: 1000, colors: ['#1c1917', '#44403c', '#57534e'], name: 'The Stone Threshold' },
  { id: 'OUTSKIRTS', threshold: 0, colors: ['#022c22', '#064e3b', '#0f172a'], name: 'Misty Outskirts' },
];

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ score }) => {
  const currentBiome = useMemo(() => {
    return BIOMES.find(b => score >= b.threshold) || BIOMES[BIOMES.length - 1];
  }, [score]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Removed mode="wait" to allow cross-fading overlap, preventing black flashes */}
      <AnimatePresence>
        <motion.div
          key={currentBiome.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
          style={{
            background: `linear-gradient(to bottom, ${currentBiome.colors[0]}, ${currentBiome.colors[1]}, ${currentBiome.colors[2]})`
          }}
        >
          {/* Layered Atmospheric Effects based on Biome */}
          
          {currentBiome.id === 'OUTSKIRTS' && (
            <>
              {/* Seamless Fog Layer */}
              <div className="absolute inset-0 bg-fog-layer opacity-40 mix-blend-screen bg-[length:100%_100%]"></div>
              <div className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-[pulse_10s_infinite]"></div>
            </>
          )}

          {currentBiome.id === 'THRESHOLD' && (
            <>
              {/* Rock Texture Overlay */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-stone.png')] opacity-30 mix-blend-multiply"></div>
              {/* Torchlight Flickers on Edges */}
              <div className="absolute inset-0 bg-torch-light mix-blend-hard-light"></div>
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-orange-900/20 to-transparent animate-pulse"></div>
            </>
          )}

          {currentBiome.id === 'HALL' && (
            <>
              {/* Pillar Silhouettes (CSS Gradients) */}
              <div 
                className="absolute inset-0 opacity-40 mix-blend-multiply" 
                style={{ 
                    backgroundImage: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.8) 100%), repeating-linear-gradient(90deg, transparent 0, transparent 100px, rgba(0,0,0,0.5) 100px, rgba(0,0,0,0.5) 120px)' 
                }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-black/60"></div>
              <div className="absolute top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
            </>
          )}

          {currentBiome.id === 'LIBRARY' && (
            <>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20 mix-blend-multiply"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/40 via-transparent to-purple-900/40"></div>
              {/* Floating dust/magic */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse"></div>
            </>
          )}

          {currentBiome.id === 'HOARD' && (
            <>
              <div className="absolute inset-0 bg-gold-shimmer mix-blend-overlay opacity-30"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/gold-scale.png')] opacity-20 mix-blend-color-dodge"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-600/30 via-transparent to-amber-500/20"></div>
              {/* Sparkles */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 animate-pulse"></div>
            </>
          )}

          {currentBiome.id === 'ABYSS' && (
            <>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 animate-spin-slow mix-blend-overlay"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-900 to-black opacity-90"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-3xl animate-pulse"></div>
              </div>
            </>
          )}

          {/* Vignette for focus */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
        </motion.div>
      </AnimatePresence>
      
      {/* Biome Name Toast */}
      <div className="absolute bottom-4 left-0 w-full flex justify-center opacity-50">
          <span className="text-[10px] uppercase tracking-[0.5em] text-white/50 font-serif shadow-black drop-shadow-md">
              {currentBiome.name}
          </span>
      </div>
    </div>
  );
};
