
import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Trash2, AlertCircle } from 'lucide-react';
import { audioService } from '../services/audioService';
import { clearSaveData } from '../services/gameLogic';

interface SettingsProps {
  onBack: () => void;
  onClearData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack, onClearData }) => {
  const [volume, setVolume] = useState(audioService.getVolume() * 100);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    audioService.setVolume(val / 100);
  };

  const handleClearData = () => {
      clearSaveData();
      onClearData(); // Likely restarts the app state
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
           <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
             <ArrowLeft size={24} />
           </button>
           <h2 className="text-2xl font-bold text-white fantasy-font">Settings</h2>
        </div>

        <div className="space-y-8">
            {/* Audio Section */}
            <div>
                <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4">Audio</h3>
                <div className="flex items-center gap-4">
                    <button onClick={() => { setVolume(0); audioService.setVolume(0); }} className="text-slate-400 hover:text-white">
                        {volume === 0 ? <VolumeX /> : <Volume2 />}
                    </button>
                    <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={volume} 
                        onChange={handleVolumeChange}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <span className="w-12 text-right font-mono text-slate-300">{volume}%</span>
                </div>
            </div>

            {/* Data Section */}
            <div className="pt-8 border-t border-slate-800">
                <h3 className="text-red-400/80 text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                    <AlertCircle size={14}/> Danger Zone
                </h3>
                
                {!confirmClear ? (
                    <button 
                        onClick={() => setConfirmClear(true)}
                        className="w-full py-3 border border-red-900/50 bg-red-900/10 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16} /> Delete Save Data
                    </button>
                ) : (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                        <button 
                            onClick={() => setConfirmClear(false)}
                            className="flex-1 py-3 border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleClearData}
                            className="flex-1 py-3 bg-red-600 text-white hover:bg-red-500 rounded-lg font-bold"
                        >
                            CONFIRM DELETE
                        </button>
                    </div>
                )}
                <p className="text-xs text-slate-600 mt-2 text-center">
                    This will wipe your progress, inventory, and high scores.
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
