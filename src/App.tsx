/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ProjectState,
  InstrumentId,
  TrackRole,
  ScaleType,
  NoteEvent,
  StylePreset,
  ClassicExcerpt,
  ScenePreset,
  MotifSeed,
  AcousticHallType,
} from './types/music';
import {
  INSTRUMENTS,
  INSTRUMENT_CATEGORIES,
  SCALES,
  CHORD_PROGRESSIONS,
  PITCH_CLASS_CHINESE_NAMES,
  PITCH_CLASS_NAMES,
  getInstrumentById,
} from './data/instruments';
import {
  CLASSIC_REPERTOIRE,
  createProjectFromClassicExcerpt,
} from './data/classicRepertoire';
import {
  SCENE_PRESETS,
  SCENE_DIMENSION_TAGS,
  TRACK_ROLE_DEFINITIONS,
  matchBestScenePreset,
} from './data/scenePresets';
import {
  createProjectFromScenePreset,
  createProjectFromStylePreset,
  generateFullArrangement,
  randomizeCreativeArrangement,
  developMotifAndFillArrangement,
  mergeTwoTracksAndResolveOverlaps,
  getDefaultAcousticProfile,
  calculateMelodyTrack,
  calculateChordsAndBassTracks,
  inferChordsFromMelody,
  buildChordTimeline,
  getChordIntervals,
  generateNotesForRole,
  createAdditionalTrack,
} from './algorithms/composer';
import { ACOUSTIC_HALL_PRESETS, soundEngine } from './audio/soundEngine';
import { downloadMidiFile, downloadH5SourceFile } from './utils/exporters';
import { PianoRollEditor } from './components/PianoRollEditor';
import { MotifWorkshop } from './components/MotifWorkshop';
import { InstrumentVault } from './components/InstrumentVault';
import { ExportStudio } from './components/ExportStudio';
import { AudioSpectrumCanvas } from './components/AudioSpectrumCanvas';
import {
  Language,
  tr,
  INSTRUMENT_CATEGORY_EN,
  INSTRUMENT_EN_MAP,
  SCALE_EN_MAP,
  PROGRESSION_EN_MAP,
  ROLE_EN_MAP,
  HALL_EN_MAP,
  SCENE_EN_MAP,
  CLASSIC_EN_MAP,
} from './i18n/translations';
import {
  Play,
  Pause,
  Square,
  Sparkles,
  Download,
  Volume2,
  VolumeX,
  Wand2,
  Sliders,
  Music2,
  RefreshCw,
  FileCode,
  BookOpen,
  Plus,
  Trash2,
  Compass,
  Search,
  Dices,
  ChevronDown,
  ChevronUp,
  GitMerge,
  Globe,
  Check,
} from 'lucide-react';

type ActiveTab = 'workstation' | 'wizard' | 'instruments' | 'export';

const SCENE_TAG_EN_MAP: Record<string, string> = {
  '华夏上古/皇家': 'Ancient Imperial',
  '仙侠/古风奇幻': 'Xianxia Fantasy',
  '江南山水/茶寮': 'Jiangnan Pastoral',
  '好莱坞交响/巨龙': 'Hollywood / Dragon',
  '哥特大教堂/神殿': 'Gothic Cathedral',
  '复古8Bit像素城': '8-Bit Pixel Castle',
  '深空星际/宇宙': 'Interstellar Space',
  '奇幻精灵森林': 'Elven Forest',
  '赛博霓虹都市': 'Cyberpunk Neon',
  '海滨黄昏/校园': 'Seaside Sunset',
  '庄严神圣': 'Solemn & Sacred',
  '空灵飘逸': 'Ethereal & Airy',
  '热血燃战': 'Epic Battle',
  '治愈静谧': 'Calm & Healing',
  '神秘奇幻': 'Mystic & Magical',
  '复古欢快': 'Retro Upbeat',
  '悬疑张力': 'Suspense & Tension',
  '温暖抒情': 'Warm & Lyrical',
  '钟磬金石与大合奏': 'Bronze Bells & Tutti',
  '古筝琵琶竹笛民乐': 'Guzheng, Pipa & Dizi',
  '管风琴与唱诗班': 'Pipe Organ & Choir',
  '弦乐协奏与羽管键琴': 'Strings & Harpsichord',
  '8Bit方波与电子合成': '8-Bit & Analog Synth',
  '钢琴竖琴与古典吉他': 'Piano, Harp & Guitar',
};

const SCENE_CATEGORY_TITLE_EN: Record<string, string> = {
  '时代与地域空间': '01. Era & World Setting',
  '情绪与戏剧张力': '02. Mood & Dramatic Tension',
  '核心声学与乐器色彩': '03. Core Acoustic & Timbre Color',
};

