import {
  ProjectState,
  NoteEvent,
  ChordSlot,
  Track,
  TrackRole,
  ScaleType,
  StylePreset,
  ScenePreset,
  InstrumentId,
  MotifSeed,
  MotifNote,
  MotifDevelopmentMode,
} from '../types/music';
import {
  getScaleById,
  getProgressionById,
  PITCH_CLASS_NAMES,
  STYLE_PRESETS,
  CHORD_PROGRESSIONS,
} from '../data/instruments';
import { TRACK_ROLE_DEFINITIONS } from '../data/scenePresets';

let noteIdCounter = 1000;
export function createNoteId(prefix = 'n'): string {
  noteIdCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${noteIdCounter}`;
}

/**
 * High-entropy random helper combining Math.random() with crypto entropy when available.
 */
function randFloat(): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  }
  return Math.random();
}

function randChoice<T>(items: T[]): T {
  return items[Math.floor(randFloat() * items.length)];
}

/**
 * Default acoustic Fidelity & Reverb Send per instrument so classical & traditional instruments
 * immediately sound rich, delicate, and dimensional.
 */
export function getDefaultAcousticProfile(instrument: InstrumentId): {
  fidelity: number;
  reverbSend: number;
} {
  switch (instrument) {
    case 'string_concerto':
    case 'violin_section':
    case 'cello_solo':
    case 'grand_piano':
    case 'classical_guitar':
    case 'orchestral_harp':
    case 'guzheng':
    case 'pipa':
    case 'dizi':
    case 'flute_orchestral':
      return { fidelity: 0.96, reverbSend: 0.52 };
    case 'ancient_bianzhong':
    case 'church_bells':
    case 'pipe_organ':
    case 'grand_choir':
    case 'epic_strings':
    case 'epic_brass':
      return { fidelity: 0.95, reverbSend: 0.68 };
    case 'harpsichord':
      return { fidelity: 0.94, reverbSend: 0.42 };
    case 'female_soprano':
    case 'female_mezzo':
    case 'female_alto':
    case 'male_tenor':
    case 'male_baritone':
    case 'male_bass':
    case 'soft_humming':
      return { fidelity: 0.94, reverbSend: 0.58 };
    case 'chiptune_8bit':
      return { fidelity: 0.8, reverbSend: 0.14 };
    case 'percussion_kit':
      return { fidelity: 0.9, reverbSend: 0.28 };
    default:
      return { fidelity: 0.9, reverbSend: 0.45 };
  }
}

/**
 * 8 Built-in Leitmotif & Theme Fragment Seeds (内置主导动机与主题片段种子)
 */
export const BUILT_IN_MOTIF_SEEDS: MotifSeed[] = [
  {
    id: 'motif_guofeng_stream',
    name: '五声云水主题',
    subtitle: '级进回旋 · 东方古典雅韵',
    category: '国风/古典',
    bars: 2,
    developmentMode: 'classic_variation',
    ornamentDensity: 0.68,
    notes: [
      { stepOffset: 0, durationSteps: 4, scaleDegreeOffset: 0, velocity: 0.88 },
      { stepOffset: 4, durationSteps: 2, scaleDegreeOffset: 1, velocity: 0.78 },
      { stepOffset: 6, durationSteps: 2, scaleDegreeOffset: 2, velocity: 0.82 },
      { stepOffset: 8, durationSteps: 4, scaleDegreeOffset: 4, velocity: 0.9 },
      { stepOffset: 12, durationSteps: 4, scaleDegreeOffset: 2, velocity: 0.76 },
      { stepOffset: 16, durationSteps: 6, scaleDegreeOffset: 3, velocity: 0.86 },
      { stepOffset: 22, durationSteps: 2, scaleDegreeOffset: 2, velocity: 0.75 },
      { stepOffset: 24, durationSteps: 8, scaleDegreeOffset: 0, velocity: 0.92 },
    ],
  },
  {
    id: 'motif_fate_knock',
    name: '命运叩门动机',
    subtitle: '短-短-短-长 · 贝多芬式戏剧张力',
    category: '古典交响',
    bars: 2,
    developmentMode: 'sequence_ascend',
    ornamentDensity: 0.55,
    notes: [
      { stepOffset: 2, durationSteps: 2, scaleDegreeOffset: 4, velocity: 0.92 },
      { stepOffset: 4, durationSteps: 2, scaleDegreeOffset: 4, velocity: 0.92 },
      { stepOffset: 6, durationSteps: 2, scaleDegreeOffset: 4, velocity: 0.94 },
      { stepOffset: 8, durationSteps: 8, scaleDegreeOffset: 2, velocity: 0.96 },
      { stepOffset: 18, durationSteps: 2, scaleDegreeOffset: 3, velocity: 0.9 },
      { stepOffset: 20, durationSteps: 2, scaleDegreeOffset: 3, velocity: 0.9 },
      { stepOffset: 22, durationSteps: 2, scaleDegreeOffset: 3, velocity: 0.92 },
      { stepOffset: 24, durationSteps: 8, scaleDegreeOffset: 1, velocity: 0.95 },
    ],
  },
  {
    id: 'motif_heroic_horn',
    name: '苍穹号角动机',
    subtitle: '四度五度跃升 · 史诗交响开篇',
    category: '影视史诗',
    bars: 2,
    developmentMode: 'classic_variation',
    ornamentDensity: 0.6,
    notes: [
      { stepOffset: 0, durationSteps: 6, scaleDegreeOffset: 0, velocity: 0.9 },
      { stepOffset: 6, durationSteps: 2, scaleDegreeOffset: 2, velocity: 0.82 },
      { stepOffset: 8, durationSteps: 8, scaleDegreeOffset: 4, velocity: 0.95 },
      { stepOffset: 16, durationSteps: 4, scaleDegreeOffset: 5, velocity: 0.92 },
      { stepOffset: 20, durationSteps: 4, scaleDegreeOffset: 4, velocity: 0.86 },
      { stepOffset: 24, durationSteps: 8, scaleDegreeOffset: 7, velocity: 0.96 },
    ],
  },
  {
    id: 'motif_lyrical_sigh',
    name: '月光叹息主题',
    subtitle: '六度跳进与级进下行 · 唯美弦乐/独唱',
    category: '抒情室内乐',
    bars: 2,
    developmentMode: 'call_response',
    ornamentDensity: 0.72,
    notes: [
      { stepOffset: 0, durationSteps: 4, scaleDegreeOffset: 0, velocity: 0.82 },
      { stepOffset: 4, durationSteps: 6, scaleDegreeOffset: 5, velocity: 0.94 },
      { stepOffset: 10, durationSteps: 2, scaleDegreeOffset: 4, velocity: 0.8 },
      { stepOffset: 12, durationSteps: 4, scaleDegreeOffset: 3, velocity: 0.84 },
      { stepOffset: 16, durationSteps: 4, scaleDegreeOffset: 2, velocity: 0.86 },
      { stepOffset: 20, durationSteps: 4, scaleDegreeOffset: 1, velocity: 0.78 },
      { stepOffset: 24, durationSteps: 8, scaleDegreeOffset: 2, velocity: 0.88 },
    ],
  },
  {
    id: 'motif_baroque_spin',
    name: '巴洛克协奏回旋',
    subtitle: '十六分音符音阶穿梭 · 维瓦尔第/巴赫风格',
    category: '巴洛克古典',
    bars: 2,
    developmentMode: 'inversion_mirror',
    ornamentDensity: 0.8,
    notes: [
      { stepOffset: 0, durationSteps: 2, scaleDegreeOffset: 0, velocity: 0.88 },
      { stepOffset: 2, durationSteps: 2, scaleDegreeOffset: 2, velocity: 0.82 },
      { stepOffset: 4, durationSteps: 2, scaleDegreeOffset: 4, velocity: 0.9 },
      { stepOffset: 6, durationSteps: 2, scaleDegreeOffset: 2, velocity: 0.8 },
      { stepOffset: 8, durationSteps: 2, scaleDegreeOffset: 5, velocity: 0.92 },
      { stepOffset: 10, durationSteps: 2, scaleDegreeOffset: 4, velocity: 0.82 },
      { stepOffset: 12, durationSteps: 4, scaleDegreeOffset: 2, velocity: 0.86 },
      { stepOffset: 16, durationSteps: 2, scaleDegreeOffset: 3, velocity: 0.88 },
      { stepOffset: 18, durationSteps: 2, scaleDegreeOffset: 2, velocity: 0.8 },
      { stepOffset: 20, durationSteps: 2, scaleDegreeOffset: 1, velocity: 0.82 },
      { stepOffset: 22, durationSteps: 2, scaleDegreeOffset: 2, velocity: 0.84 },
      { stepOffset: 24, durationSteps: 8, scaleDegreeOffset: 0, velocity: 0.92 },
    ],
  },
  {
    id: 'motif_xianxia_sword',
    name: '御剑乘风主题',
    subtitle: '附点切分与高八度凌空 · 仙侠古风代表',
    category: '仙侠国风',
    bars: 2,
    developmentMode: 'sequence_ascend',
    ornamentDensity: 0.75,
    notes: [
      { stepOffset: 0, durationSteps: 6, scaleDegreeOffset: 0, velocity: 0.9 },
      { stepOffset: 6, durationSteps: 2, scaleDegreeOffset: 2, velocity: 0.82 },
      { stepOffset: 8, durationSteps: 4, scaleDegreeOffset: 4, velocity: 0.92 },
      { stepOffset: 12, durationSteps: 4, scaleDegreeOffset: 5, velocity: 0.95 },
      { stepOffset: 16, durationSteps: 3, scaleDegreeOffset: 4, velocity: 0.88 },
      { stepOffset: 19, durationSteps: 1, scaleDegreeOffset: 5, velocity: 0.8 },
      { stepOffset: 20, durationSteps: 4, scaleDegreeOffset: 2, velocity: 0.84 },
      { stepOffset: 24, durationSteps: 8, scaleDegreeOffset: 0, velocity: 0.9 },
    ],
  },
  {
    id: 'motif_sacred_chime',
    name: '太和钟磬礼赞',
    subtitle: '庄严八度与五度共鸣 · 皇家雅乐/教堂圣咏',
    category: '礼乐/圣咏',
    bars: 2,
    developmentMode: 'classic_variation',
    ornamentDensity: 0.45,
    notes: [
      { stepOffset: 0, durationSteps: 8, scaleDegreeOffset: 0, velocity: 0.94 },
      { stepOffset: 8, durationSteps: 4, scaleDegreeOffset: 4, velocity: 0.88 },
      { stepOffset: 12, durationSteps: 4, scaleDegreeOffset: 2, velocity: 0.85 },
      { stepOffset: 16, durationSteps: 8, scaleDegreeOffset: 5, velocity: 0.92 },
      { stepOffset: 24, durationSteps: 8, scaleDegreeOffset: 4, velocity: 0.95 },
    ],
  },
  {
    id: 'motif_cyber_sync',
    name: '星际脉冲切分',
    subtitle: '切分重音与八度跳跃 · 电音/8-Bit/科幻',
    category: '现代/游戏',
    bars: 2,
    developmentMode: 'call_response',
    ornamentDensity: 0.65,
    notes: [
      { stepOffset: 0, durationSteps: 3, scaleDegreeOffset: 0, velocity: 0.92 },
      { stepOffset: 3, durationSteps: 3, scaleDegreeOffset: 2, velocity: 0.86 },
      { stepOffset: 6, durationSteps: 2, scaleDegreeOffset: 4, velocity: 0.9 },
      { stepOffset: 8, durationSteps: 4, scaleDegreeOffset: 7, velocity: 0.95 },
      { stepOffset: 12, durationSteps: 4, scaleDegreeOffset: 4, velocity: 0.84 },
      { stepOffset: 16, durationSteps: 3, scaleDegreeOffset: 5, velocity: 0.9 },
      { stepOffset: 19, durationSteps: 3, scaleDegreeOffset: 4, velocity: 0.84 },
      { stepOffset: 22, durationSteps: 2, scaleDegreeOffset: 2, velocity: 0.82 },
      { stepOffset: 24, durationSteps: 8, scaleDegreeOffset: 0, velocity: 0.94 },
    ],
  },
];

/**
 * Generates a brand-new, catchy randomized Leitmotif seed (随机生成主导动机与主题片段).
 */
export function generateRandomMotifSeed(bars: 1 | 2 = 2): MotifSeed {
  const totalSteps = bars * 16;
  const rhythmicCells = [
    [4, 2, 2, 4, 4],
    [6, 2, 4, 4],
    [2, 2, 4, 2, 2, 4],
    [3, 3, 2, 4, 4],
    [4, 4, 2, 2, 4],
    [2, 2, 2, 2, 4, 4],
  ];

  const contourTypes = ['arch', 'ascend', 'descend', 'wave', 'leap_sigh'] as const;
  const chosenContour = randChoice([...contourTypes]);
  const modes: MotifDevelopmentMode[] = [
    'classic_variation',
    'sequence_ascend',
    'inversion_mirror',
    'call_response',
  ];

  const notes: MotifNote[] = [];
  let deg = randChoice([0, 0, 2, 4]);

  for (let b = 0; b < bars; b++) {
    const cell = randChoice(rhythmicCells);
    let stepInBar = 0;
    for (let i = 0; i < cell.length; i++) {
      const dur = cell[i];
      const absStep = b * 16 + stepInBar;
      if (absStep >= totalSteps) break;

      // Final note of bar 2 lands stably on tonic (0), mediant (2), or dominant (4)
      if (b === bars - 1 && stepInBar + dur >= 14) {
        deg = randChoice([0, 0, 2, 4]);
      } else {
        const progress = absStep / totalSteps;
        if (chosenContour === 'arch') {
          deg += progress < 0.5 ? randChoice([1, 2, 0]) : randChoice([-1, -2, 0]);
        } else if (chosenContour === 'ascend') {
          deg += randChoice([1, 1, 2, -1]);
        } else if (chosenContour === 'descend') {
          if (absStep === 0) deg = 5;
          deg += randChoice([-1, -1, -2, 1]);
        } else if (chosenContour === 'leap_sigh') {
          deg = i === 0 ? 0 : i === 1 ? 5 : Math.max(0, deg - 1);
        } else {
          deg += randChoice([-2, -1, 1, 2, 3]);
        }
        deg = Math.max(-2, Math.min(8, deg));
      }

      notes.push({
        stepOffset: absStep,
        durationSteps: dur,
        scaleDegreeOffset: deg,
        velocity: Number((0.76 + randFloat() * 0.2).toFixed(2)),
      });
      stepInBar += dur;
    }
  }

  return {
    id: `motif_custom_${Date.now()}`,
    name: `随机灵感动机 #${Math.floor(100 + randFloat() * 900)}`,
    subtitle: 'AI 乐理随机生成 · 可自由微调音高与时值',
    category: '随机创意',
    bars,
    developmentMode: randChoice(modes),
    ornamentDensity: Number((0.5 + randFloat() * 0.35).toFixed(2)),
    notes,
  };
}

