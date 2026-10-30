export type InstrumentCategory =
  | 'chinese'
  | 'orchestral'
  | 'vocal'
  | 'keyboard'
  | 'modern'
  | 'percussion';

export type InstrumentId =
  // 键盘与古钢琴/钟声 (Keyboards, Baroque & Bells)
  | 'grand_piano'
  | 'pipe_organ'
  | 'harpsichord'
  | 'church_bells'
  // 中国传统与上古礼乐 (Chinese Traditional & Ancient)
  | 'guzheng'
  | 'pipa'
  | 'dizi'
  | 'ancient_bianzhong'
  // 管弦与史诗交响乐器 (Orchestral & Epic Cinema)
  | 'string_concerto'
  | 'epic_strings'
  | 'epic_brass'
  | 'violin_section'
  | 'cello_solo'
  | 'french_horn'
  | 'flute_orchestral'
  | 'orchestral_harp'
  // 男女声独唱、合唱、轻声吟唱 (Vocals)
  | 'female_soprano'
  | 'female_mezzo'
  | 'female_alto'
  | 'male_tenor'
  | 'male_baritone'
  | 'male_bass'
  | 'grand_choir'
  | 'soft_humming'
  // 吉他、电声、合成器与8-bit (Guitars, Synth & 8-bit)
  | 'classical_guitar'
  | 'electric_guitar_lead'
  | 'electric_guitar_clean'
  | 'chiptune_8bit'
  | 'synth_lead'
  | 'synth_pad'
  | 'synth_bass'
  // 打击乐采样 (Percussion)
  | 'percussion_kit';

export type AcousticHallType =
  | 'golden_hall'
  | 'cathedral'
  | 'oriental_courtyard'
  | 'studio_intimate';

export type MotifDevelopmentMode =
  | 'classic_variation'
  | 'sequence_ascend'
  | 'inversion_mirror'
  | 'call_response';

export interface MotifNote {
  stepOffset: number; // 0 to 31 (up to 2 bars of 16th-note steps)
  durationSteps: number; // 1 to 16
  scaleDegreeOffset: number; // Offset in scale steps from root (e.g. -2..+9)
  velocity: number; // 0.3 to 1.0
}

export interface MotifSeed {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  bars: 1 | 2;
  developmentMode: MotifDevelopmentMode;
  ornamentDensity: number; // 0.0 to 1.0 (自动填充经过音、倚音、句尾华彩细节)
  notes: MotifNote[];
}

export interface InstrumentDefinition {
  id: InstrumentId;
  name: string;
  subtitle: string;
  category: InstrumentCategory;
  categoryLabel: string;
  gmProgram: number; // General MIDI 0-127
  recommendedRange: [number, number]; // MIDI note numbers
  defaultOctave: number;
  acousticDescription: string;
  beginnerTip: string;
}

export type ScaleType =
  | 'pentatonic_major'
  | 'pentatonic_minor'
  | 'major'
  | 'minor'
  | 'dorian'
  | 'harmonic_minor';

export interface ScaleDefinition {
  id: ScaleType;
  name: string;
  subtitle: string;
  intervals: number[]; // Semitones from root (0..11)
  jianpuLabels: Record<number, string>; // Semitone -> 简谱/古风音阶名
  moodDescription: string;
}

export type TrackRole =
  | 'melody'
  | 'counter'
  | 'chords'
  | 'arpeggio'
  | 'pad'
  | 'bass'
  | 'accent'
  | 'rhythm';

export interface NoteEvent {
  id: string;
  pitch: number; // MIDI note (36 to 84); for percussion_kit, maps to specific drum hits
  startStep: number; // 0 to (bars * 16 - 1), each step is a 16th note
  durationSteps: number; // 1 to 16
  velocity: number; // 0.1 to 1.0
}

export interface Track {
  id: string;
  name: string;
  role: TrackRole;
  instrument: InstrumentId;
  volume: number; // 0 to 1
  fidelity?: number; // 0.2 to 1.0 (音色物理建模保真度与泛音细腻度)
  reverbSend?: number; // 0.0 to 1.0 (单轨空间混响发送量)
  muted: boolean;
  solo: boolean;
  color: string; // Hex color for visual distinction
  notes: NoteEvent[];
}

