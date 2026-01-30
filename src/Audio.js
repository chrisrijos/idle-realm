// Zelda-inspired procedural soundtrack using Web Audio API
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.nodes = [];
    this.currentTrack = 0;
    this.trackNames = ['Jabu-Jabu', 'Lost Woods', 'Temple of Time', 'Fairy Fountain'];
    this.volumeBeforeMute = 0.3;
  }

  async init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.isMuted ? 0 : 0.3;
    this.masterGain.connect(this.ctx.destination);
  }

  mute() {
    this.isMuted = true;
    if (this.masterGain) {
      this.volumeBeforeMute = this.masterGain.gain.value || 0.3;
      this.masterGain.gain.value = 0;
    }
    return true;
  }

  unmute() {
    this.isMuted = false;
    if (this.masterGain) {
      this.masterGain.gain.value = this.volumeBeforeMute;
    }
    return false;
  }

  toggleMute() {
    if (this.isMuted) {
      return this.unmute();
    } else {
      return this.mute();
    }
  }

  async start() {
    if (!this.ctx) await this.init();
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;

    this.playTrack(this.currentTrack);
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

  nextTrack() {
    this.currentTrack = (this.currentTrack + 1) % this.trackNames.length;
    if (this.isPlaying) {
      this.stop();
      this.isPlaying = true;
      this.playTrack(this.currentTrack);
    }
    return this.trackNames[this.currentTrack];
  }

  getTrackName() {
    return this.trackNames[this.currentTrack];
  }

  playTrack(index) {
    switch (index) {
      case 0: this.playJabuJabu(); break;
      case 1: this.playLostWoods(); break;
      case 2: this.playTempleOfTime(); break;
      case 3: this.playFairyFountain(); break;
    }
  }

  // === TRACK 1: JABU-JABU'S BELLY ===
  playJabuJabu() {
    if (!this.isPlaying) return;

    // Heartbeat
    const playHeartbeat = () => {
      if (!this.isPlaying || this.currentTrack !== 0) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = 40;
      filter.type = 'lowpass';
      filter.frequency.value = 80;

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

      setTimeout(playHeartbeat, 1500 + Math.random() * 1000);
    };

    // Bubbles
    const playBubble = () => {
      if (!this.isPlaying || this.currentTrack !== 0) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = 400 + Math.random() * 800;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);

      setTimeout(playBubble, 300 + Math.random() * 1700);
    };

    // Deep drone
    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    const droneFilter = this.ctx.createBiquadFilter();

    drone.type = 'sawtooth';
    drone.frequency.value = 30;
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 60;
    droneGain.gain.value = 0.08;

    drone.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.masterGain);
    drone.start();
    this.nodes.push(drone);

    setTimeout(playHeartbeat, 500);
    setTimeout(playBubble, 1000);
  }

  // === TRACK 2: LOST WOODS ===
  playLostWoods() {
    if (!this.isPlaying) return;

    // Saria's Song inspired melody pattern: F A B, F A B, F A B E D
    const melody = [349.23, 440, 493.88, 349.23, 440, 493.88, 349.23, 440, 493.88, 329.63, 293.66];
    const durations = [0.25, 0.25, 0.5, 0.25, 0.25, 0.5, 0.25, 0.25, 0.25, 0.25, 0.75];
    let noteIndex = 0;

    const playMelodyNote = () => {
      if (!this.isPlaying || this.currentTrack !== 1) return;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const freq = melody[noteIndex];
      const dur = durations[noteIndex];

      osc.type = 'square';
      osc.frequency.value = freq;
      osc2.type = 'triangle';
      osc2.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 1500;

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur * 0.9);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc2.start();
      osc.stop(this.ctx.currentTime + dur);
      osc2.stop(this.ctx.currentTime + dur);

      noteIndex = (noteIndex + 1) % melody.length;

      // Add pause after full phrase
      const nextDelay = noteIndex === 0 ? 1500 : dur * 1000;
      setTimeout(playMelodyNote, nextDelay);
    };

    // Forest ambience - bird chirps
    const playBirdChirp = () => {
      if (!this.isPlaying || this.currentTrack !== 1) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = 1500 + Math.random() * 1000;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.setValueAtTime(baseFreq * 1.2, this.ctx.currentTime + 0.05);
      osc.frequency.setValueAtTime(baseFreq * 0.9, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);

      setTimeout(playBirdChirp, 2000 + Math.random() * 4000);
    };

    // Bass drone in F
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = 'triangle';
    bass.frequency.value = 87.31; // F2
    bassGain.gain.value = 0.1;
    bass.connect(bassGain);
    bassGain.connect(this.masterGain);
    bass.start();
    this.nodes.push(bass);

    setTimeout(playMelodyNote, 500);
    setTimeout(playBirdChirp, 2000);
  }

  // === TRACK 3: TEMPLE OF TIME ===
  playTempleOfTime() {
    if (!this.isPlaying) return;

    // Slow, reverential chords
    const chords = [
      [130.81, 164.81, 196.00], // C major
      [146.83, 174.61, 220.00], // D minor
      [164.81, 196.00, 246.94], // E minor
      [174.61, 220.00, 261.63], // F major
    ];
    let chordIndex = 0;

    const playChord = () => {
      if (!this.isPlaying || this.currentTrack !== 2) return;

      const chord = chords[chordIndex];

      chord.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.value = freq;

        filter.type = 'lowpass';
        filter.frequency.value = 500;

        const startTime = this.ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08, startTime + 1);
        gain.gain.linearRampToValueAtTime(0.06, startTime + 3);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + 5);
      });

      chordIndex = (chordIndex + 1) % chords.length;
      setTimeout(playChord, 4000);
    };

    // Bell tones
    const playBell = () => {
      if (!this.isPlaying || this.currentTrack !== 2) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const note = notes[Math.floor(Math.random() * notes.length)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = note;

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 3);

      setTimeout(playBell, 3000 + Math.random() * 4000);
    };

    // Deep reverb drone
    const drone = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    drone.type = 'sine';
    drone.frequency.value = 65.41; // C2
    droneGain.gain.value = 0.12;
    drone.connect(droneGain);
    droneGain.connect(this.masterGain);
    drone.start();
    this.nodes.push(drone);

    setTimeout(playChord, 500);
    setTimeout(playBell, 2000);
  }

  // === TRACK 4: FAIRY FOUNTAIN ===
  playFairyFountain() {
    if (!this.isPlaying) return;

    // Iconic arpeggio pattern
    const arpNotes = [
      261.63, 329.63, 392.00, 523.25, 659.25, 783.99,
      659.25, 523.25, 392.00, 329.63
    ];
    let arpIndex = 0;

    const playArp = () => {
      if (!this.isPlaying || this.currentTrack !== 3) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = arpNotes[arpIndex];

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.02, this.ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.8);

      arpIndex = (arpIndex + 1) % arpNotes.length;

      const nextDelay = arpIndex === 0 ? 400 : 150;
      setTimeout(playArp, nextDelay);
    };

    // Sparkle sounds
    const playSparkle = () => {
      if (!this.isPlaying || this.currentTrack !== 3) return;

      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.value = 2000 + Math.random() * 2000;

          gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.1);
        }, i * 50);
      }

      setTimeout(playSparkle, 1500 + Math.random() * 2000);
    };

    // Pad chord
    const playPad = () => {
      if (!this.isPlaying || this.currentTrack !== 3) return;

      const chords = [
        [261.63, 329.63, 392.00], // C
        [293.66, 369.99, 440.00], // D
        [329.63, 415.30, 493.88], // E
        [349.23, 440.00, 523.25], // F
      ];
      const chord = chords[Math.floor(Math.random() * chords.length)];

      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq / 2;

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 1);
        gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 4);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 6);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 6);
      });

      setTimeout(playPad, 5000 + Math.random() * 3000);
    };

    setTimeout(playArp, 100);
    setTimeout(playSparkle, 1000);
    setTimeout(playPad, 500);
  }

  // === EVENT SOUNDS ===

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

  playKill() {
    if (!this.ctx) return;
    this.ensureContext();

    // Dramatic death sound
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.8);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + 0.8);
    osc2.stop(this.ctx.currentTime + 0.8);
  }

  playVillainAppear() {
    if (!this.ctx) return;
    this.ensureContext();

    // Ominous appearance
    [0, 0.1, 0.2].forEach((delay, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = 80 + i * 20;

      gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.3);
    });
  }

  playContainerStart() {
    if (!this.ctx) return;
    this.ensureContext();

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

  playContainerStop() {
    if (!this.ctx) return;
    this.ensureContext();

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

  playError() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 150;
    osc2.type = 'sawtooth';
    osc2.frequency.value = 158;

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

  playHealthy() {
    if (!this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

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