/**
 * Extracts a MotifSeed from the first 1-2 bars of the current Melody track!
 */
export function extractMotifFromMelodyTrack(project: ProjectState): MotifSeed {
  const melodyTrack = project.tracks.find((t) => t.role === 'melody');
  const scalePitches = getScalePitches(project.rootNote, project.scale, 36, 84);
  const rootMidi = 60 + (project.rootNote % 12);
  const rootScaleIdx = findClosestScaleIndex(scalePitches, rootMidi);

  const bar12Notes = (melodyTrack?.notes || [])
    .filter((n) => n.startStep < 32)
    .sort((a, b) => a.startStep - b.startStep);

  if (bar12Notes.length === 0) {
    return generateRandomMotifSeed(2);
  }

  const motifNotes: MotifNote[] = bar12Notes.map((n) => {
    const idx = findClosestScaleIndex(scalePitches, n.pitch);
    return {
      stepOffset: n.startStep,
      durationSteps: Math.min(16, n.durationSteps),
      scaleDegreeOffset: Math.max(-4, Math.min(10, idx - rootScaleIdx)),
      velocity: n.velocity,
    };
  });

  return {
    id: `motif_extracted_${Date.now()}`,
    name: `${project.title} · 提取动机`,
    subtitle: '从主旋律前 2 小节提取的核心主题片段',
    category: '自创提取',
    bars: 2,
    developmentMode: 'classic_variation',
    ornamentDensity: project.algorithmParams.ornamentDensity ?? 0.65,
    notes: motifNotes,
  };
}

/**
 * Returns all valid MIDI pitches in [minMidi, maxMidi] that belong to the given rootNote + scaleId.
 */
export function getScalePitches(
  rootNote: number,
  scaleId: ScaleType,
  minMidi = 48,
  maxMidi = 84
): number[] {
  const scale = getScaleById(scaleId);
  const rootPc = rootNote % 12;
  const result: number[] = [];
  for (let m = minMidi; m <= maxMidi; m++) {
    const rel = ((m % 12) - rootPc + 12) % 12;
    if (scale.intervals.includes(rel)) {
      result.push(m);
    }
  }
  return result;
}

/**
 * Returns the chord intervals (in semitones from chord root) for a chordType.
 */
export function getChordIntervals(chordType: ChordSlot['chordType']): number[] {
  switch (chordType) {
    case 'major':
      return [0, 4, 7];
    case 'minor':
      return [0, 3, 7];
    case 'sus4':
      return [0, 5, 7];
    case 'maj7':
      return [0, 4, 7, 11];
    case 'min7':
      return [0, 3, 7, 10];
    case 'dom7':
      return [0, 4, 7, 10];
    case 'power5':
      return [0, 7, 12];
    default:
      return [0, 4, 7];
  }
}

/**
 * Builds the ChordSlot timeline for up to 16 bars based on rootNote, progressionId, and bar count.
 */
export function buildChordTimeline(
  rootNote: number,
  progressionId: string,
  bars: number
): ChordSlot[] {
  const prog = getProgressionById(progressionId);
  const rootPc = rootNote % 12;
  const timeline: ChordSlot[] = [];

  for (let b = 0; b < bars; b++) {
    const sectionIdx = Math.floor(b / 4); // 0=A段(1-4), 1=B段(5-8), 2=C段(9-12), 3=D段(13-16)
    const template = prog.bars4[b % prog.bars4.length];
    const absPc = (rootPc + template.rootOffset) % 12;
    const rootName = PITCH_CLASS_NAMES[absPc];
    let suffix = '';
    if (template.chordType === 'minor') suffix = 'm';
    else if (template.chordType === 'sus4') suffix = 'sus4';
    else if (template.chordType === 'maj7') suffix = 'maj7';
    else if (template.chordType === 'min7') suffix = 'm7';

    const sectionTag =
      bars > 4
        ? ['A呈示', 'B展开', 'C高潮', 'D收束'][sectionIdx % 4] + ' · '
        : '';

    timeline.push({
      barIndex: b,
      degree: b % 4,
      rootSemitone: template.rootOffset,
      chordType: template.chordType,
      label: `${rootName}${suffix}`,
      roman: template.roman,
      functionHint: `${sectionTag}${template.functionHint}`,
    });
  }
  return timeline;
}

/**
 * Analyzes existing melody notes in each bar to infer the best matching chords (智能根据旋律反推配和弦).
 */
