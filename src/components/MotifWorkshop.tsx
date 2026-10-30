import React, { useState } from 'react';
import {
  MotifDevelopmentMode,
  MotifNote,
  MotifSeed,
  ProjectState,
} from '../types/music';
import {
  BUILT_IN_MOTIF_SEEDS,
  extractMotifFromMelodyTrack,
  findClosestScaleIndex,
  generateRandomMotifSeed,
  getScalePitches,
} from '../algorithms/composer';
import { getScaleById, midiToNoteName } from '../data/instruments';
import { soundEngine } from '../audio/soundEngine';
import {
  DEV_MODE_EN_MAP,
  Language,
  MOTIF_EN_MAP,
  tr,
} from '../i18n/translations';
import {
  Sparkles,
  Play,
  Dices,
  DownloadCloud,
  Trash2,
  Wand2,
  Music,
} from 'lucide-react';

interface MotifWorkshopProps {
  project: ProjectState;
  lang: Language;
  onApplyMotifToProject: (motif: MotifSeed) => void;
}

const DEVELOPMENT_MODES: Array<{
  id: MotifDevelopmentMode;
  label: string;
  desc: string;
}> = [
  {
    id: 'classic_variation',
    label: '经典起承转合',
    desc: 'A段原样呈示 → B段随和弦移位 → C段高潮升华 → D段主音收束',
  },
  {
    id: 'sequence_ascend',
    label: '阶梯模进攀升',
    desc: '动机在后续乐句中沿音阶逐级向上模进，营造强烈递进推动力',
  },
  {
    id: 'inversion_mirror',
    label: '镜像倒影复调',
    desc: '双数乐句将动机音程上下镜像翻转，展现巴洛克古典复调对称美',
  },
  {
    id: 'call_response',
    label: '问答对句呼应',
    desc: '单数乐句陈述主导动机，双数乐句自动生成华彩变奏对答乐句',
  },
];

// Scale degree offsets shown on the Motif Sketchpad (from high to low)
const SKETCH_DEGREE_ROWS = [7, 6, 5, 4, 3, 2, 1, 0, -1, -2];

