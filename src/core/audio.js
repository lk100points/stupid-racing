export class GameAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.engine = null;
    this.engineGain = null;
    this.nitroGain = null;
    this.musicOscA = null;
    this.musicOscB = null;
    this.musicGain = null;
    this.musicFilter = null;
    this.enabled = true;
    this.infernal = false;
  }

  unlock() {
    if (!this.enabled) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!this.ctx) {
      this.ctx = new Ctx();
      this.master = this.ctx.createGain(); this.master.gain.value = .18; this.master.connect(this.ctx.destination);
      this.engine = this.ctx.createOscillator(); this.engine.type = 'sawtooth';
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = .0001;
      const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 310;
      this.engine.connect(filter); filter.connect(this.engineGain); this.engineGain.connect(this.master); this.engine.start();
      const nitro = this.ctx.createOscillator(); nitro.type = 'triangle'; nitro.frequency.value = 72;
      this.nitroGain = this.ctx.createGain(); this.nitroGain.gain.value = .0001;
      nitro.connect(this.nitroGain); this.nitroGain.connect(this.master); nitro.start();
      this.nitroOsc = nitro;

      // A quiet, original two-oscillator ambience bed. It is created only
      // after the first user gesture, so mobile browsers do not block it.
      this.musicOscA = this.ctx.createOscillator(); this.musicOscA.type = 'sine';
      this.musicOscB = this.ctx.createOscillator(); this.musicOscB.type = 'triangle';
      this.musicOscA.frequency.value = 82.41;
      this.musicOscB.frequency.value = 123.5;
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = .0001;
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass'; this.musicFilter.frequency.value = 520;
      this.musicOscA.connect(this.musicFilter);
      this.musicOscB.connect(this.musicFilter);
      this.musicFilter.connect(this.musicGain);
      this.musicGain.connect(this.master);
      this.musicOscA.start(); this.musicOscB.start();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setEnabled(value) {
    this.enabled = value;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(value ? .18 : .0001, this.ctx.currentTime, .08);
  }

  setInfernal(value) { this.infernal = value; }

  stopMusic() {
    if (this.ctx && this.musicGain) this.musicGain.gain.setTargetAtTime(.0001, this.ctx.currentTime, .18);
  }

  update(speed, boosting = false, elapsed = 0) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    this.engine.frequency.setTargetAtTime(42 + speed * 2.9 + (this.infernal ? 8 : 0), now, .07);
    this.engineGain.gain.setTargetAtTime(.012 + Math.min(speed / 65, .05), now, .12);
    this.nitroGain.gain.setTargetAtTime(boosting ? .07 : .0001, now, .035);
    this.nitroOsc.frequency.setTargetAtTime(boosting ? 95 + speed * 2 : 60, now, .08);
    const scale = [0, 3, 5, 7, 10, 7, 5, 3];
    const step = scale[Math.floor(elapsed / 2.25) % scale.length];
    const base = this.infernal ? 55 : 82.41;
    const root = base * Math.pow(2, step / 12);
    this.musicOscA.frequency.setTargetAtTime(root, now, .45);
    this.musicOscB.frequency.setTargetAtTime(root * (this.infernal ? 1.5 : 1.498), now, .55);
    this.musicGain.gain.setTargetAtTime(this.infernal ? .026 : .018, now, .8);
    this.musicFilter.frequency.setTargetAtTime(this.infernal ? 380 : 520, now, .9);
  }

  tone(freq, duration = .13, type = 'sine', volume = .1, slide = 0) {
    this.unlock();
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime + duration);
    osc.connect(gain); gain.connect(this.master); osc.start(); osc.stop(this.ctx.currentTime + duration + .02);
  }

  jump() { this.tone(240, .19, 'triangle', .08, 230); }
  collect() { this.tone(650, .12, 'sine', .08, 370); }
  hit() { this.tone(105, .24, 'sawtooth', .1, -55); }
  boss() { this.tone(this.infernal ? 130 : 260, .5, 'triangle', .13, this.infernal ? 500 : 240); }
  win() { this.tone(440, .17, 'sine', .1, 260); setTimeout(() => this.tone(660, .22, 'sine', .1, 180), 140); }
  abyss() { this.tone(55, 1.5, 'sawtooth', .12, -30); }
}
