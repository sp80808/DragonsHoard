
class AudioService {
  private ctx: AudioContext | null = null;
  
  // Nodes
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null; // Used for Drone
  private sfxGain: GainNode | null = null;
  
  // Reverb
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  
  // Active Drone Nodes
  private droneOscillators: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private droneLFO: OscillatorNode | null = null;

  private enabled: boolean = true;
  private volume: number = 0.5; 
  private musicVolume: number = 0.5; 
  
  private isInitialized = false;

  constructor() {
      // Auto-bind resume to window interactions to fix audio blockage
      if (typeof window !== 'undefined') {
          const tryResume = () => {
              this.resume();
              if (this.ctx && this.ctx.state === 'running') {
                  window.removeEventListener('click', tryResume);
                  window.removeEventListener('touchstart', tryResume);
                  window.removeEventListener('keydown', tryResume);
              }
          };
          window.addEventListener('click', tryResume);
          window.addEventListener('touchstart', tryResume);
          window.addEventListener('keydown', tryResume);
      }
  }

  async init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx!.createGain();
      this.masterGain.connect(this.ctx!.destination);
      
      this.musicGain = this.ctx!.createGain();
      this.musicGain.connect(this.masterGain);
      
      this.sfxGain = this.ctx!.createGain();
      this.sfxGain.connect(this.masterGain);

      // --- Setup Reverb (Procedural Hall) ---
      this.reverbNode = this.ctx!.createConvolver();
      this.reverbGain = this.ctx!.createGain();
      this.reverbGain.gain.value = 0.3; 

      // Generate Impulse Response (Dark Hall)
      const duration = 2.5;
      const decay = 2.0;
      const rate = this.ctx!.sampleRate;
      const length = rate * duration;
      const impulse = this.ctx!.createBuffer(2, length, rate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const n = i / length;
        const vol = Math.pow(1 - n, decay);
        left[i] = (Math.random() * 2 - 1) * vol;
        right[i] = (Math.random() * 2 - 1) * vol;
      }
      this.reverbNode.buffer = impulse;

