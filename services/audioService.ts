

class AudioService {
  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  
  // Nodes
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  
  // Reverb
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  
  // Procedural Engine Nodes
  private droneNodes: AudioNode[] = [];
  private droneGain: GainNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  
  // File-based Music
  private activeMusicSource: AudioBufferSourceNode | null = null;

  private enabled: boolean = true;
  private volume: number = 0.3; 
  private musicVolume: number = 0.5; 
  
  private isInitialized = false;

  constructor() {}

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
      this.reverbGain.gain.value = 0.5; // High reverb for atmosphere

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

  async loadTrack(key: string, url: string): Promise<void> {
    if (!this.ctx) await this.init();
    if (!this.ctx) return;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.buffers[key] = audioBuffer;
    } catch (e) {
        console.warn(`Failed to load audio track: ${key} (${url})`);
        // We do not rethrow here, so the app can continue without the file
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val: number) {
      this.volume = Math.max(0, Math.min(1, val));
      if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(this.volume, this.ctx!.currentTime, 0.1);
  }

  getVolume() { return this.volume; }

  setMusicVolume(val: number) {
      this.musicVolume = Math.max(0, Math.min(1, val));
      if (this.musicGain) this.musicGain.gain.setTargetAtTime(this.musicVolume, this.ctx!.currentTime, 0.1);
  }

  getMusicVolume() { return this.musicVolume; }

  // --- Playback Control ---

  stopCurrentMusic(fadeOutDuration = 1.0) {
      const t = this.ctx!.currentTime;
      
      // Stop File-based Music
      if (this.activeMusicSource) {
          try {
             // Fade out specific source gain if we had one, otherwise hard stop
             this.activeMusicSource.stop(t + fadeOutDuration);
          } catch(e) {}
          this.activeMusicSource = null;
      }

      // Stop Procedural Engine
      this.stopDroneEngine(fadeOutDuration);
  }

  playSplashTheme() {
      if (!this.enabled || !this.ctx) return;
      this.stopCurrentMusic();
      
      if (!this.buffers['SPLASH']) {
          // Fallback to simple drone if file missing
          this.startProceduralAtmosphere(true);
          return;
      }

      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers['SPLASH'];
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = 62;
      
      const trackGain = this.ctx.createGain();
      trackGain.gain.value = 0.5;

      source.connect(trackGain);
      trackGain.connect(this.musicGain!);
      
      source.start();
      this.activeMusicSource = source;
  }

  playDeathTheme() {
      if (!this.enabled || !this.ctx) return;
      this.stopCurrentMusic();
      
      if (!this.buffers['DEATH']) return; // Silence is fine for death

      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers['DEATH'];
      source.loop = true;

      const trackGain = this.ctx.createGain();
      trackGain.gain.value = 0.6; 

      source.connect(trackGain);
      trackGain.connect(this.musicGain!);
      
      source.start();
      this.activeMusicSource = source;
  }

  playGameplayTheme() {
      if (!this.enabled || !this.ctx) return;
      this.stopCurrentMusic();
      
      // Use Procedural Engine instead of Files
      this.startProceduralAtmosphere();
  }

  // --- Procedural "Drone" Engine ---
  // Generates dark ambient music in real-time without MP3s
  
  startProceduralAtmosphere(isSplash = false) {
      if (!this.ctx || !this.musicGain) return;
      
      const t = this.ctx.currentTime;
      const rootFreq = isSplash ? 55.00 : 69.30; // A1 or C#2 (Darker)

      // 1. Create Filter Chain (Lowpass for that "underwater" sound)
      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.value = isSplash ? 300 : 120; // Start very muffled
      this.droneFilter.Q.value = 0.5;

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0, t);
      this.droneGain.gain.linearRampToValueAtTime(0.3, t + 3); // Slow fade in

      // Connect: Oscillators -> Filter -> DroneGain -> Reverb -> MusicGain
      this.droneGain.connect(this.reverbNode!); // Heavy reverb is key
      this.droneGain.connect(this.musicGain); // Also direct signal
      this.droneFilter.connect(this.droneGain);

