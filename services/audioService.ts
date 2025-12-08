
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.4;
  private musicVolume: number = 0.25;
  private droneOscillators: OscillatorNode[] = [];
  private droneLfo: OscillatorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

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

        // SFX Channel (Slightly compressed for punch)
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -10;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0;
        compressor.release.value = 0.25;
        compressor.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(compressor);
        this.sfxGain.gain.value = this.volume;

        // Music Channel
        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.masterGain);
        this.musicGain.gain.value = this.musicVolume;

        // Create a static noise buffer for physical sounds
        this.createNoiseBuffer();
      }
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        // Brown/Pinkish noise (softer than white noise)
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // Compensate for gain loss
    }
    this.noiseBuffer = buffer;
  }

  setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.sfxGain) {
        this.sfxGain.gain.value = this.volume;
    }
  }

  getVolume() { return this.volume; }

  setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain) {
        this.musicGain.gain.value = this.musicVolume;
    }
  }

  getMusicVolume() { return this.musicVolume; }

  toggleMute() {
    this.enabled = !this.enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = this.enabled ? 1.0 : 0;
    }
    return this.enabled;
  }

  resume() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.startDrone();
  }

  // --- Cinematic Drone (Darker & More Textured) ---
  private startDrone() {
    if (!this.ctx || !this.musicGain || this.droneOscillators.length > 0) return;

    const t = this.ctx.currentTime;

    // Layer 1: The "Abyss" (Sub-bass rumble)
    // Using two oscillators slightly detuned to create a slow, unnerving "beat" frequency
    const rumbleFreqs = [38, 42]; 
    
    // Lowpass filter to remove any harsh digital edges from the oscillators
    const rumbleFilter = this.ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 80;
    rumbleFilter.connect(this.musicGain);

    rumbleFreqs.forEach((f) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine'; 
        osc.frequency.value = f;
        
        const oscGain = this.ctx!.createGain();
        oscGain.gain.value = 0.2; // Slightly reduced
        
        // Add a slow LFO to pitch to simulate "breathing" of a cave
        const lfo = this.ctx!.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.03; // Slower (~33s cycle)
        
        const lfoGain = this.ctx!.createGain();
        lfoGain.gain.value = 1.0; 
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t);

        osc.connect(oscGain);
        oscGain.connect(rumbleFilter);
        osc.start(t);
        
        this.droneOscillators.push(osc);
        this.droneOscillators.push(lfo); 
    });

    // Layer 2: The "Draft" (Wind texture)
    if (this.noiseBuffer) {
        const windSrc = this.ctx.createBufferSource();
        windSrc.buffer = this.noiseBuffer;
        windSrc.loop = true;
        
        // Playback rate: 0.08 slows it deeply for a cavernous feel
        windSrc.playbackRate.value = 0.08; 

        // Filter: Bandpass that sweeps slowly to simulate wind gusting through tunnels
        const windFilter = this.ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.Q.value = 1.0; // Softer band
        windFilter.frequency.value = 180;

        // Wind Gust LFO
        const gustLfo = this.ctx.createOscillator();
        gustLfo.frequency.value = 0.02; // Very slow gusts (~50s cycle)
        const gustGain = this.ctx.createGain();
        gustGain.gain.value = 100; // Sweep filter range
        
        gustLfo.connect(gustGain);
        gustGain.connect(windFilter.frequency);
        gustLfo.start(t);

        const windGain = this.ctx.createGain();
        windGain.gain.value = 0.04; // Very subtle background texture

        // Stereo Panner to make the dungeon feel wide
        const panner = this.ctx.createStereoPanner();
        const panLfo = this.ctx.createOscillator();
        panLfo.frequency.value = 0.02; // Very slow pan
        const panAmp = this.ctx.createGain();
        panAmp.gain.value = 0.5;
        panLfo.connect(panAmp);
        panAmp.connect(panner.pan);
        panLfo.start(t);

        windSrc.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(panner);
        panner.connect(this.musicGain);
        
        windSrc.start(t);
        
        // Track nodes for potential cleanup (though not strictly implemented in toggleMute for now)
        // In a real app we'd wrap these in a wrapper object to stop() them later.
    }
  }

  // --- Sound Effects ---

  // High-fidelity Slide Sound (Grit)
  playMove() {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    
    const t = this.ctx.currentTime;
    
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.8 + Math.random() * 0.4; // Varying texture
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    src.start();
    src.stop(t + 0.2);
  }

  // Dark RPG Merge (Physical Modeling Synthesis)
  playMerge(value: number) {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    // Determine Material based on value
    // Low (2-16): Stone/Wood
    // Mid (32-256): Metal
    // High (512+): Magic/Crystal
    let material = 'STONE';
    if (value >= 32) material = 'METAL';
    if (value >= 512) material = 'MAGIC';

    // 1. IMPACT LAYER (The "Thud")
    const kickOsc = this.ctx.createOscillator();
    kickOsc.type = 'sine';
    // Pitch drops fast to simulate heavy impact
    kickOsc.frequency.setValueAtTime(150, t);
    kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    
    const kickGain = this.ctx.createGain();
    kickGain.gain.setValueAtTime(0.5, t);
    kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    
    kickOsc.connect(kickGain);
    kickGain.connect(this.sfxGain);
    kickOsc.start();
    kickOsc.stop(t + 0.15);

    // 2. TEXTURE LAYER (The "Scrape/Clank")
    if (this.noiseBuffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = this.noiseBuffer;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        const noiseGain = this.ctx.createGain();

        if (material === 'STONE') {
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.value = 600;
            noiseSrc.playbackRate.value = 0.5;
            noiseGain.gain.setValueAtTime(0.3, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        } else if (material === 'METAL') {
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 1200; // Metallic ring freq
            noiseFilter.Q.value = 5;
            noiseSrc.playbackRate.value = 1.0;
            noiseGain.gain.setValueAtTime(0.2, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        } else {
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 2000;
            noiseSrc.playbackRate.value = 1.5;
            noiseGain.gain.setValueAtTime(0.15, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        }

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseSrc.start();
        noiseSrc.stop(t + 0.5);
    }

    // 3. TONAL LAYER (The "Resonance") - FM Synthesis for metallic bell sound
    if (material !== 'STONE') {
        const carrier = this.ctx.createOscillator();
        const modulator = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();

        // Subtle pitch scaling (not musical scale, just "heavier" or "sharper")
        // Log2 of value gives us 1, 2, 3, 4...
        // We add small increments.
        const tier = Math.log2(value);
        const baseFreq = material === 'METAL' ? 300 + (tier * 20) : 600 + (tier * 50);

        carrier.frequency.value = baseFreq;
        carrier.type = 'sine';

        // FM Ratio for metallic sound (non-integer)
        modulator.frequency.value = baseFreq * 1.41; 
        modulator.type = 'triangle';
        
        modGain.gain.setValueAtTime(200, t);
        modGain.gain.exponentialRampToValueAtTime(1, t + 0.3);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        const carrierGain = this.ctx.createGain();
        carrierGain.gain.setValueAtTime(0.15, t);
        carrierGain.gain.exponentialRampToValueAtTime(0.001, t + (material === 'MAGIC' ? 1.0 : 0.4));

        carrier.connect(carrierGain);
        carrierGain.connect(this.sfxGain);
        
        carrier.start();
        modulator.start();
        carrier.stop(t + 1.0);
        modulator.stop(t + 1.0);
    }
  }

  playCascade(step: number) {
      this.initContext();
      if (!this.enabled || !this.ctx || !this.sfxGain) return;
      const t = this.ctx.currentTime;
      
      // Cascade is a "shimmering" effect rising in intensity
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      
      // Pitch rises with step, but in a dissonant/magical way
      const freq = 400 + (step * 100);
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq + 50, t + 0.2); // Pitch bend up
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      // Pan effect (stereo width)
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = (step % 2 === 0) ? -0.5 : 0.5;
      
      osc.connect(gain);
      gain.connect(panner);
      panner.connect(this.sfxGain);
      
      osc.start();
      osc.stop(t + 0.3);
  }

  playLevelUp() {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    
    const t = this.ctx.currentTime;
    
    // Deep Gong / Choir Swell
    const freqs = [110, 164.8, 220]; // A Majorish
    freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = f;
        
        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.5); // Slow swell
        gain.gain.exponentialRampToValueAtTime(0.001, t + 3.0); // Long tail
        
        // Slight detune for chorus effect
        osc.frequency.linearRampToValueAtTime(f + (Math.random()*2), t + 3);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start();
        osc.stop(t + 3.5);
    });
  }

  playBossSpawn() {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // War Horn / Alarm
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.1); // Attack
    osc.frequency.linearRampToValueAtTime(50, t + 1.5); // Decay

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.linearRampToValueAtTime(800, t + 0.5); // Open filter

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0, t + 2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(t + 2);
  }

  playStageTransition() {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Wind / Portal Noise
    if (this.noiseBuffer) {
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.playbackRate.value = 0.4; // Deep rumbles
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, t);
        filter.frequency.linearRampToValueAtTime(500, t + 1.5); // Sweep up
        filter.frequency.linearRampToValueAtTime(100, t + 3);   // Sweep down

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 1.5);
        gain.gain.linearRampToValueAtTime(0, t + 3);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        src.start();
        src.stop(t + 3);
    }
  }

  playBomb() {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(50, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + 0.4);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(t + 0.5);
  }
}

export const audioService = new AudioService();