export function inferChordsFromMelody(project: ProjectState): ChordSlot[] {
  const melodyTrack = project.tracks.find((t) => t.role === 'melody');
  if (!melodyTrack || melodyTrack.notes.length === 0) {
    return buildChordTimeline(project.rootNote, project.progressionId, project.bars);
  }

  const rootPc = project.rootNote % 12;
  const candidateTemplates: Array<{
    rootOffset: number;
    chordType: ChordSlot['chordType'];
    roman: string;
    functionHint: string;
  }> = [
    { rootOffset: 0, chordType: 'major', roman: 'I', functionHint: '主和弦 · 稳定支撑旋律主音' },
    { rootOffset: 0, chordType: 'minor', roman: 'i', functionHint: '小调主和弦 · 契合叙事旋律' },
    { rootOffset: 5, chordType: 'major', roman: 'IV', functionHint: '下属和弦 · 温暖托举中声部' },
    { rootOffset: 5, chordType: 'minor', roman: 'iv', functionHint: '小下属和弦 · 深情内省色彩' },
    { rootOffset: 7, chordType: 'major', roman: 'V', functionHint: '属和弦 · 增强旋律推进力' },
    { rootOffset: 9, chordType: 'minor', roman: 'vi', functionHint: '六级小和弦 · 柔和古风/流行落点' },
    { rootOffset: 8, chordType: 'major', roman: 'bVI', functionHint: '降六级和弦 · 史诗宽广衬托' },
    { rootOffset: 3, chordType: 'major', roman: 'bIII', functionHint: '降三级和弦 · 明亮转折支撑' },
    { rootOffset: 10, chordType: 'major', roman: 'bVII', functionHint: '降七级和弦 · 开阔递进张力' },
    { rootOffset: 2, chordType: 'minor', roman: 'ii', functionHint: '二级小和弦 · 细腻过渡连接' },
  ];

  const fallbackTimeline = buildChordTimeline(project.rootNote, project.progressionId, project.bars);
  const result: ChordSlot[] = [];

  for (let b = 0; b < project.bars; b++) {
    const barStart = b * 16;
    const barEnd = barStart + 16;
    const barNotes = melodyTrack.notes.filter(
      (n) => n.startStep >= barStart && n.startStep < barEnd
    );

    if (barNotes.length === 0) {
      result.push(fallbackTimeline[b]);
      continue;
    }

    let bestCandidate = candidateTemplates[0];
    let bestScore = -999;

    for (const cand of candidateTemplates) {
      const chordRootPc = (rootPc + cand.rootOffset) % 12;
      const intervals = getChordIntervals(cand.chordType);
      const chordPcs = intervals.map((iv) => (chordRootPc + iv) % 12);

      let score = 0;
      for (const note of barNotes) {
        const notePc = note.pitch % 12;
        const weight = note.durationSteps * (note.startStep % 4 === 0 ? 1.5 : 1.0);
        if (notePc === chordRootPc) {
          score += weight * 3.0;
        } else if (chordPcs.includes(notePc)) {
          score += weight * 2.2;
        } else {
          score -= weight * 0.6;
        }
      }

      if ((b + 1) % 4 === 0 && b === project.bars - 1 && cand.rootOffset === 0) {
        score += 6;
      }
      if (b > 0 && result[b - 1].rootSemitone === cand.rootOffset) {
        score -= 3.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = cand;
      }
    }

    const absPc = (rootPc + bestCandidate.rootOffset) % 12;
    const rootName = PITCH_CLASS_NAMES[absPc];
    const suffix = bestCandidate.chordType === 'minor' ? 'm' : '';

    result.push({
      barIndex: b,
      degree: b % 4,
      rootSemitone: bestCandidate.rootOffset,
      chordType: bestCandidate.chordType,
      label: `${rootName}${suffix}`,
      roman: bestCandidate.roman,
      functionHint: bestCandidate.functionHint,
    });
  }

  return result;
}

