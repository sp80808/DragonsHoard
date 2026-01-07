
export class AudioService {
  ctx: AudioContext | null = null;
  
  // Graph Nodes
  masterGain: GainNode | null = null;
  compressor: DynamicsCompressorNode | null = null; // Psychoacoustic glue
  sfxInput: GainNode | null = null; 
  sfxFilter: BiquadFilterNode | null = null;
  dryGain: GainNode | null = null;
  wetGain: GainNode | null = null;
  convolver: ConvolverNode | null = null;
  musicGain: GainNode | null = null;

  enabled: boolean = true;
  private _sfxVolume: number = 0.5;
  private _musicVolume: number = 0.3;

  // C Minor Pentatonic Scale frequencies for musical cohesion
  private readonly scale = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25, 622.25, 698.46, 783.99, 932.33];

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.setupAudioGraph();
      }
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  private setupAudioGraph() {
      if (!this.ctx) return;

      // 1. Master Output
      this.masterGain = this.ctx.createGain();
      
      // 2. Dynamic Compressor (The "Glue")
      // This mimics how human ears react to loud sounds (dampening) 
      // and adds "weight" by bringing up quiet details while squashing peaks.
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      this.compressor.connect(this.ctx.destination);
      this.masterGain.connect(this.compressor);

      // 3. Music Path
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain); 

      // 4. SFX Path
      this.sfxInput = this.ctx.createGain();
      
      this.sfxFilter = this.ctx.createBiquadFilter();
      this.sfxFilter.type = 'lowpass';
      this.sfxFilter.frequency.value = 2500; // Warm, non-fatiguing cutoff
      this.sfxFilter.Q.value = 0.5;

      this.dryGain = this.ctx.createGain();
      this.wetGain = this.ctx.createGain();
      this.convolver = this.ctx.createConvolver();

      this.generateImpulseResponse(2.0, 2.0); // Dark stone hall reverb

      // Routing
      this.sfxInput.connect(this.sfxFilter);
      this.sfxFilter.connect(this.dryGain);
      this.sfxFilter.connect(this.convolver);
      
      this.dryGain.connect(this.masterGain);
      this.convolver.connect(this.wetGain);
      this.wetGain.connect(this.masterGain);

      // Mix: Heavy dry signal for distinct feedback, subtle reverb for space
      this.dryGain.gain.value = 0.9; 
      this.wetGain.gain.value = 0.35; 

      this.setVolume(this._sfxVolume);
      this.setMusicVolume(this._musicVolume);
  }

  private generateImpulseResponse(duration: number, decay: number) {
      if (!this.ctx || !this.convolver) return;
      const rate = this.ctx.sampleRate;
      const length = rate * duration;
      const impulse = this.ctx.createBuffer(2, length, rate);
      const impulseL = impulse.getChannelData(0);
      const impulseR = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
          const n = i / length;
          // Pink noise decay for a more natural "dark cave" sound
          const noise = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
          impulseL[i] = noise;
          impulseR[i] = noise;
      }
      this.convolver.buffer = impulse;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.warn(e));
    }
  }

  getVolume() { return this._sfxVolume; }
  
  setVolume(val: number) {
    this._sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxInput && this.ctx) {
        this.sfxInput.gain.setTargetAtTime(this._sfxVolume, this.ctx.currentTime, 0.1);
    }
  }

  getMusicVolume() { return this._musicVolume; }

  setMusicVolume(val: number) {
    this._musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
        this.musicGain.gain.setTargetAtTime(this._musicVolume, this.ctx.currentTime, 0.1);
    }
  }

  // --- CORE SYNTHESIS HELPERS ---

  private playKick(decay: number = 0.1, freqStart: number = 100) {
      // Physicality: A rapid pitch drop creates a "thud" sensation (psychoacoustic weight)
      if (!this.ctx || !this.sfxInput) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.frequency.setValueAtTime(freqStart, t);
      osc.frequency.exponentialRampToValueAtTime(0.01, t + decay);
      
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + decay);

      osc.connect(gain);
      gain.connect(this.sfxInput);
      osc.start(t);
      osc.stop(t + decay);
  }

  private playNoise(duration: number, filterFreq: number = 1000) {
      // Texture: Filtered noise mimics physical materials (stone, wood)
      if (!this.ctx || !this.sfxInput) return;
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      filter.type = 'lowpass';
      filter.frequency.value = filterFreq;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxInput);
      
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);
      
      noise.start();
  }

  playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.5, detune: number = 0) {
      if (!this.ctx || !this.sfxInput) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;
      
      osc.connect(gain);
      gain.connect(this.sfxInput);
      
      const now = this.ctx.currentTime + startTime;
      
      // Envelope: Fast attack, exponential decay (Percussive)
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.start(now);
      osc.stop(now + duration);
  }

  // --- UI SOUNDS (Tactile & Responsive) ---

  playUIHover() {
      // Subtle "breath" / friction
      this.playNoise(0.05, 400); 
  }

  playUIClick() {
      // Mechanical Latch Sound
      // 1. Solid Thud
      this.playKick(0.05, 80);
      // 2. High frequency "click" mechanism
      this.playTone(2000, 'square', 0.02, 0, 0.05);
  }

  playUIConfirm() {
      // Major Third "Success" Chime
      const now = this.ctx?.currentTime || 0;
      this.playTone(440, 'triangle', 0.3, 0, 0.2); 
      this.playTone(554.37, 'triangle', 0.3, 0.05, 0.2); 
      this.playKick(0.2, 150); // Undercurrent of weight
  }

  playUIBack() {
      // Hollow cancel sound
      this.playTone(300, 'sine', 0.1, 0, 0.1);
      this.playNoise(0.1, 200);
  }

  // --- GAMEPLAY SOUNDS (Immersive & Weighted) ---

  playMove() {
      // 1. Weight: Sub-bass thud (Stone hitting stone)
      this.playKick(0.1, 60);
      // 2. Texture: Friction noise (Sliding)
      this.playNoise(0.15, 800); 
  }

  playInvalidMove() {
      // Dull, hollow wood sound
      this.playTone(100, 'square', 0.1, 0, 0.1);
      this.playTone(90, 'sawtooth', 0.1, 0, 0.05); // Dissonance
  }

  playMerge(score: number, combo: number, highestTileValue: number = 0) {
      if (!this.ctx || !this.sfxInput) return;
      
      // Scale mapping: Map combo count to a musical scale index
      // This prevents "random beepiness" and creates a melody as you combo
      const scaleIndex = combo % this.scale.length;
      const rootFreq = this.scale[scaleIndex];
      const now = this.ctx.currentTime;

      // 1. The Body (Main Tone)
      this.playTone(rootFreq, 'triangle', 0.3, 0, 0.2);

      // 2. The Weight (Sub-Bass Impact)
      // Every merge feels like a physical event
      this.playKick(0.15, 80 + (combo * 5));

      // 3. The Reward (Harmonic Stacking)
      // As tiles get bigger, the sound gets "richer" (more harmonics)
      if (highestTileValue >= 128) {
          // Add a Perfect Fifth (Power Chord)
          this.playTone(rootFreq * 1.5, 'sine', 0.4, 0.05, 0.15);
      }
      
      if (highestTileValue >= 512) {
          // Add a Major Third (Full Triad)
          this.playTone(rootFreq * 1.25, 'sine', 0.4, 0.05, 0.15);
          // Sparkle Texture
          this.playNoise(0.3, 3000); 
      }

      if (highestTileValue >= 2048) {
          // Add Octave + Detune (Celestrial Chorus effect)
          this.playTone(rootFreq * 2, 'sawtooth', 0.5, 0.1, 0.1, 5); 
          this.playTone(rootFreq * 2, 'sawtooth', 0.5, 0.1, 0.1, -5);
      }
  }

  playBomb() {
      if (!this.ctx || !this.sfxInput) return;
      this.duckMusic(0.8); // Duck music for impact

      // 1. Deep Sub Explosion
      this.playKick(0.8, 120);
      
      // 2. Debris (Filtered Noise)
      this.playNoise(0.6, 600);
  }

  playZap(intensity: number) {
      if (!this.ctx || !this.sfxInput) return;
      
      // High frequency instability (Electricity)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.1);
      
      // Rapid volume modulation (Tremolo)
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 30; // 30Hz flutter
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.5;
      
      lfo.connect(lfoGain.gain);
      osc.connect(gain);
      gain.connect(this.sfxInput);
      
      gain.gain.setValueAtTime(0.1 * intensity, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      
      osc.start();
      lfo.start();
      osc.stop(this.ctx.currentTime + 0.2);
      lfo.stop(this.ctx.currentTime + 0.2);
  }

  playBossSpawn() {
      this.duckMusic(2.0); // Major ducking for boss entrance
      
      // The "Shepard Tone" illusion of infinite power
      // Stack octaves of detuned saws
      const now = this.ctx?.currentTime || 0;
      const fundamental = 55; // Low A
      
      [1, 2, 4].forEach((mult, i) => {
          this.playTone(fundamental * mult, 'sawtooth', 1.5, i * 0.1, 0.15, Math.random() * 10 - 5);
      });
      
      this.playKick(1.5, 200); // Massive impact
  }

  playLevelUp() {
      // Orchestral Swell
      // Fast Arpeggio of the C Minor Pentatonic scale
      const now = this.ctx?.currentTime || 0;
      this.scale.slice(0, 6).forEach((freq, i) => {
          this.playTone(freq, 'triangle', 0.5, i * 0.08, 0.1);
      });
      // Final shimmer
      this.playNoise(1.0, 5000);
  }

  playCascade(step: number) {
      // Pentatonic Step Up
      // Ensure we stay within scale bounds
      const scaleIndex = (step * 2) % this.scale.length;
      const freq = this.scale[scaleIndex];
      
      // Light, glassy texture for cascades
      this.playTone(freq, 'sine', 0.3, 0, 0.2);
      this.playTone(freq * 2, 'sine', 0.3, 0.05, 0.1); // Harmonic
  }

  playCrunch() {
      // Mechanical breaking sound
      this.playNoise(0.2, 1000);
      this.playKick(0.2, 100);
  }

  playDeathTheme() {
      if (!this.ctx || !this.sfxInput) return;
      this.duckMusic(3.0);
      this.resume();
      
      const t = this.ctx.currentTime;
      
      // 1. Dissonant cluster (Horror sting)
      this.playTone(100, 'sawtooth', 2.0, 0, 0.2, 0);
      this.playTone(106, 'sawtooth', 2.0, 0, 0.2, 0); // Minor second interval
      
      // 2. Final Heartbeat
      this.playKick(0.5, 60);
      setTimeout(() => this.playKick(0.5, 50), 600);
  }

  // --- PSYCHOACOUSTIC UTILS ---

  // Side-chain compression simulation:
  // Ducks the music volume when a loud SFX plays, creating a sense of "loudness" 
  // without actually increasing peak volume.
  private duckMusic(duration: number) {
      if (!this.musicGain || !this.ctx) return;
      const t = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.setValueAtTime(this._musicVolume, t);
      this.musicGain.gain.linearRampToValueAtTime(this._musicVolume * 0.3, t + 0.05); // Attack
      this.musicGain.gain.exponentialRampToValueAtTime(this._musicVolume, t + duration); // Release
  }

  playSplashTheme() {
      // Placeholder for future ambient tracks
  }

  playGameplayTheme() {
      // Placeholder
  }

  updateGameplayIntensity(val: number) {
      // Dynamic Low-Pass Filter on Music based on Score
      // As score increases, filter opens up (music gets brighter/more intense)
      // Not implemented fully yet as we don't have music tracks, 
      // but this is where we would modulate `this.musicFilter.frequency`.
  }
}

export const audioService = new AudioService();