export const MotifWorkshop: React.FC<MotifWorkshopProps> = ({
  project,
  lang,
  onApplyMotifToProject,
}) => {
  const [motif, setMotif] = useState<MotifSeed>(
    () => project.activeMotif || BUILT_IN_MOTIF_SEEDS[0]
  );
  const [brushDuration, setBrushDuration] = useState<number>(4);

  const scale = getScaleById(project.scale);
  const scalePitches = getScalePitches(project.rootNote, project.scale, 36, 84);
  const rootPc = project.rootNote % 12;
  const tonicCenterMidi = 60 + rootPc + (rootPc > 7 ? 0 : 12);
  const rootScaleIdx = findClosestScaleIndex(scalePitches, tonicCenterMidi);

  const melodyTrack =
    project.tracks.find((t) => t.role === 'melody') || project.tracks[0];
  const totalSteps = motif.bars * 16;

  const degreeOffsetToMidi = (degOffset: number): number => {
    const idx = Math.max(
      0,
      Math.min(scalePitches.length - 1, rootScaleIdx + degOffset)
    );
    return scalePitches[idx] || 60;
  };

  // Audition a single motif note
  const auditionDegree = (degOffset: number, durSteps = 4) => {
    soundEngine.init();
    const pitch = degreeOffsetToMidi(degOffset);
    const stepSec = 60 / project.bpm / 4;
    soundEngine.triggerNote(
      melodyTrack?.instrument || 'grand_piano',
      pitch,
      durSteps * stepSec,
      0.88,
      melodyTrack?.volume ?? 0.9,
      0,
      melodyTrack?.fidelity ?? 0.95,
      melodyTrack?.reverbSend ?? 0.5
    );
  };

  // Audition the entire 1-2 bar Motif Seed
  const handleAuditionFullMotif = () => {
    soundEngine.init();
    const stepSec = 60 / project.bpm / 4;
    for (const mn of motif.notes) {
      const pitch = degreeOffsetToMidi(mn.scaleDegreeOffset);
      soundEngine.triggerNote(
        melodyTrack?.instrument || 'grand_piano',
        pitch,
        mn.durationSteps * stepSec,
        mn.velocity,
        melodyTrack?.volume ?? 0.9,
        mn.stepOffset * stepSec,
        melodyTrack?.fidelity ?? 0.95,
        melodyTrack?.reverbSend ?? 0.5
      );
    }
  };

  // Toggle or add a note on the Motif Sketchpad
  const handleCellClick = (degOffset: number, stepIndex: number) => {
    const existingIdx = motif.notes.findIndex(
      (n) =>
        n.scaleDegreeOffset === degOffset &&
        stepIndex >= n.stepOffset &&
        stepIndex < n.stepOffset + n.durationSteps
    );

    if (existingIdx >= 0) {
      const nextNotes = motif.notes.filter((_, i) => i !== existingIdx);
      setMotif({ ...motif, notes: nextNotes });
      return;
    }

    const filtered = motif.notes.filter((n) => n.stepOffset !== stepIndex);
    const dur = Math.min(brushDuration, totalSteps - stepIndex);
    const newNote: MotifNote = {
      stepOffset: stepIndex,
      durationSteps: dur,
      scaleDegreeOffset: degOffset,
      velocity: stepIndex % 4 === 0 ? 0.9 : 0.8,
    };

    auditionDegree(degOffset, dur);
    setMotif({
      ...motif,
      notes: [...filtered, newNote].sort((a, b) => a.stepOffset - b.stepOffset),
    });
  };

  // Randomize a fresh motif
  const handleRandomizeMotif = () => {
    const randMotif = generateRandomMotifSeed(motif.bars);
    const updated: MotifSeed = {
      ...randMotif,
      developmentMode: motif.developmentMode,
      ornamentDensity: motif.ornamentDensity,
    };
    setMotif(updated);
    soundEngine.init();
    const stepSec = 60 / project.bpm / 4;
    updated.notes.forEach((mn) => {
      soundEngine.triggerNote(
        melodyTrack?.instrument || 'grand_piano',
        degreeOffsetToMidi(mn.scaleDegreeOffset),
        mn.durationSteps * stepSec,
        mn.velocity,
        melodyTrack?.volume ?? 0.9,
        mn.stepOffset * stepSec,
        melodyTrack?.fidelity ?? 0.95,
        melodyTrack?.reverbSend ?? 0.5
      );
    });
  };

  // Extract motif from Bar 1-2 of current Melody Track
  const handleExtractFromMelody = () => {
    const extracted = extractMotifFromMelodyTrack(project);
    setMotif(extracted);
  };

  const motifDisplayName =
    lang === 'en'
      ? MOTIF_EN_MAP[motif.id]?.name || motif.name
      : motif.name;

  return (
    <div className="bg-[#131A26] border border-[#1E293B] rounded-xl overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-[#0E1420] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
            <Wand2 className="w-4 h-4" />
            <span>
              {tr(
                lang,
                '主导动机与主题片段创作工坊 (Leitmotif & Auto-Fill Engine)',
                'Leitmotif & Theme Workshop (Auto-Fill Details Engine)'
              )}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {tr(
              lang,
              '先创作 1–2 小节核心主题动机，再由算法自动发展并填充经过音、波音与伴奏声部细节',
              'Craft a 1–2 bar core motif, then auto-develop across all bars with passing tones & ornaments'
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAuditionFullMotif}
            className="px-3 py-1.5 rounded-lg bg-[#0B0F17] hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>
              {tr(
                lang,
                `试听当前动机 (${motif.bars}小节)`,
                `Preview Motif (${motif.bars} Bars)`
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRandomizeMotif}
            className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Dices className="w-3.5 h-3.5" />
            <span>{tr(lang, '随机生成新动机', 'Randomize Motif')}</span>
          </button>

          <button
            type="button"
            onClick={handleExtractFromMelody}
            className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={tr(
              lang,
              '将主旋律轨道前2小节的音符提取为主导动机',
              'Extract notes from Bar 1-2 of Melody track as Leitmotif'
            )}
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>{tr(lang, '从主旋律提取动机', 'Extract from Melody')}</span>
          </button>

          <button
            type="button"
            onClick={() => onApplyMotifToProject(motif)}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {tr(
                lang,
                `以此动机展开并自动填充全曲 (${project.bars}小节)`,
                `Develop Motif & Auto-Fill Song (${project.bars} Bars)`
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Body Grid: Left Controls & Seeds + Right Interactive 2-Bar Motif Sketchpad */}
      <div className="p-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left 5 cols: Built-in Classic Motif Seeds + Development Mode + Detail Ornament Density */}
        <div className="xl:col-span-5 flex flex-col justify-between gap-3.5">
          {/* 8 Built-in Leitmotif Seeds */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {tr(
                    lang,
                    '选择经典主导动机种子 (点击载入并试听)：',
                    'Built-in Leitmotif Seeds (Click to load & preview):'
                  )}
                </span>
              </span>
              <span className="text-slate-400 font-mono truncate max-w-[160px]">
                {motifDisplayName}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-1.5">
              {BUILT_IN_MOTIF_SEEDS.map((seed) => {
                const isSelected = motif.id === seed.id;
                const seedEn = MOTIF_EN_MAP[seed.id];
                const seedTitle =
                  lang === 'en' && seedEn ? seedEn.name : seed.name;
                const seedSub =
                  lang === 'en' && seedEn
                    ? seedEn.subtitle
                    : seed.subtitle.split(' · ')[0];
                return (
                  <button
                    key={seed.id}
                    type="button"
                    onClick={() => {
                      setMotif(seed);
                      soundEngine.init();
                      const stepSec = 60 / project.bpm / 4;
                      seed.notes.slice(0, 5).forEach((mn) => {
                        soundEngine.triggerNote(
                          melodyTrack?.instrument || 'grand_piano',
                          degreeOffsetToMidi(mn.scaleDegreeOffset),
                          mn.durationSteps * stepSec,
                          mn.velocity,
                          melodyTrack?.volume ?? 0.9,
                          mn.stepOffset * stepSec * 0.75,
                          melodyTrack?.fidelity ?? 0.95,
                          melodyTrack?.reverbSend ?? 0.5
                        );
                      });
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                        : 'bg-[#0B0F17] text-slate-300 border-[#1E293B] hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{seedTitle}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {seedSub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Development Technique Selector */}
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-slate-200">
              {tr(
                lang,
                `主题发展手法 (决定动机如何延展至 ${project.bars} 小节)：`,
                `Motif Development Technique (Across ${project.bars} Bars):`
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DEVELOPMENT_MODES.map((dm) => {
                const active = motif.developmentMode === dm.id;
                const dmEn = DEV_MODE_EN_MAP[dm.id];
                return (
                  <button
                    key={dm.id}
                    type="button"
                    onClick={() =>
                      setMotif({ ...motif, developmentMode: dm.id })
                    }
                    className={`p-2 rounded-lg text-left border transition-colors cursor-pointer ${
                      active
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50'
                        : 'bg-[#0B0F17] text-slate-300 border-[#1E293B] hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">
                      {lang === 'en' ? dmEn.label : dm.label}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      {lang === 'en' ? dmEn.desc : dm.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail Ornamentation Auto-Fill Density Slider */}
          <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                {tr(
                  lang,
                  '自动填充乐曲细节密度 (经过音 / 倚音波音 / 句尾华彩)',
                  'Auto-Fill Detail Density (Passing Tones / Ornaments / Flourishes)'
                )}
              </span>
              <span className="font-mono font-bold text-amber-400">
                {Math.round(motif.ornamentDensity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(motif.ornamentDensity * 100)}
              onChange={(e) =>
                setMotif({
                  ...motif,
                  ornamentDensity: Number(e.target.value) / 100,
                })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{tr(lang, '0% 纯净骨干音', '0% Pure Skeleton')}</span>
              <span>{tr(lang, '50% 自然经过音连接', '50% Passing Tones')}</span>
              <span>
                {tr(lang, '100% 丰富古典华彩装饰', '100% Rich Ornaments')}
              </span>
            </div>
          </div>
        </div>

        {/* Right 7 cols: Interactive 2-Bar (32-step) Motif Sketchpad */}
        <div className="xl:col-span-7 bg-[#0B0F17] border border-[#1E293B] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                {tr(
                  lang,
                  '主题动机交互画板 (点击格子点亮/取消音符，100% 契合当前调式)',
                  'Interactive Motif Sketchpad (Click cells to toggle in-scale notes)'
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 1 Bar vs 2 Bars Motif Length */}
              <div className="flex items-center bg-[#131A26] p-0.5 rounded-lg border border-[#1E293B]">
                {([1, 2] as const).map((bLen) => (
                  <button
                    key={bLen}
                    type="button"
                    onClick={() =>
                      setMotif({
                        ...motif,
                        bars: bLen,
                        notes: motif.notes.filter((n) => n.stepOffset < bLen * 16),
                      })
                    }
                    className={`px-2 py-0.5 text-[11px] font-mono rounded cursor-pointer ${
                      motif.bars === bLen
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tr(lang, `${bLen}小节动机`, `${bLen} Bar${bLen > 1 ? 's' : ''}`)}
                  </button>
                ))}
              </div>

              {/* Brush Note Duration */}
              <div className="flex items-center gap-1 bg-[#131A26] p-0.5 rounded-lg border border-[#1E293B]">
                {[
                  { steps: 2, zh: '八分', en: '1/8' },
                  { steps: 4, zh: '四分', en: '1/4' },
                  { steps: 6, zh: '附点', en: 'Dot' },
                  { steps: 8, zh: '二分', en: '1/2' },
                ].map((d) => (
                  <button
                    key={d.steps}
                    type="button"
                    onClick={() => setBrushDuration(d.steps)}
                    className={`px-2 py-0.5 text-[11px] rounded cursor-pointer ${
                      brushDuration === d.steps
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tr(lang, d.zh, d.en)}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setMotif({ ...motif, notes: [] })}
                className="p-1.5 rounded-lg bg-[#131A26] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-[#1E293B] transition-colors cursor-pointer"
                title={tr(lang, '清空动机画板', 'Clear Motif Grid')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Step Ruler (1..16 or 1..32) */}
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="flex items-center border-b border-[#1E293B] pb-1 mb-1">
                <div className="w-24 shrink-0 text-[10px] font-mono text-slate-400 px-1.5">
                  {tr(lang, '音阶度数', 'Scale Tone')}
                </div>
                <div
                  className="flex-1 grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: totalSteps }).map((_, sIdx) => (
                    <div
                      key={sIdx}
                      className={`text-center text-[9px] font-mono ${
                        sIdx % 16 === 0
                          ? 'text-amber-400 font-bold'
                          : sIdx % 4 === 0
                          ? 'text-slate-300'
                          : 'text-slate-600'
                      }`}
                    >
                      {sIdx % 4 === 0
                        ? tr(
                            lang,
                            `${Math.floor(sIdx / 4) + 1}拍`,
                            `B${Math.floor(sIdx / 4) + 1}`
                          )
                        : '·'}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pitch Degree Rows */}
              <div className="space-y-1">
                {SKETCH_DEGREE_ROWS.map((degOffset) => {
                  const midi = degreeOffsetToMidi(degOffset);
                  const relSemitone = ((midi % 12) - rootPc + 12) % 12;
                  const jianpu = scale.jianpuLabels[relSemitone] || '';
                  const isTonic = degOffset === 0 || relSemitone === 0;

                  return (
                    <div
                      key={degOffset}
                      className="flex items-center h-6 rounded hover:bg-[#131A26]/70"
                    >
                      {/* Left Key Label */}
                      <button
                        type="button"
                        onClick={() => auditionDegree(degOffset, 4)}
                        className={`w-24 shrink-0 h-full px-1.5 flex items-center justify-between text-[11px] font-mono rounded-l border-r border-[#1E293B] cursor-pointer ${
                          isTonic
                            ? 'bg-amber-500/15 text-amber-300 font-bold'
                            : 'bg-[#0E1420] text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>{midiToNoteName(midi)}</span>
                        <span className="text-[10px] text-amber-400/90">
                          {jianpu.split(' ')[0]}
                        </span>
                      </button>

                      {/* Grid Cells */}
                      <div
                        className="flex-1 h-full grid gap-0.5 pl-0.5"
                        style={{
                          gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))`,
                        }}
                      >
                        {Array.from({ length: totalSteps }).map((_, sIdx) => {
                          const activeNote = motif.notes.find(
                            (n) =>
                              n.scaleDegreeOffset === degOffset &&
                              sIdx >= n.stepOffset &&
                              sIdx < n.stepOffset + n.durationSteps
                          );
                          const isStart = activeNote?.stepOffset === sIdx;

                          return (
                            <div
                              key={sIdx}
                              onClick={() => handleCellClick(degOffset, sIdx)}
                              className={`h-full rounded-sm transition-colors cursor-pointer border ${
                                activeNote
                                  ? isStart
                                    ? 'bg-amber-500 border-amber-300'
                                    : 'bg-amber-500/75 border-amber-400/50'
                                  : sIdx % 16 === 0
                                  ? 'bg-[#161F30] border-[#26354D] hover:bg-amber-500/25'
                                  : sIdx % 4 === 0
                                  ? 'bg-[#111826] border-[#1E293B] hover:bg-amber-500/20'
                                  : 'bg-[#0D131F] border-[#161E2E] hover:bg-amber-500/15'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-[#1E293B]">
            <span>
              {tr(
                lang,
                `提示：当前动机包含 ${motif.notes.length} 个骨干音符 · 点击右上角「以此动机展开并自动填充全曲」即可生成完整 ${project.bars} 小节多轨总谱。`,
                `Tip: Current motif has ${motif.notes.length} core notes · Click "Develop Motif & Auto-Fill Song" to generate all ${project.bars} bars.`
              )}
            </span>
            <span className="font-mono text-emerald-400">
              {lang === 'en'
                ? `Mode: ${DEV_MODE_EN_MAP[motif.developmentMode]?.label}`
                : `发展模式：${
                    DEVELOPMENT_MODES.find((d) => d.id === motif.developmentMode)
                      ?.label
                  }`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