export function findClosestScaleIndex(scalePitches: number[], targetPitch: number): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < scalePitches.length; i++) {
    const d = Math.abs(scalePitches[i] - targetPitch);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Automatically fills in delicate musical details (经过音 Passing Tones, 邻音倚音 Neighbor Ornaments,
 * 句尾华彩走音 Cadential Flourishes) on a melody note list according to `ornamentDensity` (0..1).
 */
export function autoFillMelodyDetails(
  baseNotes: NoteEvent[],
  scalePitches: number[],
  bars: number,
  ornamentDensity = 0.6
): NoteEvent[] {
  if (ornamentDensity <= 0.08 || baseNotes.length === 0 || scalePitches.length === 0) {
    return baseNotes;
  }

  const sorted = [...baseNotes].sort((a, b) => a.startStep - b.startStep);
  const detailed: NoteEvent[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const curr = { ...sorted[i] };
    const next = sorted[i + 1];
    const currIdx = findClosestScaleIndex(scalePitches, curr.pitch);

    // 1. Passing Tone Fill (经过音填充): If curr has duration >= 4 and leaps by 2 or 3 scale steps to next
    if (
      next &&
      curr.startStep + curr.durationSteps <= next.startStep &&
      curr.durationSteps >= 3 &&
      randFloat() < ornamentDensity * 0.72
    ) {
      const nextIdx = findClosestScaleIndex(scalePitches, next.pitch);
      const diff = nextIdx - currIdx;
      if (Math.abs(diff) >= 2 && Math.abs(diff) <= 4) {
        const passDur = curr.durationSteps >= 6 ? 2 : 1;
        const mainDur = curr.durationSteps - passDur;
        const passIdx = Math.max(
          0,
          Math.min(scalePitches.length - 1, currIdx + Math.sign(diff))
        );
        detailed.push({
          ...curr,
          durationSteps: mainDur,
        });
        detailed.push({
          id: createNoteId('orn_pass'),
          pitch: scalePitches[passIdx],
          startStep: curr.startStep + mainDur,
          durationSteps: passDur,
          velocity: Math.max(0.45, curr.velocity * 0.82),
        });
        continue;
      }
    }

    // 2. Neighbor Mordent / Grace Turn (波音/邻音微装饰) on sustained notes (duration >= 6)
    if (
      curr.durationSteps >= 6 &&
      (curr.startStep % 16) < 10 &&
      randFloat() < ornamentDensity * 0.65
    ) {
      const neighborDir = randFloat() < 0.65 ? 1 : -1;
      const neighborIdx = Math.max(
        0,
        Math.min(scalePitches.length - 1, currIdx + neighborDir)
      );
      if (neighborIdx !== currIdx) {
        detailed.push({
          ...curr,
          durationSteps: 2,
        });
        detailed.push({
          id: createNoteId('orn_mord'),
          pitch: scalePitches[neighborIdx],
          startStep: curr.startStep + 2,
          durationSteps: 1,
          velocity: Math.max(0.5, curr.velocity * 0.85),
        });
        detailed.push({
          id: createNoteId('orn_res'),
          pitch: curr.pitch,
          startStep: curr.startStep + 3,
          durationSteps: curr.durationSteps - 3,
          velocity: curr.velocity * 0.94,
        });
        continue;
      }
    }

    detailed.push(curr);
  }

  // 3. Phrase-End Pickup Flourish (每2或4小节句尾华彩过渡音填充)
  for (let bar = 1; bar < bars - 1; bar += 2) {
    if (randFloat() > ornamentDensity * 0.75) continue;
    const pickupStart = bar * 16 + 14;
    const hasOverlap = detailed.some(
      (n) => n.startStep < pickupStart + 2 && n.startStep + n.durationSteps > pickupStart
    );
    if (!hasOverlap) {
      const prevNote = [...detailed]
        .filter((n) => n.startStep < pickupStart)
        .sort((a, b) => b.startStep - a.startStep)[0];
      const baseIdx = prevNote
        ? findClosestScaleIndex(scalePitches, prevNote.pitch)
        : Math.floor(scalePitches.length / 2);
      const p1 = scalePitches[Math.min(scalePitches.length - 1, baseIdx + 1)];
      const p2 = scalePitches[Math.min(scalePitches.length - 1, baseIdx + 2)];
      detailed.push({
        id: createNoteId('orn_pk1'),
        pitch: p1,
        startStep: pickupStart,
        durationSteps: 1,
        velocity: 0.68,
      });
      detailed.push({
        id: createNoteId('orn_pk2'),
        pitch: p2,
        startStep: pickupStart + 1,
        durationSteps: 1,
        velocity: 0.74,
      });
    }
  }

  return detailed.sort((a, b) => a.startStep - b.startStep);
}

/**
 * Develops a Leitmotif & Theme Seed (`MotifSeed`) into a full 4/8/12/16-bar Melody
 * and automatically fills in musical details and all accompanying tracks!
 */
export function developMotifIntoMelody(
  project: ProjectState,
  motif: MotifSeed
): NoteEvent[] {
  const scalePitches = getScalePitches(project.rootNote, project.scale, 55, 83);
  if (scalePitches.length === 0) return [];

  const rootPc = project.rootNote % 12;
  const tonicCenterMidi = 60 + rootPc + (rootPc > 7 ? 0 : 12);
  const rootScaleIdx = findClosestScaleIndex(scalePitches, tonicCenterMidi);
  const motifBars = motif.bars || 2;
  const rawMelody: NoteEvent[] = [];

  for (let bar = 0; bar < project.bars; bar += motifBars) {
    const phraseIndex = Math.floor(bar / motifBars);
    const sectionIdx = Math.floor(bar / 4); // 0=A, 1=B, 2=C (Climax), 3=D (Finale)
    const isLastChunk = bar + motifBars >= project.bars;

    const chord =
      project.chordTimeline[bar] ||
      buildChordTimeline(project.rootNote, project.progressionId, project.bars)[bar];
    const chordRootTarget = tonicCenterMidi + ((chord.rootSemitone > 7 ? chord.rootSemitone - 12 : chord.rootSemitone));
    const chordAnchorIdx = findClosestScaleIndex(scalePitches, chordRootTarget);
    const chordDegreeShift = chordAnchorIdx - rootScaleIdx;

    for (let idx = 0; idx < motif.notes.length; idx++) {
      const mn = motif.notes[idx];
      const absStep = bar * 16 + mn.stepOffset;
      if (absStep >= project.bars * 16) continue;

      let degOffset = mn.scaleDegreeOffset;

      // Apply Development Technique across phrases
      if (phraseIndex === 0) {
        // Phrase 1 (起 · 呈示): Original Leitmotif statement
        degOffset = mn.scaleDegreeOffset;
      } else if (isLastChunk && idx === motif.notes.length - 1) {
        // Final cadence note resolves cleanly to Tonic (0)
        degOffset = 0;
      } else {
        switch (motif.developmentMode) {
          case 'sequence_ascend': {
            // Sequential ascending transposition (+1, +2, +4 scale steps in climax)
            const seqShift = sectionIdx === 2 ? 3 : (phraseIndex % 3) + 1;
            degOffset = mn.scaleDegreeOffset + seqShift;
            break;
          }
          case 'inversion_mirror': {
            // Melodic inversion on odd phrases, climax octave expansion on Section C
            const axis = motif.notes[0]?.scaleDegreeOffset || 2;
            if (phraseIndex % 2 === 1) {
              degOffset = axis - (mn.scaleDegreeOffset - axis) + Math.round(chordDegreeShift * 0.5);
            } else {
              degOffset = mn.scaleDegreeOffset + (sectionIdx === 2 ? 2 : 0);
            }
            break;
          }
          case 'call_response': {
            // Odd phrases answer with a complementary rhythmic/melodic variation
            if (phraseIndex % 2 === 1) {
              const variationDelta = idx % 2 === 0 ? 2 : -1;
              degOffset = mn.scaleDegreeOffset + variationDelta + Math.round(chordDegreeShift * 0.5);
            } else {
              degOffset = mn.scaleDegreeOffset + (sectionIdx === 2 ? 2 : 0);
            }
            break;
          }
          case 'classic_variation':
          default: {
            // Follows harmonic root shift + Section C climax lift
            const climaxLift = sectionIdx === 2 ? 2 : 0;
            degOffset =
              mn.scaleDegreeOffset +
              Math.round(chordDegreeShift * 0.65) +
              climaxLift;
            break;
          }
        }
      }

      const targetScaleIdx = Math.max(
        0,
        Math.min(scalePitches.length - 1, rootScaleIdx + degOffset)
      );

      // Subtle human velocity expression
      const humanVel = Math.max(
        0.45,
        Math.min(
          0.98,
          mn.velocity * (sectionIdx === 2 ? 1.08 : 1.0) + (randFloat() - 0.5) * 0.08
        )
      );

      rawMelody.push({
        id: createNoteId('mot_mel'),
        pitch: scalePitches[targetScaleIdx],
        startStep: absStep,
        durationSteps: Math.min(mn.durationSteps, project.bars * 16 - absStep),
        velocity: Number(humanVel.toFixed(2)),
      });
    }
  }

  return autoFillMelodyDetails(
    rawMelody,
    scalePitches,
    project.bars,
    motif.ornamentDensity
  );
}

/**
 * Generates a full multi-track arrangement around a Leitmotif / Theme Fragment (`MotifSeed`).
 */
export function developMotifAndFillArrangement(
  project: ProjectState,
  motif: MotifSeed
): ProjectState {
  const melodyNotes = developMotifIntoMelody(project, motif);
  const projectWithMel: ProjectState = {
    ...project,
    activeMotif: motif,
    algorithmParams: {
      ...project.algorithmParams,
      ornamentDensity: motif.ornamentDensity,
    },
    tracks: project.tracks.map((t) =>
      t.role === 'melody' ? { ...t, notes: melodyNotes } : t
    ),
  };

  const inferredTimeline = inferChordsFromMelody(projectWithMel);
  const syncedProject: ProjectState = {
    ...projectWithMel,
    chordTimeline: inferredTimeline,
  };

  const nextTracks = syncedProject.tracks.map((t, idx) => {
    if (t.role === 'melody') {
      return { ...t, notes: melodyNotes };
    }
    return {
      ...t,
      notes: generateNotesForRole(syncedProject, t.role, melodyNotes, idx),
    };
  });

  return {
    ...syncedProject,
    tracks: nextTracks,
  };
}

/**
 * Generates or Auto-Completes the Melody Track across up to 16 bars with HIGH RANDOMNESS & VARIETY.
 * Every invocation selects fresh phrase contour archetypes, rhythmic syncopation cells,
 * register shifts, and ornamental details so no two generations are alike.
 */
export function calculateMelodyTrack(
  project: ProjectState,
  preserveExisting: boolean
): NoteEvent[] {
  const melodyTrack = project.tracks.find((t) => t.role === 'melody');
  const existingNotes = melodyTrack ? [...melodyTrack.notes] : [];

  const scalePitches = getScalePitches(project.rootNote, project.scale, 55, 83);
  if (scalePitches.length === 0) return existingNotes;

  const {
    melodyDensity,
    pitchSmoothness,
    randomness = 0.72,
    ornamentDensity = 0.58,
  } = project.algorithmParams;
  const rootPc = project.rootNote % 12;

  const preservedNotes: NoteEvent[] = preserveExisting
    ? existingNotes.filter((n) => n.startStep < project.bars * 16)
    : [];

  // Randomize starting scale degree among tonic, mediant (3rd), or dominant (5th) when generating fresh
  const startOffsets = [0, 2, 4, 7];
  const randomStartSemitone = randChoice(startOffsets);
  let currentScaleIdx = findClosestScaleIndex(
    scalePitches,
    preservedNotes.length > 0
      ? preservedNotes[preservedNotes.length - 1].pitch
      : 60 + rootPc + randomStartSemitone + (randFloat() < 0.65 ? 12 : 0)
  );

  // Extract user's seed motif if preserving existing notes
  let seedBarIntervals: Array<{ stepOffset: number; dur: number; scaleDelta: number }> | null =
    null;
  if (preserveExisting && preservedNotes.length >= 2) {
    const sorted = [...preservedNotes].sort((a, b) => a.startStep - b.startStep);
    const firstBarIndex = Math.floor(sorted[0].startStep / 16);
    const firstBarNotes = sorted.filter(
      (n) => Math.floor(n.startStep / 16) === firstBarIndex
    );
    if (firstBarNotes.length >= 2) {
      const baseIdx = findClosestScaleIndex(scalePitches, firstBarNotes[0].pitch);
      seedBarIntervals = firstBarNotes.map((n) => ({
        stepOffset: n.startStep % 16,
        dur: n.durationSteps,
        scaleDelta: findClosestScaleIndex(scalePitches, n.pitch) - baseIdx,
      }));
    }
  }

  // Diverse Rhythmic Cell Library (16 steps per bar) for randomized phrasing
  const sparseCells = [
    [6, 2, 8],
    [4, 4, 8],
    [8, 4, 4],
    [4, 6, 2, 4],
  ];
  const mediumCells = [
    [4, 2, 2, 4, 4],
    [3, 3, 2, 4, 4],
    [2, 2, 4, 4, 2, 2],
    [6, 2, 2, 2, 4],
    [4, 4, 2, 2, 4],
    [2, 4, 2, 4, 4],
  ];
  const activeCells = [
    [2, 2, 2, 2, 4, 2, 2],
    [3, 1, 2, 2, 2, 2, 4],
    [2, 2, 4, 2, 2, 2, 2],
    [1, 1, 2, 2, 2, 4, 4],
    [2, 1, 1, 2, 2, 4, 4],
  ];

  // Phrase Contour Archetypes randomly assigned to each 4-bar section
  type ContourArchetype = 'arch' | 'wave' | 'cascade_down' | 'heroic_climb' | 'pendulum';
  const allContours: ContourArchetype[] = [
    'arch',
    'wave',
    'cascade_down',
    'heroic_climb',
    'pendulum',
  ];
  const sectionContours: ContourArchetype[] = [
    randChoice(allContours),
    randChoice(allContours),
    'heroic_climb', // Section C climax favors soaring ascent
    randChoice(['arch', 'cascade_down']),
  ];

  const generated: NoteEvent[] = [...preservedNotes];

  for (let bar = 0; bar < project.bars; bar++) {
    const barStart = bar * 16;
    const barEnd = barStart + 16;
    const sectionIdx = Math.floor(bar / 4);
    const contour = sectionContours[sectionIdx % sectionContours.length];

    const occupiedSteps = new Set<number>();
    if (preserveExisting) {
      for (const n of preservedNotes) {
        for (let s = n.startStep; s < n.startStep + n.durationSteps; s++) {
          if (s >= barStart && s < barEnd) {
            occupiedSteps.add(s);
          }
        }
      }
    }

    if (occupiedSteps.size >= 10) {
      const lastInBar = preservedNotes
        .filter((n) => n.startStep >= barStart && n.startStep < barEnd)
        .sort((a, b) => b.startStep - a.startStep)[0];
      if (lastInBar) {
        currentScaleIdx = findClosestScaleIndex(scalePitches, lastInBar.pitch);
      }
      continue;
    }

    const chord =
      project.chordTimeline[bar] ||
      buildChordTimeline(project.rootNote, project.progressionId, project.bars)[bar];
    const chordRootPc = (rootPc + chord.rootSemitone) % 12;
    const chordIntervals = getChordIntervals(chord.chordType);
    const chordPcs = chordIntervals.map((iv) => (chordRootPc + iv) % 12);

    // Motif development if user provided a seed bar and we are in preserve mode
    if (
      seedBarIntervals &&
      occupiedSteps.size === 0 &&
      bar < project.bars - 1 &&
      (bar + 1) % 4 !== 0 &&
      randFloat() > randomness * 0.45
    ) {
      const motifShift =
        sectionIdx === 2
          ? 2
          : bar % 2 === 1
          ? randChoice([1, 2, -1])
          : randChoice([-1, -2, 1]);
      const anchorTarget = 64 + chord.rootSemitone + (sectionIdx === 2 ? 3 : 0);
      const anchorIdx = findClosestScaleIndex(scalePitches, anchorTarget);

      for (const item of seedBarIntervals) {
        const targetIdx = Math.max(
          0,
          Math.min(scalePitches.length - 1, anchorIdx + item.scaleDelta + motifShift)
        );
        const step = barStart + item.stepOffset;
        generated.push({
          id: createNoteId('mel'),
          pitch: scalePitches[targetIdx],
          startStep: step,
          durationSteps: item.dur,
          velocity: Number((0.74 + randFloat() * 0.2).toFixed(2)),
        });
        currentScaleIdx = targetIdx;
      }
      continue;
    }

    // Choose a rhythmic cell for this bar based on melodyDensity + randomness
    const pool =
      melodyDensity < 0.42
        ? sparseCells
        : melodyDensity > 0.72
        ? activeCells
        : mediumCells;
    const chosenCell = randChoice(pool);

    let stepInBar = 0;
    let cellIdx = 0;

    while (stepInBar < 16) {
      const absStep = barStart + stepInBar;
      if (occupiedSteps.has(absStep)) {
        stepInBar += 2;
        continue;
      }

      const isFinalBarOfSong = bar === project.bars - 1;
      const isPhraseEndBar = (bar + 1) % 4 === 0;
      const isStrongBeat = stepInBar % 4 === 0;

      // Phrase cadence resolution on every 4th bar
      if ((isFinalBarOfSong || isPhraseEndBar) && stepInBar >= 8) {
        let bestCadenceIdx = currentScaleIdx;
        let bestDist = 999;
        const targetPc =
          isFinalBarOfSong || bar === 7
            ? rootPc
            : randChoice([(rootPc + 7) % 12, (rootPc + 4) % 12]);
        for (let i = 0; i < scalePitches.length; i++) {
          if (
            scalePitches[i] % 12 === targetPc ||
            (isFinalBarOfSong && scalePitches[i] % 12 === rootPc)
          ) {
            const d = Math.abs(i - currentScaleIdx);
            if (d < bestDist) {
              bestDist = d;
              bestCadenceIdx = i;
            }
          }
        }
        const dur = Math.min(16 - stepInBar, 8);
        generated.push({
          id: createNoteId('mel'),
          pitch: scalePitches[bestCadenceIdx],
          startStep: absStep,
          durationSteps: dur,
          velocity: 0.92,
        });
        currentScaleIdx = bestCadenceIdx;
        break;
      }

      const cellDur = chosenCell[cellIdx % chosenCell.length] || 2;
      cellIdx++;

      // Occasional expressive breathing rest
      const restProb = isStrongBeat ? 0.06 : Math.max(0.08, (1 - melodyDensity) * 0.45);
      if (randFloat() < restProb && stepInBar > 0) {
        stepInBar += Math.min(cellDur, 16 - stepInBar);
        continue;
      }

      const maxLeap =
        pitchSmoothness > 0.8
          ? 2
          : pitchSmoothness > 0.55
          ? 3
          : Math.round(4 + randomness * 2);
      const candidates: Array<{ idx: number; weight: number }> = [];

      // Contour directional bias
      const barProgress = ((bar % 4) * 16 + stepInBar) / 64;
      let contourBias = 0;
      if (contour === 'arch') contourBias = barProgress < 0.5 ? 1.5 : -1.5;
      else if (contour === 'heroic_climb') contourBias = 1.3;
      else if (contour === 'cascade_down') contourBias = stepInBar === 0 ? 2.5 : -1.4;
      else if (contour === 'wave') contourBias = Math.sin(barProgress * Math.PI * 4) * 1.6;
      else if (contour === 'pendulum') contourBias = cellIdx % 2 === 0 ? 2.0 : -2.0;

      for (let delta = -maxLeap; delta <= maxLeap; delta++) {
        const idx = currentScaleIdx + delta;
        if (idx < 0 || idx >= scalePitches.length) continue;
        const p = scalePitches[idx];
        const pc = p % 12;

        // Base weight with randomness flattening so unexpected intervals can emerge
        let weight = 1.0 / (Math.pow(Math.abs(delta), 1.15 - randomness * 0.45) + 0.65);
        if (delta === 0) weight *= 0.25;

        // Apply contour directional bias
        if (Math.sign(delta) === Math.sign(contourBias)) {
          weight *= 1 + Math.abs(contourBias) * 0.45;
        }

        if (isStrongBeat && chordPcs.includes(pc)) {
          weight *= 2.6;
        }
        if (pc === chordRootPc && stepInBar === 0) {
          weight *= 1.75;
        }

        const minComfort = sectionIdx === 2 ? 64 : 58;
        const maxComfort = sectionIdx === 2 ? 81 : 77;
        if (p < minComfort || p > maxComfort) {
          weight *= 0.28;
        }

        candidates.push({ idx, weight });
      }

      if (candidates.length > 0) {
        const totalW = candidates.reduce((acc, c) => acc + c.weight, 0);
        let r = randFloat() * totalW;
        let chosenIdx = candidates[0].idx;
        for (const c of candidates) {
          r -= c.weight;
          if (r <= 0) {
            chosenIdx = c.idx;
            break;
          }
        }
        currentScaleIdx = chosenIdx;
      }

      let maxAllowedDur = Math.min(cellDur, 16 - stepInBar);
      for (let check = 1; check < maxAllowedDur; check++) {
        if (occupiedSteps.has(absStep + check)) {
          maxAllowedDur = check;
          break;
        }
      }
      maxAllowedDur = Math.max(1, maxAllowedDur);

      const phraseArcVel = 0.72 + Math.sin((stepInBar / 16) * Math.PI) * 0.14;
      const randJitter = (randFloat() - 0.5) * 0.12 * randomness;
      const finalVel = Math.max(
        0.48,
        Math.min(0.98, (isStrongBeat ? phraseArcVel + 0.08 : phraseArcVel) + randJitter)
      );

      generated.push({
        id: createNoteId('mel'),
        pitch: scalePitches[currentScaleIdx],
        startStep: absStep,
        durationSteps: maxAllowedDur,
        velocity: Number(finalVel.toFixed(2)),
      });

      stepInBar += maxAllowedDur;
    }
  }

  return autoFillMelodyDetails(
    generated.sort((a, b) => a.startStep - b.startStep),
    scalePitches,
    project.bars,
    ornamentDensity * 0.65
  );
}

/**
 * Generates an interlocking Counter-Melody / Call-and-Response track with randomized rhythmic templates.
 */
export function calculateCounterMelodyTrack(
  project: ProjectState,
  melodyNotes: NoteEvent[],
  variantOffset = 0
): NoteEvent[] {
  const scalePitches = getScalePitches(project.rootNote, project.scale, 53, 79);
  if (scalePitches.length === 0) return [];

  const rootPc = project.rootNote % 12;
  const notes: NoteEvent[] = [];

  const stepTemplates = [
    [0, 4, 8, 12, 14],
    [2, 6, 10, 12],
    [0, 6, 8, 14],
    [4, 8, 10, 12],
    [0, 3, 6, 12],
  ];

  for (let bar = 0; bar < project.bars; bar++) {
    const barStart = bar * 16;
    const chord =
      project.chordTimeline[bar] ||
      buildChordTimeline(project.rootNote, project.progressionId, project.bars)[bar];
    const chordRootPc = (rootPc + chord.rootSemitone) % 12;
    const chordPcs = getChordIntervals(chord.chordType).map((iv) => (chordRootPc + iv) % 12);

    const barMelody = melodyNotes.filter(
      (n) => n.startStep >= barStart && n.startStep < barStart + 16
    );

    const targetSteps =
      stepTemplates[Math.floor(randFloat() * stepTemplates.length + variantOffset) % stepTemplates.length];
    const harmIntervalChoice = randChoice([-2, -3, 2, 4, -5]);

    for (const sOff of targetSteps) {
      const absStep = barStart + sOff;
      const activeMel = barMelody.find(
        (m) => m.startStep <= absStep && m.startStep + m.durationSteps > absStep
      );

      if (activeMel && activeMel.durationSteps < 3 && sOff !== 8 && randFloat() < 0.65) {
        continue;
      }

      let targetPitch = 60 + chordRootPc;
      if (activeMel) {
        const melIdx = findClosestScaleIndex(scalePitches, activeMel.pitch);
        const harmIdx = Math.max(
          0,
          Math.min(scalePitches.length - 1, melIdx + harmIntervalChoice)
        );
        targetPitch = scalePitches[harmIdx];
      } else {
        const candidates = scalePitches.filter(
          (p) => chordPcs.includes(p % 12) && p >= 55 && p <= 75
        );
        if (candidates.length > 0) {
          targetPitch = randChoice(candidates);
        }
      }

      const dur = sOff >= 14 ? 2 : randChoice([2, 4, 4]);
      notes.push({
        id: createNoteId('cnt'),
        pitch: targetPitch,
        startStep: absStep,
        durationSteps: Math.min(dur, 16 - sOff),
        velocity: Number(((activeMel ? 0.54 : 0.72) + (randFloat() - 0.5) * 0.1).toFixed(2)),
      });
    }
  }

  return notes;
}

/**
 * Generates dedicated Flowing Arpeggio Track (`arpeggio` 流水琶音轨道) with 6 randomized harp/guzheng/keyboard patterns!
 */
export function calculateArpeggioTrack(
  project: ProjectState,
  variantIndex = 0
): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const rootPc = project.rootNote % 12;

  for (let bar = 0; bar < project.bars; bar++) {
    const barStart = bar * 16;
    const slot =
      project.chordTimeline[bar] ||
      buildChordTimeline(project.rootNote, project.progressionId, project.bars)[bar];
    const chordRootMidi = 48 + ((rootPc + slot.rootSemitone) % 12);
    const intervals = getChordIntervals(slot.chordType);

    const voicingPitches = intervals
      .map((iv) => {
        let p = chordRootMidi + iv + 12;
        if (p > 72) p -= 12;
        if (p < 55) p += 12;
        return p;
      })
      .sort((a, b) => a - b);

    const p0 = voicingPitches[0];
    const p1 = voicingPitches[1] || p0 + 4;
    const p2 = voicingPitches[2] || p0 + 7;
    const p3 = p0 + 12;
    const p4 = p1 + 12 <= 84 ? p1 + 12 : p3;

    const patterns = [
      [p0, p1, p2, p3, p2, p1, p2, p3], // Classic wave
      [p3, p2, p1, p0, p1, p2, p3, p4], // Cascade & soar
      [p0, p2, p1, p2, p3, p2, p1, p2], // Classical Alberti bass
      [p0, p1, p2, p4, p3, p2, p1, p2], // Guzheng/Harp wide arch
      [p0, p2, p3, p2, p0, p2, p4, p3], // Open fifth harp sparkle
    ];

    const chosenPattern =
      patterns[(Math.floor(randFloat() * patterns.length) + variantIndex + Math.floor(bar / 2)) % patterns.length];

    // Occasionally use 16th-note harp cascade on climax or phrase turnaround bars
    const use16thFlourish =
      (bar % 4 === 3 || Math.floor(bar / 4) === 2) &&
      (project.algorithmParams.ornamentDensity ?? 0.55) > 0.5 &&
      randFloat() < 0.55;

    if (use16thFlourish) {
      for (let i = 0; i < 16; i++) {
        const pitch = chosenPattern[i % chosenPattern.length] + (i >= 12 ? 12 : 0);
        notes.push({
          id: createNoteId('arp16'),
          pitch: pitch > 84 ? pitch - 12 : pitch,
          startStep: barStart + i,
          durationSteps: 1,
          velocity: Number((0.58 + (i % 4 === 0 ? 0.18 : 0) + (randFloat() - 0.5) * 0.08).toFixed(2)),
        });
      }
    } else {
      for (let i = 0; i < 8; i++) {
        notes.push({
          id: createNoteId('arp'),
          pitch: chosenPattern[i],
          startStep: barStart + i * 2,
          durationSteps: 2,
          velocity: Number(((i % 4 === 0 ? 0.78 : 0.62) + (randFloat() - 0.5) * 0.08).toFixed(2)),
        });
      }
    }
  }
  return notes;
}