export interface ChordSlot {
  barIndex: number; // 0 to bars - 1
  degree: number; // Scale degree index (0-based) or semitone offset
  rootSemitone: number; // Offset from project rootNote
  chordType: 'major' | 'minor' | 'sus4' | 'maj7' | 'min7' | 'dom7' | 'power5';
  label: string; // e.g. "C", "Am", "Fmaj7"
  roman: string; // e.g. "I", "vi", "IV", "V"
  functionHint: string; // Beginner explanation: "主和弦·稳定起点", etc.
}

export interface ChordProgressionPreset {
  id: string;
  name: string;
  tag: string;
  description: string;
  recommendedScales: ScaleType[];
  bars4: Array<{
    rootOffset: number;
    chordType: ChordSlot['chordType'];
    roman: string;
    functionHint: string;
  }>;
}

export interface StylePreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  bpm: number;
  rootNote: number; // 0=C, 2=D, etc.
  scale: ScaleType;
  progressionId: string;
  trackInstruments: Record<'melody' | 'counter' | 'chords' | 'bass' | 'rhythm', InstrumentId>;
  algorithmParams: AlgorithmParams;
}

export interface SceneTrackSpec {
  name: string;
  role: TrackRole;
  instrument: InstrumentId;
  volume: number;
  fidelity?: number;
  reverbSend?: number;
  color: string;
}

export interface ScenePreset {
  id: string;
  name: string;
  category: 'film' | 'game' | 'guofeng' | 'healing';
  categoryLabel: string;
  keywords: string[];
  moodTags: string[];
  visualImagery: string;
  description: string;
  bpm: number;
  bars: number; // 8 or 16 bars
  rootNote: number;
  scale: ScaleType;
  progressionId: string;
  tracksSpec: SceneTrackSpec[]; // 6 to 10 tracks pre-configured for the scene!
  algorithmParams: AlgorithmParams;
}

export interface ClassicExcerpt {
  id: string;
  title: string;
  composerOrOrigin: string;
  tag: string;
  description: string;
  bpm: number;
  bars: number;
  rootNote: number;
  scale: ScaleType;
  progressionId: string;
  trackInstruments: Record<'melody' | 'counter' | 'chords' | 'bass' | 'rhythm', InstrumentId>;
  extraTracks?: SceneTrackSpec[];
  chordTimeline: ChordSlot[];
  melodyNotes: Array<{ pitch: number; startStep: number; durationSteps: number; velocity?: number }>;
  counterNotes?: Array<{ pitch: number; startStep: number; durationSteps: number; velocity?: number }>;
  algorithmParams: AlgorithmParams;
}

export interface AlgorithmParams {
  melodyDensity: number; // 0.2 (sparse/lyrical) to 0.9 (active/virtuosic)
  pitchSmoothness: number; // 0.2 (wide leaps) to 0.95 (stepwise smooth)
  chordStyle: 'sustained' | 'arpeggio' | 'rhythmic';
  rhythmIntensity: number; // 0.2 (minimal) to 0.95 (driving + fills)
  randomness?: number; // 0.1 to 1.0 (创意随机发散度：控制旋律轮廓、节奏切分、声部转位与加花的随机性)
  ornamentDensity?: number; // 0.0 to 1.0 (细节填充密度：控制经过音、倚音、颤音、句尾华彩装饰)
}

export interface ProjectState {
  title: string;
  bpm: number;
  bars: number; // 4, 8, 12, or 16 bars (up to 256 16th-note steps)
  rootNote: number; // Pitch class 0=C, 1=C#, 2=D, ..., 11=B
  scale: ScaleType;
  progressionId: string;
  styleId: string;
  sceneId?: string;
  masterFidelity?: number; // 0.2 to 1.0 (全局母带声学保真度)
  masterReverb?: number; // 0.0 to 1.0 (全局厅堂混响深度)
  hallType?: AcousticHallType; // 声学空间模型
  activeMotif?: MotifSeed; // 当前使用的主导动机与主题片段
  algorithmParams: AlgorithmParams;
  chordTimeline: ChordSlot[];
  tracks: Track[]; // Up to 10 tracks
}

export interface PercussionPadDefinition {
  pitch: number;
  name: string;
  shortName: string;
  category: 'modern' | 'traditional';
  description: string;
}
