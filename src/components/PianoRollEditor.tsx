import React, { useMemo, useState, useEffect } from 'react';
import {
  ProjectState,
  Track,
  NoteEvent,
} from '../types/music';
import {
  getBeginnerNoteLabel,
  PERCUSSION_PADS,
  getInstrumentById,
} from '../data/instruments';
import { soundEngine } from '../audio/soundEngine';
import { createNoteId } from '../algorithms/composer';
import {
  INSTRUMENT_EN_MAP,
  Language,
  ROLE_EN_MAP,
  tr,
} from '../i18n/translations';
import { Volume2, Lock, Unlock, Trash2, Sparkles, Layers } from 'lucide-react';

interface PianoRollEditorProps {
  project: ProjectState;
  activeTrackId: string;
  currentStep: number;
  isPlaying: boolean;
  lang?: Language;
  onUpdateTrackNotes: (trackId: string, notes: NoteEvent[]) => void;
  onAutoCompleteTrack: (role: Track['role'], preserveExisting: boolean) => void;
}

export const PianoRollEditor: React.FC<PianoRollEditorProps> = ({
  project,
  activeTrackId,
  currentStep,
  isPlaying,
  lang = 'zh',
  onUpdateTrackNotes,
  onAutoCompleteTrack,
}) => {
  const activeTrack =
    project.tracks.find((t) => t.id === activeTrackId) || project.tracks[0];
  const inst = getInstrumentById(activeTrack.instrument);
  const instName =
    lang === 'en'
      ? INSTRUMENT_EN_MAP[inst.id]?.name || inst.name
      : inst.name;
  const trackDisplayName =
    lang === 'en'
      ? `${ROLE_EN_MAP[activeTrack.role]?.label || activeTrack.name}`
      : activeTrack.name;

  const isPercussion =
    activeTrack.instrument === 'percussion_kit' || activeTrack.role === 'rhythm';

  const [scaleLock, setScaleLock] = useState<boolean>(true);
  const [brushDuration, setBrushDuration] = useState<number>(2); // 1=16th, 2=8th, 4=quarter, 8=half
  const [showGhostNotes, setShowGhostNotes] = useState<boolean>(true);
  // Section page: 'all' or 0 (bars 1-4), 1 (bars 5-8), 2 (bars 9-12), 3 (bars 13-16)
  const [activeSection, setActiveSection] = useState<number | 'all'>(0);
  const [autoFollowPlayhead, setAutoFollowPlayhead] = useState<boolean>(true);

  const totalSections = Math.ceil(project.bars / 4);

  useEffect(() => {
    if (typeof activeSection === 'number' && activeSection >= totalSections) {
      setActiveSection(0);
    }
  }, [project.bars, totalSections, activeSection]);

  useEffect(() => {
    if (isPlaying && autoFollowPlayhead && activeSection !== 'all') {
      const playingSection = Math.floor(currentStep / 64);
      if (playingSection !== activeSection && playingSection < totalSections) {
        setActiveSection(playingSection);
      }
    }
  }, [currentStep, isPlaying, autoFollowPlayhead, activeSection, totalSections]);

  const startBar = activeSection === 'all' ? 0 : activeSection * 4;
  const endBar =
    activeSection === 'all'
      ? project.bars
      : Math.min(project.bars, (activeSection + 1) * 4);
  const visibleBarsCount = Math.max(1, endBar - startBar);
  const startStepOffset = startBar * 16;
  const visibleStepsCount = visibleBarsCount * 16;
  const totalProjectSteps = project.bars * 16;

  // Build rows of pitches for the current track
  const pitchRows = useMemo(() => {
    if (isPercussion) {
      return PERCUSSION_PADS.map((pad) => ({
        pitch: pad.pitch,
        noteName: pad.shortName,
        jianpu:
          pad.category === 'traditional'
            ? tr(lang, '民乐/管弦', 'Trad/Orch')
            : tr(lang, '现代鼓组', 'Studio Kit'),
        inScale: true,
        isRoot: pad.pitch === 36 || pad.pitch === 45,
        description: pad.name,
      }));
    }

    const [minRec, maxRec] = inst.recommendedRange;
    const low = Math.max(36, minRec);
    const high = Math.min(84, maxRec);

    const rows: Array<{
      pitch: number;
      noteName: string;
      jianpu: string;
      inScale: boolean;
      isRoot: boolean;
      description: string;
    }> = [];

    for (let p = high; p >= low; p--) {
      const info = getBeginnerNoteLabel(p, project.rootNote, project.scale);
      if (scaleLock && !info.inScale) continue;
      rows.push({
        pitch: p,
        noteName: info.noteName,
        jianpu: info.jianpu,
        inScale: info.inScale,
        isRoot: info.isRoot,
        description: `${info.noteName} ${info.jianpu}`,
      });
    }
    return rows;
  }, [
    isPercussion,
    inst.recommendedRange,
    project.rootNote,
    project.scale,
    scaleLock,
    lang,
  ]);

  // Ghost notes from other non-percussion tracks for visual harmonic reference
  const ghostNotes = useMemo(() => {
    if (!showGhostNotes || isPercussion) return [];
    const list: Array<{ note: NoteEvent; color: string }> = [];
    for (const t of project.tracks) {
      if (t.id === activeTrack.id || t.muted || t.role === 'rhythm') continue;
      for (const n of t.notes) {
        list.push({ note: n, color: t.color });
      }
    }
    return list;
  }, [showGhostNotes, isPercussion, project.tracks, activeTrack.id]);

  const handleCellClick = (pitch: number, absStep: number) => {
    const existingIdx = activeTrack.notes.findIndex(
      (n) =>
        n.pitch === pitch &&
        absStep >= n.startStep &&
        absStep < n.startStep + n.durationSteps
    );

    if (existingIdx !== -1) {
      const next = activeTrack.notes.filter((_, i) => i !== existingIdx);
      onUpdateTrackNotes(activeTrack.id, next);
      return;
    }

    const durSteps = isPercussion
      ? 1
      : Math.min(brushDuration, totalProjectSteps - absStep);
    const stepSec = 60 / project.bpm / 4;
    soundEngine.triggerNote(
      activeTrack.instrument,
      pitch,
      durSteps * stepSec,
      0.85,
      activeTrack.volume,
      0,
      activeTrack.fidelity ?? 0.94,
      activeTrack.reverbSend
    );

    const filtered = activeTrack.notes.filter(
      (n) =>
        !(
          n.pitch === pitch &&
          n.startStep < absStep + durSteps &&
          n.startStep + n.durationSteps > absStep
        )
    );

    const newNote: NoteEvent = {
      id: createNoteId('usr'),
      pitch,
      startStep: absStep,
      durationSteps: durSteps,
      velocity: absStep % 4 === 0 ? 0.88 : 0.76,
    };

    onUpdateTrackNotes(
      activeTrack.id,
      [...filtered, newNote].sort((a, b) => a.startStep - b.startStep)
    );
  };

  const handleAuditionPitch = (pitch: number) => {
    const stepSec = 60 / project.bpm / 4;
    soundEngine.triggerNote(
      activeTrack.instrument,
      pitch,
      Math.max(0.35, brushDuration * stepSec),
      0.88,
      activeTrack.volume,
      0,
      activeTrack.fidelity ?? 0.94,
      activeTrack.reverbSend
    );
  };

  const handleClearTrack = () => {
    onUpdateTrackNotes(activeTrack.id, []);
  };

  const sectionNames =
    lang === 'en'
      ? [
          'Sec A (Bars 1-4)',
          'Sec B (Bars 5-8)',
          'Sec C (Bars 9-12)',
          'Sec D (Bars 13-16)',
        ]
      : ['A段 (1-4小节)', 'B段 (5-8小节)', 'C段 (9-12小节)', 'D段 (13-16小节)'];

  return (
    <div className="bg-[#131A26] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col">
      {/* Piano Roll Top Toolbar */}
      <div className="px-4 py-3 border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3 bg-[#0E1420]">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-sm shrink-0"
            style={{ backgroundColor: activeTrack.color }}
          />
          <span className="text-sm font-semibold text-slate-100 whitespace-nowrap">
            {tr(lang, '当前编辑：', 'Editing: ')}
            {trackDisplayName}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-amber-400 font-medium whitespace-nowrap">
            {tr(lang, '音色：', 'Timbre: ')}
            {instName}
          </span>
        </div>

        {/* 16-Bar Section Navigator */}
        {project.bars > 4 && (
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0B0F17] p-1 rounded-lg border border-[#1E293B]">
            <span className="text-[11px] text-slate-400 px-1.5 flex items-center gap-1 whitespace-nowrap">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>{tr(lang, '乐段聚焦：', 'Section Focus:')}</span>
            </span>
            {Array.from({ length: totalSections }).map((_, secIdx) => (
              <button
                key={secIdx}
                type="button"
                onClick={() => setActiveSection(secIdx)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSection === secIdx
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {sectionNames[secIdx]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActiveSection('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tr(
                lang,
                `全曲 ${project.bars} 小节总览`,
                `All ${project.bars} Bars`
              )}
            </button>
            {activeSection !== 'all' && (
              <button
                type="button"
                onClick={() => setAutoFollowPlayhead(!autoFollowPlayhead)}
                className={`px-2 py-1 text-[11px] rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  autoFollowPlayhead
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-transparent text-slate-500 border-transparent'
                }`}
                title={tr(
                  lang,
                  '播放时自动切换至当前所在4小节乐段',
                  'Auto-follow playhead across 4-bar sections'
                )}
              >
                {tr(lang, '自动翻页', 'Auto-Follow')}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Scale Lock Toggle */}
          {!isPercussion && (
            <button
              type="button"
              onClick={() => setScaleLock(!scaleLock)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 border cursor-pointer ${
                scaleLock
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-[#131A26] text-slate-300 border-[#1E293B] hover:border-slate-600'
              }`}
              title={tr(
                lang,
                '开启后仅显示当前调式内和谐音符，零基础随便点都不会跑调',
                'Only shows notes belonging to the current scale so you never hit a wrong note'
              )}
            >
              {scaleLock ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
              <span>
                {scaleLock
                  ? tr(lang, '防跑调音阶锁：开启', 'Scale Lock: ON')
                  : tr(lang, '12平均律全半音', 'Chromatic 12-Tone')}
              </span>
            </button>
          )}

          {/* Note Duration Selector */}
          {!isPercussion && (
            <div className="flex items-center bg-[#0B0F17] p-0.5 rounded-lg border border-[#1E293B]">
              {[
                { val: 1, zh: '1/16短音', en: '1/16' },
                { val: 2, zh: '1/8标准', en: '1/8' },
                { val: 4, zh: '1/4一拍', en: '1/4' },
                { val: 8, zh: '1/2长音', en: '1/2' },
              ].map((d) => (
                <button
                  key={d.val}
                  type="button"
                  onClick={() => setBrushDuration(d.val)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    brushDuration === d.val
                      ? 'bg-amber-500 text-slate-950 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tr(lang, d.zh, d.en)}
                </button>
              ))}
            </div>
          )}

          {/* Ghost Notes Toggle */}
          {!isPercussion && (
            <button
              type="button"
              onClick={() => setShowGhostNotes(!showGhostNotes)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showGhostNotes
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-[#0B0F17] text-slate-500 border-[#1E293B]'
              }`}
            >
              {tr(lang, '其他轨道透视', 'Ghost Notes')}
            </button>
          )}

          {activeTrack.role === 'melody' && (
            <button
              type="button"
              onClick={() => onAutoCompleteTrack('melody', true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {tr(lang, '按现有音符补齐旋律', 'Auto-Complete Melody')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onAutoCompleteTrack(activeTrack.role, false)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {tr(lang, '重算本轨', 'Regenerate Track')}
          </button>

          <button
            type="button"
            onClick={handleClearTrack}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            title={tr(lang, '清空当前轨道所有音符', 'Clear all notes in track')}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{tr(lang, '清空', 'Clear')}</span>
          </button>
        </div>
      </div>

      {/* Chord Progression Bar Header above the Grid */}
      <div className="flex border-b border-[#1E293B] bg-[#0B0F17]">
        <div className="w-36 shrink-0 px-3 py-2 border-r border-[#1E293B] text-xs font-medium text-slate-400 flex items-center justify-between">
          <span>{tr(lang, '音高 / 简谱唱名', 'Pitch / Solfege')}</span>
          <Volume2 className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="flex-1 overflow-x-auto">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${visibleBarsCount}, minmax(180px, 1fr))`,
              minWidth: `${visibleBarsCount * 190}px`,
            }}
          >
            {project.chordTimeline.slice(startBar, endBar).map((slot) => {
              const barIdx = slot.barIndex;
              const isCurrentBar = Math.floor(currentStep / 16) === barIdx;
              return (
                <div
                  key={barIdx}
                  className={`px-3 py-1.5 border-r border-[#1E293B] flex items-center justify-between transition-colors ${
                    isCurrentBar ? 'bg-amber-500/15' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      {tr(lang, `第${barIdx + 1}小节`, `Bar ${barIdx + 1}`)}
                    </span>
                    <span className="text-xs font-bold text-amber-400 font-mono">
                      {slot.label}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({slot.roman})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                    {slot.functionHint}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Scrollable Piano Roll / Drum Grid */}
      <div className="overflow-x-auto overflow-y-auto max-h-[420px] select-none">
        <div
          className="inline-block min-w-full"
          style={{ minWidth: `${144 + visibleBarsCount * 190}px` }}
        >
          {pitchRows.map((row) => {
            const rowNotes = activeTrack.notes.filter(
              (n) => n.pitch === row.pitch
            );
            const rowGhostNotes = ghostNotes.filter(
              (g) => g.note.pitch === row.pitch
            );

            return (
              <div
                key={row.pitch}
                className={`flex border-b border-[#1E293B]/60 ${
                  row.isRoot ? 'bg-amber-500/[0.03]' : 'hover:bg-white/[0.015]'
                }`}
              >
                {/* Left Piano Key / Percussion Pad Label */}
                <button
                  type="button"
                  onClick={() => handleAuditionPitch(row.pitch)}
                  className={`w-36 shrink-0 px-3 py-1.5 border-r border-[#1E293B] flex items-center justify-between text-left transition-colors group cursor-pointer ${
                    row.isRoot
                      ? 'bg-[#172031] text-amber-300 hover:bg-[#1E293B]'
                      : 'bg-[#0E1420] text-slate-300 hover:bg-[#172031]'
                  }`}
                  title={tr(
                    lang,
                    `点击试听: ${row.description}`,
                    `Click to audition: ${row.description}`
                  )}
                >
                  <span className="text-xs font-mono font-semibold truncate">
                    {row.noteName}
                  </span>
                  <span
                    className={`text-[11px] font-mono whitespace-nowrap ${
                      row.isRoot
                        ? 'text-amber-400 font-semibold'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {row.jianpu}
                  </span>
                </button>

                {/* Visible Step Cells */}
                <div
                  className="flex-1 grid relative"
                  style={{
                    gridTemplateColumns: `repeat(${visibleStepsCount}, minmax(12px, 1fr))`,
                  }}
                >
                  {Array.from({ length: visibleStepsCount }).map(
                    (_, localIdx) => {
                      const absStep = startStepOffset + localIdx;
                      const isBarStart = absStep % 16 === 0;
                      const isBeatStart = absStep % 4 === 0;
                      const isPlayhead = currentStep === absStep;

                      const coveringNote = rowNotes.find(
                        (n) =>
                          absStep >= n.startStep &&
                          absStep < n.startStep + n.durationSteps
                      );
                      const isNoteHead =
                        coveringNote && coveringNote.startStep === absStep;

                      const ghostCover =
                        !coveringNote &&
                        rowGhostNotes.find(
                          (g) =>
                            absStep >= g.note.startStep &&
                            absStep < g.note.startStep + g.note.durationSteps
                        );

                      return (
                        <div
                          key={absStep}
                          onClick={() => handleCellClick(row.pitch, absStep)}
                          className={`h-7 border-r cursor-pointer relative transition-colors ${
                            isBarStart
                              ? 'border-l border-l-slate-700/80 border-r-[#1E293B]/50'
                              : isBeatStart
                              ? 'border-l border-l-[#1E293B] border-r-[#1E293B]/40'
                              : 'border-r-[#1E293B]/30'
                          } ${
                            isPlayhead
                              ? 'bg-amber-400/20'
                              : absStep % 8 < 4
                              ? 'bg-transparent'
                              : 'bg-[#090D14]/40'
                          } hover:bg-amber-500/20`}
                        >
                          {ghostCover && (
                            <div
                              className="absolute inset-y-2 inset-x-0.5 rounded-sm opacity-25 pointer-events-none"
                              style={{ backgroundColor: ghostCover.color }}
                            />
                          )}

                          {coveringNote && (
                            <div
                              className={`absolute inset-y-1 inset-x-0.5 rounded-sm flex items-center px-1 transition-transform ${
                                isPlayhead ? 'brightness-125 scale-y-105' : ''
                              }`}
                              style={{
                                backgroundColor: activeTrack.color,
                                opacity: isNoteHead ? 0.95 : 0.78,
                              }}
                            >
                              {isNoteHead &&
                                coveringNote.durationSteps >= 2 && (
                                  <span className="text-[10px] font-mono font-bold text-slate-950 truncate leading-none">
                                    {isPercussion
                                      ? '●'
                                      : row.jianpu.split(' ')[0] ||
                                        row.noteName}
                                  </span>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Piano Roll Footer Help Bar */}
      <div className="px-4 py-2 bg-[#0B0F17] border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div>
          {tr(
            lang,
            '操作指南：点击网格空白处添加音符，点击已有音符即可删除；点击左侧琴键可单独试听音高。',
            'Guide: Click empty cells to place notes, click existing notes to remove; click left keys to audition.'
          )}
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          {tr(
            lang,
            `当前显示：第 ${startBar + 1} – ${endBar} 小节 · 本轨共 ${
              activeTrack.notes.length
            } 个音符`,
            `Showing: Bars ${startBar + 1}–${endBar} · ${
              activeTrack.notes.length
            } Notes in Track`
          )}
        </div>
      </div>
    </div>
  );
};
