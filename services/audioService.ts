

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
  
  // Active Nodes
  private activeMusicSource: AudioBufferSourceNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;

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
             // Stop gently
             this.activeMusicSource.stop(t + fadeOutDuration);
          } catch(e) {}
          this.activeMusicSource = null;
      }
      this.musicFilter = null;
  }

  playSplashTheme() {
      if (!this.enabled || !this.ctx) return;
      this.stopCurrentMusic();
      
      if (!this.buffers['SPLASH']) return;

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
      
      if (!this.buffers['DEATH']) return;

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
      
      // Pick random gameplay track
      const availableTracks = Object.keys(this.buffers).filter(k => k.startsWith('GAMEPLAY_'));
      if (availableTracks.length === 0) return;

      const randomKey = availableTracks[Math.floor(Math.random() * availableTracks.length)];
      const buffer = this.buffers[randomKey];
      if (!buffer) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Create Filter for Dynamic Intensity (Muffled -> Clear)
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 150; // Start Muffled (Calm)
      this.musicFilter.Q.value = 0.5;

      const trackGain = this.ctx.createGain();
      trackGain.gain.value = 0.4; // Slightly lower as gameplay tracks can be loud

      // Connect: Source -> Filter -> Gain -> MusicMix
      source.connect(this.musicFilter);
      this.musicFilter.connect(trackGain);
      trackGain.connect(this.musicGain!);

      source.start();
      this.activeMusicSource = source;
  }

  /**
   * Updates music intensity based on game state.
   * @param intensity 0.0 to 1.0
   */
  updateGameplayIntensity(intensity: number) {
      if (!this.musicFilter || !this.ctx) return;
      
      const t = this.ctx.currentTime;
      
      // Map intensity to Filter Opening (100Hz -> 20000Hz)
      // Cubic curve for dramatic opening only when very intense
      // 0.0 -> 100Hz
      // 0.5 -> ~2000Hz
      // 1.0 -> 20000Hz
      const minFreq = 100;
      const maxFreq = 20000;
      const targetFreq = minFreq + (Math.pow(intensity, 3) * (maxFreq - minFreq));
      
      this.musicFilter.frequency.setTargetAtTime(targetFreq, t, 1.0);
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
          filter.frequency.value = 400; // Very soft
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
              gain.gain.linearRampToValueAtTime(0.05, t + (i * 0.1) + 0.1); // Very Quiet
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
