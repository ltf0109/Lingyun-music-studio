import React, { useState } from 'react';
import {
  AcousticHallType,
  InstrumentCategory,
  InstrumentDefinition,
  InstrumentId,
  ProjectState,
  TrackRole,
} from '../types/music';
import {
  INSTRUMENTS,
  INSTRUMENT_CATEGORIES,
  PERCUSSION_PADS,
  midiToNoteName,
} from '../data/instruments';
import { ACOUSTIC_HALL_PRESETS, soundEngine } from '../audio/soundEngine';
import {
  HALL_EN_MAP,
  INSTRUMENT_CATEGORY_EN,
  INSTRUMENT_EN_MAP,
  Language,
  tr,
} from '../i18n/translations';
import { Volume2, Check, Music, Sliders } from 'lucide-react';

interface InstrumentVaultProps {
  project: ProjectState;
  lang?: Language;
  onAssignInstrument: (role: TrackRole, instrument: InstrumentId) => void;
  onUpdateMasterAcoustics?: (
    fidelity: number,
    reverb: number,
    hallType: AcousticHallType
  ) => void;
}

export const InstrumentVault: React.FC<InstrumentVaultProps> = ({
  project,
  lang = 'zh',
  onAssignInstrument,
  onUpdateMasterAcoustics,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    InstrumentCategory | 'all'
  >('all');
  const [auditioningId, setAuditioningId] =
    useState<InstrumentId>('string_concerto');
  const [auditionFidelity, setAuditionFidelity] = useState<number>(
    project.masterFidelity ?? 0.96
  );
  const [auditionReverb, setAuditionReverb] = useState<number>(
    project.masterReverb ?? 0.52
  );
  const [selectedHall, setSelectedHall] = useState<AcousticHallType>(
    project.hallType || 'golden_hall'
  );

  const filteredInstruments =
    selectedCategory === 'all'
      ? INSTRUMENTS
      : INSTRUMENTS.filter((i) => i.category === selectedCategory);

  const activeAuditionInst =
    INSTRUMENTS.find((i) => i.id === auditioningId) || INSTRUMENTS[0];
  const activeEn = INSTRUMENT_EN_MAP[activeAuditionInst.id];

  const handlePlayDemoPhrase = (inst: InstrumentDefinition) => {
    setAuditioningId(inst.id);
    soundEngine.init();

    if (inst.id === 'percussion_kit') {
      const pattern = [
        { pitch: 45, delay: 0 },
        { pitch: 50, delay: 0.22 },
        { pitch: 38, delay: 0.44 },
        { pitch: 42, delay: 0.66 },
        { pitch: 45, delay: 0.88 },
        { pitch: 49, delay: 1.1 },
      ];
      pattern.forEach((p) => {
        soundEngine.triggerNote(
          'percussion_kit',
          p.pitch,
          0.25,
          0.88,
          0.9,
          p.delay,
          auditionFidelity,
          auditionReverb
        );
      });
      return;
    }

    const baseMidi = Math.max(
      inst.recommendedRange[0],
      Math.min(
        inst.recommendedRange[1] - 12,
        inst.defaultOctave * 12 + 12 + (project.rootNote % 12)
      )
    );

    const intervals =
      inst.category === 'chinese'
        ? [0, 2, 4, 7, 9, 12]
        : inst.category === 'vocal'
        ? [0, 4, 7, 12, 7]
        : [0, 4, 7, 11, 12];

    intervals.forEach((iv, idx) => {
      const isLast = idx === intervals.length - 1;
      soundEngine.triggerNote(
        inst.id,
        baseMidi + iv,
        isLast ? 0.95 : 0.34,
        0.88,
        0.92,
        idx * 0.24,
        auditionFidelity,
        auditionReverb
      );
    });
  };

  const roleLabels: Array<{ role: TrackRole; zh: string; en: string }> = [
    { role: 'melody', zh: '设为主旋律', en: 'Set Melody' },
    { role: 'counter', zh: '设为副旋律', en: 'Set Counter' },
    { role: 'chords', zh: '设为和弦轨', en: 'Set Chords' },
    { role: 'bass', zh: '设为低音轨', en: 'Set Bass' },
  ];

  return (
    <div className="space-y-6">
      {/* Interactive Acoustic Realism, Fidelity, Reverb & Keyboard Audition Bar */}
      <div className="bg-[#131A26] border border-[#1E293B] rounded-xl p-5 space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <Music className="w-3.5 h-3.5" />
              <span>
                {tr(
                  lang,
                  '高解析物理建模共鸣箱与人声共振峰试听台',
                  'High-Resolution Physical Modeling & Vocal Formant Audition Deck'
                )}
              </span>
              <span>·</span>
              <span>
                {lang === 'en'
                  ? INSTRUMENT_CATEGORY_EN[activeAuditionInst.category]
                  : activeAuditionInst.categoryLabel}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100">
              {lang === 'en' ? activeEn.name : activeAuditionInst.name}{' '}
              <span className="text-sm font-normal text-slate-400">
                {lang === 'en'
                  ? activeEn.subtitle
                  : activeAuditionInst.subtitle}
              </span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'en'
                ? activeEn.desc
                : activeAuditionInst.acousticDescription}{' '}
              <strong>{tr(lang, '编曲建议：', 'Arrangement Tip: ')}</strong>
              {lang === 'en' ? activeEn.tip : activeAuditionInst.beginnerTip}
            </p>
          </div>

          {/* Audition Keys or Percussion Pads */}
          <div className="flex flex-wrap items-center gap-1.5">
            {activeAuditionInst.id === 'percussion_kit'
              ? PERCUSSION_PADS.map((pad) => (
                  <button
                    key={pad.pitch}
                    type="button"
                    onClick={() =>
                      soundEngine.triggerNote(
                        'percussion_kit',
                        pad.pitch,
                        0.3,
                        0.9,
                        0.9,
                        0,
                        auditionFidelity,
                        auditionReverb
                      )
                    }
                    className="px-3 py-2.5 bg-[#0B0F17] hover:bg-amber-500/20 border border-[#1E293B] hover:border-amber-500/50 rounded-lg text-xs font-mono text-slate-200 transition-colors flex flex-col items-center min-w-[74px] cursor-pointer"
                  >
                    <span className="font-semibold text-amber-300">
                      {pad.shortName}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      MIDI {pad.pitch}
                    </span>
                  </button>
                ))
              : [0, 2, 4, 5, 7, 9, 11, 12].map((semitone, idx) => {
                  const base =
                    activeAuditionInst.defaultOctave * 12 +
                    12 +
                    (project.rootNote % 12);
                  const pitch = Math.min(84, Math.max(36, base + semitone));
                  const jianpuNames = [
                    '1 Do',
                    '2 Re',
                    '3 Mi',
                    '4 Fa',
                    '5 Sol',
                    '6 La',
                    '7 Si',
                    '1 Hi',
                  ];
                  return (
                    <button
                      key={semitone}
                      type="button"
                      onClick={() =>
                        soundEngine.triggerNote(
                          activeAuditionInst.id,
                          pitch,
                          0.65,
                          0.88,
                          0.92,
                          0,
                          auditionFidelity,
                          auditionReverb
                        )
                      }
                      className="w-14 h-16 bg-[#0B0F17] hover:bg-amber-500/20 active:scale-95 border border-[#1E293B] hover:border-amber-500/50 rounded-lg flex flex-col items-center justify-between py-2 transition-all cursor-pointer"
                    >
                      <span className="text-[10px] font-mono text-slate-400">
                        {midiToNoteName(pitch)}
                      </span>
                      <span className="text-xs font-bold font-mono text-amber-400">
                        {jianpuNames[idx]}
                      </span>
                    </button>
                  );
                })}
          </div>
        </div>

        {/* Acoustic Realism, Fidelity, Reverb & Hall Space Controls */}
        <div className="pt-4 border-t border-[#1E293B] grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {tr(
                    lang,
                    '音色物理保真度 (木质腔体共鸣/泛音列/瞬态)',
                    'Acoustic Fidelity (Wood Body / Overtones / Transients)'
                  )}
                </span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {Math.round(auditionFidelity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              value={Math.round(auditionFidelity * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                setAuditionFidelity(v);
                soundEngine.setMasterFidelity(v);
                onUpdateMasterAcoustics?.(v, auditionReverb, selectedHall);
              }}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-200">
                {tr(
                  lang,
                  '空间厅堂混响深度 (早期反射 + 尾音混响)',
                  'Concert Hall Reverb Depth (Early + Late Reflections)'
                )}
              </span>
              <span className="font-mono font-bold text-sky-400">
                {Math.round(auditionReverb * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(auditionReverb * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                setAuditionReverb(v);
                soundEngine.setMasterReverb(v);
                onUpdateMasterAcoustics?.(auditionFidelity, v, selectedHall);
              }}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-3 flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-200 mb-1">
              {tr(lang, '声学空间厅堂模型：', 'Acoustic Hall Space Model:')}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ACOUSTIC_HALL_PRESETS.map((hall) => (
                <button
                  key={hall.id}
                  type="button"
                  onClick={() => {
                    soundEngine.init();
                    setSelectedHall(hall.id);
                    soundEngine.setHallType(hall.id);
                    onUpdateMasterAcoustics?.(
                      auditionFidelity,
                      auditionReverb,
                      hall.id
                    );
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer border ${
                    selectedHall === hall.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-[#131A26] text-slate-400 border-[#1E293B] hover:text-slate-200'
                  }`}
                >
                  {lang === 'en' ? HALL_EN_MAP[hall.id].name : hall.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#0E1420] p-1.5 rounded-xl border border-[#1E293B]">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-300 hover:text-white hover:bg-[#131A26]'
          }`}
        >
          {tr(lang, '全部 28 种乐器与人声采样', 'All 28 Instruments & Vocals')}
        </button>
        {INSTRUMENT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-[#131A26]'
            }`}
          >
            {lang === 'en' ? INSTRUMENT_CATEGORY_EN[cat.id] : cat.label}
          </button>
        ))}
      </div>

      {/* Instrument Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredInstruments.map((inst) => {
          const activeTracksUsing = project.tracks.filter(
            (t) => t.instrument === inst.id
          );
          const isAuditioning = auditioningId === inst.id;
          const enInfo = INSTRUMENT_EN_MAP[inst.id];

          return (
            <div
              key={inst.id}
              className={`bg-[#131A26] border rounded-xl p-4 flex flex-col justify-between gap-4 transition-colors ${
                isAuditioning
                  ? 'border-amber-500/60'
                  : 'border-[#1E293B] hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] text-slate-400">
                      {lang === 'en'
                        ? INSTRUMENT_CATEGORY_EN[inst.category]
                        : inst.categoryLabel}{' '}
                      · GM #{inst.gmProgram}
                    </div>
                    <h4 className="text-base font-bold text-slate-100 mt-0.5">
                      {lang === 'en' ? enInfo.name : inst.name}
                    </h4>
                    <div className="text-xs text-amber-400/90 font-medium">
                      {lang === 'en' ? enInfo.subtitle : inst.subtitle}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayDemoPhrase(inst)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{tr(lang, '试听高保真乐句', 'Audition Phrase')}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {lang === 'en' ? enInfo.desc : inst.acousticDescription}
                </p>
                <p className="text-xs text-slate-400">
                  {tr(lang, '推荐音域：', 'Range: ')}
                  {midiToNoteName(inst.recommendedRange[0])} –{' '}
                  {midiToNoteName(inst.recommendedRange[1])} ·{' '}
                  {lang === 'en' ? enInfo.tip : inst.beginnerTip}
                </p>
              </div>

              {/* Assign to Track Actions */}
              <div className="pt-3 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-1.5">
                {inst.id === 'percussion_kit' ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    {tr(
                      lang,
                      '已绑定至打击乐节奏轨道',
                      'Bound to Rhythm Percussion Track'
                    )}
                  </span>
                ) : (
                  roleLabels.map((rl) => {
                    const isAssigned = activeTracksUsing.some(
                      (t) => t.role === rl.role
                    );
                    const labelText = tr(lang, rl.zh, rl.en);
                    return (
                      <button
                        key={rl.role}
                        type="button"
                        onClick={() => {
                          onAssignInstrument(rl.role, inst.id);
                          handlePlayDemoPhrase(inst);
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isAssigned
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-[#0B0F17] hover:bg-slate-800 text-slate-300 border border-[#1E293B]'
                        }`}
                      >
                        {isAssigned ? `✓ ${labelText}` : labelText}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