      // 2. Oscillator 1: The Foundation (Sawtooth)
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.value = rootFreq; 
      
      // 3. Oscillator 2: Detuned Texture (Sawtooth)
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.value = rootFreq * 1.01; // Slight detune for phasing
      
      // 4. Oscillator 3: Sub Bass (Sine)
      const osc3 = this.ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.value = rootFreq / 2; // Octave down

      // 5. LFO to modulate filter (The "Breathing" effect)
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1; // Very slow
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 50; // Filter moves by +/- 50Hz
      
      lfo.connect(lfoGain);
      lfoGain.connect(this.droneFilter.frequency);

      // Connect all
      osc1.connect(this.droneFilter);
      osc2.connect(this.droneFilter);
      osc3.connect(this.droneFilter);

      // Start
      osc1.start();
      osc2.start();
      osc3.start();
      lfo.start();

      this.droneNodes = [osc1, osc2, osc3, lfo, lfoGain, this.droneFilter, this.droneGain];
  }

  stopDroneEngine(fadeOutDuration: number) {
      if (!this.droneGain || !this.ctx) return;
      
      const t = this.ctx.currentTime;
      this.droneGain.gain.setTargetAtTime(0, t, fadeOutDuration / 3);
      
      // Cleanup after fade
      setTimeout(() => {
          this.droneNodes.forEach(node => {
              try { 
                  if (node instanceof OscillatorNode) node.stop(); 
                  node.disconnect(); 
              } catch(e) {}
          });
          this.droneNodes = [];
          this.droneGain = null;
          this.droneFilter = null;
      }, fadeOutDuration * 1000 + 100);
  }

  /**
   * Updates drone intensity based on game state.
   * @param intensity 0.0 to 1.0
   */
  updateGameplayIntensity(intensity: number) {
      if (!this.droneFilter || !this.ctx) return;
      
      const t = this.ctx.currentTime;
      
      // Map intensity to Filter Opening (100Hz -> 800Hz)
      // We keep it relatively dark even at high intensity to maintain "Dark Fantasy" vibe
      const targetFreq = 120 + (Math.pow(intensity, 2) * 800); 
      this.droneFilter.frequency.setTargetAtTime(targetFreq, t, 1.0);
  }

  // --- SFX ---

  playSFX(type: 'MOVE' | 'MERGE' | 'LEVEL_UP' | 'BOMB') {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;

      if (type === 'LEVEL_UP') {
          // Soft "Heavenly" Chord (Major Triad)
          const notes = [523.25, 659.25, 783.99]; 
          
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 600; 
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
              gain.gain.linearRampToValueAtTime(0.05, t + (i * 0.1) + 0.1); 
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
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(150, t);
          osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
          gain.gain.setValueAtTime(0.05, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          osc.start();
          osc.stop(t + 0.1);
      } else if (type === 'MERGE') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, t);
          osc.frequency.linearRampToValueAtTime(600, t + 0.1);
          gain.gain.setValueAtTime(0.1, t); // Softer volume
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
          osc.start();
          osc.stop(t + 0.2);
      } else if (type === 'BOMB') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, t);
          osc.frequency.exponentialRampToValueAtTime(10, t + 0.5);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
          osc.start();
          osc.stop(t + 0.5);
      }
  }

  playMerge(value: number) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      
      const baseFreq = 220 + (Math.log2(value) * 50);
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.15);
      
      gain.gain.setValueAtTime(0.08, t); // Soft volume
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      
      osc.start();
      osc.stop(t + 0.3);
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
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0, t + 2);
      osc.start();
      osc.stop(t + 2);
  }
  playStageTransition() { this.playLevelUp(); }
  playCascade(step: number) { 
       if (!this.enabled || !this.ctx) return;
       this.playMerge(Math.pow(2, step + 2));
  }
}

export const audioService = new AudioService();
