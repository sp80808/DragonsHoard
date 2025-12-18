
import React from 'react';
import { ArrowLeft, Lock, CheckCircle, Palette, Flame, Ghost, Grid, Droplets, Zap, Star, Settings, Sword, Heart } from 'lucide-react';
import { PlayerProfile } from '../types';
import { THEME_STYLES } from '../constants';
import { setActiveTileset } from '../services/storageService';

interface GrimoireProps {
  profile: PlayerProfile;
  onBack: () => void;
  onSelectTileset: (id: string) => void;
}

export const Grimoire: React.FC<GrimoireProps> = ({ profile, onBack, onSelectTileset }) => {
  const themes = [
    { id: 'DEFAULT', name: 'Classic Runic', desc: 'The standard dungeon aesthetic.', icon: <Grid size={24} />, reqLevel: 0, unlocked: true },
    { id: 'UNDEAD', name: 'Necrotic Rot', desc: 'Rot, skulls, and spirits.', icon: <Ghost size={24} />, reqLevel: 8, unlocked: profile.unlockedFeatures.includes('TILESET_UNDEAD') },
    { id: 'INFERNAL', name: 'Infernal Core', desc: 'Demons born of fire and brimstone.', icon: <Flame size={24} />, reqLevel: 15, unlocked: profile.unlockedFeatures.includes('TILESET_INFERNAL') },
    { id: 'AQUATIC', name: 'Abyssal Depth', desc: 'Monsters from the deep sea.', icon: <Droplets size={24} />, reqLevel: 25, unlocked: profile.unlockedFeatures.includes('TILESET_AQUATIC') },
    { id: 'CYBERPUNK', name: 'Neon City', desc: 'High-tech droids and chips.', icon: <Zap size={24} />, reqLevel: 35, unlocked: profile.unlockedFeatures.includes('TILESET_CYBERPUNK') },
    { id: 'STEAMPUNK', name: 'Clockwork', desc: 'Brass gears and steam engines.', icon: <Settings size={24} />, reqLevel: 45, unlocked: profile.unlockedFeatures.includes('TILESET_STEAMPUNK') },
    { id: 'CELESTIAL', name: 'Divine Light', desc: 'Angels and holy entities.', icon: <Star size={24} />, reqLevel: 50, unlocked: profile.unlockedFeatures.includes('TILESET_CELESTIAL') },
    { id: 'FEUDAL', name: 'Ronin Path', desc: 'Samurai, oni, and ancient spirits.', icon: <Sword size={24} />, reqLevel: 55, unlocked: profile.unlockedFeatures.includes('TILESET_FEUDAL') },
    { id: 'CANDY', name: 'Sugar Rush', desc: 'Sweet treats with a bitter bite.', icon: <Heart size={24} />, reqLevel: 60, unlocked: profile.unlockedFeatures.includes('TILESET_CANDY') }
  ];

  const handleSelect = (id: string) => {
      setActiveTileset(id);
      onSelectTileset(id);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center bg-slate-950 text-slate-200 p-4 overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="w-full max-w-4xl flex flex-col h-full bg-slate-900/80 rounded-xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-900/95">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-500 fantasy-font flex items-center gap-3">
            <Palette size={28} className="text-indigo-400"/> Grimoire of Visuals
          </h2>
          <div className="w-10"></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
            
            <section>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Grid size={20} className="text-indigo-400"/> Monster Aesthetics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {themes.map(theme => {
                        const isActive = profile.activeTilesetId === theme.id;
                        const styleSet = THEME_STYLES[theme.id];
                        // Get preview image (Rank 4/8/16 usually good)
                        const previewTile = styleSet[16] || styleSet[8]; 

                        return (
                            <button 
                                key={theme.id}
                                disabled={!theme.unlocked}
                                onClick={() => handleSelect(theme.id)}
                                className={`relative group flex flex-col text-left rounded-2xl border-2 transition-all duration-300 overflow-hidden
                                    ${isActive ? 'border-indigo-500 bg-indigo-900/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 
                                      theme.unlocked ? 'border-slate-700 bg-slate-900/40 hover:border-slate-500 hover:bg-slate-800' : 'border-slate-800 bg-black/40 opacity-70 cursor-not-allowed'}
                                `}
                            >
                                {/* Preview Banner */}
                                <div className={`h-32 w-full relative overflow-hidden bg-gradient-to-br ${previewTile.color}`}>
                                    {previewTile.imageUrl && (
                                        <img src={previewTile.imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-110 transition-transform duration-700" />
                                    )}
                                    <div className="absolute inset-0 bg-black/20"></div>
                                    
                                    {/* Icon Overlay */}
                                    <div className="absolute bottom-3 right-3 text-4xl drop-shadow-lg filter shadow-black">{previewTile.icon}</div>
                                    
                                    {/* Lock Overlay */}
                                    {!theme.unlocked && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                            <Lock size={32} className="text-slate-500" />
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-lg font-bold text-white font-serif">{theme.name}</div>
                                        {isActive && <CheckCircle size={20} className="text-indigo-400" />}
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{theme.desc}</p>
                                    
                                    <div className="mt-auto pt-4 border-t border-white/5 w-full">
                                        {!theme.unlocked ? (
                                            <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                                                <Lock size={12}/> Unlocks at Level {theme.reqLevel}
                                            </div>
                                        ) : (
                                            <div className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                                                {isActive ? 'Active Theme' : 'Select to Equip'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

        </div>
      </div>
    </div>
  );
};
