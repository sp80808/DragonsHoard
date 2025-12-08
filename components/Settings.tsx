
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Trash2, AlertCircle, Music } from 'lucide-react';
import { audioService } from '../services/audioService';
import { clearSaveData } from '../services/gameLogic';

interface SettingsProps {
  onBack: () => void;
  onClearData: () => void;
  setTheme: (theme: string) => void;
  currentTheme: string;
  particleQuality: 'high' | 'medium' | 'low';
  setParticleQuality: (quality: 'high' | 'medium' | 'low') => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, onClearData, setTheme, currentTheme }) => {
  const [sfxVolume, setSfxVolume] = useState(audioService.getVolume() * 100);
  const [musicVolume, setMusicVolume] = useState(audioService.getMusicVolume() * 100);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setSfxVolume(val);
    audioService.setVolume(val / 100);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setMusicVolume(val);
    audioService.setMusicVolume(val / 100);
  };

  const handleClearData = () => {
      clearSaveData();
      onClearData(); 
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 module-creative rounded-xl p-6 shadow-2xl glass-panel layered-depth acrylic-panel depth-focused">
        <div className="flex items-center gap-4 mb-8">
           <motion.button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-all text-slate-400 btn-press item-hover" whileTap={{ scale: 0.98 }}>
              <ArrowLeft size={24} />
            </motion.button>
           <h2 className="text-2xl font-bold text-white fantasy-font">Settings</h2>
        </div>

        <div className="space-y-6">
            {/* Audio Section */}
            <div>
                <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4">Audio</h3>
                
                {/* SFX Volume */}
                <div className="flex items-center gap-4 mb-4">
                    <motion.button onClick={() => { setSfxVolume(0); audioService.setVolume(0); }} className="text-slate-400 hover:text-white w-6 btn-press" whileTap={{ scale: 0.98 }}>
                        {sfxVolume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                    </motion.button>
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 block mb-1">Sound Effects</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={sfxVolume} 
                            onChange={handleSfxChange}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>
                    <span className="w-8 text-right font-mono text-slate-300 text-sm">{sfxVolume}%</span>
                </div>

                {/* Music Volume */}
                <div className="flex items-center gap-4">
                    <motion.button onClick={() => { setMusicVolume(0); audioService.setMusicVolume(0); }} className="text-slate-400 hover:text-white w-6 btn-press" whileTap={{ scale: 0.98 }}>
                        <Music size={20}/>
                    </motion.button>
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 block mb-1">Dark Ambient</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={musicVolume} 
                            onChange={handleMusicChange}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                    <span className="w-8 text-right font-mono text-slate-300 text-sm">{musicVolume}%</span>
                </div>
            </div>

            {/* Theme Section */}
            <div>
                <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4">Theme</h3>
                <div className="space-y-2">
                    {[
                        { key: 'default', name: 'High-Tech Ghost (Default)' },
                        { key: 'bass-lab', name: 'Bass Lab' },
                        { key: 'jungle-studio', name: 'Jungle Studio' },
                        { key: 'dubstep-mode', name: 'Dubstep Mode' },
                        { key: 'house-techno', name: 'House/Techno' },
                        { key: 'cinematic', name: 'Cinematic' }
                    ].map(({ key, name }) => (
                        <motion.button
                            key={key}
                            onClick={() => setTheme(key)}
                            className={`w-full py-2 px-3 text-left rounded-lg transition-all btn-press ${currentTheme === key ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                            whileTap={{ scale: 0.98 }}
                        >
                            {name}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Data Section */}
            <div className="pt-8 border-t border-slate-800">
                <h3 className="text-red-400/80 text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                    <AlertCircle size={14}/> Danger Zone
                </h3>
                
                {!confirmClear ? (
                    <motion.button
                        onClick={() => setConfirmClear(true)}
                        className="w-full py-3 border border-red-900/50 bg-red-900/10 text-red-400 hover:bg-red-900/30 rounded-lg transition-all flex items-center justify-center gap-2 btn-press"
                        whileTap={{ scale: 0.98 }}
                    >
                        <Trash2 size={16} /> Delete Save Data
                    </motion.button>
                ) : (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                        <motion.button
                            onClick={() => setConfirmClear(false)}
                            className="flex-1 py-3 border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg btn-press"
                            whileTap={{ scale: 0.98 }}
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            onClick={handleClearData}
                            className="flex-1 py-3 bg-red-600 text-white hover:bg-red-500 rounded-lg font-bold btn-press"
                            whileTap={{ scale: 0.98 }}
                        >
                            CONFIRM DELETE
                        </motion.button>
                    </div>
                )}
                <p className="text-xs text-slate-600 mt-2 text-center">
                    This will wipe your progress, inventory, and achievements.
                </p>
            </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-800 text-center text-xs text-slate-600">
             Dragon's Hoard &copy; 2025
        </div>
      </div>
    </div>
  );
};
