
import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Trash2, AlertCircle, Music, Keyboard, MousePointer, Monitor, MessageSquare, Gauge, Zap, Sparkles, Database, Save, Activity, Layers, Image as ImageIcon, Box } from 'lucide-react';
import { audioService } from '../services/audioService';
import { clearSaveData } from '../services/gameLogic';
import { InputSettings, GraphicsQuality } from '../types';

interface SettingsProps {
  settings: InputSettings;
  onUpdateSettings: (s: InputSettings) => void;
  onBack: () => void;
  onClearData: () => void;
}

type SettingsTab = 'GAMEPLAY' | 'AUDIO' | 'DATA';

const SettingsIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);

const Section = ({ title, icon, children }: { title: string, icon: React.ReactNode, children?: React.ReactNode }) => (
    <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            {icon} {title}
        </h3>
        {children}
    </div>
);

const SettingRow = ({ label, desc, icon, control }: { label: string, desc: string, icon: React.ReactNode, control: React.ReactNode }) => (
    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
        <div className="flex items-start gap-3">
            <div className="mt-1 text-slate-500">{icon}</div>
            <div>
                <div className="text-sm font-bold text-slate-200">{label}</div>
                <div className="text-xs text-slate-500 leading-tight mt-0.5">{desc}</div>
            </div>
        </div>
        {control}
    </div>
);

const Toggle = ({ checked, onChange, size = 'md' }: { checked: boolean, onChange: () => void, size?: 'sm' | 'md' }) => (
    <label className={`relative inline-flex items-center cursor-pointer ${size === 'sm' ? 'scale-75' : ''}`}>
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
);

