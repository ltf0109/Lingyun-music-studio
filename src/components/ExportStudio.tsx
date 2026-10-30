import React, { useMemo, useState } from 'react';
import { ProjectState } from '../types/music';
import {
  downloadMidiFile,
  downloadH5SourceFile,
  generateStandaloneH5Source,
  buildMidiBinary,
} from '../utils/exporters';
import {
  getInstrumentById,
  getScaleById,
  PITCH_CLASS_NAMES,
} from '../data/instruments';
import {
  INSTRUMENT_EN_MAP,
  Language,
  ROLE_EN_MAP,
  SCALE_EN_MAP,
  tr,
} from '../i18n/translations';
import {
  Download,
  Code2,
  Copy,
  Check,
  FileAudio,
  FileCode,
} from 'lucide-react';

interface ExportStudioProps {
  project: ProjectState;
  lang?: Language;
}

export const ExportStudio: React.FC<ExportStudioProps> = ({
  project,
  lang = 'zh',
}) => {
  const [copied, setCopied] = useState(false);

  const h5Source = useMemo(
    () => generateStandaloneH5Source(project),
    [project]
  );
  const midiBytes = useMemo(() => buildMidiBinary(project), [project]);
  const totalNotes = useMemo(
    () => project.tracks.reduce((sum, t) => sum + t.notes.length, 0),
    [project.tracks]
  );

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(h5Source);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = h5Source;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scale = getScaleById(project.scale);
  const scaleName =
    lang === 'en' ? SCALE_EN_MAP[scale.id]?.name || scale.name : scale.name;
  const rootName = PITCH_CLASS_NAMES[project.rootNote % 12];

  return (
    <div className="space-y-6">
      {/* Top 2 Export Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Standard MIDI File Export */}
        <div className="bg-[#131A26] border border-[#1E293B] rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <FileAudio className="w-4 h-4" />
                <span>
                  {tr(
                    lang,
                    '标准多轨 MIDI 工程导出 (SMF Format 1)',
                    'Standard Multi-Track MIDI Export (SMF Format 1)'
                  )}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {midiBytes.length} Bytes · 480 PPQ
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-100">
              {tr(
                lang,
                '导出标准 MIDI 文件 (.mid)',
                'Export Standard MIDI File (.mid)'
              )}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tr(
                lang,
                `包含完整的多轨音符事件、速度轨 (${project.bpm} BPM)、4/4 拍号元数据、各轨道独立通道及 General MIDI 乐器音色号 (Program Change)，可直接拖入 Logic Pro、Cubase、FL Studio、Ableton Live 或 GarageBand 进行后期混音与精修。`,
                `Includes complete multi-track note events, tempo track (${project.bpm} BPM), 4/4 time signature metadata, independent MIDI channels, and General MIDI Program Change numbers for Logic Pro, Cubase, FL Studio, or Ableton Live.`
              )}
            </p>

            {/* MIDI Track Mapping Table */}
            <div className="border border-[#1E293B] rounded-lg overflow-hidden mt-3">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0B0F17] text-slate-400 border-b border-[#1E293B]">
                    <th className="py-2 px-3 font-medium">
                      {tr(lang, '轨道名称', 'Track Name')}
                    </th>
                    <th className="py-2 px-3 font-medium">
                      {tr(lang, '当前音色', 'Instrument')}
                    </th>
                    <th className="py-2 px-3 font-medium text-right">
                      {tr(lang, 'MIDI 通道', 'Channel')}
                    </th>
                    <th className="py-2 px-3 font-medium text-right">
                      {tr(lang, 'GM 音色号', 'GM Prog')}
                    </th>
                    <th className="py-2 px-3 font-medium text-right">
                      {tr(lang, '音符数', 'Notes')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/60 font-mono">
                  {project.tracks.map((t, idx) => {
                    const inst = getInstrumentById(t.instrument);
                    const instTitle =
                      lang === 'en'
                        ? INSTRUMENT_EN_MAP[inst.id]?.name || inst.name
                        : inst.name;
                    const isDrum =
                      t.instrument === 'percussion_kit' || t.role === 'rhythm';
                    const ch = isDrum ? 10 : idx >= 9 ? idx + 2 : idx + 1;
                    return (
                      <tr key={t.id} className="bg-[#0E1420]/70">
                        <td className="py-2 px-3 font-sans font-medium text-slate-200">
                          {lang === 'en'
                            ? ROLE_EN_MAP[t.role]?.shortLabel || t.name
                            : t.name.split(' ')[0]}
                        </td>
                        <td className="py-2 px-3 font-sans text-amber-300">
                          {instTitle}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          Ch {ch}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          {isDrum ? 'Drum Kit' : `#${inst.gmProgram}`}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-200">
                          {t.notes.length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <button
            type="button"
            onClick={() => downloadMidiFile(project)}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {tr(
                lang,
                `一键下载多轨 MIDI 文件 (${project.title}.mid)`,
                `Download Multi-Track MIDI (${project.title}.mid)`
              )}
            </span>
          </button>
        </div>

        {/* 2. Standalone H5 Source Code Export */}
        <div className="bg-[#131A26] border border-[#1E293B] rounded-xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <FileCode className="w-4 h-4" />
                <span>
                  {tr(
                    lang,
                    '零依赖单文件 HTML5 源码导出',
                    'Zero-Dependency Single-File HTML5 Source Export'
                  )}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {(new Blob([h5Source]).size / 1024).toFixed(1)} KB · Web Audio
                API
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-100">
              {tr(
                lang,
                '导出独立可运行 H5 源码 (.html)',
                'Export Standalone HTML5 Player (.html)'
              )}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {tr(
                lang,
                `生成的单个 HTML 文件内嵌了您的完整编曲数据 (${totalNotes} 个音符 · ${rootName} ${scaleName})、Web Audio 合成器代码、Canvas 动态音符卷帘与分轨静音控制台。无需任何外部服务器或音频文件，双击即可在任意浏览器播放或二次开发。`,
                `Generates a self-contained HTML file embedding your arrangement (${totalNotes} notes · ${rootName} ${scaleName}), Web Audio synthesizer engine, animated Canvas piano roll, and track mixer. Double-click to run in any browser offline.`
              )}
            </p>

            <div className="bg-[#0B0F17] border border-[#1E293B] rounded-lg p-3.5 space-y-2 text-xs text-slate-300">
              <div className="font-semibold text-slate-200">
                {tr(
                  lang,
                  'H5 源码内含模块清单：',
                  'Embedded Modules in HTML5 Source:'
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>
                  1. <span className="text-slate-200">PROJECT JSON</span>：
                  {tr(lang, '结构化多轨编曲数据', 'Structured Multi-Track Data')}
                </div>
                <div>
                  2. <span className="text-slate-200">Web Audio</span>：
                  {tr(lang, '实时声学与人声共振合成', 'Real-Time Acoustic Synth')}
                </div>
                <div>
                  3. <span className="text-slate-200">Canvas Roll</span>：
                  {tr(lang, '实时时间轴与音符高亮', 'Animated Note Visualizer')}
                </div>
                <div>
                  4. <span className="text-slate-200">Interactive Mixer</span>：
                  {tr(lang, '支持在线调速与分轨开关', 'BPM & Track Mute Controls')}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => downloadH5SourceFile(project)}
              className="w-full sm:flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {tr(
                  lang,
                  '一键下载 H5 源码文件 (.html)',
                  'Download HTML5 Source (.html)'
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={handleCopyCode}
              className="w-full sm:w-auto py-3 px-4 bg-[#0B0F17] hover:bg-slate-800 text-slate-200 border border-[#1E293B] font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>
                {copied
                  ? tr(lang, '已复制完整源码', 'Copied Source!')
                  : tr(lang, '复制 H5 源码', 'Copy Source Code')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Live H5 Source Code Preview */}
      <div className="bg-[#131A26] border border-[#1E293B] rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 bg-[#0E1420] border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Code2 className="w-4 h-4 text-amber-400" />
            <span>
              {tr(
                lang,
                'H5 独立播放器完整源码预览 (实时随编曲改动同步生成)',
                'Standalone HTML5 Player Source Code Preview (Live Synced)'
              )}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            UTF-8 · HTML5 + Vanilla JS + Web Audio API
          </span>
        </div>
        <pre className="p-5 text-xs font-mono text-slate-300 bg-[#080B11] overflow-x-auto max-h-[420px] leading-relaxed select-all">
          {h5Source}
        </pre>
      </div>
    </div>
  );
};
