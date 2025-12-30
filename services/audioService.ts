
export class AudioService {
  ctx: AudioContext | null = null;
  sfxGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  enabled: boolean = true;
  private _sfxVolume: number = 0.5;
  private _musicVolume: number = 0.3;

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        if (this.sfxGain && this.musicGain) {
            this.sfxGain.connect(this.ctx.destination);
            this.musicGain.connect(this.ctx.destination);
            this.setVolume(this._sfxVolume);
            this.setMusicVolume(this._musicVolume);
        }
      }
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn(e));
    }
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(e => console.warn(e));
    }
  }

  getVolume() { return this._sfxVolume; }
  setVolume(val: number) {
    this._sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain) this.sfxGain.gain.setValueAtTime(this._sfxVolume, this.ctx?.currentTime || 0);
  }

  getMusicVolume() { return this._musicVolume; }
  setMusicVolume(val: number) {
    this._musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain) this.musicGain.gain.setValueAtTime(this._musicVolume, this.ctx?.currentTime || 0);
  }

  // Synthesis helpers
  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0) {
    if (!this.ctx || !this.enabled || !this.sfxGain) return;
    const t = this.ctx.currentTime + startTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  }

  playMove() {
    this.resume();
    this.playTone(150, 'sine', 0.1);
  }

  playMerge(score: number, combo: number, value: number = 0) {
    this.resume();
    const baseFreq = 220 + (Math.min(combo, 10) * 50);

    if (value >= 2048) {
        // God Tier: Full Chord, Long Sustain
        this.playTone(110, 'sawtooth', 1.5, 0); // Root
        this.playTone(165, 'sine', 1.5, 0);     // Fifth
        this.playTone(220, 'square', 1.5, 0.1); // Octave
        this.playTone(440, 'sine', 1.0, 0.2);   // Shimmer
        return;
    } 
    
    if (value >= 1024) {
        // Demon Tier: Aggressive, Dissonant
        this.playTone(150, 'sawtooth', 0.6);
        this.playTone(220, 'square', 0.4, 0.1);
        return;
    }

    if (value >= 256) {
        // High Tier: Metallic, Sharp
        this.playTone(baseFreq, 'square', 0.3);
        this.playTone(baseFreq * 1.5, 'sine', 0.4, 0.05);
        return;
    }

    if (value >= 64) {
        // Mid Tier: Punchy
        this.playTone(baseFreq, 'sawtooth', 0.25);
        return;
    }

    // Default
    this.playTone(baseFreq, 'triangle', 0.2);
    if (combo > 1) {
      this.playTone(baseFreq * 1.5, 'sine', 0.3, 0.1);
    }
  }

  playZap(intensity: number) {
     this.resume();
     this.playTone(400 + (intensity * 100), 'sawtooth', 0.2);
  }

  playBossSpawn() { 
      // Ominous Siren
      if (!this.ctx || !this.enabled) return;
      this.resume();
      const t = this.ctx.currentTime;

      // 1. Siren Oscillator (FM Synthesis)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      // LFO modulates pitch
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t); // Base pitch

      lfo.type = 'sawtooth'; 
      lfo.frequency.setValueAtTime(3, t); // Siren speed
      lfoGain.gain.setValueAtTime(60, t); // Pitch depth

      // Envelope
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);

      osc.start(t);
      lfo.start(t);
      osc.stop(t + 3.0);
      lfo.stop(t + 3.0);

      // 2. Low Rumble Impact
      const rumble = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumble.connect(rumbleGain);
      rumbleGain.connect(this.sfxGain!);
      
      rumble.type = 'square';
      rumble.frequency.setValueAtTime(50, t);
      rumble.frequency.linearRampToValueAtTime(20, t + 1.5);
      
      rumbleGain.gain.setValueAtTime(0.3, t);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      
      rumble.start(t);
      rumble.stop(t + 1.5);
  }

  updateGameplayIntensity(intensity: number) {
      // Placeholder for dynamic music
  }

  playLevelUp() {
      this.resume();
      this.playTone(440, 'sine', 0.1, 0);
      this.playTone(554, 'sine', 0.1, 0.1);
      this.playTone(659, 'sine', 0.1, 0.2);
      this.playTone(880, 'sine', 0.4, 0.3);
  }

  playSplashTheme() {
      // Placeholder
  }

  playGameplayTheme() {
      // Placeholder
  }

  playDeathTheme() {
      // Placeholder
  }

  playBomb() {
      this.resume();
      this.playTone(100, 'square', 0.5);
  }

  playCrunch() {
      this.resume();
      this.playTone(80, 'sawtooth', 0.1);
  }

  playCascade(step: number) {
      this.resume();
      const freq = 300 + (step * 50);
      this.playTone(freq, 'sine', 0.15);
  }
}

export const audioService = new AudioService();