const QualityButton = ({ value, label, current, onClick, desc }: { value: GraphicsQuality, label: string, current: GraphicsQuality, onClick: (v: GraphicsQuality) => void, desc: string }) => {
    const isActive = value === current;
    return (
        <button 
            onClick={() => onClick(value)}
            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 gap-1
                ${isActive 
                    ? 'bg-blue-900/30 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                    : 'bg-slate-900 border-slate-700 hover:bg-slate-800 hover:border-slate-500'}
            `}
        >
            <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                {label}
            </span>
            <span className={`text-[9px] text-center leading-tight ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                {desc}
            </span>
        </button>
    );
};

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onBack, onClearData }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('GAMEPLAY');
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

  const handleQualityChange = (q: GraphicsQuality) => {
      onUpdateSettings({ ...settings, graphicsQuality: q });
  };

  const handleSlideSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateSettings({ ...settings, slideSpeed: parseInt(e.target.value) });
  };

  const handleClearData = () => {
      clearSaveData();
      onClearData(); 
  };

  const TabButton = ({ id, icon, label }: { id: SettingsTab, icon: React.ReactNode, label: string }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all
            ${activeTab === id ? 'bg-slate-800 text-yellow-400 shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}
        `}
      >
          {icon} {label}
      </button>
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
           <h2 className="text-2xl font-bold text-white fantasy-font flex items-center gap-3">
               <SettingsIcon className="text-slate-400" /> Configuration
           </h2>
           <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
             <ArrowLeft size={24} />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 border-b border-slate-800 bg-slate-950 gap-2 overflow-x-auto">
            <TabButton id="GAMEPLAY" icon={<Monitor size={16}/>} label="Gameplay & Graphics" />
            <TabButton id="AUDIO" icon={<Volume2 size={16}/>} label="Audio" />
            <TabButton id="DATA" icon={<Database size={16}/>} label="Data" />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            
            {activeTab === 'GAMEPLAY' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    
                    {/* Visual Quality Section */}
                    <Section title="Visual Quality" icon={<Layers size={18} className="text-green-400"/>}>
                        <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4">
                            <div className="flex gap-2 mb-4">
                                <QualityButton 
                                    value="LOW" 
                                    label="Performance" 
                                    desc="Max FPS. No effects." 
                                    current={settings.graphicsQuality} 
                                    onClick={handleQualityChange} 
                                />
                                <QualityButton 
                                    value="MEDIUM" 
                                    label="Balanced" 
                                    desc="Standard look. No blur." 
                                    current={settings.graphicsQuality} 
                                    onClick={handleQualityChange} 
                                />
                                <QualityButton 
                                    value="HIGH" 
                                    label="Quality" 
                                    desc="Full particles & glow." 
                                    current={settings.graphicsQuality} 
                                    onClick={handleQualityChange} 
                                />
                            </div>
                            <div className="text-[10px] text-slate-500 text-center italic">
                                Note: Changing quality may require a reload to fully apply all shaders.
                            </div>
                        </div>
                    </Section>

                    {/* Controls Section */}
                    <Section title="Controls" icon={<Keyboard size={18} className="text-blue-400"/>}>
                        <div className="space-y-3">
                            <SettingRow 
                                label="Keyboard Controls" 
                                desc="Use Arrow Keys or WASD to move."
                                icon={<Keyboard size={16} />}
                                control={<Toggle checked={settings.enableKeyboard} onChange={() => toggleSetting('enableKeyboard')} />}
                            />
                            <SettingRow 
                                label="Touch / Mouse Swipe" 
                                desc="Swipe on screen to move tiles."
                                icon={<MousePointer size={16} />}
                                control={<Toggle checked={settings.enableSwipe} onChange={() => toggleSetting('enableSwipe')} />}
                            />
                            {settings.enableSwipe && (
                                <div className="pl-12 pr-2">
                                    <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                        <span className="text-xs text-slate-400">Invert Swipe Direction</span>
                                        <Toggle checked={settings.invertSwipe} onChange={() => toggleSetting('invertSwipe')} size="sm" />
                                    </div>
                                </div>
                            )}
                            <SettingRow 
                                label="Trackpad Scroll" 
                                desc="Use two-finger scroll to move."
                                icon={<Monitor size={16} />}
                                control={<Toggle checked={settings.enableScroll} onChange={() => toggleSetting('enableScroll')} />}
                            />
                        </div>
                    </Section>

                    {/* Interface Section */}
                    <Section title="Interface" icon={<Sparkles size={18} className="text-purple-400"/>}>
                        <div className="space-y-4">
                            <SettingRow 
                                label="Gameplay Tooltips" 
                                desc="Show helpful hints for game mechanics."
                                icon={<MessageSquare size={16} />}
                                control={<Toggle checked={settings.enableTooltips} onChange={() => toggleSetting('enableTooltips')} />}
                            />
                            
                            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <div className="flex justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                                        <Gauge size={16} className="text-slate-400"/> Animation Speed
                                    </div>
                                    <span className="text-xs font-mono text-slate-500">{settings.slideSpeed}ms</span>
                                </div>
                                <input 
                                    type="range" min="80" max="300" step="10"
                                    value={settings.slideSpeed} 
                                    onChange={handleSlideSpeedChange}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                    <span>Fast</span>
                                    <span>Slow</span>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>
            )}

            {activeTab === 'AUDIO' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <Section title="Volume Mixing" icon={<Volume2 size={18} className="text-pink-400"/>}>
                        <div className="space-y-6 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                            {/* SFX */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                        <Zap size={16} className="text-yellow-400"/> Sound Effects
                                    </label>
                                    <span className="text-xs font-mono text-slate-500">{sfxVolume}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={sfxVolume} 
                                    onChange={handleSfxChange}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                />
                            </div>

                            {/* Music */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                        <Music size={16} className="text-purple-400"/> Ambience & Music
                                    </label>
                                    <span className="text-xs font-mono text-slate-500">{musicVolume}%</span>
                                </div>
                                <input 
                                    type="range" min="0" max="100" 
                                    value={musicVolume} 
                                    onChange={handleMusicChange}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                        </div>
                    </Section>
                </div>
            )}

            {activeTab === 'DATA' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <Section title="Save Management" icon={<Save size={18} className="text-red-400"/>}>
                        <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-xl text-center">
                            <AlertCircle size={48} className="text-red-500 mx-auto mb-4 opacity-80" />
                            <h3 className="text-lg font-bold text-white mb-2">Danger Zone</h3>
                            <p className="text-sm text-red-200/60 mb-6">
                                Deleting your save data will reset all progress, high scores, and unlocked classes. This action cannot be undone.
                            </p>

                            {!confirmClear ? (
                                <button 
                                    onClick={() => setConfirmClear(true)}
                                    className="w-full py-3 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} /> Delete Save Data
                                </button>
                            ) : (
                                <div className="flex gap-3 animate-in fade-in zoom-in">
                                    <button 
                                        onClick={() => setConfirmClear(false)}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleClearData}
                                        className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-900/20"
                                    >
                                        CONFIRM DELETE
                                    </button>
                                </div>
                            )}
                        </div>
                    </Section>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