/**
 * Generates dedicated Symphonic / Vocal Pad Track (`pad` 氛围铺底轨道) with randomized open/drop-2 voicings.
 */
export function calculatePadTrack(project: ProjectState): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const rootPc = project.rootNote % 12;

  for (let bar = 0; bar < project.bars; bar++) {
    const barStart = bar * 16;
    const slot =
      project.chordTimeline[bar] ||
      buildChordTimeline(project.rootNote, project.progressionId, project.bars)[bar];
    const chordRootMidi = 60 + ((rootPc + slot.rootSemitone) % 12);
    const intervals = getChordIntervals(slot.chordType);

    const thirdOrFourth = intervals[1] || 4;
    const voicingOptions = [
      [chordRootMidi - 12, chordRootMidi + thirdOrFourth, chordRootMidi + 7],
      [chordRootMidi - 12, chordRootMidi + 7, chordRootMidi + thirdOrFourth + 12],
      [chordRootMidi, chordRootMidi + thirdOrFourth, chordRootMidi + 7],
    ];
    const padVoicing = randChoice(voicingOptions).map((p) =>
      p > 76 ? p - 12 : p < 50 ? p + 12 : p
    );

    const splitTwoHalfBars = randFloat() < 0.3;
    for (const pitch of padVoicing) {
      if (splitTwoHalfBars) {
        notes.push({
          id: createNoteId('pad'),
          pitch,
          startStep: barStart,
          durationSteps: 8,
          velocity: 0.64,
        });
        notes.push({
          id: createNoteId('pad'),
          pitch,
          startStep: barStart + 8,
          durationSteps: 8,
          velocity: 0.68,
        });
      } else {
        notes.push({
          id: createNoteId('pad'),
          pitch,
          startStep: barStart,
          durationSteps: 16,
          velocity: 0.65,
        });
      }
    }
  }
  return notes;
}