export default function App() {
  // Bilingual state ('zh' | 'en')
  const [lang, setLang] = useState<Language>('zh');

  // Default to the 8-track, 8-bar Imperial Palace Ceremony Scene Preset
  const [project, setProject] = useState<ProjectState>(() =>
    createProjectFromScenePreset(SCENE_PRESETS[0], 8)
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('workstation');
  const [activeTrackId, setActiveTrackId] = useState<string>(
    () => project.tracks[0]?.id || 'track_1'
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [showMotifWorkshop, setShowMotifWorkshop] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>(
    '已启用高保真古典声学建模与智能编曲引擎 · 支持多轨合并防重叠、主导动机创作及中英双语切换'
  );

  // Track Merge state (select up to 2 tracks via checkboxes or inline Merge bar)
  const [selectedMergeIds, setSelectedMergeIds] = useState<string[]>([]);
  const [showMergeBar, setShowMergeBar] = useState<boolean>(false);
  const [mergePrimaryId, setMergePrimaryId] = useState<string>(
    () => project.tracks[0]?.id || ''
  );
  const [mergeSecondaryId, setMergeSecondaryId] = useState<string>(
    () => project.tracks[1]?.id || ''
  );

  // Scene Auto-Matcher state
  const [sceneQuery, setSceneQuery] = useState<string>('');
  const [selectedSceneTags, setSelectedSceneTags] = useState<string[]>([
    '华夏上古/皇家',
    '庄严神圣',
  ]);

  const projectRef = useRef<ProjectState>(project);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // Keep activeTrackId and merge IDs valid if tracks change
  useEffect(() => {
    if (
      !project.tracks.some((t) => t.id === activeTrackId) &&
      project.tracks.length > 0
    ) {
      setActiveTrackId(project.tracks[0].id);
    }
    setSelectedMergeIds((prev) =>
      prev.filter((id) => project.tracks.some((t) => t.id === id))
    );
    if (!project.tracks.some((t) => t.id === mergePrimaryId)) {
      setMergePrimaryId(project.tracks[0]?.id || '');
    }
    if (
      !project.tracks.some((t) => t.id === mergeSecondaryId) ||
      mergeSecondaryId === mergePrimaryId
    ) {
      const second =
        project.tracks.find((t) => t.id !== mergePrimaryId)?.id ||
        project.tracks[0]?.id ||
        '';
      setMergeSecondaryId(second);
    }
  }, [project.tracks, activeTrackId, mergePrimaryId, mergeSecondaryId]);

  const stepRef = useRef<number>(0);

  // Trigger audio for all active tracks at a given 16th-note step (passing per-track fidelity & reverbSend)
  const triggerStepAudio = useCallback((stepIndex: number) => {
    const proj = projectRef.current;
    const stepDurationSec = 60 / proj.bpm / 4;
    const hasSolo = proj.tracks.some((t) => t.solo);

    for (const track of proj.tracks) {
      if (track.muted) continue;
      if (hasSolo && !track.solo) continue;

      for (const note of track.notes) {
        if (note.startStep === stepIndex) {
          soundEngine.triggerNote(
            track.instrument,
            note.pitch,
            note.durationSteps * stepDurationSec,
            note.velocity,
            track.volume,
            0,
            track.fidelity ?? 0.94,
            track.reverbSend ?? 0.48
          );
        }
      }
    }
  }, []);

  // Playback Scheduler Loop
  useEffect(() => {
    if (!isPlaying) return;

    const stepMs = (60 / project.bpm / 4) * 1000;
    const timer = window.setInterval(() => {
      const totalSteps = projectRef.current.bars * 16;
      const nextStep = (stepRef.current + 1) % totalSteps;
      stepRef.current = nextStep;
      setCurrentStep(nextStep);
      triggerStepAudio(nextStep);
    }, stepMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, project.bpm, triggerStepAudio]);

  const handleTogglePlay = () => {
    soundEngine.init();
    if (!isPlaying) {
      triggerStepAudio(stepRef.current);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    stepRef.current = 0;
    setCurrentStep(0);
  };

  // Toggle selection of a track for merging (up to 2 tracks)
  const handleToggleMergeSelect = (trackId: string) => {
    setSelectedMergeIds((prev) => {
      if (prev.includes(trackId)) {
        return prev.filter((id) => id !== trackId);
      }
      if (prev.length >= 2) {
        const next = [prev[1], trackId];
        setMergePrimaryId(next[0]);
        setMergeSecondaryId(next[1]);
        return next;
      }
      const next = [...prev, trackId];
      if (next.length === 1) {
        setMergePrimaryId(next[0]);
      } else if (next.length === 2) {
        setMergePrimaryId(next[0]);
        setMergeSecondaryId(next[1]);
      }
      return next;
    });
  };

  // Execute Track Merge & Auto Overlap Resolution
  const handleExecuteMergeTracks = (idA?: string, idB?: string) => {
    if (project.tracks.length < 2) {
      setStatusMessage(
        tr(
          lang,
          '至少需要 2 条音轨才能执行合并操作',
          'At least 2 tracks are required to merge.'
        )
      );
      return;
    }

    const targetA = idA || selectedMergeIds[0] || mergePrimaryId;
    const targetB = idB || selectedMergeIds[1] || mergeSecondaryId;

    if (!targetA || !targetB || targetA === targetB) {
      setShowMergeBar(true);
      setStatusMessage(
        tr(
          lang,
          '请先在轨道列表左侧勾选 2 条不同的音轨，或在下方合并栏选择两条轨道后再点击合并',
          'Please select 2 different tracks using the checkboxes or dropdowns to merge.'
        )
      );
      return;
    }

    soundEngine.init();
    const result = mergeTwoTracksAndResolveOverlaps(project, targetA, targetB);
    if (!result) return;

    setProject(result.updatedProject);
    setActiveTrackId(result.mergedTrack.id);
    setSelectedMergeIds([]);
    setShowMergeBar(false);

    // Audition a chord/note from the merged track to give immediate auditory confirmation
    const sampleNote = result.mergedTrack.notes[0];
    if (sampleNote) {
      soundEngine.triggerNote(
        result.mergedTrack.instrument,
        sampleNote.pitch,
        0.45,
        0.82,
        result.mergedTrack.volume,
        0,
        result.mergedTrack.fidelity ?? 0.94,
        result.mergedTrack.reverbSend ?? 0.48
      );
    }

    setStatusMessage(
      tr(
        lang,
        `✅ 已将选中双轨合并为「${result.mergedTrack.name}」：合并前 ${result.stats.beforeCount} 个音符 → 智能消除 ${result.stats.overlapsResolved} 处同音碰撞/时值重叠/浑浊音簇 → 精炼保留 ${result.stats.afterCount} 个清晰音符`,
        `✅ Merged into "${result.mergedTrack.name}": ${result.stats.beforeCount} raw notes → auto-resolved ${result.stats.overlapsResolved} note overlaps/collisions → ${result.stats.afterCount} clean notes.`
      )
    );
  };

  // Full Intelligent Arrangement Generation across all active tracks (up to 10)
  const handleFullAutoArrange = (preserveMelody = false) => {
    soundEngine.init();
    const updated = generateFullArrangement(project, preserveMelody);
    setProject(updated);
    setStatusMessage(
      preserveMelody
        ? tr(
            lang,
            `已根据现有旋律音符，随机推演补齐 ${updated.bars} 小节旋律与细节并同步重算全部 ${updated.tracks.length} 条音轨`,
            `Extended existing melody across ${updated.bars} bars with passing ornaments and recalculated all ${updated.tracks.length} tracks.`
          )
        : tr(
            lang,
            `已通过高随机度乐理算法全新生成 ${updated.tracks.length} 条轨道（共 ${updated.bars} 小节 · 含经过音与装饰音细节）`,
            `Generated a brand-new ${updated.tracks.length}-track arrangement (${updated.bars} bars with passing tones & ornaments).`
          )
    );
  };

  // Deep Creative Randomization ("🎲 深度随机灵感重构")
  const handleDeepRandomize = () => {
    soundEngine.init();
    const updated = randomizeCreativeArrangement(project);
    setProject(updated);
    const progObj = CHORD_PROGRESSIONS.find(
      (p) => p.id === updated.progressionId
    );
    const progName =
      lang === 'en'
        ? PROGRESSION_EN_MAP[updated.progressionId]?.name || progObj?.name || ''
        : progObj?.name || '';
    setStatusMessage(
      tr(
        lang,
        `🎲 已深度随机重构全曲：随机匹配「${progName}」和声、全新主导动机轮廓与多声部律动织体（${updated.bars}小节）`,
        `🎲 Deep Randomized: Matched "${progName}" harmony, fresh motif contour & multi-voice textures (${updated.bars} bars).`
      )
    );
  };

  // Apply Leitmotif & Theme Seed and auto-fill musical details across all bars & tracks
  const handleApplyMotifToProject = (motif: MotifSeed) => {
    soundEngine.init();
    const updated = developMotifAndFillArrangement(project, motif);
    setProject(updated);
    setStatusMessage(
      tr(
        lang,
        `✨ 已围绕主导动机「${motif.name}」自动展开并填充 ${updated.bars} 小节细节与全部 ${updated.tracks.length} 轨伴奏`,
        `✨ Developed leitmotif "${motif.name}" across ${updated.bars} bars and auto-filled all ${updated.tracks.length} tracks.`
      )
    );
  };

  // Update Master Acoustic Fidelity, Reverb & Hall Type
  const handleUpdateMasterAcoustics = (
    fidelity: number,
    reverb: number,
    hallType: AcousticHallType
  ) => {
    soundEngine.init();
    soundEngine.setMasterFidelity(fidelity);
    soundEngine.setMasterReverb(reverb);
    soundEngine.setHallType(hallType);
    setProject((prev) => ({
      ...prev,
      masterFidelity: fidelity,
      masterReverb: reverb,
      hallType,
    }));
  };

  // Apply a Scene Preset (6 to 10 tracks)
  const handleApplyScenePreset = (scene: ScenePreset, customBars?: number) => {
    soundEngine.init();
    const targetBars = customBars || project.bars;
    const nextProj = createProjectFromScenePreset(scene, targetBars);
    if (nextProj.hallType) {
      soundEngine.setHallType(nextProj.hallType);
    }
    setProject(nextProj);
    setActiveTrackId(nextProj.tracks[0]?.id || '');
    setSelectedMergeIds([]);
    stepRef.current = 0;
    setCurrentStep(0);
    const sName =
      lang === 'en' ? SCENE_EN_MAP[scene.id]?.name || scene.name : scene.name;
    setStatusMessage(
      tr(
        lang,
        `已套用场景预设【${sName}】（${nextProj.tracks.length} 轨编制 · ${nextProj.bars} 小节）`,
        `Applied Scene Preset "${sName}" (${nextProj.tracks.length} tracks · ${nextProj.bars} bars).`
      )
    );
    setActiveTab('workstation');
  };

  // Run Intelligent Scene Auto-Matcher
  const handleAutoMatchScene = () => {
    soundEngine.init();
    const { preset, reason } = matchBestScenePreset(
      sceneQuery,
      selectedSceneTags
    );
    const nextProj = createProjectFromScenePreset(preset, project.bars);
    if (nextProj.hallType) {
      soundEngine.setHallType(nextProj.hallType);
    }
    setProject(nextProj);
    setActiveTrackId(nextProj.tracks[0]?.id || '');
    setSelectedMergeIds([]);
    stepRef.current = 0;
    setCurrentStep(0);
    const sName =
      lang === 'en'
        ? SCENE_EN_MAP[preset.id]?.name || preset.name
        : preset.name;
    setStatusMessage(
      lang === 'en'
        ? `Matched scene "${sName}" (${nextProj.tracks.length} tracks · ${nextProj.bars} bars)`
        : reason
    );
    setActiveTab('workstation');
  };

  // Apply a Style Preset
  const handleApplyStylePreset = (preset: StylePreset) => {
    soundEngine.init();
    const nextProj = createProjectFromStylePreset(preset, project.bars);
    setProject(nextProj);
    setActiveTrackId(nextProj.tracks[0]?.id || '');
    setSelectedMergeIds([]);
    stepRef.current = 0;
    setCurrentStep(0);
    setStatusMessage(
      tr(
        lang,
        `已切换至「${preset.name}」风格模板（${nextProj.bars} 小节）`,
        `Switched to style template "${preset.name}" (${nextProj.bars} bars).`
      )
    );
    setActiveTab('workstation');
  };

  // Load a Classic Repertoire Excerpt
  const handleLoadClassicExcerpt = (excerpt: ClassicExcerpt) => {
    soundEngine.init();
    const nextProj = createProjectFromClassicExcerpt(excerpt);
    setProject(nextProj);
    setActiveTrackId(nextProj.tracks[0]?.id || '');
    setSelectedMergeIds([]);
    stepRef.current = 0;
    setCurrentStep(0);
    const cTitle =
      lang === 'en'
        ? CLASSIC_EN_MAP[excerpt.id]?.title || excerpt.title
        : excerpt.title;
    setStatusMessage(
      tr(
        lang,
        `已载入经典名曲参考《${cTitle}》（${nextProj.tracks.length} 轨 · ${nextProj.bars} 小节），已开启古典高保真共鸣建模`,
        `Loaded classic piece "${cTitle}" (${nextProj.tracks.length} tracks · ${nextProj.bars} bars) with high-fidelity acoustic modeling.`
      )
    );
    setActiveTab('workstation');
  };

  // Add a new track (up to 10 tracks)
  const handleAddTrack = () => {
    if (project.tracks.length >= 10) {
      setStatusMessage(
        tr(
          lang,
          '当前已达到最大 10 条音轨上限',
          'Maximum limit of 10 tracks reached.'
        )
      );
      return;
    }
    soundEngine.init();
    const newTrack = createAdditionalTrack(project);
    if (!newTrack) return;

    setProject((prev) => ({
      ...prev,
      tracks: [...prev.tracks, newTrack],
    }));
    setActiveTrackId(newTrack.id);
    const inst = getInstrumentById(newTrack.instrument);
    const instName =
      lang === 'en'
        ? INSTRUMENT_EN_MAP[inst.id]?.name || inst.name
        : inst.name;
    setStatusMessage(
      tr(
        lang,
        `已添加第 ${project.tracks.length + 1} 轨「${newTrack.name}」（默认音色：${instName}），并自动生成声部音符`,
        `Added Track #${project.tracks.length + 1} (${instName}) with auto-generated notes.`
      )
    );
  };

  // Remove a track (keep at least 1 track)
  const handleRemoveTrack = (trackId: string) => {
    if (project.tracks.length <= 1) return;
    setProject((prev) => {
      const nextTracks = prev.tracks.filter((t) => t.id !== trackId);
      return {
        ...prev,
        tracks: nextTracks,
      };
    });
    setStatusMessage(
      tr(lang, '已移除所选音轨', 'Removed the selected track.')
    );
  };

  // Change a specific track's Role and recalculate its notes
  const handleChangeTrackRole = (trackId: string, newRole: TrackRole) => {
    soundEngine.init();
    setProject((prev) => {
      const melodyNotes =
        prev.tracks.find((t) => t.role === 'melody')?.notes || [];
      const roleDef = TRACK_ROLE_DEFINITIONS.find((d) => d.role === newRole);
      return {
        ...prev,
        tracks: prev.tracks.map((t, idx) => {
          if (t.id !== trackId) return t;
          const nextNotes =
            newRole === 'melody'
              ? calculateMelodyTrack(prev, false)
              : generateNotesForRole(prev, newRole, melodyNotes, idx);
          return {
            ...t,
            role: newRole,
            color: roleDef?.defaultColor || t.color,
            notes: nextNotes,
          };
        }),
      };
    });
    const roleLabel =
      lang === 'en'
        ? ROLE_EN_MAP[newRole]?.shortLabel || newRole
        : TRACK_ROLE_DEFINITIONS.find((d) => d.role === newRole)?.shortLabel ||
          newRole;
    setStatusMessage(
      tr(
        lang,
        `已将该轨道声部职能切换为「${roleLabel}」并随机重算音符`,
        `Switched track role to "${roleLabel}" and recalculated notes.`
      )
    );
  };

  // Auto-complete or recalculate a single track role
  const handleAutoCompleteTrack = (
    role: TrackRole,
    preserveExisting: boolean
  ) => {
    soundEngine.init();
    setProject((prev) => {
      if (role === 'melody') {
        const melodyNotes = calculateMelodyTrack(prev, preserveExisting);
        return {
          ...prev,
          tracks: prev.tracks.map((t, idx) =>
            t.role === 'melody'
              ? { ...t, notes: melodyNotes }
              : t.role === 'counter'
              ? {
                  ...t,
                  notes: generateNotesForRole(prev, 'counter', melodyNotes, idx),
                }
              : t
          ),
        };
      }
      const melNotes = prev.tracks.find((t) => t.role === 'melody')?.notes || [];
      return {
        ...prev,
        tracks: prev.tracks.map((t, idx) =>
          t.id === activeTrackId || t.role === role
            ? { ...t, notes: generateNotesForRole(prev, t.role, melNotes, idx) }
            : t
        ),
      };
    });

    setStatusMessage(
      preserveExisting
        ? tr(
            lang,
            '已保留您手绘的种子音符，并基于动机模进与经过音细节填充算法补齐全部小节',
            'Preserved your seed notes and auto-completed all bars with motif development & passing tones.'
          )
        : tr(
            lang,
            '已通过随机变奏算法重新计算生成该轨道的音符编排',
            'Recalculated this track with a fresh algorithmic variation.'
          )
    );
  };

  // Reverse-Harmonize Chords from Melody
  const handleInferChordsFromMelody = () => {
    soundEngine.init();
    setProject((prev) => {
      const inferredTimeline = inferChordsFromMelody(prev);
      const nextProj = { ...prev, chordTimeline: inferredTimeline };
      const melNotes =
        nextProj.tracks.find((t) => t.role === 'melody')?.notes || [];
      return {
        ...nextProj,
        tracks: nextProj.tracks.map((t, idx) =>
          t.role === 'melody' || t.role === 'rhythm'
            ? t
            : {
                ...t,
                notes: generateNotesForRole(nextProj, t.role, melNotes, idx),
              }
        ),
      };
    });
    setStatusMessage(
      tr(
        lang,
        '已分析主旋律各小节骨干音，自动反推最佳和弦走向并同步更新所有伴奏轨道',
        'Analyzed melody backbone notes per bar, inferred optimal chords, and updated all accompaniment tracks.'
      )
    );
  };

  // Change Root Key or Scale
  const handleChangeKeyOrScale = (newRoot: number, newScale: ScaleType) => {
    setProject((prev) => {
      const nextTimeline = buildChordTimeline(
        newRoot,
        prev.progressionId,
        prev.bars
      );
      const tempProj: ProjectState = {
        ...prev,
        rootNote: newRoot,
        scale: newScale,
        chordTimeline: nextTimeline,
      };
      return generateFullArrangement(tempProj, false);
    });
    const scaleName =
      lang === 'en'
        ? SCALE_EN_MAP[newScale]?.name || newScale
        : SCALES.find((s) => s.id === newScale)?.name || '';
    setStatusMessage(
      tr(
        lang,
        `已切换调式为 ${PITCH_CLASS_NAMES[newRoot % 12]} · ${scaleName}，并自动重算全部 ${project.tracks.length} 轨和声`,
        `Switched key/scale to ${PITCH_CLASS_NAMES[newRoot % 12]} ${scaleName} and recalculated all ${project.tracks.length} tracks.`
      )
    );
  };

  // Change Chord Progression Template
  const handleChangeProgression = (progressionId: string) => {
    soundEngine.init();
    setProject((prev) => {
      const nextTimeline = buildChordTimeline(
        prev.rootNote,
        progressionId,
        prev.bars
      );
      const nextProj = { ...prev, progressionId, chordTimeline: nextTimeline };
      return generateFullArrangement(nextProj, false);
    });
    const prog = CHORD_PROGRESSIONS.find((p) => p.id === progressionId);
    const pName =
      lang === 'en'
        ? PROGRESSION_EN_MAP[progressionId]?.name || prog?.name || ''
        : prog?.name || '';
    setStatusMessage(
      tr(
        lang,
        `已套用「${pName}」和弦进行，并同步适配全曲 ${project.bars} 小节`,
        `Applied chord progression "${pName}" across all ${project.bars} bars.`
      )
    );
  };

  // Audition a single chord slot on click
  const handleAuditionChordSlot = (barIdx: number) => {
    soundEngine.init();
    const slot = project.chordTimeline[barIdx];
    if (!slot) return;
    const chordTrack = project.tracks.find((t) => t.role === 'chords');
    const instId = chordTrack ? chordTrack.instrument : 'grand_piano';
    const rootMidi = 60 + ((project.rootNote + slot.rootSemitone) % 12);
    const intervals = getChordIntervals(slot.chordType);
    intervals.forEach((iv, i) => {
      soundEngine.triggerNote(
        instId,
        rootMidi + iv,
        0.9,
        0.78,
        0.85,
        i * 0.04,
        chordTrack?.fidelity ?? 0.95,
        chordTrack?.reverbSend ?? 0.5
      );
    });
  };

  // Update notes in a specific track
  const handleUpdateTrackNotes = (trackId: string, notes: NoteEvent[]) => {
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) => (t.id === trackId ? { ...t, notes } : t)),
    }));
  };

  // Assign an instrument to a track role (or active track)
  const handleAssignInstrument = (
    role: TrackRole,
    instrument: InstrumentId
  ) => {
    soundEngine.init();
    const prof = getDefaultAcousticProfile(instrument);
    setProject((prev) => ({
      ...prev,
      tracks: prev.tracks.map((t) =>
        t.role === role
          ? {
              ...t,
              instrument,
              fidelity: prof.fidelity,
              reverbSend: prof.reverbSend,
            }
          : t
      ),
    }));
    const inst = getInstrumentById(instrument);
    const instName =
      lang === 'en'
        ? INSTRUMENT_EN_MAP[instrument]?.name || inst.name
        : inst.name;
    setStatusMessage(
      tr(
        lang,
        `已将「${instName}」分配至 ${role.toUpperCase()} 轨道（自动匹配保真度 ${Math.round(
          prof.fidelity * 100
        )}% · 混响 ${Math.round(prof.reverbSend * 100)}%）`,
        `Assigned "${instName}" to ${role.toUpperCase()} track (Fidelity ${Math.round(
          prof.fidelity * 100
        )}% · Reverb ${Math.round(prof.reverbSend * 100)}%).`
      )
    );
  };

  const toggleSceneTag = (tag: string) => {
    setSelectedSceneTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const currentBar = Math.floor(currentStep / 16) + 1;
  const currentBeat = Math.floor((currentStep % 16) / 4) + 1;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F1F5F9] flex flex-col">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-[#1E293B] bg-[#0E1420]">
        {/* Zone 1: Brand Title, single element */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('workstation');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 font-display"
        >
          {tr(lang, '灵韵工坊 LingYun Studio', 'LingYun Studio · AI-Free Music Workstation')}
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <button
            type="button"
            onClick={() => setActiveTab('workstation')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'workstation'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : ''
            }`}
          >
            {tr(lang, '编曲工作台', 'Workstation')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wizard')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'wizard'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : ''
            }`}
          >
            {tr(lang, '场景匹配与名曲库', 'Scenes & Classics')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('instruments')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'instruments'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : ''
            }`}
          >
            {tr(lang, '高保真音色库 (28种)', 'Sound Vault (28)')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 cursor-pointer ${
              activeTab === 'export'
                ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                : ''
            }`}
          >
            {tr(lang, '导出与源码', 'Export MIDI & HTML5')}
          </button>
        </nav>

        {/* Zone 3: Primary Action Button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => handleFullAutoArrange(false)}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{tr(lang, '随机生成全新乐曲', 'Generate New Song')}</span>
          </button>
        </div>
      </header>

      {/* Studio Transport & Global Musical Parameters Toolbar */}
      <div className="px-6 py-3 bg-[#131A26] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-4">
        {/* Left: Playback Transport & Position Counter */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isPlaying
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>
              {isPlaying
                ? tr(lang, '暂停播放', 'Pause')
                : tr(lang, '播放全曲', 'Play Song')}
            </span>
          </button>

          <button
            type="button"
            onClick={handleStop}
            className="p-2 rounded-lg bg-[#0B0F17] hover:bg-slate-800 text-slate-300 border border-[#1E293B] transition-colors cursor-pointer"
            title={tr(lang, '停止并回到开头', 'Stop and rewind to start')}
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Bar : Beat : Step Display (tabular-nums) */}
          <div className="px-3 py-1.5 bg-[#0B0F17] border border-[#1E293B] rounded-lg font-mono text-xs flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="text-slate-400">
              {tr(lang, '小节:拍', 'BAR:BEAT')}
            </span>
            <span className="text-amber-400 font-bold text-sm">
              {String(currentBar).padStart(2, '0')}:
              {String(currentBeat).padStart(2, '0')}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">
              {tr(lang, '步进', 'STEP')} {String(currentStep + 1).padStart(3, '0')}/
              {project.bars * 16}
            </span>
          </div>

          <AudioSpectrumCanvas isPlaying={isPlaying} />
        </div>

        {/* Center: Key, Scale, BPM, Bar Length (4 / 8 / 12 / 16 Bars) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            className="w-32 sm:w-36 px-2.5 py-1.5 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-xs font-medium text-slate-100 focus:outline-none focus:border-amber-500"
            placeholder={tr(lang, '输入曲名...', 'Song title...')}
            aria-label={tr(lang, '乐曲名称', 'Song Title')}
          />

          <select
            value={project.rootNote}
            onChange={(e) =>
              handleChangeKeyOrScale(Number(e.target.value), project.scale)
            }
            className="px-2.5 py-1.5 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            aria-label={tr(lang, '选择主音调号', 'Root Key')}
          >
            {Object.entries(PITCH_CLASS_CHINESE_NAMES).map(([pc, label]) => {
              const numPc = Number(pc);
              const enLabel = `${PITCH_CLASS_NAMES[numPc % 12]} Key`;
              return (
                <option key={pc} value={numPc}>
                  {lang === 'en' ? enLabel : label}
                </option>
              );
            })}
          </select>

          <select
            value={project.scale}
            onChange={(e) =>
              handleChangeKeyOrScale(
                project.rootNote,
                e.target.value as ScaleType
              )
            }
            className="px-2.5 py-1.5 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
            aria-label={tr(lang, '选择调式音阶', 'Musical Scale')}
          >
            {SCALES.map((sc) => {
              const enSc = SCALE_EN_MAP[sc.id];
              return (
                <option key={sc.id} value={sc.id}>
                  {lang === 'en' && enSc
                    ? `${enSc.name}`
                    : `${sc.name} (${sc.subtitle.split(' · ')[0]})`}
                </option>
              );
            })}
          </select>

          {/* BPM Control */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-xs font-mono whitespace-nowrap shrink-0">
            <span className="text-slate-400">BPM</span>
            <span className="text-amber-400 font-bold w-7 text-right">
              {project.bpm}
            </span>
            <input
              type="range"
              min={55}
              max={165}
              value={project.bpm}
              onChange={(e) =>
                setProject({ ...project, bpm: Number(e.target.value) })
              }
              className="w-20 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* 4 / 8 / 12 / 16 Bars Selector */}
          <div className="flex items-center bg-[#0B0F17] p-0.5 rounded-lg border border-[#1E293B]">
            {[4, 8, 12, 16].map((bCount) => (
              <button
                key={bCount}
                type="button"
                onClick={() => {
                  const nextTimeline = buildChordTimeline(
                    project.rootNote,
                    project.progressionId,
                    bCount
                  );
                  const nextProj = generateFullArrangement(
                    { ...project, bars: bCount, chordTimeline: nextTimeline },
                    true
                  );
                  setProject(nextProj);
                  setStatusMessage(
                    tr(
                      lang,
                      `已将乐曲长度调整为 ${bCount} 小节（共 ${
                        bCount * 16
                      } 个十六分音符步进），并自动补齐延长所有声部轨道`,
                      `Changed song length to ${bCount} bars (${
                        bCount * 16
                      } 16th-note steps) and extended all tracks.`
                    )
                  );
                }}
                className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  project.bars === bCount
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {bCount}
                {tr(lang, '小节', 'B')}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Language Switcher (中 / EN) + Direct One-Click Export Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Bilingual Switcher Button */}
          <button
            type="button"
            onClick={() => {
              const nextLang: Language = lang === 'zh' ? 'en' : 'zh';
              setLang(nextLang);
              setStatusMessage(
                nextLang === 'en'
                  ? 'Switched workstation interface to English · Track Merging & Overlap Resolution ready.'
                  : '已切换工作台界面为中文 · 支持任意双轨一键合并与重叠音符自动消解'
              );
            }}
            className="px-2.5 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title={tr(
              lang,
              '切换中英文界面 (Switch Chinese / English)',
              'Switch between Chinese and English'
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '中文 / EN' : 'EN / 中文'}</span>
          </button>

          <button
            type="button"
            onClick={() => downloadMidiFile(project)}
            className="px-3 py-1.5 bg-[#0B0F17] hover:bg-slate-800 text-slate-200 border border-[#1E293B] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{tr(lang, '导出 MIDI', 'MIDI')}</span>
          </button>

          <button
            type="button"
            onClick={() => downloadH5SourceFile(project)}
            className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>{tr(lang, '导出 H5 源码', 'HTML5 Code')}</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center justify-around border-b border-[#1E293B] bg-[#0E1420] px-2 py-2">
        {[
          { id: 'workstation', label: tr(lang, '编曲台', 'Studio') },
          { id: 'wizard', label: tr(lang, '场景与名曲', 'Scenes') },
          { id: 'instruments', label: tr(lang, '28种音色', '28 Sounds') },
          { id: 'export', label: tr(lang, '导出MIDI/H5', 'Export') },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as ActiveTab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-5 space-y-5">
        {/* Top Quick Scene Presets & Classic Masterpieces Strip */}
        <div className="bg-[#131A26] border border-[#1E293B] rounded-xl px-4 py-3 space-y-2.5">
          {/* Row 1: 10 Scene Presets + Smart Scene Matcher Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-amber-400 flex items-center gap-1 whitespace-nowrap mr-1">
                <Compass className="w-3.5 h-3.5" />
                <span>
                  {tr(lang, '多轨场景预设 (6-8轨)：', 'Scene Presets (6-8 Tracks):')}
                </span>
              </span>
              {SCENE_PRESETS.map((scene) => {
                const isSelected = project.sceneId === scene.id;
                const sEn = SCENE_EN_MAP[scene.id];
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => handleApplyScenePreset(scene)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                        : 'bg-[#0B0F17] text-slate-300 border-[#1E293B] hover:border-amber-500/40'
                    }`}
                    title={lang === 'en' && sEn ? sEn.desc : scene.description}
                  >
                    {lang === 'en' && sEn ? sEn.name : scene.name}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setActiveTab('wizard')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/40 hover:bg-sky-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Search className="w-3 h-3" />
                <span>
                  {tr(lang, '自动匹配场景向导', 'Auto-Match Scene')}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: 12 Classic Masterpieces Reference Excerpts + Status */}
          <div className="pt-2 border-t border-[#1E293B]/80 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 whitespace-nowrap mr-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {tr(lang, '12首经典名曲参考：', '12 Classic Masterpieces:')}
                </span>
              </span>
              {CLASSIC_REPERTOIRE.map((excerpt) => {
                const isSelected = project.styleId === excerpt.id;
                const cEn = CLASSIC_EN_MAP[excerpt.id];
                return (
                  <button
                    key={excerpt.id}
                    type="button"
                    onClick={() => handleLoadClassicExcerpt(excerpt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                        : 'bg-[#0B0F17] text-slate-300 border-[#1E293B] hover:border-emerald-500/40'
                    }`}
                  >
                    {lang === 'en' && cEn
                      ? cEn.title.split(' (')[0]
                      : `《${excerpt.title.split(' ')[0]}》`}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-400 truncate max-w-md shrink-0">
              {statusMessage}
            </div>
          </div>
        </div>

        {/* TAB 1: WORKSTATION VIEW */}
        {activeTab === 'workstation' && (
          <div className="space-y-5">
            {/* Algorithmic Calculation, Randomization & Arrangement Assistant Bar */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              {/* Left 7 cols: Smart Calculation & Random Inspiration Buttons */}
              <div className="xl:col-span-7 bg-[#131A26] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-slate-100">
                      {tr(
                        lang,
                        '智能随机作曲与细节填充引擎 (16小节 · 10轨协同)',
                        'Algorithmic Composition & Detail Engine (Up to 16 Bars · 10 Tracks)'
                      )}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDeepRandomize}
                      className="px-3 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={tr(
                        lang,
                        '随机切换和声进行、旋律轮廓、动机种子与多轨节奏型',
                        'Randomize chord progression, motif contour, and multi-track grooves'
                      )}
                    >
                      <Dices className="w-3.5 h-3.5" />
                      <span>
                        {tr(lang, '深度随机灵感重构', 'Deep Randomize')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMotifWorkshop((v) => !v)}
                      className="px-2.5 py-1 rounded-lg bg-[#0B0F17] hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>{tr(lang, '主导动机工坊', 'Motif Workshop')}</span>
                      {showMotifWorkshop ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleAutoCompleteTrack('melody', true)}
                    className="p-3 rounded-lg bg-[#0B0F17] hover:bg-amber-500/15 border border-[#1E293B] hover:border-amber-500/40 text-left transition-colors group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-amber-400 group-hover:text-amber-300 flex items-center justify-between">
                      <span>
                        {tr(lang, '1. 动机延展与补齐', '1. Extend Melody')}
                      </span>
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {tr(
                        lang,
                        '保留前段动机，随机推演后续小节并填充经过音',
                        'Keep seed notes & auto-fill remaining bars with ornaments'
                      )}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleInferChordsFromMelody}
                    className="p-3 rounded-lg bg-[#0B0F17] hover:bg-emerald-500/15 border border-[#1E293B] hover:border-emerald-500/40 text-left transition-colors group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center justify-between">
                      <span>
                        {tr(lang, '2. 旋律反推和弦', '2. Harmonize Melody')}
                      </span>
                      <Music2 className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {tr(
                        lang,
                        '分析各小节骨干音，反推最佳和弦并更新伴奏轨',
                        'Infer best-fitting chords from melody & sync accompaniment'
                      )}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAutoCompleteTrack('counter', false)}
                    className="p-3 rounded-lg bg-[#0B0F17] hover:bg-sky-500/15 border border-[#1E293B] hover:border-sky-500/40 text-left transition-colors group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-sky-400 group-hover:text-sky-300 flex items-center justify-between">
                      <span>
                        {tr(lang, '3. 随机对位与琶音', '3. Counter & Arpeggio')}
                      </span>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {tr(
                        lang,
                        '随机生成三度/六度副旋律对位与华彩琶音织体',
                        'Generate 3rd/6th counter-melody & flowing arpeggios'
                      )}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAutoCompleteTrack('rhythm', false)}
                    className="p-3 rounded-lg bg-[#0B0F17] hover:bg-rose-500/15 border border-[#1E293B] hover:border-rose-500/40 text-left transition-colors group cursor-pointer"
                  >
                    <div className="text-xs font-bold text-rose-400 group-hover:text-rose-300 flex items-center justify-between">
                      <span>
                        {tr(lang, '4. 随机节奏与加花', '4. Drum Groove & Fills')}
                      </span>
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      {tr(
                        lang,
                        '计算欧几里得变奏鼓组与每4小节随机过门加花',
                        'Compute Euclidean drum patterns & 4-bar turnarounds'
                      )}
                    </p>
                  </button>
                </div>
              </div>

              {/* Right 5 cols: Algorithmic Parameter Sliders (including Randomness & Detail Density) */}
              <div className="xl:col-span-5 bg-[#131A26] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-bold text-slate-100">
                      {tr(
                        lang,
                        '随机发散度与编曲细节参数',
                        'Randomness & Arrangement Detail Parameters'
                      )}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 bg-[#0B0F17] p-0.5 rounded-lg border border-[#1E293B]">
                    {(
                      [
                        {
                          id: 'arpeggio',
                          label: tr(lang, '流水琶音', 'Arpeggio'),
                        },
                        {
                          id: 'sustained',
                          label: tr(lang, '交响长音', 'Sustained'),
                        },
                        {
                          id: 'rhythmic',
                          label: tr(lang, '律动切分', 'Rhythmic'),
                        },
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          const nextProj: ProjectState = {
                            ...project,
                            algorithmParams: {
                              ...project.algorithmParams,
                              chordStyle: mode.id,
                            },
                          };
                          const { chordNotes, bassNotes } =
                            calculateChordsAndBassTracks(nextProj);
                          setProject({
                            ...nextProj,
                            tracks: nextProj.tracks.map((t) =>
                              t.role === 'chords'
                                ? { ...t, notes: chordNotes }
                                : t.role === 'bass'
                                ? { ...t, notes: bassNotes }
                                : t
                            ),
                          });
                        }}
                        className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          project.algorithmParams.chordStyle === mode.id
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">
                        {tr(lang, '随机发散度', 'Entropy')}
                      </span>
                      <span className="font-mono text-purple-400 font-bold">
                        {Math.round(
                          (project.algorithmParams.randomness ?? 0.72) * 100
                        )}
                        %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={100}
                      value={Math.round(
                        (project.algorithmParams.randomness ?? 0.72) * 100
                      )}
                      onChange={(e) => {
                        const val = Number(e.target.value) / 100;
                        setProject({
                          ...project,
                          algorithmParams: {
                            ...project.algorithmParams,
                            randomness: val,
                          },
                        });
                      }}
                      className="w-full accent-purple-400 cursor-pointer"
                    />
                  </div>

                  <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">
                        {tr(lang, '细节装饰度', 'Ornaments')}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {Math.round(
                          (project.algorithmParams.ornamentDensity ?? 0.62) * 100
                        )}
                        %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(
                        (project.algorithmParams.ornamentDensity ?? 0.62) * 100
                      )}
                      onChange={(e) => {
                        const val = Number(e.target.value) / 100;
                        setProject({
                          ...project,
                          algorithmParams: {
                            ...project.algorithmParams,
                            ornamentDensity: val,
                          },
                        });
                      }}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>

                  <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">
                        {tr(lang, '旋律密集度', 'Melody')}
                      </span>
                      <span className="font-mono text-amber-400 font-bold">
                        {Math.round(project.algorithmParams.melodyDensity * 100)}
                        %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={95}
                      value={Math.round(
                        project.algorithmParams.melodyDensity * 100
                      )}
                      onChange={(e) => {
                        const val = Number(e.target.value) / 100;
                        setProject({
                          ...project,
                          algorithmParams: {
                            ...project.algorithmParams,
                            melodyDensity: val,
                          },
                        });
                      }}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">
                        {tr(lang, '鼓点律动感', 'Rhythm')}
                      </span>
                      <span className="font-mono text-rose-400 font-bold">
                        {Math.round(
                          project.algorithmParams.rhythmIntensity * 100
                        )}
                        %
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={95}
                      value={Math.round(
                        project.algorithmParams.rhythmIntensity * 100
                      )}
                      onChange={(e) => {
                        const val = Number(e.target.value) / 100;
                        setProject({
                          ...project,
                          algorithmParams: {
                            ...project.algorithmParams,
                            rhythmIntensity: val,
                          },
                        });
                      }}
                      className="w-full accent-rose-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Leitmotif & Theme Fragment Workshop (Collapsible, open by default) */}
            {showMotifWorkshop && (
              <MotifWorkshop
                project={project}
                lang={lang}
                onApplyMotifToProject={handleApplyMotifToProject}
              />
            )}

            {/* Up-to-10-Track Multi-Instrument Mixer with Track Merge, Volume, Fidelity & Reverb */}
            <div className="bg-[#131A26] border border-[#1E293B] rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-[#0E1420] border-b border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-semibold text-slate-200">
                    {tr(
                      lang,
                      `多轨总览与乐器音色配置 (${project.tracks.length} / 10 轨 · 支持双轨合并防重叠 / 音量 / 保真度 / 混响)`,
                      `Multi-Track Overview & Timbre Mixer (${project.tracks.length} / 10 Tracks · Merge Tracks / Volume / Fidelity / Reverb)`
                    )}
                  </span>

                  {/* Add Track Button (Up to 10 Tracks) */}
                  <button
                    type="button"
                    onClick={handleAddTrack}
                    disabled={project.tracks.length >= 10}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                      project.tracks.length >= 10
                        ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                        : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {project.tracks.length >= 10
                        ? tr(lang, '已达 10 轨上限', 'Max 10 Tracks')
                        : tr(
                            lang,
                            `添加新音轨 (${project.tracks.length}/10)`,
                            `Add Track (${project.tracks.length}/10)`
                          )}
                    </span>
                  </button>

                  {/* Merge Tracks Button ("合并轨道") */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMergeIds.length === 2) {
                        handleExecuteMergeTracks(
                          selectedMergeIds[0],
                          selectedMergeIds[1]
                        );
                      } else {
                        setShowMergeBar((v) => !v);
                      }
                    }}
                    disabled={project.tracks.length < 2}
                    className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                      project.tracks.length < 2
                        ? 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed'
                        : selectedMergeIds.length === 2
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : showMergeBar
                        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                    }`}
                    title={tr(
                      lang,
                      '将任意两条选中的音轨合并为一个轨道，并自动消除同音碰撞、时值重叠与不协和音簇',
                      'Merge any two selected tracks into one and automatically resolve note overlaps'
                    )}
                  >
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>
                      {selectedMergeIds.length === 2
                        ? tr(
                            lang,
                            '立即合并已选双轨 (2/2)',
                            'Merge Selected Tracks (2/2)'
                          )
                        : selectedMergeIds.length === 1
                        ? tr(
                            lang,
                            '合并轨道 (已勾选 1/2)',
                            'Merge Tracks (1/2 Selected)'
                          )
                        : tr(lang, '合并轨道', 'Merge Tracks')}
                    </span>
                  </button>
                </div>

                {/* Global Acoustic Hall Selector + Chord Progression Selector */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">
                      {tr(lang, '声学厅堂：', 'Acoustic Hall:')}
                    </span>
                    <select
                      value={project.hallType || 'golden_hall'}
                      onChange={(e) => {
                        const nextHall = e.target.value as AcousticHallType;
                        handleUpdateMasterAcoustics(
                          project.masterFidelity ?? 0.95,
                          project.masterReverb ?? 0.5,
                          nextHall
                        );
                        const hObj = ACOUSTIC_HALL_PRESETS.find(
                          (h) => h.id === nextHall
                        );
                        const hName =
                          lang === 'en'
                            ? HALL_EN_MAP[nextHall]?.name || hObj?.name || ''
                            : hObj?.name || '';
                        setStatusMessage(
                          tr(
                            lang,
                            `已切换声学空间模型为「${hName}」`,
                            `Switched acoustic hall model to "${hName}".`
                          )
                        );
                      }}
                      className="px-2 py-1 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-xs text-sky-300 font-medium focus:outline-none focus:border-amber-500"
                    >
                      {ACOUSTIC_HALL_PRESETS.map((h) => {
                        const hEn = HALL_EN_MAP[h.id];
                        return (
                          <option key={h.id} value={h.id}>
                            {lang === 'en' && hEn
                              ? `${hEn.name} (${hEn.subtitle.split(' ')[0]})`
                              : `${h.name} (${h.subtitle.split(' ')[0]})`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">
                      {tr(lang, '和弦走向：', 'Progression:')}
                    </span>
                    <select
                      value={project.progressionId}
                      onChange={(e) => handleChangeProgression(e.target.value)}
                      className="px-2 py-1 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
                      aria-label={tr(
                        lang,
                        '选择和弦进行模板',
                        'Chord Progression Template'
                      )}
                    >
                      {CHORD_PROGRESSIONS.map((prog) => {
                        const pEn = PROGRESSION_EN_MAP[prog.id];
                        return (
                          <option key={prog.id} value={prog.id}>
                            {lang === 'en' && pEn
                              ? `${pEn.name} — ${pEn.tag}`
                              : `${prog.name} — ${prog.tag}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              {/* Interactive Merge Tracks Bar (Shown when clicking "合并轨道" or when selecting tracks to merge) */}
              {(showMergeBar || selectedMergeIds.length > 0) &&
                project.tracks.length >= 2 && (
                  <div className="px-4 py-2.5 bg-emerald-950/30 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>
                          {tr(
                            lang,
                            '双轨合并与重叠音符自动消解：',
                            'Track Merger & Auto Overlap Resolver:'
                          )}
                        </span>
                      </span>
                      <span className="text-slate-300">
                        {tr(lang, '保留主轨道 A', 'Primary Track A')}
                      </span>
                      <select
                        value={selectedMergeIds[0] || mergePrimaryId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMergePrimaryId(val);
                          if (selectedMergeIds.length >= 1) {
                            setSelectedMergeIds((prev) => [
                              val,
                              ...(prev[1] && prev[1] !== val ? [prev[1]] : []),
                            ]);
                          }
                        }}
                        className="px-2 py-1 bg-[#0B0F17] border border-emerald-500/40 rounded-lg text-xs text-amber-300 font-semibold focus:outline-none"
                      >
                        {project.tracks.map((t, i) => (
                          <option key={t.id} value={t.id}>
                            {i + 1}. {t.name.split(' ')[0]} ({t.notes.length}{' '}
                            {tr(lang, '音符', 'notes')})
                          </option>
                        ))}
                      </select>

                      <span className="text-slate-400">+</span>
                      <span className="text-slate-300">
                        {tr(lang, '并入副轨道 B', 'Merge Track B')}
                      </span>
                      <select
                        value={
                          selectedMergeIds[1] ||
                          (mergeSecondaryId !==
                          (selectedMergeIds[0] || mergePrimaryId)
                            ? mergeSecondaryId
                            : project.tracks.find(
                                (t) =>
                                  t.id !==
                                  (selectedMergeIds[0] || mergePrimaryId)
                              )?.id || '')
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          setMergeSecondaryId(val);
                          const primary =
                            selectedMergeIds[0] || mergePrimaryId;
                          if (primary && primary !== val) {
                            setSelectedMergeIds([primary, val]);
                          }
                        }}
                        className="px-2 py-1 bg-[#0B0F17] border border-emerald-500/40 rounded-lg text-xs text-emerald-300 font-semibold focus:outline-none"
                      >
                        {project.tracks
                          .filter(
                            (t) =>
                              t.id !== (selectedMergeIds[0] || mergePrimaryId)
                          )
                          .map((t) => {
                            const origIdx = project.tracks.findIndex(
                              (x) => x.id === t.id
                            );
                            return (
                              <option key={t.id} value={t.id}>
                                {origIdx + 1}. {t.name.split(' ')[0]} (
                                {t.notes.length} {tr(lang, '音符', 'notes')})
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-400 hidden lg:inline">
                        {tr(
                          lang,
                          '自动执行：同音碰撞融合 · 尾音重叠截断 · 单音旋律防打架 · 小二度音簇过滤',
                          'Auto-resolves: same-pitch collisions · overlapping tails · monophonic lead clashes · 2nd clusters'
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const idA = selectedMergeIds[0] || mergePrimaryId;
                          const idB =
                            selectedMergeIds[1] ||
                            (mergeSecondaryId !== idA
                              ? mergeSecondaryId
                              : project.tracks.find((t) => t.id !== idA)?.id);
                          handleExecuteMergeTracks(idA, idB);
                        }}
                        className="px-3.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>
                          {tr(
                            lang,
                            '确认合并并消除重叠',
                            'Confirm Merge & Resolve Overlaps'
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMergeIds([]);
                          setShowMergeBar(false);
                        }}
                        className="px-2.5 py-1 bg-[#0B0F17] hover:bg-slate-800 text-slate-400 border border-[#1E293B] text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        {tr(lang, '取消', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}

              <div className="divide-y divide-[#1E293B]">
                {project.tracks.map((track, idx) => {
                  const isSelected = track.id === activeTrackId;
                  const isCheckedForMerge = selectedMergeIds.includes(track.id);
                  const totalSteps = project.bars * 16;
                  const volPercent = Math.round(track.volume * 100);
                  const fidPercent = Math.round((track.fidelity ?? 0.94) * 100);
                  const revPercent = Math.round((track.reverbSend ?? 0.48) * 100);
                  const roleEn = ROLE_EN_MAP[track.role];

                  return (
                    <div
                      key={track.id}
                      onClick={() => setActiveTrackId(track.id)}
                      className={`flex flex-col xl:flex-row items-stretch xl:items-center transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#182234]'
                          : 'bg-[#131A26] hover:bg-[#161E2E]'
                      }`}
                    >
                      {/* Track Header, Merge Checkbox, Role Selector, Instrument Selector & Full Volume + Fidelity + Reverb Controls */}
                      <div className="w-full xl:w-[905px] shrink-0 px-3.5 py-2 border-b xl:border-b-0 xl:border-r border-[#1E293B] flex flex-wrap items-center justify-between gap-2">
                        {/* 1. Merge Checkbox + Track Index, Name & Note Count */}
                        <div className="flex items-center gap-2 w-[142px] shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleMergeSelect(track.id);
                            }}
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                              isCheckedForMerge
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'bg-[#0B0F17] border-slate-600 hover:border-emerald-400 text-transparent'
                            }`}
                            title={tr(
                              lang,
                              '勾选两条音轨以执行【合并轨道】',
                              'Select 2 tracks to merge them'
                            )}
                            aria-label={tr(
                              lang,
                              `选择 ${track.name} 用于合并轨道`,
                              `Select ${track.name} for merging`
                            )}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>

                          <span
                            className="w-2.5 h-6 rounded-sm shrink-0"
                            style={{ backgroundColor: track.color }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-100 flex items-center gap-1 truncate">
                              <span className="font-mono text-slate-400">
                                {idx + 1}.
                              </span>
                              <span className="truncate">
                                {lang === 'en' && roleEn
                                  ? roleEn.shortLabel
                                  : track.name.split(' ')[0]}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {track.notes.length}{' '}
                              {tr(lang, '音符', 'notes')}
                            </div>
                          </div>
                        </div>

                        {/* 2. Track Role Selector (8 Roles) */}
                        <select
                          value={track.role}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleChangeTrackRole(
                              track.id,
                              e.target.value as TrackRole
                            )
                          }
                          className="w-[92px] shrink-0 px-1.5 py-1.5 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          title={tr(
                            lang,
                            '切换该轨道的声部编曲职能并自动重算音符',
                            'Switch track role and recalculate notes'
                          )}
                        >
                          {TRACK_ROLE_DEFINITIONS.map((rd) => {
                            const rEn = ROLE_EN_MAP[rd.role];
                            return (
                              <option key={rd.role} value={rd.role}>
                                {lang === 'en' && rEn
                                  ? rEn.shortLabel
                                  : rd.shortLabel}
                              </option>
                            );
                          })}
                        </select>

                        {/* 3. Instrument Dropdown (All 28 Instruments categorized) */}
                        <select
                          value={track.instrument}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const newInst = e.target.value as InstrumentId;
                            const prof = getDefaultAcousticProfile(newInst);
                            setProject((prev) => ({
                              ...prev,
                              tracks: prev.tracks.map((t) =>
                                t.id === track.id
                                  ? {
                                      ...t,
                                      instrument: newInst,
                                      fidelity: prof.fidelity,
                                      reverbSend: prof.reverbSend,
                                    }
                                  : t
                              ),
                            }));
                            soundEngine.triggerNote(
                              newInst,
                              track.role === 'rhythm' ? 45 : 64,
                              0.5,
                              0.86,
                              track.volume,
                              0,
                              prof.fidelity,
                              prof.reverbSend
                            );
                          }}
                          className="w-[175px] shrink-0 px-2 py-1.5 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
                        >
                          {INSTRUMENT_CATEGORIES.map((cat) => (
                            <optgroup
                              key={cat.id}
                              label={
                                lang === 'en'
                                  ? INSTRUMENT_CATEGORY_EN[cat.id]
                                  : cat.label
                              }
                            >
                              {INSTRUMENTS.filter(
                                (i) => i.category === cat.id
                              ).map((inst) => {
                                const iEn = INSTRUMENT_EN_MAP[inst.id];
                                return (
                                  <option key={inst.id} value={inst.id}>
                                    {lang === 'en' && iEn
                                      ? `${iEn.name}`
                                      : `${inst.name} (${
                                          inst.subtitle.split(' · ')[1] ||
                                          inst.categoryLabel
                                        })`}
                                  </option>
                                );
                              })}
                            </optgroup>
                          ))}
                        </select>

                        {/* 4. Mute, Solo, Volume Slider, Fidelity Slider, Reverb Slider & Delete */}
                        <div
                          className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 bg-[#0B0F17] px-2.5 py-1.5 rounded-lg border border-[#1E293B]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setProject((prev) => ({
                                ...prev,
                                tracks: prev.tracks.map((t) =>
                                  t.id === track.id
                                    ? { ...t, muted: !t.muted }
                                    : t
                                ),
                              }))
                            }
                            className={`px-1.5 py-1 rounded text-xs font-mono font-semibold border transition-colors cursor-pointer shrink-0 ${
                              track.muted
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-[#131A26] text-slate-300 border-[#1E293B] hover:text-white'
                            }`}
                            title={tr(lang, '静音本轨 (Mute)', 'Mute Track')}
                          >
                            {track.muted ? (
                              <VolumeX className="w-3.5 h-3.5" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setProject((prev) => ({
                                ...prev,
                                tracks: prev.tracks.map((t) =>
                                  t.id === track.id
                                    ? { ...t, solo: !t.solo }
                                    : t
                                ),
                              }))
                            }
                            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold border transition-colors cursor-pointer shrink-0 ${
                              track.solo
                                ? 'bg-amber-500 text-slate-950 border-amber-500'
                                : 'bg-[#131A26] text-slate-400 border-[#1E293B] hover:text-slate-200'
                            }`}
                            title={tr(lang, '独奏本轨 (Solo)', 'Solo Track')}
                          >
                            {tr(lang, '独奏', 'Solo')}
                          </button>

                          {/* Volume Slider */}
                          <div
                            className="flex items-center gap-1 shrink-0"
                            title={tr(lang, '轨道音量 (Volume)', 'Track Volume')}
                          >
                            <span className="text-[10px] text-slate-400">
                              {tr(lang, '音量', 'Vol')}
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={volPercent}
                              onChange={(e) => {
                                const v = Number(e.target.value) / 100;
                                setProject((prev) => ({
                                  ...prev,
                                  tracks: prev.tracks.map((t) =>
                                    t.id === track.id ? { ...t, volume: v } : t
                                  ),
                                }));
                              }}
                              className="w-16 h-1.5 accent-amber-500 cursor-pointer shrink-0"
                              aria-label={`${track.name} Volume`}
                            />
                            <span className="w-7 text-right text-[10px] font-mono text-amber-400 font-semibold shrink-0">
                              {volPercent}%
                            </span>
                          </div>

                          {/* Fidelity Slider (音色保真度) */}
                          <div
                            className="flex items-center gap-1 shrink-0 border-l border-[#1E293B] pl-2"
                            title={tr(
                              lang,
                              '物理建模音色保真度：调节古典乐器木质共鸣箱、高次泛音列与擦弦/拨弦瞬态细腻度',
                              'Acoustic Fidelity: Wood body formants, harmonic warmth & bow/pluck transient detail'
                            )}
                          >
                            <span className="text-[10px] text-emerald-300">
                              {tr(lang, '保真', 'Fid')}
                            </span>
                            <input
                              type="range"
                              min={20}
                              max={100}
                              value={fidPercent}
                              onChange={(e) => {
                                const f = Number(e.target.value) / 100;
                                setProject((prev) => ({
                                  ...prev,
                                  tracks: prev.tracks.map((t) =>
                                    t.id === track.id
                                      ? { ...t, fidelity: f }
                                      : t
                                  ),
                                }));
                              }}
                              className="w-14 h-1.5 accent-emerald-400 cursor-pointer shrink-0"
                              aria-label={`${track.name} Fidelity`}
                            />
                            <span className="w-7 text-right text-[10px] font-mono text-emerald-400 font-semibold shrink-0">
                              {fidPercent}%
                            </span>
                          </div>

                          {/* Reverb Slider (空间混响深度) */}
                          <div
                            className="flex items-center gap-1 shrink-0 border-l border-[#1E293B] pl-2"
                            title={tr(
                              lang,
                              '单轨空间厅堂混响发送量 (Reverb Send)',
                              'Track Acoustic Hall Reverb Send'
                            )}
                          >
                            <span className="text-[10px] text-sky-300">
                              {tr(lang, '混响', 'Rev')}
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={revPercent}
                              onChange={(e) => {
                                const r = Number(e.target.value) / 100;
                                setProject((prev) => ({
                                  ...prev,
                                  tracks: prev.tracks.map((t) =>
                                    t.id === track.id
                                      ? { ...t, reverbSend: r }
                                      : t
                                  ),
                                }));
                              }}
                              className="w-14 h-1.5 accent-sky-400 cursor-pointer shrink-0"
                              aria-label={`${track.name} Reverb`}
                            />
                            <span className="w-7 text-right text-[10px] font-mono text-sky-400 font-semibold shrink-0">
                              {revPercent}%
                            </span>
                          </div>

                          {project.tracks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTrack(track.id)}
                              className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                              title={tr(lang, '删除此音轨', 'Remove Track')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Mini Note Overview Strip across all bars (up to 16 bars) */}
                      <div className="flex-1 h-12 relative bg-[#090D14]/60 overflow-hidden min-w-[140px]">
                        <div
                          className="absolute inset-0 grid pointer-events-none"
                          style={{
                            gridTemplateColumns: `repeat(${project.bars}, 1fr)`,
                          }}
                        >
                          {Array.from({ length: project.bars }).map(
                            (_, bIdx) => (
                              <div
                                key={bIdx}
                                className={`border-r h-full ${
                                  (bIdx + 1) % 4 === 0
                                    ? 'border-slate-600/80'
                                    : 'border-[#1E293B]/60'
                                }`}
                              />
                            )
                          )}
                        </div>

                        {/* Playhead indicator */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 pointer-events-none"
                          style={{
                            left: `${(currentStep / totalSteps) * 100}%`,
                          }}
                        />

                        {/* Mini notes */}
                        {track.notes.map((n) => {
                          const leftPct = (n.startStep / totalSteps) * 100;
                          const widthPct = Math.max(
                            0.5,
                            (n.durationSteps / totalSteps) * 100
                          );
                          const normY = Math.max(
                            0.08,
                            Math.min(0.88, 1 - (n.pitch - 36) / 48)
                          );
                          return (
                            <div
                              key={n.id}
                              className="absolute h-1.5 rounded-full pointer-events-none"
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                top: `${normY * 38 + 4}px`,
                                backgroundColor: track.color,
                                opacity: track.muted ? 0.25 : 0.88,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Beginner-Friendly Piano Roll & Percussion Sequencer */}
            <PianoRollEditor
              project={project}
              activeTrackId={activeTrackId}
              currentStep={currentStep}
              isPlaying={isPlaying}
              lang={lang}
              onUpdateTrackNotes={handleUpdateTrackNotes}
              onAutoCompleteTrack={handleAutoCompleteTrack}
            />
          </div>
        )}

        {/* TAB 2: SCENE AUTO-MATCHER, SCENE PRESETS & CLASSIC REPERTOIRE */}
        {activeTab === 'wizard' && (
          <div className="space-y-8">
            {/* Section 1: Intelligent Auto-Scene Matcher */}
            <div className="bg-[#131A26] border border-[#1E293B] rounded-xl p-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                    <Compass className="w-4 h-4" />
                    <span>
                      {tr(
                        lang,
                        '智能画面与场景配乐匹配引擎',
                        'Intelligent Scene & Mood Scoring Matcher'
                      )}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 mt-1">
                    {tr(
                      lang,
                      '01. 自动匹配场景编曲 (描述您的画面或勾选场景特征)',
                      '01. Auto-Match Scene Arrangement (Describe Your Scene or Pick Tags)'
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tr(
                      lang,
                      '输入任何故事画面描述（如“紫禁城登基大典钟磬”、“仙侠御剑飞行”、“太空黑洞远征”、“8bit像素闯关”、“森林精灵吟唱”），系统将自动计算最佳多轨乐器编制、调式、速度与和弦走向。',
                      'Enter any scene keywords (e.g., "Forbidden City ceremony", "Xianxia sword flight", "Space odyssey", "8-bit dungeon", "Elven forest") to automatically configure multi-track orchestration, scale, tempo, and harmony.'
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full lg:w-auto">
                  <input
                    type="text"
                    value={sceneQuery}
                    onChange={(e) => setSceneQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAutoMatchScene();
                    }}
                    placeholder={tr(
                      lang,
                      '输入画面关键词，如：仙侠御剑、朝堂钟磬、太空歌剧...',
                      'Type scene keywords: palace, xianxia, dragon, space, 8bit...'
                    )}
                    className="flex-1 lg:w-80 px-3.5 py-2.5 bg-[#0B0F17] border border-[#1E293B] rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAutoMatchScene}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {tr(lang, '自动匹配场景并编曲', 'Auto-Match & Arrange')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Scene Dimension Tags */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SCENE_DIMENSION_TAGS.map((group) => (
                  <div
                    key={group.category}
                    className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-3.5 space-y-2"
                  >
                    <div className="text-xs font-semibold text-slate-300">
                      {lang === 'en'
                        ? SCENE_CATEGORY_TITLE_EN[group.category] ||
                          group.category
                        : group.category}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.tags.map((tag) => {
                        const active = selectedSceneTags.includes(tag);
                        const displayTag =
                          lang === 'en' ? SCENE_TAG_EN_MAP[tag] || tag : tag;
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleSceneTag(tag)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                              active
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold'
                                : 'bg-[#131A26] text-slate-400 border-[#1E293B] hover:text-slate-200'
                            }`}
                          >
                            {active ? `✓ ${displayTag}` : displayTag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: 10 Multi-Track Scene Presets */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {tr(
                    lang,
                    '02. 十大影视/游戏/国风礼乐多轨场景预设 (内置 6–8 轨独立交响配器)',
                    '02. 10 Multi-Track Film, Game & Oriental Ritual Scene Presets (6–8 Tracks)'
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {tr(
                    lang,
                    '每个场景均针对具体画面氛围精心编排了主旋律、副歌对位、流水琶音、交响/人声铺底、金石点缀、低音与打击乐轨道。',
                    'Each preset configures Lead Melody, Counter-Melody, Arpeggios, Choir/String Pads, Bell Accents, Bass, and Percussion.'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SCENE_PRESETS.map((scene) => {
                  const isCurrent = project.sceneId === scene.id;
                  const sEn = SCENE_EN_MAP[scene.id];
                  const scaleName =
                    lang === 'en'
                      ? SCALE_EN_MAP[scene.scale]?.name
                      : SCALES.find((s) => s.id === scene.scale)?.name;

                  return (
                    <div
                      key={scene.id}
                      className={`bg-[#131A26] border rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors ${
                        isCurrent
                          ? 'border-amber-500/70'
                          : 'border-[#1E293B] hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-amber-400 font-semibold">
                            {lang === 'en' && sEn
                              ? `${sEn.categoryLabel} · ${scene.tracksSpec.length} Tracks`
                              : `${scene.categoryLabel} · ${scene.tracksSpec.length} 轨大型编制`}
                          </span>
                          <span className="text-slate-400">
                            {scene.bpm} BPM · {scaleName}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-100">
                          {lang === 'en' && sEn ? sEn.name : scene.name}
                        </h3>
                        <p className="text-xs text-emerald-300/90 leading-relaxed">
                          {tr(lang, '画面意境：', 'Imagery: ')}
                          {lang === 'en' && sEn
                            ? sEn.imagery
                            : scene.visualImagery}
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {lang === 'en' && sEn ? sEn.desc : scene.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#1E293B]">
                        <button
                          type="button"
                          onClick={() => handleApplyScenePreset(scene, 8)}
                          className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          {tr(lang, '载入 8 小节场景编曲', 'Load 8-Bar Scene')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyScenePreset(scene, 16)}
                          className="flex-1 py-2 px-3 bg-[#0B0F17] hover:bg-slate-800 text-amber-300 border border-amber-500/40 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          {tr(lang, '载入 16 小节完整长曲', 'Load 16-Bar Epic')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: 12 Classic Masterpiece Excerpts Reference Library */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {tr(
                    lang,
                    '03. 十二首中外传世经典名曲参考库 (一键载入多轨总谱进行改编或续写)',
                    '03. 12 World & Chinese Classical Masterpieces (One-Click Multi-Track Score)'
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {tr(
                    lang,
                    '涵盖《茉莉花》、《春江花月夜》、《沧海一声笑》、帕赫贝尔《D大调卡农》、贝多芬《欢乐颂》、维瓦尔第《四季·春》、格里格《在山魔王的宫殿里》、柴可夫斯基《天鹅湖》、巴赫《d小调托卡塔与赋格》、《绿袖子》、《渔舟唱晚》等经典杰作。',
                    'Includes Jasmine Flower, Moonlight on the Spring River, Vivaldi’s Spring, Ode to Joy, In the Hall of the Mountain King, Canon in D, Swan Lake, Bach’s Toccata & Fugue in D Minor, Greensleeves, and more.'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {CLASSIC_REPERTOIRE.map((excerpt) => {
                  const isCurrent = project.styleId === excerpt.id;
                  const melInst = getInstrumentById(
                    excerpt.trackInstruments.melody
                  );
                  const chdInst = getInstrumentById(
                    excerpt.trackInstruments.chords
                  );
                  const cEn = CLASSIC_EN_MAP[excerpt.id];
                  const melName =
                    lang === 'en'
                      ? INSTRUMENT_EN_MAP[melInst.id]?.name || melInst.name
                      : melInst.name;
                  const chdName =
                    lang === 'en'
                      ? INSTRUMENT_EN_MAP[chdInst.id]?.name || chdInst.name
                      : chdInst.name;

                  return (
                    <div
                      key={excerpt.id}
                      className={`bg-[#131A26] border rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors ${
                        isCurrent
                          ? 'border-emerald-500/70'
                          : 'border-[#1E293B] hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-emerald-400 font-semibold">
                            {lang === 'en' && cEn ? cEn.tag : excerpt.tag}
                          </span>
                          <span className="text-slate-400">
                            {excerpt.bpm} BPM · {excerpt.bars}{' '}
                            {tr(lang, '小节', 'Bars')}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-100">
                          {lang === 'en' && cEn ? cEn.title : excerpt.title}
                        </h3>
                        <div className="text-xs text-amber-300/90 font-medium">
                          {lang === 'en' && cEn
                            ? cEn.composer
                            : excerpt.composerOrOrigin}{' '}
                          · {tr(lang, '主音：', 'Lead: ')}
                          {melName} / {tr(lang, '伴奏：', 'Chords: ')}
                          {chdName}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {lang === 'en' && cEn ? cEn.desc : excerpt.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLoadClassicExcerpt(excerpt)}
                        className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        {tr(
                          lang,
                          `载入《${excerpt.title.split(' ')[0]}》至工作台参考创作`,
                          `Load "${
                            cEn ? cEn.title.split(' (')[0] : excerpt.title
                          }" into Workstation`
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: 7 Classic Chord Progression Assistants */}
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {tr(
                    lang,
                    '04. 经典和弦走向向导 (点击任意小节可实时试听和弦色彩)',
                    '04. Classic Chord Progression Templates (Click Any Bar to Audition)'
                  )}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CHORD_PROGRESSIONS.map((prog) => {
                  const isSelected = project.progressionId === prog.id;
                  const pEn = PROGRESSION_EN_MAP[prog.id];
                  return (
                    <div
                      key={prog.id}
                      className={`bg-[#131A26] border rounded-xl p-5 flex flex-col justify-between gap-4 ${
                        isSelected ? 'border-amber-500/60' : 'border-[#1E293B]'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-slate-100">
                            {lang === 'en' && pEn ? pEn.name : prog.name}
                          </h3>
                          <span className="text-xs text-amber-400 font-medium">
                            {lang === 'en' && pEn ? pEn.tag : prog.tag}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {lang === 'en' && pEn ? pEn.desc : prog.description}
                        </p>

                        <div className="grid grid-cols-4 gap-2 pt-2">
                          {prog.bars4.map((b, idx) => {
                            const absPc =
                              (project.rootNote + b.rootOffset) % 12;
                            const cName =
                              PITCH_CLASS_NAMES[absPc] +
                              (b.chordType === 'minor'
                                ? 'm'
                                : b.chordType === 'sus4'
                                ? 'sus4'
                                : '');
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  soundEngine.init();
                                  const rootMidi = 60 + absPc;
                                  getChordIntervals(b.chordType).forEach(
                                    (iv, i) => {
                                      soundEngine.triggerNote(
                                        'grand_piano',
                                        rootMidi + iv,
                                        0.8,
                                        0.8,
                                        0.85,
                                        i * 0.04
                                      );
                                    }
                                  );
                                }}
                                className="p-2 bg-[#0B0F17] hover:bg-amber-500/15 border border-[#1E293B] rounded-lg text-left transition-colors cursor-pointer"
                              >
                                <div className="text-xs font-mono font-bold text-amber-400">
                                  {cName} ({b.roman})
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {b.functionHint}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1E293B]">
                        <button
                          type="button"
                          onClick={() => {
                            prog.bars4.forEach((b, idx) => {
                              const absPc =
                                (project.rootNote + b.rootOffset) % 12;
                              const rootMidi = 60 + absPc;
                              getChordIntervals(b.chordType).forEach((iv) => {
                                soundEngine.triggerNote(
                                  'grand_piano',
                                  rootMidi + iv,
                                  0.5,
                                  0.78,
                                  0.85,
                                  idx * 0.55
                                );
                              });
                            });
                          }}
                          className="px-3 py-1.5 bg-[#0B0F17] hover:bg-slate-800 text-slate-200 border border-[#1E293B] rounded-lg text-xs font-medium cursor-pointer"
                        >
                          {tr(lang, '连续试听 4 小节进行', 'Audition 4-Bar Cycle')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleChangeProgression(prog.id);
                            setActiveTab('workstation');
                          }}
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs cursor-pointer"
                        >
                          {tr(lang, '套用此和弦走向', 'Apply Progression')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INSTRUMENT VAULT VIEW */}
        {activeTab === 'instruments' && (
          <InstrumentVault
            project={project}
            lang={lang}
            onAssignInstrument={handleAssignInstrument}
            onUpdateMasterAcoustics={handleUpdateMasterAcoustics}
          />
        )}

        {/* TAB 4: EXPORT & SOURCE CODE VIEW */}
        {activeTab === 'export' && (
          <ExportStudio project={project} lang={lang} />
        )}
      </main>

      {/* Clean Studio Footer */}
      <footer className="mt-auto px-6 py-4 border-t border-[#1E293B] bg-[#0E1420] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div>
          {tr(
            lang,
            '灵韵工坊 LingYun Studio · 支持任意双轨一键合并与重叠消解 · 主导动机发展 · 单轨保真度与混响调节 · 中英双语工作台',
            'LingYun Studio · Track Merging & Overlap Resolution · Leitmotif Development · Acoustic Fidelity & Hall Reverb · Bilingual'
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleAuditionChordSlot(0)}
            className="hover:text-slate-200 transition-colors cursor-pointer"
          >
            {tr(lang, '试听主和弦', 'Audition Tonic Chord')}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => downloadMidiFile(project)}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            {tr(lang, '快速下载 MIDI (.mid)', 'Download MIDI (.mid)')}
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => downloadH5SourceFile(project)}
            className="hover:text-emerald-400 transition-colors cursor-pointer"
          >
            {tr(lang, '快速下载 H5 源码 (.html)', 'Download HTML5 (.html)')}
          </button>
        </div>
      </footer>
    </div>
  );
}
