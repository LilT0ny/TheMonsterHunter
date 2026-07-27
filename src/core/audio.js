const MUTE_STORAGE_KEY = 'tmh_audio_muted';

const MUSIC_PRESETS = {
  calm: { tempo: 96, chordFreqs: [220, 277, 330], oscType: 'sine', pulseFilter: 900, pulseGain: 0.05, padGain: 0.07 },
  tense: { tempo: 128, chordFreqs: [196, 233, 277], oscType: 'sawtooth', pulseFilter: 340, pulseGain: 0.08, padGain: 0.065 },
  boss: { tempo: 150, chordFreqs: [110, 146, 174, 220], oscType: 'sawtooth', pulseFilter: 220, pulseGain: 0.12, padGain: 0.09 },
  gameover: { tempo: 54, chordFreqs: [196, 233], oscType: 'sine', pulseFilter: null, pulseGain: 0, padGain: 0.08 }
};

const FOLEY_LOOPS = {
  wind: { filterType: 'lowpass', filterFreq: 700, gain: 0.045 },
  sandstorm: { filterType: 'bandpass', filterFreq: 1000, gain: 0.085 }
};

export default class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.foleyGain = null;
    this.muted = typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    this.currentMusic = null;
    this.foleyNodes = {};
    this.footstepToggle = false;
  }

  ensureContext() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 1;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.35;
    this.musicGain.connect(this.masterGain);

    // El bus de SFX subio de 0.5 a 0.72: con 0.5 el disparo quedaba en 0.08 de
    // volumen real y el paso en 0.025, o sea practicamente inaudibles.
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.72;
    this.sfxGain.connect(this.masterGain);

    this.foleyGain = this.ctx.createGain();
    this.foleyGain.gain.value = 0.25;
    this.foleyGain.connect(this.masterGain);
  }

  resume() {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUTE_STORAGE_KEY, this.muted ? '1' : '0');
    }
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  // ---- Primitivas de sintesis ----

  playTone({ freq = 440, freqEnd = null, duration = 0.15, type = 'sine', gain = 0.25, delay = 0 }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + duration);
    }

    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t0 + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  playNoise({ duration = 0.15, gain = 0.25, filterFreq = 1200, filterType = 'bandpass', delay = 0, destination = null }) {
    if (!this.ctx) return null;
    const t0 = this.ctx.currentTime + delay;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(Math.max(0.001, gain), t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    source.connect(filter);
    filter.connect(env);
    env.connect(destination || this.sfxGain);
    source.start(t0);
    source.stop(t0 + duration + 0.02);
    return source;
  }

  // ---- SFX de un disparo (incluye foley puntual) ----

  playSfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'shoot':
        // Tres capas para que el disparo se NOTE: chasquido de cuerda, cuerpo
        // tonal y silbido de la flecha al salir.
        this.playNoise({ duration: 0.05, gain: 0.34, filterFreq: 2600, filterType: 'highpass' });
        this.playTone({ freq: 940, freqEnd: 320, duration: 0.11, type: 'triangle', gain: 0.4 });
        this.playTone({ freq: 300, freqEnd: 140, duration: 0.13, type: 'square', gain: 0.16, delay: 0.01 });
        this.playNoise({ duration: 0.16, gain: 0.12, filterFreq: 1500, filterType: 'bandpass', delay: 0.03 });
        break;
      case 'hit':
        this.playTone({ freq: 220, freqEnd: 90, duration: 0.09, type: 'square', gain: 0.18 });
        break;
      case 'damage':
        this.playNoise({ duration: 0.18, gain: 0.26, filterFreq: 500, filterType: 'lowpass' });
        break;
      case 'coin':
        this.playTone({ freq: 1200, duration: 0.05, type: 'square', gain: 0.14 });
        this.playTone({ freq: 1600, duration: 0.08, type: 'square', gain: 0.14, delay: 0.05 });
        break;
      case 'death':
        this.playTone({ freq: 300, freqEnd: 60, duration: 0.9, type: 'sawtooth', gain: 0.24 });
        break;
      case 'levelup':
        [523, 659, 784, 1046].forEach((freq, i) => this.playTone({
          freq, duration: 0.16, type: 'triangle', gain: 0.2, delay: i * 0.09
        }));
        break;
      case 'ability':
        this.playTone({ freq: 660, freqEnd: 990, duration: 0.22, type: 'sine', gain: 0.2 });
        break;
      case 'bossPhase':
        this.playNoise({ duration: 0.5, gain: 0.32, filterFreq: 200, filterType: 'lowpass' });
        this.playTone({ freq: 110, freqEnd: 55, duration: 0.6, type: 'sawtooth', gain: 0.24, delay: 0.05 });
        break;
      case 'footstep': {
        // Alterna pie izquierdo/derecho cambiando el brillo del filtro, para que
        // caminar suene a caminar y no a un click repetido.
        this.footstepToggle = !this.footstepToggle;
        const filterFreq = this.footstepToggle ? 1500 : 1150;
        this.playNoise({ duration: 0.07, gain: 0.2, filterFreq, filterType: 'bandpass' });
        this.playTone({ freq: this.footstepToggle ? 130 : 108, freqEnd: 62, duration: 0.06, type: 'sine', gain: 0.12 });
        break;
      }
      case 'heart':
        [660, 880, 1320].forEach((freq, i) => this.playTone({
          freq, duration: 0.18, type: 'sine', gain: 0.26, delay: i * 0.07
        }));
        break;
      case 'down':
        this.playTone({ freq: 420, freqEnd: 70, duration: 0.7, type: 'sawtooth', gain: 0.3 });
        this.playNoise({ duration: 0.45, gain: 0.2, filterFreq: 380, filterType: 'lowpass' });
        break;
      case 'revive':
        [392, 523, 659, 784].forEach((freq, i) => this.playTone({
          freq, duration: 0.24, type: 'triangle', gain: 0.24, delay: i * 0.08
        }));
        break;
      case 'split':
        this.playTone({ freq: 240, freqEnd: 520, duration: 0.2, type: 'square', gain: 0.22 });
        this.playNoise({ duration: 0.22, gain: 0.2, filterFreq: 900, filterType: 'bandpass', delay: 0.04 });
        break;
      case 'star':
        [784, 988, 1319].forEach((freq, i) => this.playTone({
          freq, duration: 0.3, type: 'triangle', gain: 0.3, delay: i * 0.16
        }));
        break;
      case 'playerJoin':
        [330, 415, 494, 659].forEach((freq, i) => this.playTone({
          freq, duration: 0.26, type: 'triangle', gain: 0.28, delay: i * 0.1
        }));
        break;
      case 'pause':
        this.playTone({ freq: 620, freqEnd: 300, duration: 0.16, type: 'sine', gain: 0.24 });
        break;
      case 'unpause':
        this.playTone({ freq: 300, freqEnd: 620, duration: 0.16, type: 'sine', gain: 0.24 });
        break;
      case 'uiSelect':
        this.playTone({ freq: 720, duration: 0.07, type: 'square', gain: 0.16 });
        break;
      case 'golemCreak':
        this.playTone({ freq: 90, freqEnd: 58, duration: 0.6, type: 'sawtooth', gain: 0.18 });
        this.playNoise({ duration: 0.4, gain: 0.1, filterFreq: 300, filterType: 'lowpass' });
        break;
      case 'scorpionRoar':
        this.playNoise({ duration: 0.5, gain: 0.2, filterFreq: 600, filterType: 'bandpass' });
        this.playTone({ freq: 180, freqEnd: 70, duration: 0.5, type: 'sawtooth', gain: 0.18, delay: 0.05 });
        break;
      default:
        break;
    }
  }

  // ---- Musica de fondo procedural ----

  startMusic(mood) {
    if (!this.ctx) return;
    if (this.currentMusic && this.currentMusic.mood === mood) return;
    this.stopMusic();
    this.currentMusic = this.buildMusicLoop(mood);
  }

  setMusicIntensity(level) {
    if (this.currentMusic?.setIntensity) {
      this.currentMusic.setIntensity(level);
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }

  buildMusicLoop(mood) {
    const preset = MUSIC_PRESETS[mood] || MUSIC_PRESETS.calm;
    const beatDuration = 60 / preset.tempo;

    const padVoices = preset.chordFreqs.map((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = preset.oscType;
      const detune = i === 0 ? 0 : (i % 2 === 0 ? 3 : -3);
      osc.frequency.value = freq;
      osc.detune.value = detune;

      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      gain.gain.setTargetAtTime(preset.padGain / preset.chordFreqs.length, this.ctx.currentTime, 1.2);
      return { osc, gain };
    });

    let intensity = 1;
    let running = true;
    let nextPulseTime = this.ctx.currentTime + 0.1;

    const schedulePulse = () => {
      if (!running || !preset.pulseFilter) return;
      const lookahead = 0.15;
      while (nextPulseTime < this.ctx.currentTime + lookahead) {
        this.playNoise({
          duration: beatDuration * 0.4,
          gain: preset.pulseGain * intensity,
          filterFreq: preset.pulseFilter,
          filterType: 'bandpass',
          delay: Math.max(0, nextPulseTime - this.ctx.currentTime),
          destination: this.musicGain
        });
        nextPulseTime += beatDuration;
      }
    };

    const intervalId = window.setInterval(schedulePulse, 50);

    return {
      mood,
      setIntensity: (level) => { intensity = level; },
      stop: () => {
        running = false;
        window.clearInterval(intervalId);
        padVoices.forEach(({ osc, gain }) => {
          gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
          osc.stop(this.ctx.currentTime + 0.6);
        });
      }
    };
  }

  // ---- Foley ambiental en loop ----

  startFoley(name) {
    if (!this.ctx || this.foleyNodes[name]) return;
    const config = FOLEY_LOOPS[name];
    if (!config) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = config.filterType;
    filter.frequency.value = config.filterFreq;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.foleyGain);
    source.start();
    gain.gain.setTargetAtTime(config.gain, this.ctx.currentTime, 1);

    this.foleyNodes[name] = { source, gain };
  }

  stopFoley(name) {
    const node = this.foleyNodes[name];
    if (!node) return;
    node.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.4);
    window.setTimeout(() => {
      try {
        node.source.stop();
      } catch (error) {
        // ya estaba detenido, no pasa nada.
      }
    }, 800);
    delete this.foleyNodes[name];
  }

  stopAllFoley() {
    Object.keys(this.foleyNodes).forEach((name) => this.stopFoley(name));
  }
}

export function getAudio(scene) {
  return scene.registry.get('audio') || null;
}