      // Routing: SFX -> Reverb
      this.sfxGain.connect(this.reverbGain);
      this.reverbGain.connect(this.reverbNode);
      this.reverbNode.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.error("Audio init failed", e);
    }
  }

  // Legacy method signature maintained for compatibility, but no longer loads external files.
  async loadTrack(key: string, url: string): Promise<void> {
      // No-op: We are fully procedural now.
      return Promise.resolve();
  }

  resume() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  suspend() {
      if (this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend();
      }
  }

  setVolume(val: number) {
      this.volume = Math.max(0, Math.min(1, val));
      if (this.sfxGain && this.ctx) this.sfxGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
  }

  getVolume() { return this.volume; }

  setMusicVolume(val: number) {
      this.musicVolume = Math.max(0, Math.min(1, val));
      if (this.musicGain && this.ctx) this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.1);
  }

  getMusicVolume() { return this.musicVolume; }

  // --- PROCEDURAL DRONE (Focus Music) ---

  startDrone() {
      if (!this.ctx || !this.enabled) return;
      if (this.droneOscillators.length > 0) return; // Already playing

      const t = this.ctx.currentTime;

      this.droneGain = this.ctx.createGain();
      // Reduced gain significantly to be subliminal/focus-aiding (approx -46dBFS)
      this.droneGain.gain.value = 0.005; 
      this.droneGain.connect(this.musicGain!);

      // Lowpass Filter for that "underwater/focus" feel
      // Restricting range to 80-200Hz to avoid mud but keep it deep
      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass'; 
      this.droneFilter.frequency.value = 80; 
      this.droneFilter.connect(this.droneGain);

      // Slow LFO to modulate filter - breathing effect
      this.droneLFO = this.ctx.createOscillator();
      this.droneLFO.type = 'sine';
      this.droneLFO.frequency.value = 0.05; // Very slow (20s cycle)
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 20; // Modulate cutoff very slightly (+/- 20Hz)
      
      this.droneLFO.connect(lfoGain);
      lfoGain.connect(this.droneFilter.frequency);
      this.droneLFO.start(t);

      // Dual Oscillators for thick texture
      // Tuned to ~40Hz (Gamma Range) which is associated with cognitive focus
      // Osc 1: Deep Root (40Hz)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = 40; 
      osc1.connect(this.droneFilter);
      osc1.start(t);
      this.droneOscillators.push(osc1);

      // Osc 2: Slight detune (40.5Hz) creates a 0.5Hz "breathing" phase
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.value = 40.5; 
      osc2.connect(this.droneFilter);
      osc2.start(t);
      this.droneOscillators.push(osc2);

      // Osc 3: Sub Sine (80Hz) - First harmonic support
      const osc3 = this.ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = 80; 
      osc3.connect(this.droneFilter);
      osc3.start(t);
      this.droneOscillators.push(osc3);
  }

  stopDrone() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      
      this.droneOscillators.forEach(osc => {
          try { osc.stop(t + 1); } catch(e) {}
      });
      this.droneOscillators = [];

      if (this.droneLFO) {
          try { this.droneLFO.stop(t + 1); } catch(e) {}
          this.droneLFO = null;
      }

      if (this.droneGain) {
          this.droneGain.gain.setTargetAtTime(0, t, 0.5);
      }
  }

  // Replaces all previous "Play Track" methods
  playSplashTheme() {
      this.resume();
      this.startDrone();
  }

  playDeathTheme() {
      // Just keep the drone, maybe lower the filter to make it darker?
      if (this.droneFilter && this.ctx) {
          this.droneFilter.frequency.setTargetAtTime(60, this.ctx.currentTime, 1.0);
      }
  }

  playGameplayTheme() {
      this.resume();
      this.startDrone();
      // Open up the filter slightly for gameplay, but keep under 200Hz limit
      if (this.droneFilter && this.ctx) {
          this.droneFilter.frequency.setTargetAtTime(150, this.ctx.currentTime, 1.0);
      }
  }

  updateGameplayIntensity(intensity: number) {
      if (!this.droneFilter || !this.ctx) return;
      const t = this.ctx.currentTime;
      
      // Map intensity to Filter Opening (80Hz -> 200Hz)
      const minFreq = 80;
      const maxFreq = 200;
      const clamped = Math.max(0, Math.min(1, intensity));
      
      const targetFreq = minFreq + (clamped * (maxFreq - minFreq));
      
      this.droneFilter.frequency.setTargetAtTime(targetFreq, t, 0.5);
  }

  // --- SOUND EFFECTS (SYNTHESIS) ---

  // Helper: Create Noise Buffer for "Crunch/Impact" sounds
  private createNoiseBuffer(): AudioBuffer | null {
      if (!this.ctx) return null;
      const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }
      return buffer;
  }

  // Effect: "Whoosh" for movement (Stone sliding)
  playWhoosh() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      
      const bufferSize = this.ctx.sampleRate * 0.15; // Short burst
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }

      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, t);
      filter.frequency.linearRampToValueAtTime(600, t + 0.15); // Slight upward slide

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, t); // Boosted volume
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      noiseSrc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain!);
      
      noiseSrc.start(t);
  }

  // Effect: "Zap/Magic Discharge" for Combos
  playZap(combo: number) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      // Dual oscillator for rich phasing texture
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      
      // Pitch scales with combo
      const baseFreq = 250 + (combo * 100);
      
      osc1.frequency.setValueAtTime(baseFreq, t);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 4, t + 0.15);
      
      osc2.frequency.setValueAtTime(baseFreq * 1.01, t); // Detuned
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 4.04, t + 0.15);

      // Envelope
      gain.gain.setValueAtTime(0.35, t); // Boosted volume
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      // Filter Sweep for "Whoosh/Zap" feel
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.linearRampToValueAtTime(8000, t + 0.15);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(filter);
      filter.connect(this.sfxGain!);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.15);
      osc2.stop(t + 0.15);
  }

  // Effect: "Thud/Crunch" for High Value Tiles
  playCrunch() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. Heavy Impact (Sub-bass kick)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'square';
      subOsc.frequency.setValueAtTime(80, t);
      subOsc.frequency.exponentialRampToValueAtTime(10, t + 0.4);
      
      subGain.gain.setValueAtTime(0.6, t); // Boosted
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      
      subOsc.connect(subGain);
      subGain.connect(this.sfxGain!);
      subOsc.start(t);
      subOsc.stop(t + 0.4);

      // 2. Bone/Stone Crunch (Textured Noise)
      const noiseBuffer = this.createNoiseBuffer();
      if (noiseBuffer) {
          const noiseSrc = this.ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          
          const noiseFilter = this.ctx.createBiquadFilter();
          noiseFilter.type = 'highpass';
          noiseFilter.frequency.setValueAtTime(800, t); // Cut mud

          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.4, t); // Boosted
          noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

          noiseSrc.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(this.sfxGain!);
          
          noiseSrc.start(t);
          noiseSrc.stop(t + 0.25);
      }
  }

  // Effect: "Heavenly Chord" for God Tile
  playGodChord() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // D Major 9 Chord: D, F#, A, E
      const freqs = [293.66, 369.99, 440.00, 659.25];
      
      freqs.forEach((f, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, t);
          
          gain.gain.setValueAtTime(0, t);
          gain.gain.linearRampToValueAtTime(0.3, t + 0.5); // Slow attack, boosted
          gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0); // Long sustain
          
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(t);
          osc.stop(t + 4.0);
      });
  }

  playSFX(type: 'MOVE' | 'LEVEL_UP' | 'BOMB') {
      this.resume();
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;

      if (type === 'LEVEL_UP') {
          // Soft "Heavenly" Chord (Major Triad)
          const notes = [523.25, 659.25, 783.99]; 
          
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 600; // Brightened up
          filter.Q.value = 0.5;
          filter.connect(this.sfxGain!);

          notes.forEach((freq, i) => {
              const osc = this.ctx!.createOscillator();
              const gain = this.ctx!.createGain();
              osc.connect(gain);
              gain.connect(filter);

              osc.type = 'triangle'; 
              osc.frequency.setValueAtTime(freq, t + (i * 0.1)); 
              
              gain.gain.setValueAtTime(0, t + (i * 0.1));
              gain.gain.linearRampToValueAtTime(0.2, t + (i * 0.1) + 0.1); 
              gain.gain.exponentialRampToValueAtTime(0.001, t + (i * 0.1) + 2.0); 

              osc.start(t + (i * 0.1));
              osc.stop(t + (i * 0.1) + 2.0);
          });
          return;
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.sfxGain!);

      if (type === 'MOVE') {
          this.playWhoosh();
      } else if (type === 'BOMB') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, t);
          osc.frequency.exponentialRampToValueAtTime(10, t + 0.5);
          gain.gain.setValueAtTime(0.4, t); // Boosted
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          osc.start();
          osc.stop(t + 0.5);
      }
  }

  // Updated Merge Logic: Handles Value-based Impact + Combo Zaps
  playMerge(value: number, combo: number = 0) {
      this.resume();
      if (!this.enabled || !this.ctx) return;
      
      const t = this.ctx.currentTime;

      // Tier 3: God / Legendary (512+)
      if (value >= 512) {
          if (value >= 2048) {
              this.playGodChord();
          } else {
              this.playCrunch(); // Heavy impact
          }
          
      // Tier 2: Mid Range (32 - 256) - Crunchy FM Synth
      } else if (value >= 32) {
          const osc = this.ctx.createOscillator();
          const mod = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const modGain = this.ctx.createGain();
          
          osc.connect(gain);
          mod.connect(modGain);
          modGain.connect(osc.frequency);
          gain.connect(this.sfxGain!);

          osc.type = 'square';
          mod.type = 'sawtooth';

          const baseFreq = 100 + (Math.log2(value) * 20);
          osc.frequency.setValueAtTime(baseFreq, t);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t + 0.3);

          mod.frequency.setValueAtTime(50, t);
          modGain.gain.setValueAtTime(200, t);
          modGain.gain.linearRampToValueAtTime(0, t + 0.3);

          gain.gain.setValueAtTime(0.25, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

          osc.start(t);
          mod.start(t);
          osc.stop(t + 0.3);
          mod.stop(t + 0.3);

      // Tier 1: Low Range (2 - 16) - Simple Pluck
      } else {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.sfxGain!);
          
          osc.type = 'triangle'; // Softer than sine for game feel
          const baseFreq = 220 + (Math.log2(value) * 60);
          osc.frequency.setValueAtTime(baseFreq, t);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, t + 0.1);
          
          gain.gain.setValueAtTime(0.2, t); 
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
          
          osc.start(t);
          osc.stop(t + 0.2);
      }

      // 2. Combo Layer (Zap!)
      if (combo > 1) {
          // Delay slightly so it doesn't mud the transient of the merge
          setTimeout(() => this.playZap(combo), 50);
      }
  }

  playMove() { this.playSFX('MOVE'); }
  playLevelUp() { this.playSFX('LEVEL_UP'); }
  playBomb() { this.playSFX('BOMB'); }
  playBossSpawn() { 
      // Ominous low drone
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, t);
      osc.frequency.linearRampToValueAtTime(40, t + 2);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0, t + 2);
      osc.start();
      osc.stop(t + 2);
  }
  playStageTransition() { this.playLevelUp(); }
  playCascade(step: number) { 
       if (!this.enabled || !this.ctx) return;
       // Cascades sound like rapid combos
       this.playZap(step);
  }
}

export const audioService = new AudioService();
