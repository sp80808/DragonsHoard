
export class AudioService {
  ctx: AudioContext | null = null;
  
  // Graph Nodes
  masterGain: GainNode | null = null;
  sfxInput: GainNode | null = null; // Entry point for SFX
  sfxFilter: BiquadFilterNode | null = null; // Low-pass filter for polish
  dryGain: GainNode | null = null;
  wetGain: GainNode | null = null;
  convolver: ConvolverNode | null = null;
  musicGain: GainNode | null = null; // For ambience/music

  // Ambience State
  private ambientNodes: AudioScheduledSourceNode[] = [];
  private isAmbiencePlaying: boolean = false;

  enabled: boolean = true;
  private _sfxVolume: number = 0.5;
  private _musicVolume: number = 0.3;

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
      this.masterGain.connect(this.ctx.destination);

      // 2. Music Path (Separate from reverb typically, but we might bleed a little for glue)
      this.musicGain = this.ctx.createGain();
      this.musicGain.connect(this.masterGain); 

      // 3. SFX Path with Reverb
      this.sfxInput = this.ctx.createGain();
      
      // Global Low-pass filter to soften digital harshness
      // Lowered to 2000Hz to make everything sound "heavier" and less "computer-y"
      this.sfxFilter = this.ctx.createBiquadFilter();
      this.sfxFilter.type = 'lowpass';
      this.sfxFilter.frequency.value = 2000; 
      this.sfxFilter.Q.value = 0.5;

      this.dryGain = this.ctx.createGain();
      this.wetGain = this.ctx.createGain();
      this.convolver = this.ctx.createConvolver();

      // Generate Reverb Impulse (Stone Hall Simulator)
      this.generateImpulseResponse(2.5, 2.5); // Slightly longer tail

      // Routing: Input -> Filter
      this.sfxInput.connect(this.sfxFilter);

      // Routing: Filter -> Split (Dry/Wet)
      this.sfxFilter.connect(this.dryGain);
      this.sfxFilter.connect(this.convolver);

      // Routing: Split -> Reassembly -> Master
      this.dryGain.connect(this.masterGain);
      this.convolver.connect(this.wetGain);
      this.wetGain.connect(this.masterGain);

      // Mix Settings
      // Strong Dry signal for gameplay responsiveness
      this.dryGain.gain.value = 0.8; 
      // Subtle Wet signal for atmospheric "glue"
      this.wetGain.gain.value = 0.4; 

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
          // Noise burst with exponential decay
          // This simulates the chaotic reflections of a room
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

  suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(e => console.warn(e));
    }
  }

  getVolume() { return this._sfxVolume; }
  
  setVolume(val: number) {
    this._sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxInput && this.ctx) {
        // Smooth transition
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

  // SFX Methods (Synthesis based)
  
  playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, volume: number = 0.5) {
      if (!this.ctx || !this.sfxInput) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = freq;
      
      osc.connect(gain);
      gain.connect(this.sfxInput);
      
      const now = this.ctx.currentTime + startTime;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Faster dropoff
      
      osc.start(now);
      osc.stop(now + duration);
  }

  // --- UI SOUNDS (Organic/Mechanical) ---

  playUIHover() {
      // Subtle "breath" or paper friction sound instead of a ping
      // Using a very low frequency sine with quick envelope
      this.playTone(80, 'sine', 0.05, 0, 0.05); 
  }

  playUIClick() {
      // Mechanical "clack" using a filtered square wave
      if (!this.ctx || !this.sfxInput) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
      
      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'lowpass';
      clickFilter.frequency.value = 800;

      gain.connect(clickFilter);
      clickFilter.connect(this.sfxInput);
      osc.connect(gain);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      osc.start(now);
      osc.stop(now + 0.08);
  }

  playUIConfirm() {
      // Positive Chime - Harmonic
      const now = this.ctx?.currentTime || 0;
      this.playTone(440, 'sine', 0.3, 0, 0.1); // A4
      this.playTone(554, 'triangle', 0.3, 0.05, 0.05); // C#5
  }

  playUIBack() {
      // Cancel/Back sound - Lower pitch
      this.playTone(180, 'triangle', 0.1, 0, 0.1);
  }

  // --- GAMEPLAY SOUNDS ---

  playMove() {
      // Stone sliding sound
      // Low frequency triangle with noise-like quality
      this.playTone(60, 'triangle', 0.1, 0, 0.1);
      // Subtle secondary tone for texture
      this.playTone(80, 'sawtooth', 0.05, 0, 0.02);
  }

  playInvalidMove() {
      // Dull wooden thud
      this.playTone(80, 'square', 0.1, 0, 0.1);
  }

  playMerge(score: number, combo: number, highestTileValue: number = 0) {
      if (!this.ctx || !this.sfxInput) return;
      
      const now = this.ctx.currentTime;
      
      // Base frequency scales gently, not aggressively
      // Starting lower to feel more "magical" and less "laser"
      const baseFreq = 220 + (combo * 20); 
      
      // Oscillator 1: The Body (Sine)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);
      // Removed the upward frequency sweep ("chirp") for a more stable bell sound
      
      osc1.connect(gain1);
      gain1.connect(this.sfxInput);
      
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4); // Longer ringing tail
      
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Oscillator 2: The Shimmer (Triangle, Octave higher)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 2, now); // Octave
      
      osc2.connect(gain2);
      gain2.connect(this.sfxInput);
      
      gain2.gain.setValueAtTime(0.05, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc2.start(now);
      osc2.stop(now + 0.3);
  }

  playBomb() {
      if (!this.ctx || !this.sfxInput) return;
      // Deep Explosion
      const bufferSize = this.ctx.sampleRate * 0.8;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      
      // Lowpass Filter for "Boom"
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600; // Lower cutoff for deeper sound
      filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.6);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxInput);
      
      gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      
      noise.start();
  }

  playZap(intensity: number) {
      if (!this.ctx || !this.sfxInput) return;
      // Arcane Static (Filtered Sawtooth)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, this.ctx.currentTime);
      // Random frequency jitter for "electricity"
      osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.1);
      
      filter.type = 'highpass';
      filter.frequency.value = 1000;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxInput);
      
      gain.gain.setValueAtTime(0.1 * intensity, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
  }

  playBossSpawn() {
      // Ominous Drone
      const now = this.ctx?.currentTime || 0;
      this.playTone(55, 'sawtooth', 1.5, 0, 0.3); // Low A
      this.playTone(110, 'sine', 1.5, 0, 0.2); // Octave
  }

  playLevelUp() {
      // Orchestral Arpeggio (Harp-like)
      // Slower timing, Triangle waves for warmth
      this.playTone(440, 'triangle', 0.4, 0, 0.2);
      this.playTone(554, 'triangle', 0.4, 0.15, 0.2); // C#
      this.playTone(659, 'triangle', 0.6, 0.3, 0.2); // E
      this.playTone(880, 'sine', 0.8, 0.45, 0.2); // A (Sine for the top note shine)
  }

  playCascade(step: number) {
      // Pentatonic Scale
      const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25]; // C D E G A C
      // Use Triangle for a xylophone/marimba feel
      const freq = scale[step % scale.length] * Math.pow(2, Math.floor(step / scale.length));
      this.playTone(freq, 'triangle', 0.3, 0, 0.15);
  }

  playCrunch() {
      this.playBomb(); 
  }

  playDeathTheme() {
      if (!this.ctx || !this.sfxInput) return;
      this.resume();
      
      const t = this.ctx.currentTime;
      
      // 1. Dissonant Drop (The "dying" sound)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      // Two detuned saws create a "gritty" feel
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(150, t);
      osc1.frequency.exponentialRampToValueAtTime(30, t + 2.5);
      
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(145, t); // Detuned for dissonance
      osc2.frequency.exponentialRampToValueAtTime(28, t + 2.5);
      
      gain.gain.setValueAtTime(0.3, t); // Slightly quieter
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxInput);
      
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 2.5);
      osc2.stop(t + 2.5);
      
      // 2. Low Impact / Thud (The finality)
      const impactOsc = this.ctx.createOscillator();
      const impactGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      impactOsc.type = 'triangle';
      impactOsc.frequency.setValueAtTime(60, t);
      impactOsc.frequency.exponentialRampToValueAtTime(10, t + 0.5);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, t);

      impactGain.gain.setValueAtTime(0.6, t);
      impactGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      
      impactOsc.connect(filter);
      filter.connect(impactGain);
      impactGain.connect(this.sfxInput);
      
      impactOsc.start(t);
      impactOsc.stop(t + 0.8);
  }

  playSplashTheme() {
      // Start ambient drone if implemented
  }

  playGameplayTheme() {
      // Change ambience
  }

  updateGameplayIntensity(val: number) {
      // Adjust filter/volume of music
  }
}

export const audioService = new AudioService();
