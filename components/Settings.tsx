
import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Trash2, AlertCircle, Music, Keyboard, MousePointer, Monitor, MessageSquare, Info } from 'lucide-react';
import { audioService } from '../services/audioService';
import { clearSaveData } from '../services/gameLogic';
import { InputSettings } from '../types';

interface SettingsProps {
  settings: InputSettings;
  onUpdateSettings: (s: InputSettings) => void;
  onBack: () => void;
  onClearData: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onBack, onClearData }) => {
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

  const toggleSetting = (key: keyof InputSettings) => {
      onUpdateSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateSettings({ ...settings, sensitivity: parseInt(e.target.value) });
  };

  const handleClearData = () => {
      clearSaveData();
      onClearData(); 
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
           <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
             <ArrowLeft size={24} />
           </button>
           <h2 className="text-2xl font-bold text-white fantasy-font">Settings</h2>
        </div>

        <div className="space-y-6">
            {/* Audio Section */}
            <div>
                <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2"><Volume2 size={12}/> Audio</h3>
                
                {/* SFX Volume */}
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => { setSfxVolume(0); audioService.setVolume(0); }} className="text-slate-400 hover:text-white w-6">
                        {sfxVolume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                    </button>
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
                    <button onClick={() => { setMusicVolume(0); audioService.setMusicVolume(0); }} className="text-slate-400 hover:text-white w-6">
                        <Music size={20}/>
                    </button>
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

            {/* Interface Section */}
            <div className="pt-6 border-t border-slate-800">
                <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2"><Monitor size={12}/> Interface</h3>
                
                <div className="space-y-3">
                     <label className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                         <div className="flex items-center gap-3">
                             <MessageSquare size={18} className="text-slate-400" />
                             <span className="text-sm font-bold text-slate-200">Gameplay Tooltips</span>
                         </div>
                         <div className="relative inline-block w-10 h-5">
                            <input type="checkbox" checked={settings.enableTooltips} onChange={() => toggleSetting('enableTooltips')} className="peer sr-only"/>
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                         </div>
                     </label>
                </div>
            </div>

            {/* Controls Section */}
            <div className="pt-6 border-t border-slate-800">
                <h3 className="text-slate-400 text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2"><Keyboard size={12}/> Controls</h3>
                
                <div className="space-y-3">
                     {/* Keyboard */}
                     <label className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                         <div className="flex items-center gap-3">
                             <Keyboard size={18} className="text-slate-400" />
                             <span className="text-sm font-bold text-slate-200">Arrow Keys</span>
                         </div>
                         <div className="relative inline-block w-10 h-5">
                            <input type="checkbox" checked={settings.enableKeyboard} onChange={() => toggleSetting('enableKeyboard')} className="peer sr-only"/>
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                         </div>
                     </label>

                     {/* Swipe */}
                     <div className="bg-slate-800/50 rounded-lg p-2">
                        <label className="flex items-center justify-between cursor-pointer mb-2">
                            <div className="flex items-center gap-3">
                                <MousePointer size={18} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-200">Mouse / Swipe</span>
                            </div>
                            <div className="relative inline-block w-10 h-5">
                                <input type="checkbox" checked={settings.enableSwipe} onChange={() => toggleSetting('enableSwipe')} className="peer sr-only"/>
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                            </div>
                        </label>
                        {settings.enableSwipe && (
                             <label className="flex items-center justify-between pl-8 pr-1 mt-2">
                                <span className="text-xs text-slate-400">Invert Direction</span>
                                <input type="checkbox" checked={settings.invertSwipe} onChange={() => toggleSetting('invertSwipe')} className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-yellow-500" />
                             </label>
                        )}
                     </div>

                     {/* Scroll */}
                     <div className="bg-slate-800/50 rounded-lg p-2">
                        <label className="flex items-center justify-between cursor-pointer mb-2">
                            <div className="flex items-center gap-3">
                                <Monitor size={18} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-200">Trackpad Scroll</span>
                            </div>
                            <div className="relative inline-block w-10 h-5">
                                <input type="checkbox" checked={settings.enableScroll} onChange={() => toggleSetting('enableScroll')} className="peer sr-only"/>
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                            </div>
                        </label>
                        {settings.enableScroll && (
                            <div className="pl-8 pr-1 space-y-2">
                                 <label className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400">Invert Scroll</span>
                                    <input type="checkbox" checked={settings.invertScroll} onChange={() => toggleSetting('invertScroll')} className="w-4 h-4 rounded border-slate-600 bg-slate-700 accent-yellow-500" />
                                 </label>
                                 <div className="flex items-center gap-2 pt-1">
                                     <span className="text-xs text-slate-500 w-16">Sens.</span>
                                     <input 
                                        type="range" min="1" max="10" value={settings.sensitivity} onChange={handleSensitivityChange}
                                        className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                                     />
                                 </div>
                            </div>
                        )}
                     </div>
                </div>
            </div>

            {/* Data Section */}
            <div className="pt-6 border-t border-slate-800">
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
            </div>
        </div>
      </div>
    </div>
  );
};