/**
 * Generates dedicated Bell / Chime / High Accent Track (`accent` 金石钟磬/高音点缀轨道).
 */
export function calculateAccentTrack(project: ProjectState): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const rootPc = project.rootNote % 12;

  for (let bar = 0; bar < project.bars; bar++) {
    const barStart = bar * 16;
    const slot =
      project.chordTimeline[bar] ||
      buildChordTimeline(project.rootNote, project.progressionId, project.bars)[bar];
    const highRoot = 72 + ((rootPc + slot.rootSemitone) % 12);
    const highFifth = highRoot + 7 <= 84 ? highRoot + 7 : highRoot - 5;
    const highThird = highRoot + (slot.chordType === 'minor' ? 3 : 4);

    notes.push({
      id: createNoteId('acc'),
      pitch: highRoot > 82 ? highRoot - 12 : highRoot,
      startStep: barStart,
      durationSteps: 8,
      velocity: 0.78,
    });

    if (bar % 2 === 1 || randFloat() < 0.45) {
      const sparkleStep = randChoice([8, 10, 12]);
      notes.push({
        id: createNoteId('acc'),
        pitch: randChoice([highFifth, highThird > 84 ? highThird - 12 : highThird]),
        startStep: barStart + sparkleStep,
        durationSteps: 4,
        velocity: 0.72,
      });
      if (sparkleStep <= 10 && randFloat() < 0.6) {
        notes.push({
          id: createNoteId('acc'),
          pitch: highRoot > 82 ? highRoot - 12 : highRoot,
          startStep: barStart + 12,
          durationSteps: 4,
          velocity: 0.75,
        });
      }
    }
  }
  return notes;
}

/**
 * Generates the Chords Track & Bass Track from project.chordTimeline with randomized rhythmic grooves.
 */
export function calculateChordsAndBassTracks(project: ProjectState): {
  chordNotes: NoteEvent[];
  bassNotes: NoteEvent[];
} {
  const chordNotes: NoteEvent[] = [];
  const bassNotes: NoteEvent[] = [];
  const rootPc = project.rootNote % 12;
  const chordStyle = project.algorithmParams.chordStyle;

  const rhythmicGrooves = [
    [
      { offset: 0, dur: 4, vel: 0.78 },
      { offset: 6, dur: 2, vel: 0.65 },
      { offset: 8, dur: 4, vel: 0.72 },
      { offset: 12, dur: 4, vel: 0.75 },
    ],
    [
      { offset: 0, dur: 3, vel: 0.8 },
      { offset: 3, dur: 3, vel: 0.72 },
      { offset: 6, dur: 2, vel: 0.68 },
      { offset: 8, dur: 4, vel: 0.74 },
      { offset: 12, dur: 4, vel: 0.76 },
    ],
    [
      { offset: 0, dur: 6, vel: 0.78 },
      { offset: 6, dur: 2, vel: 0.66 },
      { offset: 8, dur: 6, vel: 0.75 },
      { offset: 14, dur: 2, vel: 0.68 },
    ],
  ];
  const chosenGroove = randChoice(rhythmicGrooves);

  for (let bar = 0; bar < project.bars; bar++) {
    const barStart = bar * 16;
    const slot =
      project.chordTimeline[bar] ||
      buildChordTimeline(project.rootNote, project.progressionId, project.bars)[bar];

    const chordRootMidi = 48 + ((rootPc + slot.rootSemitone) % 12);
    const bassRootMidi = 36 + ((rootPc + slot.rootSemitone) % 12);
    const intervals = getChordIntervals(slot.chordType);

    const voicingPitches = intervals
      .map((iv) => {
        let p = chordRootMidi + iv + 12;
        if (p > 71) p -= 12;
        if (p < 53) p += 12;
        return p;
      })
      .sort((a, b) => a - b);

    if (chordStyle === 'sustained') {
      for (const pitch of voicingPitches) {
        chordNotes.push({
          id: createNoteId('chd'),
          pitch,
          startStep: barStart,
          durationSteps: 16,
          velocity: 0.68,
        });
      }
    } else if (chordStyle === 'arpeggio') {
      const p0 = voicingPitches[0];
      const p1 = voicingPitches[1] || p0 + 4;
      const p2 = voicingPitches[2] || p0 + 7;
      const p3 = p0 + 12;
      const arpPitches =
        bar % 2 === 0
          ? [p0, p1, p2, p3, p2, p1, p2, p3]
          : [p0, p2, p1, p3, p2, p3, p1, p2];
      for (let i = 0; i < 8; i++) {
        chordNotes.push({
          id: createNoteId('chd'),
          pitch: arpPitches[i],
          startStep: barStart + i * 2,
          durationSteps: 3,
          velocity: i % 4 === 0 ? 0.76 : 0.6,
        });
      }
    } else {
      for (const h of chosenGroove) {
        for (const pitch of voicingPitches) {
          chordNotes.push({
            id: createNoteId('chd'),
            pitch,
            startStep: barStart + h.offset,
            durationSteps: h.dur,
            velocity: h.vel,
          });
        }
      }
    }

    const fifthMidi = bassRootMidi + 7 <= 55 ? bassRootMidi + 7 : bassRootMidi - 5;
    const octaveMidi = bassRootMidi + 12 <= 57 ? bassRootMidi + 12 : bassRootMidi;
    const thirdMidi = bassRootMidi + (slot.chordType === 'minor' ? 3 : 4);

    if (project.algorithmParams.rhythmIntensity < 0.45) {
      bassNotes.push({
        id: createNoteId('bas'),
        pitch: bassRootMidi,
        startStep: barStart,
        durationSteps: 8,
        velocity: 0.82,
      });
      bassNotes.push({
        id: createNoteId('bas'),
        pitch:
          bar === project.bars - 1
            ? bassRootMidi
            : randChoice([fifthMidi, octaveMidi]),
        startStep: barStart + 8,
        durationSteps: 8,
        velocity: 0.74,
      });
    } else {
      const bassVariants = [
        [
          { offset: 0, pitch: bassRootMidi, dur: 6, vel: 0.86 },
          { offset: 6, pitch: bassRootMidi, dur: 2, vel: 0.72 },
          { offset: 8, pitch: fifthMidi, dur: 4, vel: 0.78 },
          { offset: 12, pitch: octaveMidi, dur: 4, vel: 0.8 },
        ],
        [
          { offset: 0, pitch: bassRootMidi, dur: 4, vel: 0.88 },
          { offset: 4, pitch: thirdMidi, dur: 4, vel: 0.76 },
          { offset: 8, pitch: fifthMidi, dur: 4, vel: 0.8 },
          { offset: 12, pitch: octaveMidi, dur: 4, vel: 0.82 },
        ],
        [
          { offset: 0, pitch: bassRootMidi, dur: 3, vel: 0.88 },
          { offset: 3, pitch: octaveMidi, dur: 3, vel: 0.76 },
          { offset: 6, pitch: fifthMidi, dur: 2, vel: 0.74 },
          { offset: 8, pitch: bassRootMidi, dur: 4, vel: 0.84 },
          { offset: 12, pitch: fifthMidi, dur: 4, vel: 0.78 },
        ],
      ];
      const chosenBass = randChoice(bassVariants);
      for (const bp of chosenBass) {
        bassNotes.push({
          id: createNoteId('bas'),
          pitch: bp.pitch,
          startStep: barStart + bp.offset,
          durationSteps: bp.dur,
          velocity: bp.vel,
        });
      }
    }
  }

  return { chordNotes, bassNotes };
}

/**
 * Euclidean Rhythm Generator E(pulses, steps).
 */
export function computeEuclideanSteps(pulses: number, totalSteps: number): number[] {
  const result: number[] = [];
  if (pulses <= 0) return result;
  for (let i = 0; i < totalSteps; i++) {
    if (Math.floor((i * pulses) / totalSteps) !== Math.floor(((i - 1) * pulses) / totalSteps)) {
      result.push(i);
    }
  }
  return result;
}

/**
 * Generates or Completes the Percussion / Rhythm Track across up to 16 bars with randomized fills & grooves.
 */
