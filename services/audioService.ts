
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private enabled: boolean = true;
  private volume: number = 0.4;
  private musicVolume: number = 0.01; 
  private droneNodes: AudioNode[] = [];
  private noiseBuffer: AudioBuffer | null = null;

  // SACRED FREQUENCIES CONFIG
  private readonly FREQ_GROUNDING = 174; // Solfeggio: Pain relief, security, foundation
  private readonly FREQ_LIBERATION = 396; // Solfeggio: Liberating guilt and fear
  private readonly FREQ_CONNECTION = 963; // Solfeggio: Connection to source (The "God" frequency)
  private readonly BEAT_ALPHA = 10;       // Brainwave: Relaxed focus, "The Zone"
  private readonly BEAT_GAMMA = 40;       // Brainwave: High concentration, problem solving

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

        // Music Channel (Drone)
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
        // Pink-ish noise (softer than white noise, good for texture)
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; 
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

  /**
   * --- SACRED GEOMETRY DRONE ENGINE ---
   * Designed to induce "Flow State" using Solfeggio frequencies and Binaural Beats.
   * Theme: Ancient Sacred Cavern.
   * Updated to be subtle, resonant, and non-intrusive.
   */
  private startDrone() {
    if (!this.ctx || !this.musicGain || this.droneNodes.length > 0) return;

    const t = this.ctx.currentTime;

    // LAYER 1: THE FOUNDATION (Binaural Alpha)
    // Frequency: 174 Hz (Solfeggio - Pain Relief / Security)
    // Effect: Creates a 10Hz Alpha wave beat for "Relaxed Focus".
    
    // Left Oscillator
    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.value = this.FREQ_GROUNDING;
    const panLeft = this.ctx.createStereoPanner();
    panLeft.pan.value = -1; // Hard Left
    
    // Right Oscillator
    const oscRight = this.ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.value = this.FREQ_GROUNDING + this.BEAT_ALPHA; // +10Hz difference
    const panRight = this.ctx.createStereoPanner();
    panRight.pan.value = 1; // Hard Right

    // Warmth Filter (Lowpass) - Lowered cutoff for darker tone
    const foundationFilter = this.ctx.createBiquadFilter();
    foundationFilter.type = 'lowpass';
    foundationFilter.frequency.value = 180; 

    // Gain for Foundation (Subtle base)
    const foundationGain = this.ctx.createGain();
    foundationGain.gain.value = 0.12; 

    oscLeft.connect(panLeft);
    oscRight.connect(panRight);
    panLeft.connect(foundationFilter);
    panRight.connect(foundationFilter);
    foundationFilter.connect(foundationGain);
    foundationGain.connect(this.musicGain);

    oscLeft.start(t);
    oscRight.start(t);
    this.droneNodes.push(oscLeft, oscRight, panLeft, panRight, foundationFilter, foundationGain);


    // LAYER 2: THE ATMOSPHERE (Liberation)
    // Frequency: 396 Hz (Solfeggio - Liberating Fear)
    // Switched to Sine for pure resonance, avoiding clashing harmonics.
    const oscMid = this.ctx.createOscillator();
    oscMid.type = 'sine';
    oscMid.frequency.value = this.FREQ_LIBERATION;
    
    // Filter to soften it into a "hum"
    const midFilter = this.ctx.createBiquadFilter();
    midFilter.type = 'lowpass';
    midFilter.frequency.value = 350;
    
    // Auto-Panner (Slowly drifting L <-> R)
    const midPanner = this.ctx.createStereoPanner();
    const midLfo = this.ctx.createOscillator();
    midLfo.frequency.value = 0.05; // 20 second cycle
    const midLfoGain = this.ctx.createGain();
    midLfoGain.gain.value = 0.3; // Pan width
    midLfo.connect(midLfoGain);
    midLfoGain.connect(midPanner.pan);

    const midGain = this.ctx.createGain();
    midGain.gain.value = 0.015; // Very subtle resonance

    oscMid.connect(midFilter);
    midFilter.connect(midPanner);
    midPanner.connect(midGain);
    midGain.connect(this.musicGain);

    oscMid.start(t);
    midLfo.start(t);
    this.droneNodes.push(oscMid, midLfo, midPanner, midGain);


    // LAYER 3: THE FOCUS (Gamma Noise Texture)
    // Effect: Pink noise modulated at 40Hz (Gamma).
    // Reduced gain to be barely perceptible texture.
    if (this.noiseBuffer) {
        const noiseSrc = this.ctx.createBufferSource();
        noiseSrc.buffer = this.noiseBuffer;
        noiseSrc.loop = true;
        noiseSrc.playbackRate.value = 0.15; // Deep, windy rumble

        // Bandpass to focus on "Wind" frequencies
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 150;
        noiseFilter.Q.value = 1;

        // Amplitude Modulation (Tremolo) at 40Hz
        const gammaLfo = this.ctx.createOscillator();
        gammaLfo.frequency.value = this.BEAT_GAMMA; 
        const gammaGain = this.ctx.createGain();
        gammaGain.gain.value = 0.2; // Depth of tremolo
        
        const noiseAmp = this.ctx.createGain();
        noiseAmp.gain.value = 0.01; // Extremely low level
        
        gammaLfo.connect(gammaGain);
        gammaGain.connect(noiseAmp.gain);

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseAmp);
        noiseAmp.connect(this.musicGain);
        
        noiseSrc.start(t);
        gammaLfo.start(t);
        this.droneNodes.push(noiseSrc, gammaLfo, noiseAmp);
    }

    // LAYER 4: THE DIVINE (963 Hz Connection)
    // Effect: A very faint, high "shimmer" that fades in and out.
    const oscHigh = this.ctx.createOscillator();
    oscHigh.type = 'sine';
    oscHigh.frequency.value = this.FREQ_CONNECTION; // 963 Hz
    
    const highGain = this.ctx.createGain();
    highGain.gain.value = 0; 

    // Slow swell LFO
    const swellLfo = this.ctx.createOscillator();
    swellLfo.frequency.value = 0.03; 
    const swellGain = this.ctx.createGain();
    swellGain.gain.value = 0.003; // Barely audible sparkle

    swellLfo.connect(swellGain);
    swellGain.connect(highGain.gain);

    oscHigh.connect(highGain);
    highGain.connect(this.musicGain);

    oscHigh.start(t);
    swellLfo.start(t);
    this.droneNodes.push(oscHigh, swellLfo, highGain);

    // LAYER 5: THE WASH (White Noise LPF)
    // Effect: A very subtle white noise wash.
    // UPDATED: Heavy low-pass to make it deep and soothing.
    if (this.noiseBuffer) {
        const washSrc = this.ctx.createBufferSource();
        washSrc.buffer = this.noiseBuffer;
        washSrc.loop = true;
        washSrc.playbackRate.value = 0.7; 

        // Low Pass Filter - drastically lowered for subtlety
        const washFilter = this.ctx.createBiquadFilter();
        washFilter.type = 'lowpass';
        washFilter.frequency.value = 350; // Was 1000, now 350 for warmth
        washFilter.Q.value = 0.5;

        // Tide LFO (Slower wash)
        const washLfo = this.ctx.createOscillator();
        washLfo.type = 'sine';
        washLfo.frequency.value = 0.04; // ~25 second cycle
        
        const washGain = this.ctx.createGain();
        washGain.gain.value = 0.004; // Extremely subtle base

        const washLfoAmp = this.ctx.createGain();
        washLfoAmp.gain.value = 0.002; // Modulation depth

        washLfo.connect(washLfoAmp);
        washLfoAmp.connect(washGain.gain);
        
        washSrc.connect(washFilter);
        washFilter.connect(washGain);
        washGain.connect(this.musicGain);
        
        washSrc.start(t);
        washLfo.start(t);
        this.droneNodes.push(washSrc, washLfo, washGain, washLfoAmp);
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

    // 1. IMPACT LAYER (The "Thud") - Slightly softened
    const kickOsc = this.ctx.createOscillator();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(120, t); // Lower start freq for less "click"
    kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    
    const kickGain = this.ctx.createGain();
    kickGain.gain.setValueAtTime(0.4, t);
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
            noiseFilter.frequency.value = 400; // Lowered from 600
            noiseSrc.playbackRate.value = 0.4; // Slower
            noiseGain.gain.setValueAtTime(0.25, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        } else if (material === 'METAL') {
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 1000; 
            noiseFilter.Q.value = 3;
            noiseSrc.playbackRate.value = 0.8;
            noiseGain.gain.setValueAtTime(0.15, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        } else {
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 1500; // Lowered from 2000
            noiseSrc.playbackRate.value = 1.2;
            noiseGain.gain.setValueAtTime(0.1, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        }

        noiseSrc.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseSrc.start();
        noiseSrc.stop(t + 0.5);
    }

    // 3. TONAL LAYER (The "Resonance") - FM Synthesis for metallic bell sound
    // Only play for metal/magic or very briefly for stone to add body
    if (material !== 'STONE' || value >= 8) {
        const carrier = this.ctx.createOscillator();
        const modulator = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();

        const tier = Math.log2(value);
        // Lower base frequencies slightly for warmth
        const baseFreq = material === 'METAL' ? 250 + (tier * 15) : 500 + (tier * 40);

        carrier.frequency.value = baseFreq;
        carrier.type = 'sine';

        // FM Ratio for metallic sound (non-integer)
        modulator.frequency.value = baseFreq * 1.41; 
        modulator.type = 'triangle';
        
        // Soften the FM modulation amount
        modGain.gain.setValueAtTime(100, t); // Reduced from 200
        modGain.gain.exponentialRampToValueAtTime(1, t + 0.4); // Longer decay on modulation

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        const carrierGain = this.ctx.createGain();
        
        // SOFT ATTACK implemented here
        carrierGain.gain.setValueAtTime(0, t);
        carrierGain.gain.linearRampToValueAtTime(0.12, t + 0.02); // 20ms attack
        
        // LONGER DECAY (Reverb simulation)
        const duration = material === 'MAGIC' ? 1.5 : 0.8;
        carrierGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        // Lowpass filter to cut harsh FM artifacts
        const lpf = this.ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(2000, t);
        lpf.frequency.exponentialRampToValueAtTime(500, t + duration);

        carrier.connect(lpf);
        lpf.connect(carrierGain);
        carrierGain.connect(this.sfxGain);
        
        carrier.start();
        modulator.start();
        carrier.stop(t + duration + 0.1);
        modulator.stop(t + duration + 0.1);
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

  /**
   * PLAY LEVEL UP - "The Divine Chord"
   * A Major chord based on 528Hz (Miracle Tone) swelling in with sparkles.
   * REFINED: Now uses filtered oscillators for a warmer, orchestral texture.
   */
  playLevelUp() {
    this.initContext();
    if (!this.enabled || !this.ctx || !this.sfxGain) return;
    
    const t = this.ctx.currentTime;
    
    // The Chord: C5 (528Hz Base), E5 (~665Hz), G5 (~792Hz), C6 (1056Hz)
    // Using Just Intonation ratios for cleaner "sacred" sound
    const chordFreqs = [528, 660, 792, 1056];
    
    // 1. CHORD SWELL (Pad)
    chordFreqs.forEach((freq, i) => {
        // Oscillator 1: Triangle for body
        const osc = this.ctx!.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        // Oscillator 2: Sine for purity (slightly detuned for chorus)
        const osc2 = this.ctx!.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = freq + (Math.random() * 2 - 1); // Detune +/- 1Hz

        // Filter: Start closed and open up (swell effect)
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(100, t);
        filter.frequency.exponentialRampToValueAtTime(3000, t + 0.6); // Open up brightness
        filter.frequency.exponentialRampToValueAtTime(200, t + 4.5); // Close down

        const gain = this.ctx!.createGain();
        
        // Envelope: Slow Attack, Long Sustain/Release
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.6); // Slower attack
        gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0); // Long fade out

        // Pan spread
        const panner = this.ctx!.createStereoPanner();
        panner.pan.value = (i % 2 === 0) ? -0.3 : 0.3;

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.sfxGain!);

        osc.start(t);
        osc2.start(t);
        osc.stop(t + 4.5);
        osc2.stop(t + 4.5);
    });

    // 2. BASS FOUNDATION
    const bassOsc = this.ctx.createOscillator();
    bassOsc.type = 'triangle'; // Changed to triangle for more warmth
    bassOsc.frequency.value = 264; // 528 / 2
    
    const bassFilter = this.ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 200;

    const bassGain = this.ctx.createGain();
    bassGain.gain.setValueAtTime(0, t);
    bassGain.gain.linearRampToValueAtTime(0.15, t + 0.5);
    bassGain.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
    
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(this.sfxGain);
    bassOsc.start(t);
    bassOsc.stop(t + 3.0);

    // 3. SPARKLES (Arpeggio)
    // Rapid sequence of high sine blips - like magical dust
    const sparkleCount = 8;
    for (let i = 0; i < sparkleCount; i++) {
        const time = t + 0.1 + (i * 0.12); // Staggered
        
        const sparkleOsc = this.ctx.createOscillator();
        sparkleOsc.type = 'sine';
        // Random pentatonic notes above the chord
        const notes = [1056, 1320, 1584, 2112];
        const note = notes[Math.floor(Math.random() * notes.length)];
        sparkleOsc.frequency.value = note;
        
        const sparkleGain = this.ctx.createGain();
        sparkleGain.gain.setValueAtTime(0.05, time);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        
        const sparklePan = this.ctx.createStereoPanner();
        sparklePan.pan.value = Math.random() * 2 - 1;

        sparkleOsc.connect(sparkleGain);
        sparkleGain.connect(sparklePan);
        sparklePan.connect(this.sfxGain);
        
        sparkleOsc.start(time);
        sparkleOsc.stop(time + 0.3);
    }
  }
  
  // Placeholder for bomb sound if needed by gameLogic
  playBomb() {
     this.playMerge(128); // Re-use heavy merge for now
  }
  
  playBossSpawn() {
      // Re-use logic or implement ominous drone if needed
      this.playMerge(2048);
  }
  
  playStageTransition() {
      this.playLevelUp();
  }
}

export const audioService = new AudioService();
