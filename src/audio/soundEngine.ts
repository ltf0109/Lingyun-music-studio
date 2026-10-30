import { AcousticHallType, InstrumentId } from '../types/music';
import { midiToFreq } from '../data/instruments';

export const ACOUSTIC_HALL_PRESETS: Array<{
  id: AcousticHallType;
  name: string;
  subtitle: string;
  duration: number;
  decay: number;
  dampingFreq: number;
  earlyBoost: number;
}> = [
  {
    id: 'golden_hall',
    name: '维也纳金色大厅',
    subtitle: '2.7s 温暖木质交响厅堂反射',
    duration: 2.7,
    decay: 2.5,
    dampingFreq: 5200,
    earlyBoost: 1.38,
  },
  {
    id: 'cathedral',
    name: '哥特圣堂大教堂',
    subtitle: '3.9s 穹顶石壁恢弘长混响',
    duration: 3.8,
    decay: 1.95,
    dampingFreq: 4100,
    earlyBoost: 1.5,
  },
  {
    id: 'oriental_courtyard',
    name: '东方竹林水榭',
    subtitle: '2.0s 空灵清透自然山水回响',
    duration: 2.0,
    decay: 2.8,
    dampingFreq: 6800,
    earlyBoost: 1.45,
  },
  {
    id: 'studio_intimate',
    name: '大师近场弦乐棚',
    subtitle: '1.15s 细腻贴耳高解析干声',
    duration: 1.15,
    decay: 3.6,
    dampingFreq: 7800,
    earlyBoost: 1.2,
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private fidelityFilter: BiquadFilterNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbDampingFilter: BiquadFilterNode | null = null;
  private reverbSendGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private masterFidelity = 0.95; // 0.2 to 1.0
  private masterReverb = 0.48; // 0.0 to 1.0
  private currentHall: AcousticHallType = 'golden_hall';

  public init(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -13;
      this.compressor.knee.value = 16;
      this.compressor.ratio.value = 3.5;
      this.compressor.attack.value = 0.006;
      this.compressor.release.value = 0.22;

      // Global Master Fidelity High-Resolution / Warmth Filter
      this.fidelityFilter = this.ctx.createBiquadFilter();
      this.fidelityFilter.type = 'lowpass';
      this.fidelityFilter.frequency.value = this.computeCutoffFromFidelity(this.masterFidelity);
      this.fidelityFilter.Q.value = 0.65;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.84;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.78;

      this.dryGain = this.ctx.createGain();
      this.dryGain.gain.value = 0.86;

      this.reverbSendGain = this.ctx.createGain();
      this.reverbSendGain.gain.value = this.masterReverb * 0.9;

      this.reverbDampingFilter = this.ctx.createBiquadFilter();
      this.reverbDampingFilter.type = 'lowpass';
      this.reverbDampingFilter.frequency.value = 5200;

      const hallSpec =
        ACOUSTIC_HALL_PRESETS.find((h) => h.id === this.currentHall) ||
        ACOUSTIC_HALL_PRESETS[0];
      this.reverbNode = this.createConcertHallReverb(
        this.ctx,
        hallSpec.duration,
        hallSpec.decay,
        hallSpec.earlyBoost
      );

      this.dryGain.connect(this.fidelityFilter);
      this.reverbSendGain.connect(this.reverbDampingFilter);
      this.reverbDampingFilter.connect(this.reverbNode);
      this.reverbNode.connect(this.fidelityFilter);

      this.fidelityFilter.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.noiseBuffer = this.createNoiseBuffer(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private computeCutoffFromFidelity(fidelity: number): number {
    const clamped = Math.max(0.15, Math.min(1.0, fidelity));
    // Maps 0.15 -> 1600Hz (lo-fi vintage), 0.5 -> 5200Hz, 1.0 -> 19500Hz (ultra HD acoustic sheen)
    return Math.round(1100 * Math.pow(18, clamped));
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public setMasterVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        Math.max(0, Math.min(1, vol)),
        this.ctx.currentTime,
        0.02
      );
    }
  }

  public setMasterFidelity(fidelity: number) {
    this.masterFidelity = Math.max(0.15, Math.min(1.0, fidelity));
    if (this.fidelityFilter && this.ctx) {
      this.fidelityFilter.frequency.setTargetAtTime(
        this.computeCutoffFromFidelity(this.masterFidelity),
        this.ctx.currentTime,
        0.03
      );
    }
  }

  public setMasterReverb(reverb: number) {
    this.masterReverb = Math.max(0.0, Math.min(1.0, reverb));
    if (this.reverbSendGain && this.ctx) {
      this.reverbSendGain.gain.setTargetAtTime(
        this.masterReverb * 0.95,
        this.ctx.currentTime,
        0.03
      );
    }
  }

  public setHallType(hall: AcousticHallType) {
    this.currentHall = hall;
    if (!this.ctx || !this.reverbDampingFilter || !this.fidelityFilter) return;
    const spec =
      ACOUSTIC_HALL_PRESETS.find((h) => h.id === hall) || ACOUSTIC_HALL_PRESETS[0];

    try {
      if (this.reverbNode) {
        this.reverbDampingFilter.disconnect();
        this.reverbNode.disconnect();
      }
    } catch {
      // ignore disconnect errors
    }

    this.reverbDampingFilter.frequency.setValueAtTime(
      spec.dampingFreq,
      this.ctx.currentTime
    );
    this.reverbNode = this.createConcertHallReverb(
      this.ctx,
      spec.duration,
      spec.decay,
      spec.earlyBoost
    );
    this.reverbDampingFilter.connect(this.reverbNode);
    this.reverbNode.connect(this.fidelityFilter);
  }

  private createConcertHallReverb(
    ctx: AudioContext,
    duration: number,
    decay: number,
    earlyBoost = 1.35
  ): ConvolverNode {
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, sampleRate);

    // Early reflection tap times (in seconds) simulating concert hall side walls & ceiling
    const earlyTaps = [0.011, 0.019, 0.029, 0.043, 0.059, 0.078];

    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, decay);
        // Subtle stereo modulation in late tail for spatial width
        const mod = 1 + 0.08 * Math.sin((i / sampleRate) * (ch === 0 ? 3.1 : 3.7) * Math.PI * 2);
        channelData[i] = (Math.random() * 2 - 1) * env * mod * 0.45;
      }

      // Add discrete early acoustic reflections
      for (let tapIdx = 0; tapIdx < earlyTaps.length; tapIdx++) {
        const tapSample = Math.floor((earlyTaps[tapIdx] + ch * 0.0023) * sampleRate);
        if (tapSample < length) {
          const tapAmp = (earlyBoost * 0.32) / (1 + tapIdx * 0.25);
          for (let w = 0; w < Math.min(80, length - tapSample); w++) {
            channelData[tapSample + w] +=
              (Math.random() * 2 - 1) * tapAmp * (1 - w / 80);
          }
        }
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Pink-tinted acoustic noise for smoother bow & breath realism
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.55) * 0.75;
    }
    return buffer;
  }

  /**
   * Connects an instrument's output bus to the dry & reverb busses,
   * applying per-track Fidelity filtering and per-track Reverb Send scaling.
   */
  private connectToOutput(
    node: AudioNode,
    defaultReverb = 0.38,
    trackFidelity = 0.92,
    trackReverbSend?: number
  ) {
    if (!this.ctx || !this.dryGain || !this.reverbSendGain) return;

    const effFidelity = Math.max(
      0.15,
      Math.min(1.0, trackFidelity * this.masterFidelity)
    );
    const effReverb =
      trackReverbSend !== undefined
        ? Math.max(0, Math.min(1.0, trackReverbSend * 1.15))
        : defaultReverb;

    // Per-note / per-track acoustic fidelity shaper
    let sourceNode: AudioNode = node;
    if (effFidelity < 0.88) {
      const trackLp = this.ctx.createBiquadFilter();
      trackLp.type = 'lowpass';
      trackLp.frequency.value = this.computeCutoffFromFidelity(effFidelity);
      trackLp.Q.value = 0.7;
      node.connect(trackLp);
      sourceNode = trackLp;
    } else if (effFidelity >= 0.9) {
      // High-definition acoustic air shelf (+2.5dB above 4.5kHz for classical delicacy)
      const airShelf = this.ctx.createBiquadFilter();
      airShelf.type = 'highshelf';
      airShelf.frequency.value = 4500;
      airShelf.gain.value = (effFidelity - 0.85) * 18;
      node.connect(airShelf);
      sourceNode = airShelf;
    }

    sourceNode.connect(this.dryGain);
    if (effReverb > 0.01) {
      const send = this.ctx.createGain();
      send.gain.value = effReverb;
      sourceNode.connect(send);
      send.connect(this.reverbSendGain);
    }
  }

  /**
   * Adds multi-band wooden soundboard / cavity formant filters to classical acoustic instruments
   * to dramatically enhance realism and woody warmth.
   */
  private createAcousticBodyResonator(
    ctx: AudioContext,
    formants: Array<{ freq: number; q: number; gainDb: number }>,
    fidelity: number
  ): { input: AudioNode; output: AudioNode } {
    if (fidelity < 0.35 || formants.length === 0) {
      const pass = ctx.createGain();
      return { input: pass, output: pass };
    }
    const scale = Math.min(1.2, Math.max(0.3, fidelity));
    const nodes = formants.map((f) => {
      const peq = ctx.createBiquadFilter();
      peq.type = 'peaking';
      peq.frequency.value = f.freq;
      peq.Q.value = f.q;
      peq.gain.value = f.gainDb * scale;
      return peq;
    });
    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].connect(nodes[i + 1]);
    }
    return { input: nodes[0], output: nodes[nodes.length - 1] };
  }

  public triggerNote(
    instrument: InstrumentId,
    midiPitch: number,
    durationSec: number,
    velocity = 0.8,
    trackVolume = 0.85,
    whenOffsetSec = 0,
    trackFidelity = 0.92,
    trackReverbSend?: number
  ) {
    const ctx = this.init();
    const now = ctx.currentTime + Math.max(0, whenOffsetSec);
    const gainLevel = Math.max(0.04, Math.min(1.0, velocity * trackVolume)) * 0.32;
    const dur = Math.max(0.08, durationSec);
    const fid = Math.max(0.15, Math.min(1.0, trackFidelity * this.masterFidelity));

    if (instrument === 'percussion_kit') {
      this.playPercussion(ctx, midiPitch, now, gainLevel * 1.4, fid, trackReverbSend);
      return;
    }

    const freq = midiToFreq(midiPitch);

    switch (instrument) {
      case 'ancient_bianzhong':
        this.playAncientBianzhong(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'guzheng':
        this.playGuzheng(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'pipa':
        this.playPipa(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'dizi':
        this.playDizi(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'string_concerto':
        this.playStringConcerto(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'epic_strings':
        this.playEpicStrings(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'epic_brass':
        this.playEpicBrass(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'violin_section':
        this.playStrings(ctx, freq, now, dur, gainLevel, true, fid, trackReverbSend);
        break;
      case 'cello_solo':
        this.playStrings(ctx, freq, now, dur, gainLevel, false, fid, trackReverbSend);
        break;
      case 'french_horn':
        this.playFrenchHorn(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'flute_orchestral':
        this.playConcertFlute(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'orchestral_harp':
        this.playHarp(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'female_soprano':
        this.playVocalFormant(ctx, freq, now, dur, gainLevel, fid, trackReverbSend, {
          f1: 800,
          f2: 1250,
          f3: 2900,
          vibratoRate: 5.8,
          vibratoDepth: 4.5,
          breath: 0.08,
          choirVoices: 1,
        });
        break;
      case 'female_mezzo':
        this.playVocalFormant(ctx, freq, now, dur, gainLevel, fid, trackReverbSend, {
          f1: 650,
          f2: 1150,
          f3: 2750,
          vibratoRate: 5.4,
          vibratoDepth: 4.0,
          breath: 0.09,
          choirVoices: 1,
        });
        break;
      case 'female_alto':
        this.playVocalFormant(ctx, freq, now, dur, gainLevel, fid, trackReverbSend, {
          f1: 540,
          f2: 1020,
          f3: 2550,
          vibratoRate: 5.1,
          vibratoDepth: 3.6,
          breath: 0.07,
          choirVoices: 1,
        });
        break;
      case 'male_tenor':
        this.playVocalFormant(ctx, freq, now, dur, gainLevel, fid, trackReverbSend, {
          f1: 620,
          f2: 1120,
          f3: 2750,
          vibratoRate: 5.5,
          vibratoDepth: 4.2,
          breath: 0.06,
          choirVoices: 1,
        });
        break;
      case 'male_baritone':
        this.playVocalFormant(ctx, freq, now, dur, gainLevel, fid, trackReverbSend, {
          f1: 500,
          f2: 960,
          f3: 2450,
          vibratoRate: 5.0,
          vibratoDepth: 3.5,
          breath: 0.06,
          choirVoices: 1,
        });
        break;
      case 'male_bass':
        this.playVocalFormant(ctx, freq, now, dur, gainLevel, fid, trackReverbSend, {
          f1: 420,
          f2: 860,
          f3: 2250,
          vibratoRate: 4.7,
          vibratoDepth: 3.0,
          breath: 0.05,
          choirVoices: 1,
        });
        break;
      case 'grand_choir':
        this.playVocalFormant(ctx, freq, now, dur, gainLevel, fid, trackReverbSend, {
          f1: 640,
          f2: 1100,
          f3: 2650,
          vibratoRate: 5.2,
          vibratoDepth: 3.8,
          breath: 0.12,
          choirVoices: 3,
        });
        break;
      case 'soft_humming':
        this.playSoftHumming(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'grand_piano':
        this.playGrandPiano(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'pipe_organ':
        this.playPipeOrgan(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'harpsichord':
        this.playHarpsichord(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'church_bells':
        this.playChurchBells(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'classical_guitar':
        this.playClassicalGuitar(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'chiptune_8bit':
        this.playChiptune8Bit(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'electric_guitar_lead':
        this.playElectricGuitarLead(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'electric_guitar_clean':
        this.playElectricGuitarClean(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'synth_lead':
        this.playSynthLead(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'synth_pad':
        this.playSynthPad(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      case 'synth_bass':
        this.playSynthBass(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
        break;
      default:
        this.playGrandPiano(ctx, freq, now, dur, gainLevel, fid, trackReverbSend);
    }
  }

  // 1. 中国上古钟磬 (Ancient Bianzhong & Bianqing - 曾侯乙编钟一钟双音 + 玉磬清响)
  private playAncientBianzhong(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = Math.max(dur * 2.4, 1.85);
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.32, now + 0.004);
    out.gain.exponentialRampToValueAtTime(level * 0.56, now + 0.22);
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const allPartials = [
      { ratio: 1.0, amp: 0.85, decayMult: 1.0, type: 'sine' as OscillatorType },
      { ratio: 1.2599, amp: 0.44 * fid, decayMult: 0.74, type: 'sine' as OscillatorType }, // 鼓旁音大三度
      { ratio: 2.0, amp: 0.36, decayMult: 0.82, type: 'triangle' as OscillatorType },
      { ratio: 2.76, amp: 0.3 * fid, decayMult: 0.48, type: 'sine' as OscillatorType }, // 青铜非谐波泛音
      { ratio: 4.18, amp: 0.24 * fid, decayMult: 0.32, type: 'sine' as OscillatorType }, // 玉磬清响高频
      { ratio: 5.42, amp: 0.14 * fid * fid, decayMult: 0.2, type: 'sine' as OscillatorType }, // 金石泛音微光
    ];

    const activeCount = fid > 0.7 ? allPartials.length : fid > 0.4 ? 4 : 3;
    allPartials.slice(0, activeCount).forEach((p, idx) => {
      const osc = ctx.createOscillator();
      const pg = ctx.createGain();
      osc.type = p.type;
      osc.frequency.setValueAtTime(freq * p.ratio, now);
      if (idx === 1 && fid > 0.6) {
        osc.detune.value = 3.5; // Natural bronze acoustic shimmer beating
      }
      pg.gain.setValueAtTime(Math.max(0.01, p.amp * 0.5), now);
      pg.gain.exponentialRampToValueAtTime(0.0001, now + release * p.decayMult);
      osc.connect(pg);
      pg.connect(out);
      osc.start(now);
      osc.stop(now + release * p.decayMult + 0.05);
    });

    this.addPluckNoise(ctx, out, now, 3400, 0.016, 0.32 * fid);
    this.connectToOutput(out, 0.68, fid, rev);
  }

  // 2. 弦乐协奏 (String Concerto - 斯特拉迪瓦里独奏小提琴木质共鸣箱 + 运弓擦弦细节 + 室内乐协奏)
  private playStringConcerto(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const attack = 0.022;
    const release = dur + 0.24;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.2, now + attack);
    out.gain.exponentialRampToValueAtTime(level * 0.94, now + Math.min(dur, 0.11));
    out.gain.setValueAtTime(level * 0.89, now + Math.max(attack + 0.02, dur - 0.03));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    // Cremonese Violin 3-Band Wooden Body Formant Resonator
    const body = this.createAcousticBodyResonator(
      ctx,
      [
        { freq: 285, q: 2.2, gainDb: 3.8 }, // Helmholtz air cavity mode (A0)
        { freq: 980, q: 2.0, gainDb: 5.2 }, // Spruce top plate bridge resonance
        { freq: 2750, q: 2.4, gainDb: 4.4 }, // Soloist projection singer's formant
      ],
      fid
    );

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    const maxHarmonicMult = 3.2 + fid * 4.8;
    lp.frequency.setValueAtTime(Math.min(16000, freq * maxHarmonicMult), now);
    lp.frequency.exponentialRampToValueAtTime(
      Math.min(12000, freq * (2.5 + fid * 2.5)),
      now + dur
    );

    const voices = [
      { detune: 0, amp: 0.62, vibRate: 6.1, vibDepth: 0.0095 },
      { detune: -6.5, amp: 0.28 * fid, vibRate: 5.5, vibDepth: 0.0065 },
      { detune: 7.5, amp: 0.28 * fid, vibRate: 5.8, vibDepth: 0.0065 },
    ];

    voices.forEach((v) => {
      if (v.amp <= 0.02) return;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.value = v.detune;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = v.vibRate;
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.linearRampToValueAtTime(freq * v.vibDepth * (0.6 + 0.4 * fid), now + 0.09);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const vg = ctx.createGain();
      vg.gain.value = v.amp;
      osc.connect(vg);
      vg.connect(body.input);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + release + 0.05);
      lfo.stop(now + release + 0.05);
    });

    // Silk rosin bow hair articulation transient scaled by fidelity
    this.addPluckNoise(ctx, body.input, now, 3100, 0.025, 0.22 * fid);

    body.output.connect(lp);
    lp.connect(out);
    this.connectToOutput(out, 0.46, fid, rev);
  }

  // 3. 史诗弦乐 (Epic Symphonic Strings - 双八度宽银幕大编制弦乐群 + 琴体木质共鸣)
  private playEpicStrings(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const attack = 0.042;
    const release = dur + 0.38;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.25, now + attack);
    out.gain.setValueAtTime(level * 1.0, now + Math.max(attack + 0.02, dur - 0.04));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const body = this.createAcousticBodyResonator(
      ctx,
      [
        { freq: 210, q: 1.8, gainDb: 4.2 }, // Cello/Bass warm wood chest
        { freq: 1120, q: 1.9, gainDb: 3.8 }, // Ensemble viola/violin body
        { freq: 3200, q: 2.0, gainDb: 3.5 }, // Rosin sheen
      ],
      fid
    );

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * (3.5 + fid * 4.0), now);
    lp.frequency.exponentialRampToValueAtTime(freq * (2.4 + fid * 2.2), now + dur);

    const layers = [
      { mult: 0.5, detune: -4, amp: 0.38 },
      { mult: 1.0, detune: -13, amp: 0.34 * fid },
      { mult: 1.0, detune: -4.5, amp: 0.38 },
      { mult: 1.0, detune: 4.5, amp: 0.38 },
      { mult: 1.0, detune: 13, amp: 0.34 * fid },
    ];

    layers.forEach((l, i) => {
      if (l.amp <= 0.04) return;
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * l.mult, now);
      osc.detune.value = l.detune;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 5.2 + i * 0.19;
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.linearRampToValueAtTime(freq * l.mult * 0.0075, now + 0.14);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const vg = ctx.createGain();
      vg.gain.value = l.amp * 0.55;
      osc.connect(vg);
      vg.connect(body.input);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + release + 0.05);
      lfo.stop(now + release + 0.05);
    });

    this.addPluckNoise(ctx, body.input, now, 2400, 0.032, 0.24 * fid);

    body.output.connect(lp);
    lp.connect(out);
    this.connectToOutput(out, 0.62, fid, rev);
  }

  // 4. 史诗管乐 (Epic Cinema Brass - 好莱坞铜管齐奏 + 唇振瞬态 + 号角泛音绽放)
  private playEpicBrass(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const attack = 0.035;
    const release = dur + 0.28;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.25, now + attack);
    out.gain.setValueAtTime(level * 1.02, now + Math.max(attack + 0.02, dur - 0.04));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const brassFilter = ctx.createBiquadFilter();
    brassFilter.type = 'lowpass';
    brassFilter.Q.value = 2.0 + fid * 0.8;
    brassFilter.frequency.setValueAtTime(freq * 1.4, now);
    brassFilter.frequency.exponentialRampToValueAtTime(
      Math.min(9500, freq * (4.0 + fid * 4.5)),
      now + 0.075
    );
    brassFilter.frequency.exponentialRampToValueAtTime(
      Math.min(5500, freq * (2.6 + fid * 2.2)),
      now + dur
    );

    const voices = [
      { mult: 0.5, detune: -3, type: 'sawtooth' as OscillatorType, amp: 0.36 },
      { mult: 1.0, detune: -8, type: 'sawtooth' as OscillatorType, amp: 0.48 },
      { mult: 1.0, detune: 0, type: 'sawtooth' as OscillatorType, amp: 0.52 },
      { mult: 1.0, detune: 8, type: 'square' as OscillatorType, amp: 0.28 * fid },
    ];

    voices.forEach((v) => {
      const osc = ctx.createOscillator();
      osc.type = v.type;
      osc.frequency.setValueAtTime(freq * v.mult, now);
      osc.detune.value = v.detune;
      const vg = ctx.createGain();
      vg.gain.value = v.amp * 0.52;
      osc.connect(vg);
      vg.connect(brassFilter);
      osc.start(now);
      osc.stop(now + release + 0.05);
    });

    this.addPluckNoise(ctx, brassFilter, now, 1800, 0.022, 0.16 * fid);
    brassFilter.connect(out);
    this.connectToOutput(out, 0.58, fid, rev);
  }

  // 5. 教堂钟声 (Cathedral Tubular Bells - 庄严大教堂管钟 7 阶模态泛音)
  private playChurchBells(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = Math.max(dur * 2.5, 1.95);
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.25, now + 0.004);
    out.gain.exponentialRampToValueAtTime(level * 0.5, now + 0.22);
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const bellModes = [
      { ratio: 0.5, amp: 0.45, decay: 1.0 },
      { ratio: 1.0, amp: 0.9, decay: 0.9 },
      { ratio: 1.183, amp: 0.42 * fid, decay: 0.65 },
      { ratio: 1.506, amp: 0.35, decay: 0.55 },
      { ratio: 2.0, amp: 0.48, decay: 0.45 },
      { ratio: 2.514, amp: 0.26 * fid, decay: 0.28 },
      { ratio: 3.011, amp: 0.22 * fid, decay: 0.2 },
    ];

    bellModes.forEach((m) => {
      if (m.amp <= 0.02) return;
      const osc = ctx.createOscillator();
      const mg = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * m.ratio, now);
      mg.gain.setValueAtTime(m.amp * 0.42, now);
      mg.gain.exponentialRampToValueAtTime(0.0001, now + release * m.decay);
      osc.connect(mg);
      mg.connect(out);
      osc.start(now);
      osc.stop(now + release * m.decay + 0.05);
    });

    this.addPluckNoise(ctx, out, now, 4200, 0.014, 0.28 * fid);
    this.connectToOutput(out, 0.72, fid, rev);
  }

  // 6. 古典吉他 (Classical Nylon Guitar - 西班牙红松面板共鸣 + 指甲拨弦瞬态 + 泛音自然衰减)
  private playClassicalGuitar(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = Math.max(dur * 1.45, 0.85);
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.32, now + 0.004);
    out.gain.exponentialRampToValueAtTime(level * 0.48, now + 0.16);
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    // Spanish Cedar Guitar Multi-Formant Cavity & Top Plate Resonance
    const body = this.createAcousticBodyResonator(
      ctx,
      [
        { freq: 105, q: 2.4, gainDb: 3.5 }, // Soundhole air resonance
        { freq: 235, q: 1.8, gainDb: 5.0 }, // Cedar soundboard main warmth
        { freq: 580, q: 2.0, gainDb: 3.2 }, // Midrange woody articulation
      ],
      fid
    );

    const nylonLp = ctx.createBiquadFilter();
    nylonLp.type = 'lowpass';
    nylonLp.frequency.setValueAtTime(freq * (3.5 + fid * 3.8), now);
    nylonLp.frequency.exponentialRampToValueAtTime(freq * (1.4 + fid * 0.6), now + 0.22);

    // Fundamental + 2nd + 3rd harmonic partials with natural nylon string decay
    const partials = [
      { mult: 1.0, type: 'triangle' as OscillatorType, amp: 0.78, decay: release },
      { mult: 2.0, type: 'sawtooth' as OscillatorType, amp: 0.34 * fid, decay: 0.22 },
      { mult: 3.0, type: 'sine' as OscillatorType, amp: 0.18 * fid, decay: 0.12 },
    ];

    partials.forEach((p) => {
      if (p.amp <= 0.01) return;
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.setValueAtTime(freq * p.mult, now);
      const pg = ctx.createGain();
      pg.gain.setValueAtTime(p.amp, now);
      pg.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
      osc.connect(pg);
      pg.connect(body.input);
      osc.start(now);
      osc.stop(now + p.decay + 0.04);
    });

    body.output.connect(nylonLp);
    nylonLp.connect(out);

    // Delicate fingernail flesh pluck transient
    this.addPluckNoise(ctx, out, now, 1850, 0.014, 0.19 * fid);
    this.connectToOutput(out, 0.4, fid, rev);
  }

  // 7. 8-bit 复古芯片 (8-Bit Chiptune)
  private playChiptune8Bit(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = dur + 0.03;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 0.95, now + 0.002);
    out.gain.setValueAtTime(level * 0.72, now + 0.045);
    out.gain.setValueAtTime(level * 0.65, now + Math.max(0.05, dur - 0.01));
    out.gain.linearRampToValueAtTime(0.0001, now + release);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'square';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(freq * 1.498, now);
    osc1.frequency.setValueAtTime(freq, now + 0.022);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.value = 4;

    const g1 = ctx.createGain();
    g1.gain.value = 0.65;
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;

    osc1.connect(g1);
    osc2.connect(g2);
    g1.connect(out);
    g2.connect(out);

    this.connectToOutput(out, 0.1, fid, rev);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + release + 0.02);
    osc2.stop(now + release + 0.02);
  }

  // 8. 古筝 (Guzheng - 兰考泡桐木面板双峰共鸣 + 玳瑁义甲拨弦 + 吟猱微韵)
  private playGuzheng(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = Math.max(dur * 1.55, 1.05);
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.28, now + 0.006);
    out.gain.exponentialRampToValueAtTime(level * 0.46, now + 0.19);
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    // Paulownia wood soundboard resonance (桐木共鸣箱)
    const body = this.createAcousticBodyResonator(
      ctx,
      [
        { freq: 310, q: 1.9, gainDb: 4.5 },
        { freq: 1650, q: 2.2, gainDb: 4.8 },
        { freq: 3600, q: 2.5, gainDb: 3.6 },
      ],
      fid
    );

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * (4.5 + fid * 4.5), now);
    filter.frequency.exponentialRampToValueAtTime(freq * (1.8 + fid * 0.8), now + release * 0.8);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc3.type = 'sine';

    // Subtle Guzheng left-hand string micro-bend ("按滑吟猱")
    osc1.frequency.setValueAtTime(freq * 0.991, now);
    osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.042);
    osc2.frequency.setValueAtTime(freq * 2, now);
    osc3.frequency.setValueAtTime(freq * 3, now);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5.3;
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.0065 * fid, now + 0.22);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    const g2 = ctx.createGain();
    g2.gain.value = 0.3 * fid;
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0.18 * fid, now);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc1.connect(body.input);
    osc2.connect(g2);
    osc3.connect(g3);
    g2.connect(body.input);
    g3.connect(body.input);
    body.output.connect(filter);
    filter.connect(out);

    this.addPluckNoise(ctx, out, now, 2800, 0.022, 0.28 * fid);
    this.connectToOutput(out, 0.52, fid, rev);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    lfo.start(now);
    osc1.stop(now + release + 0.05);
    osc2.stop(now + release + 0.05);
    osc3.stop(now + 0.3);
    lfo.stop(now + release + 0.05);
  }

  // 9. 琵琶 (Pipa - 梨木半梨形音箱 + 竹相品位金属清脆泛音 "金石珠玉之声")
  private playPipa(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = Math.max(dur * 0.98, 0.52);
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.38, now + 0.003);
    out.gain.exponentialRampToValueAtTime(level * 0.3, now + 0.095);
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const body = this.createAcousticBodyResonator(
      ctx,
      [
        { freq: 480, q: 2.2, gainDb: 4.2 },
        { freq: 1480, q: 2.8, gainDb: 6.8 }, // Characteristic Pipa pearwood nasal peak
        { freq: 3800, q: 3.0, gainDb: 4.5 }, // Fret metallic "Sha-Yin" brilliance
      ],
      fid
    );

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * (5.5 + fid * 5.0), now);
    lp.frequency.exponentialRampToValueAtTime(freq * 2.4, now + 0.22);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 3.005, now); // Slightly inharmonic 3rd partial

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.26 * fid, now);
    g2.gain.exponentialRampToValueAtTime(0.008, now + 0.09);

    osc1.connect(body.input);
    osc2.connect(g2);
    g2.connect(body.input);
    body.output.connect(lp);
    lp.connect(out);

    this.addPluckNoise(ctx, out, now, 3950, 0.016, 0.4 * fid);
    this.connectToOutput(out, 0.36, fid, rev);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + release + 0.04);
    osc2.stop(now + release + 0.04);
  }

  // 10. 中国传统竹笛 (Dizi - 苦竹管腔共振 + 芦苇笛膜高频非线性震颤 + 气声吐音)
  private playDizi(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = dur + 0.2;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.08, now + 0.04);
    out.gain.setValueAtTime(level * 0.92, now + Math.max(0.06, dur - 0.05));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    // Dimo (笛膜) reed membrane bright resonator scaled by fidelity
    const dimoFilter = ctx.createBiquadFilter();
    dimoFilter.type = 'bandpass';
    dimoFilter.frequency.value = Math.min(6800, freq * (2.6 + fid * 1.4));
    dimoFilter.Q.value = 1.6 + fid * 0.8;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sawtooth';
    osc3.type = 'triangle';

    // Articulation grace-pitch scoop ("吐音与滑音起音")
    osc1.frequency.setValueAtTime(freq * 0.986, now);
    osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.036);
    osc2.frequency.setValueAtTime(freq, now);
    osc3.frequency.setValueAtTime(freq * 2, now);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 6.1;
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.014 * (0.7 + 0.3 * fid), now + 0.16);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    const g1 = ctx.createGain();
    g1.gain.value = 0.72;
    const g2 = ctx.createGain();
    g2.gain.value = 0.36 * fid;
    const g3 = ctx.createGain();
    g3.gain.value = 0.16 * fid;

    osc1.connect(g1);
    g1.connect(out);
    osc2.connect(dimoFilter);
    dimoFilter.connect(g2);
    g2.connect(out);
    osc3.connect(g3);
    g3.connect(out);

    this.addBreathNoise(ctx, out, now, dur, freq * 2.3, 0.15 * fid);
    this.connectToOutput(out, 0.56, fid, rev);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    lfo.start(now);
    osc1.stop(now + release + 0.04);
    osc2.stop(now + release + 0.04);
    osc3.stop(now + release + 0.04);
    lfo.stop(now + release + 0.04);
  }

  // 11. 男女独唱与交响合唱 (Vocal Formant Synthesis)
  private playVocalFormant(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev: number | undefined,
    cfg: {
      f1: number;
      f2: number;
      f3: number;
      vibratoRate: number;
      vibratoDepth: number;
      breath: number;
      choirVoices: number;
    }
  ) {
    const out = ctx.createGain();
    const attack = cfg.choirVoices > 1 ? 0.11 : 0.06;
    const release = dur + (cfg.choirVoices > 1 ? 0.38 : 0.24);

    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.15, now + attack);
    out.gain.setValueAtTime(level, now + Math.max(attack + 0.02, dur - 0.04));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const formants = [
      { freq: cfg.f1, q: 5.2, amp: 1.0 },
      { freq: cfg.f2, q: 6.8, amp: 0.65 * fid },
      { freq: cfg.f3, q: 8.2, amp: 0.32 * fid },
    ];

    const sourceBus = ctx.createGain();
    sourceBus.gain.value = 0.76;

    const chestLp = ctx.createBiquadFilter();
    chestLp.type = 'lowpass';
    chestLp.frequency.value = Math.max(320, freq * 1.65);
    const chestGain = ctx.createGain();
    chestGain.gain.value = 0.45;
    sourceBus.connect(chestLp);
    chestLp.connect(chestGain);
    chestGain.connect(out);

    for (const f of formants) {
      if (f.amp <= 0.02) continue;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(f.freq, now);
      bp.frequency.linearRampToValueAtTime(f.freq * 1.06, now + dur * 0.6);
      bp.Q.value = f.q;

      const fg = ctx.createGain();
      fg.gain.value = f.amp;
      sourceBus.connect(bp);
      bp.connect(fg);
      fg.connect(out);
    }

    const detunes = cfg.choirVoices > 1 ? [-10, -3, 3, 10] : [-2.5, 2.5];

    detunes.forEach((det, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.value = det;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = cfg.vibratoRate + idx * 0.22;
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.linearRampToValueAtTime(cfg.vibratoDepth, now + 0.15);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 1 / Math.sqrt(detunes.length);
      osc.connect(voiceGain);
      voiceGain.connect(sourceBus);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + release + 0.05);
      lfo.stop(now + release + 0.05);
    });

    if (cfg.breath > 0) {
      this.addBreathNoise(ctx, sourceBus, now, dur, cfg.f2, cfg.breath * fid);
    }

    this.connectToOutput(out, cfg.choirVoices > 1 ? 0.68 : 0.52, fid, rev);
  }

  // 12. 空灵轻声吟唱 (Soft Ethereal Humming)
  private playSoftHumming(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const attack = 0.085;
    const release = dur + 0.36;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.05, now + attack);
    out.gain.setValueAtTime(level * 0.9, now + Math.max(attack + 0.02, dur - 0.04));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.value = 5;

    const nasalFilter = ctx.createBiquadFilter();
    nasalFilter.type = 'bandpass';
    nasalFilter.frequency.value = Math.max(480, freq * 2);
    nasalFilter.Q.value = 3.0;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5.0;
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.008, now + 0.2);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    const g1 = ctx.createGain();
    g1.gain.value = 0.68;
    const g2 = ctx.createGain();
    g2.gain.value = 0.45 * fid;

    osc1.connect(g1);
    g1.connect(out);
    osc2.connect(nasalFilter);
    nasalFilter.connect(g2);
    g2.connect(out);

    this.addBreathNoise(ctx, out, now, dur, 1100, 0.08 * fid);
    this.connectToOutput(out, 0.65, fid, rev);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);
    osc1.stop(now + release + 0.05);
    osc2.stop(now + release + 0.05);
    lfo.stop(now + release + 0.05);
  }

  // 13. 弦乐群与独奏大提琴 (Violin Section & Solo Cello - 增强木质琴腔共鸣与松香擦弦细节)
  private playStrings(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    isEnsemble: boolean,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const attack = isEnsemble ? 0.075 : 0.048;
    const release = dur + 0.3;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.08, now + attack);
    out.gain.setValueAtTime(level * 0.92, now + Math.max(attack + 0.02, dur - 0.04));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const body = this.createAcousticBodyResonator(
      ctx,
      isEnsemble
        ? [
            { freq: 290, q: 1.9, gainDb: 3.6 },
            { freq: 1050, q: 2.1, gainDb: 4.4 },
            { freq: 2850, q: 2.2, gainDb: 3.8 },
          ]
        : [
            // Solo Montagnana Cello deep chest resonance
            { freq: 175, q: 2.0, gainDb: 5.2 },
            { freq: 540, q: 1.8, gainDb: 4.5 },
            { freq: 1850, q: 2.2, gainDb: 3.6 },
          ],
      fid
    );

    const bodyLp = ctx.createBiquadFilter();
    bodyLp.type = 'lowpass';
    bodyLp.frequency.value = isEnsemble
      ? freq * (3.2 + fid * 3.0)
      : freq * (2.6 + fid * 2.6);

    const detunes = isEnsemble ? [-11, -3.5, 3.5, 11] : [-2, 2];
    detunes.forEach((det, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.value = det;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = (isEnsemble ? 5.5 : 5.2) + idx * 0.15;
      lfoGain.gain.setValueAtTime(0, now);
      lfoGain.gain.linearRampToValueAtTime(freq * 0.0085 * (0.65 + 0.35 * fid), now + 0.16);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const vg = ctx.createGain();
      vg.gain.value = 0.85 / Math.sqrt(detunes.length);
      osc.connect(vg);
      vg.connect(body.input);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + release + 0.05);
      lfo.stop(now + release + 0.05);
    });

    this.addPluckNoise(ctx, body.input, now, isEnsemble ? 2600 : 1650, 0.028, 0.17 * fid);
    body.output.connect(bodyLp);
    bodyLp.connect(out);
    this.connectToOutput(out, isEnsemble ? 0.52 : 0.46, fid, rev);
  }

  // 14. 交响圆号 (French Horn)
  private playFrenchHorn(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = dur + 0.26;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.12, now + 0.048);
    out.gain.setValueAtTime(level * 0.92, now + Math.max(0.07, dur - 0.04));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const brassFilter = ctx.createBiquadFilter();
    brassFilter.type = 'lowpass';
    brassFilter.frequency.setValueAtTime(freq * 1.4, now);
    brassFilter.frequency.exponentialRampToValueAtTime(
      freq * (3.2 + fid * 2.4),
      now + 0.085
    );
    brassFilter.frequency.exponentialRampToValueAtTime(
      freq * (2.1 + fid * 1.2),
      now + dur
    );
    brassFilter.Q.value = 1.9 + fid * 0.5;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.value = 4;

    osc1.connect(brassFilter);
    osc2.connect(brassFilter);
    brassFilter.connect(out);
    this.connectToOutput(out, 0.52, fid, rev);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + release + 0.05);
    osc2.stop(now + release + 0.05);
  }

  // 15. 西洋长笛 (Concert Flute - 纯银笛管泛音与唇风气音)
  private playConcertFlute(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = dur + 0.18;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.05, now + 0.038);
    out.gain.setValueAtTime(level * 0.9, now + Math.max(0.05, dur - 0.04));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc3.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);
    osc3.frequency.setValueAtTime(freq * 3, now);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5.5;
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.0095, now + 0.14);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    const g2 = ctx.createGain();
    g2.gain.value = 0.22 * fid;
    const g3 = ctx.createGain();
    g3.gain.value = 0.09 * fid;

    osc1.connect(out);
    osc2.connect(g2);
    osc3.connect(g3);
    g2.connect(out);
    g3.connect(out);

    this.addBreathNoise(ctx, out, now, dur, freq * 2.6, 0.11 * fid);
    this.connectToOutput(out, 0.46, fid, rev);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    lfo.start(now);
    osc1.stop(now + release + 0.04);
    osc2.stop(now + release + 0.04);
    osc3.stop(now + release + 0.04);
    lfo.stop(now + release + 0.04);
  }

  // 16. 音乐会踏板竖琴 (Concert Harp - 云杉音板共鸣与晶莹泛音)
  private playHarp(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = Math.max(dur * 1.65, 1.25);
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.25, now + 0.005);
    out.gain.exponentialRampToValueAtTime(level * 0.42, now + 0.24);
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * (3.5 + fid * 3.0), now);
    lp.frequency.exponentialRampToValueAtTime(freq * 1.4, now + release * 0.75);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc3.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);
    osc3.frequency.setValueAtTime(freq * 3, now);

    const g2 = ctx.createGain();
    g2.gain.value = 0.28 * fid;
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0.14 * fid, now);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(lp);
    osc2.connect(g2);
    osc3.connect(g3);
    g2.connect(lp);
    g3.connect(lp);
    lp.connect(out);

    this.addPluckNoise(ctx, out, now, 2100, 0.012, 0.14 * fid);
    this.connectToOutput(out, 0.58, fid, rev);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + release + 0.05);
    osc2.stop(now + release + 0.05);
    osc3.stop(now + 0.32);
  }

  // 17. 三角钢琴 (Concert Grand Piano - 施坦威云杉音板 + 琴弦非谐波泛音列 + 毡槌击弦物理瞬态)
  private playGrandPiano(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = Math.max(dur * 1.4, 0.9);
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.28, now + 0.005);
    out.gain.exponentialRampToValueAtTime(level * 0.5, now + 0.18);
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    // Spruce soundboard & cast-iron frame resonance
    const body = this.createAcousticBodyResonator(
      ctx,
      [
        { freq: 140, q: 1.6, gainDb: 3.5 },
        { freq: 720, q: 1.8, gainDb: 3.2 },
        { freq: 2450, q: 2.1, gainDb: 3.8 }, // Hammer strike clarity
      ],
      fid
    );

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * (4.0 + fid * 4.5), now);
    lp.frequency.exponentialRampToValueAtTime(freq * (1.5 + fid * 0.7), now + release * 0.78);

    // Piano string inharmonicity coefficient B (stiff steel strings stretch upper partials slightly sharp)
    const B = 0.00018 * (freq / 261.63);
    const partials = [
      { n: 1, type: 'triangle' as OscillatorType, amp: 0.72, decay: release, detune: 0 },
      { n: 1, type: 'sawtooth' as OscillatorType, amp: 0.28 * fid, decay: release * 0.85, detune: 2.2 }, // Unison bichord/trichord string detune
      { n: 2, type: 'sine' as OscillatorType, amp: 0.3 * fid, decay: release * 0.55, detune: -1.5 },
      { n: 3, type: 'sine' as OscillatorType, amp: 0.18 * fid, decay: 0.28, detune: 1.8 },
      { n: 4, type: 'sine' as OscillatorType, amp: 0.11 * fid * fid, decay: 0.16, detune: 0 },
    ];

    partials.forEach((p) => {
      if (p.amp <= 0.01) return;
      const inharmonicFreq = freq * p.n * Math.sqrt(1 + B * p.n * p.n);
      if (inharmonicFreq > 17000) return;
      const osc = ctx.createOscillator();
      osc.type = p.type;
      osc.frequency.setValueAtTime(inharmonicFreq, now);
      osc.detune.value = p.detune;

      const pg = ctx.createGain();
      pg.gain.setValueAtTime(p.amp, now);
      pg.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);

      osc.connect(pg);
      pg.connect(body.input);
      osc.start(now);
      osc.stop(now + p.decay + 0.04);
    });

    body.output.connect(lp);
    lp.connect(out);

    // Felt hammer strike thump (low) + string attack click (mid-high)
    this.addPluckNoise(ctx, out, now, 2100, 0.014, 0.16 * fid);
    this.connectToOutput(out, 0.4, fid, rev);
  }

  // 18. 大教堂管风琴 (Cathedral Pipe Organ - 6 栓音管组合 + 风箱管口瞬态气音)
  private playPipeOrgan(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = dur + 0.28;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 0.96, now + 0.032);
    out.gain.setValueAtTime(level * 0.92, now + Math.max(0.05, dur - 0.03));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const drawbars = [
      { mult: 0.5, amp: 0.36, type: 'sine' as OscillatorType }, // 16' Bourdon
      { mult: 1.0, amp: 0.76, type: 'triangle' as OscillatorType }, // 8' Principal
      { mult: 1.5, amp: 0.24 * fid, type: 'sine' as OscillatorType }, // 5-1/3' Quint
      { mult: 2.0, amp: 0.48, type: 'sine' as OscillatorType }, // 4' Octave
      { mult: 3.0, amp: 0.22 * fid, type: 'sine' as OscillatorType }, // 2-2/3' Nazard
      { mult: 4.0, amp: 0.3 * fid, type: 'sine' as OscillatorType }, // 2' Superoctave
      { mult: 5.0, amp: 0.14 * fid * fid, type: 'sine' as OscillatorType }, // 1-3/5' Tierce
    ];

    drawbars.forEach((db, idx) => {
      if (db.amp <= 0.01) return;
      const osc = ctx.createOscillator();
      osc.type = db.type;
      osc.frequency.setValueAtTime(freq * db.mult, now);
      osc.detune.value = (idx % 2 === 0 ? 1 : -1) * 1.4; // Natural pipe rank celeste warmth
      const g = ctx.createGain();
      g.gain.value = db.amp * 0.42;
      osc.connect(g);
      g.connect(out);
      osc.start(now);
      osc.stop(now + release + 0.05);
    });

    // Authentic organ pipe wind-chest chiff on attack
    this.addPluckNoise(ctx, out, now, freq * 3.5, 0.028, 0.14 * fid);
    this.connectToOutput(out, 0.66, fid, rev);
  }

  // 19. 巴洛克羽管键琴 (Baroque Harpsichord - 8尺+4尺双弦组羽管拨弦清脆瞬态)
  private playHarpsichord(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = Math.min(Math.max(dur * 0.95, 0.42), 1.05);
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.12, now + 0.0025);
    out.gain.exponentialRampToValueAtTime(level * 0.34, now + 0.12);
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = Math.min(380, freq * 0.65);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * (6.0 + fid * 6.0), now);
    lp.frequency.exponentialRampToValueAtTime(freq * (2.5 + fid * 1.5), now + release);

    const osc1 = ctx.createOscillator(); // 8' main string
    const osc2 = ctx.createOscillator(); // 4' upper octave string
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2, now);
    osc2.detune.value = 3.5;

    const g2 = ctx.createGain();
    g2.gain.value = 0.38 * fid;

    osc1.connect(hp);
    osc2.connect(g2);
    g2.connect(hp);
    hp.connect(lp);
    lp.connect(out);

    this.addPluckNoise(ctx, out, now, 4600, 0.011, 0.28 * fid);
    this.connectToOutput(out, 0.36, fid, rev);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + release + 0.04);
    osc2.stop(now + release + 0.04);
  }

  // 20. 失真主音电吉他 (Overdrive Lead Electric Guitar)
  private playElectricGuitarLead(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = dur + 0.18;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 0.95, now + 0.008);
    out.gain.setValueAtTime(level * 0.82, now + Math.max(0.02, dur - 0.03));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const shaper = ctx.createWaveShaper();
    const samples = 256;
    const curve = new Float32Array(samples);
    const drive = 18;
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + drive) * x * 20 * (Math.PI / 180)) / (Math.PI + drive * Math.abs(x));
    }
    shaper.curve = curve;
    shaper.oversample = '2x';

    const cabMid = ctx.createBiquadFilter();
    cabMid.type = 'peaking';
    cabMid.frequency.value = 1250;
    cabMid.Q.value = 1.6;
    cabMid.gain.value = 5;

    const cabLp = ctx.createBiquadFilter();
    cabLp.type = 'lowpass';
    cabLp.frequency.value = 2400 + fid * 1400;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.value = 5;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 5.8;
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.011, now + 0.16);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    osc1.connect(shaper);
    osc2.connect(shaper);
    shaper.connect(cabMid);
    cabMid.connect(cabLp);
    cabLp.connect(out);
    this.connectToOutput(out, 0.42, fid, rev);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);
    osc1.stop(now + release + 0.04);
    osc2.stop(now + release + 0.04);
    lfo.stop(now + release + 0.04);
  }

  // 21. 清音合唱电吉他 (Clean Chorus Electric Guitar)
  private playElectricGuitarClean(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = Math.max(dur * 1.15, 0.55);
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.1, now + 0.006);
    out.gain.exponentialRampToValueAtTime(level * 0.45, now + 0.18);
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * (4.0 + fid * 3.0), now);
    lp.frequency.exponentialRampToValueAtTime(freq * 2.2, now + release);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.value = 8;

    const g2 = ctx.createGain();
    g2.gain.value = 0.35 * fid;

    osc1.connect(lp);
    osc2.connect(g2);
    g2.connect(lp);
    lp.connect(out);
    this.connectToOutput(out, 0.45, fid, rev);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + release + 0.04);
    osc2.stop(now + release + 0.04);
  }

  // 22. 复古模拟合成器主音 (Analog Poly Synth Lead)
  private playSynthLead(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = dur + 0.15;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level, now + 0.012);
    out.gain.setValueAtTime(level * 0.85, now + Math.max(0.02, dur - 0.03));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 3.2;
    filter.frequency.setValueAtTime(freq * (5.0 + fid * 4.0), now);
    filter.frequency.exponentialRampToValueAtTime(freq * 2.2, now + Math.min(dur, 0.35));

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.value = 9;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(out);
    this.connectToOutput(out, 0.4, fid, rev);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + release + 0.04);
    osc2.stop(now + release + 0.04);
  }

  // 23. 星云氛围合成器铺底 (Nebula Warm Synth Pad)
  private playSynthPad(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const attack = 0.14;
    const release = dur + 0.42;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 0.85, now + attack);
    out.gain.setValueAtTime(level * 0.8, now + Math.max(attack + 0.02, dur - 0.05));
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(freq * 2.2, now);
    lp.frequency.linearRampToValueAtTime(freq * (2.6 + fid * 1.8), now + dur * 0.5);

    [-12, 0, 12].forEach((det) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.value = det;
      const g = ctx.createGain();
      g.gain.value = 0.36;
      osc.connect(g);
      g.connect(lp);
      osc.start(now);
      osc.stop(now + release + 0.05);
    });

    lp.connect(out);
    this.connectToOutput(out, 0.65, fid, rev);
  }

  // 24. 电音合成贝斯 (Sub & Pluck Synth Bass)
  private playSynthBass(
    ctx: AudioContext,
    freq: number,
    now: number,
    dur: number,
    level: number,
    fid: number,
    rev?: number
  ) {
    const out = ctx.createGain();
    const release = dur + 0.09;
    out.gain.setValueAtTime(0.0001, now);
    out.gain.linearRampToValueAtTime(level * 1.25, now + 0.008);
    out.gain.exponentialRampToValueAtTime(level * 0.72, now + 0.12);
    out.gain.exponentialRampToValueAtTime(0.0001, now + release);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 3.8;
    filter.frequency.setValueAtTime(freq * (4.5 + fid * 3.5), now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.6, now + 0.14);

    const oscSub = ctx.createOscillator();
    const oscSaw = ctx.createOscillator();
    oscSub.type = 'sine';
    oscSaw.type = 'sawtooth';
    oscSub.frequency.setValueAtTime(freq, now);
    oscSaw.frequency.setValueAtTime(freq, now);

    oscSub.connect(out);
    oscSaw.connect(filter);
    filter.connect(out);
    this.connectToOutput(out, 0.12, fid, rev);

    oscSub.start(now);
    oscSaw.start(now);
    oscSub.stop(now + release + 0.04);
    oscSaw.stop(now + release + 0.04);
  }

  // 25. 综合中西打击乐组采样合成 (Percussion Kit: 8 distinct pads)
  private playPercussion(
    ctx: AudioContext,
    midiPitch: number,
    now: number,
    level: number,
    fid = 0.92,
    rev?: number
  ) {
    switch (midiPitch) {
      case 36: // 底鼓 Kick
        {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(145, now);
          osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);
          osc.frequency.exponentialRampToValueAtTime(28, now + 0.28);
          g.gain.setValueAtTime(level * 1.4, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
          osc.connect(g);
          this.connectToOutput(g, 0.08, fid, rev);
          osc.start(now);
          osc.stop(now + 0.34);
        }
        break;
      case 38: // 军鼓 Snare
        {
          const osc = ctx.createOscillator();
          const og = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(190, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
          og.gain.setValueAtTime(level * 0.8, now);
          og.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
          osc.connect(og);
          this.connectToOutput(og, 0.25, fid, rev);
          osc.start(now);
          osc.stop(now + 0.16);
          this.addPluckNoise(ctx, this.dryGain!, now, 2200, 0.18, level * 0.9 * fid);
        }
        break;
      case 39: // 拍手 Hand Clap
        {
          [0, 0.011, 0.022].forEach((offset, i) => {
            const dur = i === 2 ? 0.15 : 0.025;
            this.addPluckNoise(ctx, this.dryGain!, now + offset, 1500, dur, level * 0.65 * fid);
          });
        }
        break;
      case 42: // 闭镲 Closed Hi-Hat
        this.addMetallicHat(ctx, now, 0.055, level * 0.55 * fid, fid, rev);
        break;
      case 46: // 开镲 Open Hi-Hat
        this.addMetallicHat(ctx, now, 0.28, level * 0.62 * fid, fid, rev);
        break;
      case 45: // 中国堂鼓 / 定音鼓 (Tanggu / Timpani)
        {
          const osc = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc2.type = 'triangle';
          osc.frequency.setValueAtTime(118, now);
          osc.frequency.exponentialRampToValueAtTime(68, now + 0.45);
          osc2.frequency.setValueAtTime(175, now);
          osc2.frequency.exponentialRampToValueAtTime(98, now + 0.35);
          g.gain.setValueAtTime(level * 1.35, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.58);
          osc.connect(g);
          osc2.connect(g);
          this.connectToOutput(g, 0.45, fid, rev);
          osc.start(now);
          osc2.start(now);
          osc.stop(now + 0.6);
          osc2.stop(now + 0.6);
        }
        break;
      case 50: // 木鱼 / 戏曲梆子 (Woodblock)
        {
          const osc = ctx.createOscillator();
          const bp = ctx.createBiquadFilter();
          const g = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(790, now);
          osc.frequency.exponentialRampToValueAtTime(520, now + 0.035);
          bp.type = 'bandpass';
          bp.frequency.value = 760;
          bp.Q.value = 4.5;
          g.gain.setValueAtTime(level * 1.15, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
          osc.connect(bp);
          bp.connect(g);
          this.connectToOutput(g, 0.28, fid, rev);
          osc.start(now);
          osc.stop(now + 0.1);
        }
        break;
      case 49: // 吊镲 / 金石风铃 (Crash & Chime)
      default:
        {
          const freqs = [1046.5, 1568, 2093, 2637];
          const g = ctx.createGain();
          g.gain.setValueAtTime(level * 0.55, now);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
          freqs.forEach((f) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            osc.connect(g);
            osc.start(now);
            osc.stop(now + 1.0);
          });
          this.addMetallicHat(ctx, now, 0.55, level * 0.4 * fid, fid, rev);
          this.connectToOutput(g, 0.6, fid, rev);
        }
        break;
    }
  }

  private addPluckNoise(
    ctx: AudioContext,
    target: AudioNode,
    now: number,
    centerFreq: number,
    dur: number,
    amp: number
  ) {
    if (!this.noiseBuffer || amp <= 0.002) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(14000, Math.max(120, centerFreq));
    bp.Q.value = 1.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(amp, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(target);
    src.start(now);
    src.stop(now + dur + 0.01);
  }

  private addBreathNoise(
    ctx: AudioContext,
    target: AudioNode,
    now: number,
    dur: number,
    centerFreq: number,
    amp: number
  ) {
    if (!this.noiseBuffer || amp <= 0.002) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(12000, Math.max(200, centerFreq));
    bp.Q.value = 2.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(amp, now + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.05);
    src.connect(bp);
    bp.connect(g);
    g.connect(target);
    src.start(now);
    src.stop(now + dur + 0.07);
  }

  private addMetallicHat(
    ctx: AudioContext,
    now: number,
    dur: number,
    amp: number,
    fid = 0.92,
    rev?: number
  ) {
    if (!this.noiseBuffer || amp <= 0.002) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(amp, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(hp);
    hp.connect(g);
    this.connectToOutput(g, 0.15, fid, rev);
    src.start(now);
    src.stop(now + dur + 0.02);
  }
}

export const soundEngine = new SoundEngine();