export function calculateRhythmTrack(project: ProjectState): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const intensity = project.algorithmParams.rhythmIntensity;
  const isTraditional =
    project.styleId === 'xianxia_guofeng' ||
    project.styleId === 'royal_ritual_ya' ||
    project.styleId === 'hollywood_symphony' ||
    project.sceneId === 'scene_imperial_ceremony' ||
    project.sceneId === 'scene_xianxia_cloud' ||
    project.sceneId === 'scene_jiangnan_rain' ||
    project.scale === 'pentatonic_major' ||
    project.styleId === 'epic_orchestra';

  const traditionalKickPatterns = [
    [0, 6, 8, 12],
    [0, 4, 8, 14],
    [0, 3, 8, 12],
  ];
  const modernKickPatterns = [
    [0, 3, 6, 8, 10],
    [0, 6, 8, 14],
    [0, 4, 8, 10, 14],
    [0, 2, 8, 11],
  ];

  const chosenTradKick = randChoice(traditionalKickPatterns);
  const chosenModKick = randChoice(modernKickPatterns);

  for (let bar = 0; bar < project.bars; bar++) {
    const barStart = bar * 16;
    const isFillBar = (bar + 1) % 4 === 0;

    if (bar % 4 === 0) {
      notes.push({
        id: createNoteId('drm'),
        pitch: 49,
        startStep: barStart,
        durationSteps: 4,
        velocity: 0.76,
      });
    }

    if (isTraditional) {
      const tangguSteps = intensity > 0.55 ? chosenTradKick : [0, 8];
      for (const s of tangguSteps) {
        notes.push({
          id: createNoteId('drm'),
          pitch: 45,
          startStep: barStart + s,
          durationSteps: 2,
          velocity: s === 0 ? 0.88 : 0.74,
        });
      }

      const woodPulses = intensity > 0.65 ? randChoice([5, 6]) : randChoice([3, 4]);
      const woodSteps = computeEuclideanSteps(woodPulses, 16);
      for (const s of woodSteps) {
        if (s % 4 !== 0) {
          notes.push({
            id: createNoteId('drm'),
            pitch: 50,
            startStep: barStart + s,
            durationSteps: 1,
            velocity: 0.68,
          });
        }
      }

      if (intensity > 0.45) {
        for (let s = 0; s < 16; s += 4) {
          notes.push({
            id: createNoteId('drm'),
            pitch: 42,
            startStep: barStart + s + 2,
            durationSteps: 1,
            velocity: 0.48,
          });
        }
      }

      if (isFillBar) {
        const fillPitches = randChoice([
          [45, 45, 50, 45],
          [50, 50, 45, 45],
          [45, 50, 45, 49],
        ]);
        [12, 13, 14, 15].forEach((s, idx) => {
          notes.push({
            id: createNoteId('drm'),
            pitch: fillPitches[idx],
            startStep: barStart + s,
            durationSteps: 1,
            velocity: 0.58 + idx * 0.1,
          });
        });
      }
    } else {
      const kickSteps = intensity > 0.65 ? chosenModKick : [0, 8, 10];
      for (const s of kickSteps) {
        notes.push({
          id: createNoteId('drm'),
          pitch: 36,
          startStep: barStart + s,
          durationSteps: 2,
          velocity: s === 0 ? 0.92 : 0.8,
        });
      }

      for (const s of [4, 12]) {
        notes.push({
          id: createNoteId('drm'),
          pitch: 38,
          startStep: barStart + s,
          durationSteps: 2,
          velocity: 0.85,
        });
        if (intensity > 0.72 && s === 12) {
          notes.push({
            id: createNoteId('drm'),
            pitch: 39,
            startStep: barStart + s,
            durationSteps: 2,
            velocity: 0.7,
          });
        }
      }

      const hatStepSize = intensity > 0.6 ? 2 : 4;
      for (let s = 0; s < 16; s += hatStepSize) {
        if (isFillBar && s >= 12) continue;
        notes.push({
          id: createNoteId('drm'),
          pitch: s === 14 && intensity > 0.5 ? 46 : 42,
          startStep: barStart + s,
          durationSteps: 1,
          velocity: s % 4 === 0 ? 0.68 : 0.5,
        });
      }

      if (isFillBar) {
        const snareTomFill = randChoice([
          [38, 38, 45, 45],
          [38, 45, 38, 49],
          [45, 38, 38, 45],
        ]);
        [12, 13, 14, 15].forEach((s, idx) => {
          notes.push({
            id: createNoteId('drm'),
            pitch: snareTomFill[idx],
            startStep: barStart + s,
            durationSteps: 1,
            velocity: 0.65 + idx * 0.08,
          });
        });
      }
    }
  }

  return notes;
}

/**
 * Generates notes for ANY track role (up to 10 tracks).
 */
export function generateNotesForRole(
  project: ProjectState,
  role: TrackRole,
  melodyNotes: NoteEvent[],
  trackIndex = 0
): NoteEvent[] {
  const { chordNotes, bassNotes } = calculateChordsAndBassTracks(project);
  switch (role) {
    case 'melody':
      return melodyNotes;
    case 'counter':
      return calculateCounterMelodyTrack(project, melodyNotes, trackIndex);
    case 'chords':
      return chordNotes;
    case 'arpeggio':
      return calculateArpeggioTrack(project, trackIndex);
    case 'pad':
      return calculatePadTrack(project);
    case 'accent':
      return calculateAccentTrack(project);
    case 'bass':
      return bassNotes;
    case 'rhythm':
      return calculateRhythmTrack(project);
    default:
      return chordNotes;
  }
}

/**
 * Generates or completes all tracks (up to 10 tracks) in the project coherently.
 */
export function generateFullArrangement(
  project: ProjectState,
  preserveExistingMelody = false
): ProjectState {
  const chordTimeline = preserveExistingMelody
    ? inferChordsFromMelody(project)
    : buildChordTimeline(project.rootNote, project.progressionId, project.bars);

  const updatedProject: ProjectState = {
    ...project,
    chordTimeline,
  };

  const melodyNotes = calculateMelodyTrack(updatedProject, preserveExistingMelody);

  const nextTracks = updatedProject.tracks.map((t, idx) => {
    const notes =
      t.role === 'melody'
        ? melodyNotes
        : generateNotesForRole(updatedProject, t.role, melodyNotes, idx);
    return {
      ...t,
      notes,
    };
  });

  return {
    ...updatedProject,
    tracks: nextTracks,
  };
}

/**
 * Deep Creative Randomization ("🎲 深度随机灵感重构"):
 * Randomly picks a fresh harmonic progression compatible with the current scale,
 * generates a new Leitmotif or randomized contour, varies chord style, and recomposes all tracks.
 */
export function randomizeCreativeArrangement(project: ProjectState): ProjectState {
  const compatibleProgs = CHORD_PROGRESSIONS.filter((p) =>
    p.recommendedScales.includes(project.scale)
  );
  const chosenProg =
    compatibleProgs.length > 0
      ? randChoice(compatibleProgs)
      : randChoice(CHORD_PROGRESSIONS);

  const chordStyles: Array<'sustained' | 'arpeggio' | 'rhythmic'> = [
    'arpeggio',
    'sustained',
    'rhythmic',
  ];
  const randomMotif = generateRandomMotifSeed(2);

  const nextBase: ProjectState = {
    ...project,
    progressionId: chosenProg.id,
    activeMotif: randomMotif,
    algorithmParams: {
      ...project.algorithmParams,
      chordStyle: randChoice(chordStyles),
      melodyDensity: Number((0.45 + randFloat() * 0.4).toFixed(2)),
      pitchSmoothness: Number((0.45 + randFloat() * 0.42).toFixed(2)),
      rhythmIntensity: Number((0.45 + randFloat() * 0.42).toFixed(2)),
      randomness: Number((0.68 + randFloat() * 0.28).toFixed(2)),
      ornamentDensity: Number((0.52 + randFloat() * 0.38).toFixed(2)),
    },
    chordTimeline: buildChordTimeline(project.rootNote, chosenProg.id, project.bars),
  };

  return generateFullArrangement(nextBase, false);
}

/**
 * Creates a complete initial ProjectState from a StylePreset.
 */
export function createProjectFromStylePreset(
  preset: StylePreset = STYLE_PRESETS[0],
  bars = 8
): ProjectState {
  const chordTimeline = buildChordTimeline(preset.rootNote, preset.progressionId, bars);

  const roles: Array<{
    id: string;
    name: string;
    role: 'melody' | 'counter' | 'chords' | 'bass' | 'rhythm';
    vol: number;
    color: string;
  }> = [
    { id: 'track_1', name: '主旋律轨道 (Melody)', role: 'melody', vol: 0.9, color: '#F59E0B' },
    { id: 'track_2', name: '副歌/对位轨道 (Counter)', role: 'counter', vol: 0.74, color: '#38BDF8' },
    { id: 'track_3', name: '和弦织体轨道 (Chords)', role: 'chords', vol: 0.76, color: '#10B981' },
    { id: 'track_4', name: '低音根音轨道 (Bass)', role: 'bass', vol: 0.82, color: '#A78BFA' },
    { id: 'track_5', name: '打击乐节奏轨道 (Rhythm)', role: 'rhythm', vol: 0.8, color: '#F43F5E' },
  ];

  const initialTracks: Track[] = roles.map((r) => {
    const inst = preset.trackInstruments[r.role];
    const prof = getDefaultAcousticProfile(inst);
    return {
      id: r.id,
      name: r.name,
      role: r.role,
      instrument: inst,
      volume: r.vol,
      fidelity: prof.fidelity,
      reverbSend: prof.reverbSend,
      muted: false,
      solo: false,
      color: r.color,
      notes: [],
    };
  });

  const baseProject: ProjectState = {
    title: preset.name.split(' · ')[1] || preset.name,
    bpm: preset.bpm,
    bars,
    rootNote: preset.rootNote,
    scale: preset.scale,
    progressionId: preset.progressionId,
    styleId: preset.id,
    masterFidelity: 0.95,
    masterReverb: 0.48,
    hallType: 'golden_hall',
    activeMotif: BUILT_IN_MOTIF_SEEDS[0],
    algorithmParams: {
      ...preset.algorithmParams,
      randomness: 0.72,
      ornamentDensity: 0.62,
    },
    chordTimeline,
    tracks: initialTracks,
  };

  return generateFullArrangement(baseProject, false);
}

/**
 * Creates a complete multi-track ProjectState (6 to 10 tracks, 8 or 16 bars) from a ScenePreset!
 */
export function createProjectFromScenePreset(
  scene: ScenePreset,
  overrideBars?: number
): ProjectState {
  const targetBars = overrideBars || scene.bars;
  const chordTimeline = buildChordTimeline(scene.rootNote, scene.progressionId, targetBars);

  const tracks: Track[] = scene.tracksSpec.slice(0, 10).map((spec, idx) => {
    const prof = getDefaultAcousticProfile(spec.instrument);
    return {
      id: `scene_track_${idx + 1}_${Date.now()}`,
      name: spec.name,
      role: spec.role,
      instrument: spec.instrument,
      volume: spec.volume,
      fidelity: spec.fidelity ?? prof.fidelity,
      reverbSend: spec.reverbSend ?? prof.reverbSend,
      muted: false,
      solo: false,
      color: spec.color,
      notes: [],
    };
  });

  const baseProject: ProjectState = {
    title: scene.name.split(' · ')[0],
    bpm: scene.bpm,
    bars: targetBars,
    rootNote: scene.rootNote,
    scale: scene.scale,
    progressionId: scene.progressionId,
    styleId: scene.id,
    sceneId: scene.id,
    masterFidelity: 0.95,
    masterReverb: 0.5,
    hallType:
      scene.category === 'guofeng'
        ? 'oriental_courtyard'
        : scene.category === 'film'
        ? 'golden_hall'
        : 'cathedral',
    activeMotif: BUILT_IN_MOTIF_SEEDS[0],
    algorithmParams: {
      ...scene.algorithmParams,
      randomness: 0.72,
      ornamentDensity: 0.65,
    },
    chordTimeline,
    tracks,
  };

  return generateFullArrangement(baseProject, false);
}

/**
 * Smartly creates a new Track (up to 10 tracks) with a complementary Role and Instrument.
 */
