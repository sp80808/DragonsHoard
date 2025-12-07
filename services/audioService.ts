
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;
  private musicVolume: number = 0.3;
  private droneOscillators: OscillatorNode[] = [];
  private droneLfo: OscillatorNode | null = null;

  constructor() {
    // Context is initialized on first user interaction via resume/init
  }

  private initContext() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        
        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = this.enabled ? 1.0 : 0;

        // SFX Channel
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.masterGain);
        this.sfxGain.gain.value = this.volume;

        // Music Channel
        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.masterGain);
        this.musicGain.gain.value = this.musicVolume;
      }
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }

  setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.sfxGain) {
        this.sfxGain.gain.value = this.volume;
    }
  }

  getVolume() {
      return this.volume;
  }

  setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain) {
        this.musicGain.gain.value = this.musicVolume;
    }
  }

  getMusicVolume() {
      return this.musicVolume;
  }

  toggleMute() {
    this.enabled = !this.enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? 1.0 : 0;
    }
    return this.enabled;
  }

  isMuted() {
      return !this.enabled;
  }

  resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.startDrone();
  }

  // --- Dark Ambient Music Drone ---
  private startDrone() {
    if (!this.ctx || !this.musicGain || this.droneOscillators.length > 0) return;

    // Create a low brooding drone
    const freqs = [55, 110, 112]; // A1, A2, slightly detuned A2
    
    // Filter for texture
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.connect(this.musicGain);

    // LFO to modulate filter
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1; // Slow breath
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.droneLfo = lfo;

    freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        osc.type = i === 0 ? 'triangle' : 'sawtooth'; // Deep bass is triangle, higher harmonics saw
        osc.frequency.value = f;
        
        const oscGain = this.ctx!.createGain();
        oscGain.gain.value = 0.15 / freqs.length; // Mix down
        
        osc.connect(oscGain);
        oscGain.connect(filter);
        
        osc.start();
        this.droneOscillators.push(osc);
    });
  }

  playMove() {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playMerge(value: number) {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    const baseFreq = 220 + (Math.log2(value) * 50); 
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(baseFreq + 200, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playLevelUp() {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880];
    
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      const startTime = now + (i * 0.1);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
      
      osc.start(startTime);
      osc.stop(startTime + 0.9);
    });
  }

  playBomb() {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.4);
    
    gain.gain.setValueAtTime(1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }
}

export const audioService = new AudioService();
