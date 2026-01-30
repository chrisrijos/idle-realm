// Ambient procedural soundtrack using Web Audio API
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.nodes = [];
  }

  async init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
  }

  async start() {
    if (!this.ctx) await this.init();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;

    this.playAmbientDrone();
    this.playArpeggio();
    this.playPad();
  }

  stop() {
    this.isPlaying = false;
    this.nodes.forEach(n => {
      try { n.stop(); } catch (e) {}
    });
    this.nodes = [];
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  // === JABU-JABU'S BELLY INSPIRED SOUNDTRACK ===

  // Deep organic bass pulse (like inside a whale)
  playAmbientDrone() {
    if (!this.isPlaying) return;

    // Deep heartbeat-like pulse
    const playHeartbeat = () => {
      if (!this.isPlaying) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = 40; // Very deep

      filter.type = 'lowpass';
      filter.frequency.value = 80;

      // Heartbeat envelope: thump-thump
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.05, this.ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 1);

      // Irregular heartbeat timing (1.5-2.5 seconds)
      setTimeout(playHeartbeat, 1500 + Math.random() * 1000);
    };

    // Underwater rumble drone
    const rumble = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    const rumbleFilter = this.ctx.createBiquadFilter();

    rumble.type = 'sawtooth';
    rumble.frequency.value = 30;

    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 60;
    rumbleFilter.Q.value = 2;

    rumbleGain.gain.value = 0.08;

    // Slow modulation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(rumble.frequency);

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.masterGain);

    rumble.start();
    lfo.start();
    this.nodes.push(rumble, lfo);

    setTimeout(playHeartbeat, 500);
  }

  // Bubble sounds (random watery blips)
  playArpeggio() {
    if (!this.isPlaying) return;

    const playBubble = () => {
      if (!this.isPlaying) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Random bubble pitch
      const baseFreq = 400 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.1);

      filter.type = 'bandpass';
      filter.frequency.value = baseFreq;
      filter.Q.value = 10;

      // Quick pop envelope
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);

      // Random bubble timing (0.3-2 seconds)
      setTimeout(playBubble, 300 + Math.random() * 1700);
    };

    // Occasional bubble cluster
    const playBubbleCluster = () => {
      if (!this.isPlaying) return;

      const count = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (!this.isPlaying) return;

          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          const freq = 600 + Math.random() * 600;
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.3, this.ctx.currentTime + 0.08);

          gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

          osc.connect(gain);
          gain.connect(this.masterGain);

          osc.start();
          osc.stop(this.ctx.currentTime + 0.15);
        }, i * (50 + Math.random() * 80));
      }

      setTimeout(playBubbleCluster, 4000 + Math.random() * 6000);
    };

    setTimeout(playBubble, 1000);
    setTimeout(playBubbleCluster, 3000);
  }

  // Eerie organic pad (like whale song / Jabu-Jabu ambience)
  playPad() {
    if (!this.isPlaying) return;

    // Zelda-style mysterious minor chords
    const chords = [
      [73.42, 87.31, 110.00, 146.83],   // D minor (deep)
      [82.41, 98.00, 123.47, 164.81],   // E minor
      [65.41, 77.78, 98.00, 130.81],    // C minor
      [69.30, 82.41, 103.83, 138.59],   // C# minor (eerie)
    ];

    const playWhaleSong = () => {
      if (!this.isPlaying) return;

      const chord = chords[Math.floor(Math.random() * chords.length)];

      chord.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Slightly detuned for organic feel
        osc.type = 'sine';
        osc.frequency.value = freq;

        osc2.type = 'triangle';
        osc2.frequency.value = freq * 1.002; // Slight detune

        filter.type = 'lowpass';
        filter.frequency.value = 300;

        // Slow swell
        const startTime = this.ctx.currentTime + i * 0.3;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.06, startTime + 3);
        gain.gain.linearRampToValueAtTime(0.05, startTime + 6);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 10);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc2.start(startTime);
        osc.stop(startTime + 10);
        osc2.stop(startTime + 10);
      });

      // Occasional high ethereal tone (like distant whale call)
      if (Math.random() < 0.4) {
        setTimeout(() => {
          if (!this.isPlaying) return;

          const whaleCall = this.ctx.createOscillator();
          const whaleGain = this.ctx.createGain();
          const whaleFilter = this.ctx.createBiquadFilter();

          whaleCall.type = 'sine';
          const startFreq = 300 + Math.random() * 200;
          whaleCall.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
          whaleCall.frequency.linearRampToValueAtTime(startFreq * 0.7, this.ctx.currentTime + 2);
          whaleCall.frequency.linearRampToValueAtTime(startFreq * 0.9, this.ctx.currentTime + 3);

          whaleFilter.type = 'lowpass';
          whaleFilter.frequency.value = 600;

          whaleGain.gain.setValueAtTime(0, this.ctx.currentTime);
          whaleGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.5);
          whaleGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 2);
          whaleGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3.5);

          whaleCall.connect(whaleFilter);
          whaleFilter.connect(whaleGain);
          whaleGain.connect(this.masterGain);

          whaleCall.start();
          whaleCall.stop(this.ctx.currentTime + 4);
        }, 2000 + Math.random() * 3000);
      }

      setTimeout(playWhaleSong, 8000 + Math.random() * 6000);
    };

    // Mysterious glassy tones (like Zelda puzzle hints)
    const playMysteryTone = () => {
      if (!this.isPlaying) return;

      const notes = [329.63, 392.00, 440.00, 493.88, 523.25]; // E4, G4, A4, B4, C5
      const note = notes[Math.floor(Math.random() * notes.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = this.ctx.createDelay();
      const delayGain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = note;

      // Reverb-like delay
      delay.delayTime.value = 0.3;
      delayGain.gain.value = 0.3;

      gain.gain.setValueAtTime(0.07, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      gain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);

      setTimeout(playMysteryTone, 5000 + Math.random() * 10000);
    };

    setTimeout(playWhaleSong, 1000);
    setTimeout(playMysteryTone, 4000);
  }

  // === EVENT SOUNDS ===

  // Process spawned
  playSpawn() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  // Process killed/stopped
  playKill() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  // Docker container started
  playContainerStart() {
    if (!this.ctx) return;
    this.ensureContext();

    // Rising tone sequence
    [0, 0.1, 0.2].forEach((delay, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = 200 + i * 100;

      gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.15);
    });
  }

  // Docker container stopped
  playContainerStop() {
    if (!this.ctx) return;
    this.ensureContext();

    // Falling tone sequence
    [0, 0.1, 0.2].forEach((delay, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.value = 400 - i * 100;

      gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.15);
    });
  }

  // Error occurred
  playError() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Dissonant chord
    osc.type = 'sawtooth';
    osc.frequency.value = 150;

    osc2.type = 'sawtooth';
    osc2.frequency.value = 158; // Slightly detuned for dissonance

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + 0.6);
    osc2.stop(this.ctx.currentTime + 0.6);
  }

  // Health check passed
  playHealthy() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Health check failed
  playUnhealthy() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  // Stale/frozen process
  playFrozen() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = 800;

    filter.type = 'highpass';
    filter.frequency.value = 600;

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  async ensureContext() {
    if (!this.ctx) await this.init();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }
}