export function createAdditionalTrack(project: ProjectState): Track | null {
  if (project.tracks.length >= 10) return null;

  const existingRoles = project.tracks.map((t) => t.role);
  const existingInsts = project.tracks.map((t) => t.instrument);

  const preferredRoleOrder: TrackRole[] = [
    'arpeggio',
    'pad',
    'accent',
    'counter',
    'chords',
    'melody',
    'bass',
    'rhythm',
  ];
  let chosenRole: TrackRole = 'arpeggio';
  for (const r of preferredRoleOrder) {
    if (!existingRoles.includes(r)) {
      chosenRole = r;
      break;
    }
  }

  const roleInstrumentPool: Record<TrackRole, InstrumentId[]> = {
    arpeggio: ['orchestral_harp', 'guzheng', 'harpsichord', 'classical_guitar', 'chiptune_8bit'],
    pad: ['grand_choir', 'epic_strings', 'soft_humming', 'synth_pad', 'pipe_organ'],
    accent: ['ancient_bianzhong', 'church_bells', 'flute_orchestral', 'pipa', 'female_soprano'],
    counter: ['string_concerto', 'dizi', 'violin_section', 'soft_humming', 'male_tenor'],
    chords: ['grand_piano', 'epic_strings', 'pipe_organ', 'classical_guitar', 'synth_pad'],
    melody: ['dizi', 'string_concerto', 'female_soprano', 'epic_brass', 'electric_guitar_lead'],
    bass: ['cello_solo', 'epic_brass', 'synth_bass', 'male_bass', 'french_horn'],
    rhythm: ['percussion_kit'],
  };

  const candidates = roleInstrumentPool[chosenRole] || ['grand_piano'];
  const chosenInst =
    candidates.find((id) => !existingInsts.includes(id)) || candidates[0];

  const roleDef =
    TRACK_ROLE_DEFINITIONS.find((d) => d.role === chosenRole) ||
    TRACK_ROLE_DEFINITIONS[0];

  const melodyNotes =
    project.tracks.find((t) => t.role === 'melody')?.notes || [];
  const newTrackIndex = project.tracks.length;
  const generatedNotes = generateNotesForRole(
    project,
    chosenRole,
    melodyNotes,
    newTrackIndex
  );

  const palette = [
    '#2DD4BF',
    '#818CF8',
    '#FBBF24',
    '#EC4899',
    '#34D399',
    '#60A5FA',
    '#F97316',
  ];

  const prof = getDefaultAcousticProfile(chosenInst);

  return {
    id: `track_custom_${Date.now()}_${newTrackIndex + 1}`,
    name: `第${newTrackIndex + 1}轨 · ${roleDef.shortLabel}`,
    role: chosenRole,
    instrument: chosenInst,
    volume: 0.76,
    fidelity: prof.fidelity,
    reverbSend: prof.reverbSend,
    muted: false,
    solo: false,
    color: palette[(newTrackIndex - 5 + palette.length) % palette.length],
    notes: generatedNotes,
  };
}

/**
 * Merges two tracks (`trackIdA` as primary target, `trackIdB` as secondary source) into a single track,
 * automatically resolving same-pitch collisions, overlapping note tails, and voice-leading clashes.
 */
export function mergeTwoTracksAndResolveOverlaps(
  project: ProjectState,
  trackIdA: string,
  trackIdB: string
): {
  updatedProject: ProjectState;
  mergedTrack: Track;
  stats: {
    beforeCount: number;
    afterCount: number;
    overlapsResolved: number;
  };
} | null {
  if (trackIdA === trackIdB) return null;
  const trackA = project.tracks.find((t) => t.id === trackIdA);
  const trackB = project.tracks.find((t) => t.id === trackIdB);
  if (!trackA || !trackB) return null;

  const beforeCount = trackA.notes.length + trackB.notes.length;
  let overlapsResolved = 0;

  // Tag notes with priority (Track A is primary)
  const tagged = [
    ...trackA.notes.map((n) => ({ ...n, isPrimary: true })),
    ...trackB.notes.map((n) => ({ ...n, isPrimary: false })),
  ].sort((a, b) => {
    if (a.startStep !== b.startStep) return a.startStep - b.startStep;
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return b.velocity - a.velocity;
  });

  // Pass 1: Resolve Same-Pitch Overlaps (identical startStep deduplication + tail truncation)
  const byPitch = new Map<number, typeof tagged>();
  for (const n of tagged) {
    const list = byPitch.get(n.pitch) || [];
    list.push(n);
    byPitch.set(n.pitch, list);
  }

  const pass1Notes: typeof tagged = [];
  for (const [, pitchNotes] of byPitch.entries()) {
    pitchNotes.sort((a, b) => {
      if (a.startStep !== b.startStep) return a.startStep - b.startStep;
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return b.durationSteps - a.durationSteps;
    });

    const cleanedPitchNotes: typeof tagged = [];
    for (const curr of pitchNotes) {
      if (cleanedPitchNotes.length === 0) {
        cleanedPitchNotes.push({ ...curr });
        continue;
      }
      const prev = cleanedPitchNotes[cleanedPitchNotes.length - 1];

      // Exact same startStep and same pitch -> merge into one stronger note
      if (prev.startStep === curr.startStep) {
        prev.durationSteps = Math.max(prev.durationSteps, curr.durationSteps);
        prev.velocity = Math.min(0.98, Math.max(prev.velocity, curr.velocity));
        overlapsResolved++;
        continue;
      }

      // Previous note on the same pitch extends past current note's startStep -> trim previous tail
      if (prev.startStep + prev.durationSteps > curr.startStep) {
        const trimmedDur = Math.max(1, curr.startStep - prev.startStep);
        prev.durationSteps = trimmedDur;
        overlapsResolved++;
      }

      cleanedPitchNotes.push({ ...curr });
    }

    pass1Notes.push(...cleanedPitchNotes);
  }

  pass1Notes.sort((a, b) => {
    if (a.startStep !== b.startStep) return a.startStep - b.startStep;
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return b.pitch - a.pitch;
  });

  // Pass 2: Role-Aware Cross-Pitch Overlap Resolution
  const isMonophonicRole = trackA.role === 'melody' || trackA.role === 'bass';
  const isRhythmRole =
    trackA.role === 'rhythm' || trackA.instrument === 'percussion_kit';
  const finalNotes: NoteEvent[] = [];

  if (isMonophonicRole && !isRhythmRole) {
    // Monophonic smart hocket & legato tail trimming
    let i = 0;
    while (i < pass1Notes.length) {
      const primary = { ...pass1Notes[i] };
      let j = i + 1;
      const sameStepNotes: typeof pass1Notes = [];
      while (j < pass1Notes.length && pass1Notes[j].startStep === primary.startStep) {
        sameStepNotes.push(pass1Notes[j]);
        j++;
      }

      if (sameStepNotes.length > 0) {
        overlapsResolved += sameStepNotes.length;
        const nextNoteStep =
          j < pass1Notes.length ? pass1Notes[j].startStep : project.bars * 16;
        const availableSpan = Math.min(
          primary.durationSteps,
          nextNoteStep - primary.startStep
        );
        // If primary note is >= 2 steps and there's room before the next event, turn the secondary note into an interlocking passing/echo note!
        if (availableSpan >= 2) {
          const halfSpan = Math.max(1, Math.floor(availableSpan / 2));
          const secondary = sameStepNotes[0];
          finalNotes.push({
            id: createNoteId('mrg'),
            pitch: primary.pitch,
            startStep: primary.startStep,
            durationSteps: halfSpan,
            velocity: primary.velocity,
          });
          finalNotes.push({
            id: createNoteId('mrg_echo'),
            pitch: secondary.pitch,
            startStep: primary.startStep + halfSpan,
            durationSteps: availableSpan - halfSpan,
            velocity: Math.max(0.5, secondary.velocity * 0.88),
          });
        } else {
          finalNotes.push({
            id: createNoteId('mrg'),
            pitch: primary.pitch,
            startStep: primary.startStep,
            durationSteps: Math.max(1, availableSpan),
            velocity: primary.velocity,
          });
        }
      } else {
        finalNotes.push({
          id: createNoteId('mrg'),
          pitch: primary.pitch,
          startStep: primary.startStep,
          durationSteps: primary.durationSteps,
          velocity: primary.velocity,
        });
      }
      i = j;
    }

    // Trim overlapping monophonic tails between consecutive notes
    finalNotes.sort((a, b) => a.startStep - b.startStep);
    for (let k = 0; k < finalNotes.length - 1; k++) {
      const curr = finalNotes[k];
      const next = finalNotes[k + 1];
      if (curr.startStep + curr.durationSteps > next.startStep) {
        curr.durationSteps = Math.max(1, next.startStep - curr.startStep);
        overlapsResolved++;
      }
    }
  } else {
    // Polyphonic / Harmony / Counterpoint / Rhythm smart voice-leading filter
    const stepGroups = new Map<number, typeof pass1Notes>();
    for (const n of pass1Notes) {
      const grp = stepGroups.get(n.startStep) || [];
      grp.push(n);
      stepGroups.set(n.startStep, grp);
    }

    for (const [, grp] of stepGroups.entries()) {
      const accepted: typeof pass1Notes = [];
      for (const candidate of grp) {
        if (!isRhythmRole) {
          // Avoid muddy minor-2nd / major-2nd simultaneous clusters (<= 2 semitones)
          const hasCloseCluster = accepted.some(
            (existing) => Math.abs(existing.pitch - candidate.pitch) <= 2
          );
          if (hasCloseCluster) {
            overlapsResolved++;
            continue;
          }
        }
        // Cap simultaneous polyphonic voices at 4 per step for clean acoustic clarity
        if (!isRhythmRole && accepted.length >= 4) {
          overlapsResolved++;
          continue;
        }
        accepted.push(candidate);
      }

      for (const item of accepted) {
        finalNotes.push({
          id: createNoteId('mrg'),
          pitch: item.pitch,
          startStep: item.startStep,
          durationSteps: item.durationSteps,
          velocity: item.velocity,
        });
      }
    }
  }

  finalNotes.sort((a, b) => a.startStep - b.startStep || b.pitch - a.pitch);

  const shortA = trackA.name.split(' ')[0];
  const shortB = trackB.name.split(' ')[0];
  const mergedTrack: Track = {
    ...trackA,
    name: `${shortA}+${shortB}`,
    volume: Math.min(0.95, Math.max(trackA.volume, trackB.volume)),
    notes: finalNotes,
  };

  const nextTracks = project.tracks
    .filter((t) => t.id !== trackIdB)
    .map((t) => (t.id === trackIdA ? mergedTrack : t));

  return {
    updatedProject: {
      ...project,
      tracks: nextTracks,
    },
    mergedTrack,
    stats: {
      beforeCount,
      afterCount: finalNotes.length,
      overlapsResolved,
    },
  };
}

