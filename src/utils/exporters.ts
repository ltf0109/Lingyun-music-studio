import { ProjectState } from '../types/music';
import { getInstrumentById, getScaleById, PITCH_CLASS_NAMES } from '../data/instruments';

/**
 * Encodes a non-negative integer into MIDI Variable-Length Quantity (VLQ) bytes.
 */
function encodeVLQ(value: number): number[] {
  let v = Math.max(0, Math.floor(value));
  const bytes: number[] = [v & 0x7f];
  v >>= 7;
  while (v > 0) {
    bytes.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return bytes;
}

function stringToAsciiBytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    bytes.push(code < 128 ? code : 63);
  }
  return bytes;
}

function uint32ToBytes(val: number): number[] {
  return [(val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8) & 0xff, val & 0xff];
}

function uint16ToBytes(val: number): number[] {
  return [(val >>> 8) & 0xff, val & 0xff];
}

/**
 * Generates a binary Standard MIDI File (SMF Format 1) Uint8Array from the ProjectState.
 */
export function buildMidiBinary(project: ProjectState): Uint8Array {
  const ticksPerQuarter = 480;
  const ticksPerStep = ticksPerQuarter / 4; // 120 ticks per 16th-note step
  const activeTracks = project.tracks;
  const numTracks = activeTracks.length + 1; // +1 for conductor tempo track

  const chunks: number[][] = [];

  // 1. MThd Header Chunk
  chunks.push([
    0x4d, 0x54, 0x68, 0x64, // "MThd"
    ...uint32ToBytes(6),
    ...uint16ToBytes(1), // SMF Format 1 (multi-track synchronous)
    ...uint16ToBytes(numTracks),
    ...uint16ToBytes(ticksPerQuarter),
  ]);

  // 2. Track 0: Conductor / Tempo & Time Signature Track
  const conductorEvents: number[] = [];
  const titleBytes = stringToAsciiBytes(project.title || 'LingYun Composition');
  conductorEvents.push(0x00, 0xff, 0x03, ...encodeVLQ(titleBytes.length), ...titleBytes);

  // Time Signature: 4/4 -> FF 58 04 04 02 18 08
  conductorEvents.push(0x00, 0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

  // Tempo: microseconds per quarter note = 60,000,000 / bpm
  const mpqn = Math.round(60000000 / Math.max(40, Math.min(240, project.bpm)));
  conductorEvents.push(
    0x00,
    0xff,
    0x51,
    0x03,
    (mpqn >>> 16) & 0xff,
    (mpqn >>> 8) & 0xff,
    mpqn & 0xff
  );

  // End of Track
  conductorEvents.push(0x00, 0xff, 0x2f, 0x00);

  chunks.push([
    0x4d, 0x54, 0x72, 0x6b, // "MTrk"
    ...uint32ToBytes(conductorEvents.length),
    ...conductorEvents,
  ]);

  // 3. Musical Tracks (1..N)
  activeTracks.forEach((track, idx) => {
    const inst = getInstrumentById(track.instrument);
    const isPercussion = track.instrument === 'percussion_kit' || track.role === 'rhythm';
    // MIDI channel 9 (0-indexed, i.e., Channel 10) is reserved for General MIDI Percussion
    const channel = isPercussion ? 9 : idx >= 9 ? (idx + 1) % 16 : idx;

    const trackBytes: number[] = [];

    // Track Name Meta Event
    const nameAscii = stringToAsciiBytes(`${track.role.toUpperCase()} - ${inst.id}`);
    trackBytes.push(0x00, 0xff, 0x03, ...encodeVLQ(nameAscii.length), ...nameAscii);

    // Program Change (for non-percussion channels)
    if (!isPercussion) {
      trackBytes.push(0x00, 0xc0 | channel, inst.gmProgram & 0x7f);
    }

    // Channel Volume CC#7
    const ccVol = track.muted ? 0 : Math.min(127, Math.round(track.volume * 115));
    trackBytes.push(0x00, 0xb0 | channel, 0x07, ccVol);

    // Collect Note On and Note Off events
    interface RawMidiEvent {
      tick: number;
      type: 'on' | 'off';
      pitch: number;
      velocity: number;
    }

    const rawEvents: RawMidiEvent[] = [];
    for (const note of track.notes) {
      const startTick = Math.max(0, Math.round(note.startStep * ticksPerStep));
      const endTick = Math.max(
        startTick + 30,
        Math.round((note.startStep + note.durationSteps) * ticksPerStep) - 5
      );
      const vel = Math.max(1, Math.min(127, Math.round(note.velocity * 120)));
      const pitch = Math.max(0, Math.min(127, note.pitch));

      rawEvents.push({ tick: startTick, type: 'on', pitch, velocity: vel });
      rawEvents.push({ tick: endTick, type: 'off', pitch, velocity: 0 });
    }

    // Sort by tick; if same tick, put 'off' before 'on' so re-triggered notes don't cut off
    rawEvents.sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      if (a.type === b.type) return a.pitch - b.pitch;
      return a.type === 'off' ? -1 : 1;
    });

    let lastTick = 0;
    for (const ev of rawEvents) {
      const delta = Math.max(0, ev.tick - lastTick);
      lastTick = ev.tick;
      const status = (ev.type === 'on' ? 0x90 : 0x80) | channel;
      trackBytes.push(...encodeVLQ(delta), status, ev.pitch, ev.velocity);
    }

    // End of Track
    trackBytes.push(0x00, 0xff, 0x2f, 0x00);

    chunks.push([
      0x4d, 0x54, 0x72, 0x6b, // "MTrk"
      ...uint32ToBytes(trackBytes.length),
      ...trackBytes,
    ]);
  });

  // Flatten all chunks into a single Uint8Array
  const totalLen = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/**
 * Triggers a browser download of the generated Standard MIDI File (.mid).
 */
export function downloadMidiFile(project: ProjectState) {
  const bytes = buildMidiBinary(project);
  const blob = new Blob([bytes], { type: 'audio/midi' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (project.title || 'lingyun_music').replace(/\s+/g, '_');
  a.href = url;
  a.download = `${safeName}_${project.bpm}bpm.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

/**
 * Generates a 100% standalone, single-file HTML5 Interactive Player & Visualizer source code (.html).
 * Contains embedded Web Audio synthesizer for all 21 instruments + percussion + interactive canvas piano roll.
 */
export function generateStandaloneH5Source(project: ProjectState): string {
  const scaleObj = getScaleById(project.scale);
  const rootName = PITCH_CLASS_NAMES[project.rootNote % 12];

  const serializedProject = JSON.stringify(
    {
      title: project.title,
      bpm: project.bpm,
      bars: project.bars,
      rootName,
      scaleName: scaleObj.name,
      chords: project.chordTimeline.map((c) => ({
        bar: c.barIndex + 1,
        label: c.label,
        roman: c.roman,
        hint: c.functionHint,
      })),
      tracks: project.tracks.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        instrument: t.instrument,
        instrumentName: getInstrumentById(t.instrument).name,
        volume: t.volume,
        muted: t.muted,
        color: t.color,
        notes: t.notes,
      })),
    },
    null,
    2
  );

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.title} - 灵韵工坊 H5 独立交互编曲播放器</title>
  <style>
    :root {
      --bg: #0B0F17;
      --panel: #131A26;
      --border: #1E293B;
      --text: #F1F5F9;
      --muted: #94A3B8;
      --accent: #F59E0B;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .container {
      width: 100%;
      max-width: 1120px;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--border);
    }
    .title-area h1 { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
    .meta { font-size: 13px; color: var(--muted); margin-top: 6px; font-variant-numeric: tabular-nums; }
    .controls { display: flex; align-items: center; gap: 12px; }
    button.primary {
      background: var(--accent);
      color: #0B0F17;
      border: none;
      padding: 10px 22px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    button.primary:hover { opacity: 0.92; }
    .bpm-box {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    canvas#visualizer {
      width: 100%;
      height: 280px;
      background: #080B11;
      border: 1px solid var(--border);
      border-radius: 10px;
      margin: 20px 0;
      display: block;
    }
    .chord-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      margin-bottom: 20px;
    }
    .chord-cell {
      padding: 10px 12px;
      background: #0E1420;
      border: 1px solid var(--border);
      border-radius: 8px;
      transition: border-color 0.15s, background 0.15s;
    }
    .chord-cell.active {
      border-color: var(--accent);
      background: rgba(245, 158, 11, 0.12);
    }
    .chord-cell .bar-num { font-size: 11px; color: var(--muted); }
    .chord-cell .chord-name { font-size: 16px; font-weight: 700; color: var(--accent); margin-top: 2px; }
    .tracks { display: grid; gap: 10px; }
    .track-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #0E1420;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 13px;
    }
    .track-info { display: flex; align-items: center; gap: 10px; }
    .color-bar { width: 10px; height: 22px; border-radius: 3px; }
    .mute-btn {
      background: #1E293B;
      color: var(--text);
      border: 1px solid #334155;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }
    .mute-btn.muted { opacity: 0.45; text-decoration: line-through; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title-area">
        <h1 id="song-title"></h1>
        <div class="meta" id="song-meta"></div>
      </div>
      <div class="controls">
        <div class="bpm-box">
          <span>速度 BPM: <strong id="bpm-val"></strong></span>
          <input type="range" id="bpm-slider" min="50" max="180" />
        </div>
        <button class="primary" id="play-btn">▶ 播放编曲</button>
      </div>
    </div>

    <canvas id="visualizer" width="1060" height="280"></canvas>
    <div class="chord-strip" id="chord-strip"></div>
    <div class="tracks" id="track-list"></div>
  </div>

  <script>
    // ====== 1. 编曲工程数据 (可直接修改音符、BPM或乐器配置) ======
    const PROJECT = ${serializedProject};

    // ====== 2. 内置 Web Audio 声学与共振峰合成引擎 ======
    let ctx = null;
    let masterGain = null;
    let noiseBuffer = null;

    function initAudio() {
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.8;
        masterGain.connect(ctx.destination);

        noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        const d = noiseBuffer.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume();
    }

    function midiToFreq(m) {
      return 440 * Math.pow(2, (m - 69) / 12);
    }

    function playNote(instrument, pitch, dur, vel, vol) {
      if (!ctx) return;
      const now = ctx.currentTime;
      const level = Math.max(0.04, Math.min(1, vel * vol)) * 0.28;

      if (instrument === 'percussion_kit') {
        playDrum(pitch, now, level * 1.35);
        return;
      }

      const freq = midiToFreq(pitch);
      const out = ctx.createGain();
      const isVocal = instrument.includes('female') || instrument.includes('male') || instrument === 'grand_choir' || instrument === 'soft_humming';
      const isBell = instrument === 'ancient_bianzhong' || instrument === 'church_bells';
      const is8Bit = instrument === 'chiptune_8bit';
      const isPluck = isBell || instrument === 'guzheng' || instrument === 'pipa' || instrument === 'harpsichord' || instrument === 'orchestral_harp' || instrument === 'grand_piano' || instrument === 'classical_guitar';

      const attack = is8Bit ? 0.002 : isPluck ? 0.005 : isVocal ? 0.075 : 0.032;
      const release = isBell ? Math.max(dur * 2.1, 1.5) : is8Bit ? dur + 0.03 : isPluck ? Math.max(dur * 1.3, 0.65) : dur + 0.24;

      out.gain.setValueAtTime(0.0001, now);
      out.gain.linearRampToValueAtTime(level, now + attack);
      out.gain.exponentialRampToValueAtTime(0.0001, now + release);

      const filter = ctx.createBiquadFilter();
      filter.type = isVocal ? 'bandpass' : 'lowpass';
      filter.frequency.value = is8Bit ? 12000 : isVocal ? Math.max(700, freq * 2.2) : freq * 4.8;
      filter.Q.value = isVocal ? 3.2 : 1.2;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = is8Bit ? 'square' : isBell ? 'sine' : isPluck ? 'triangle' : 'sawtooth';
      osc2.type = is8Bit ? 'square' : instrument === 'dizi' || instrument === 'flute_orchestral' || instrument === 'soft_humming' || isBell ? 'sine' : 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(
        isBell ? freq * 1.26 : instrument === 'pipe_organ' ? freq * 2 : instrument === 'epic_strings' || instrument === 'epic_brass' ? freq * 0.5 : freq,
        now
      );
      osc2.detune.value = 5;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(out);
      out.connect(masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + release + 0.05);
      osc2.stop(now + release + 0.05);
    }

    function playDrum(pitch, now, level) {
      if (pitch === 36 || pitch === 45) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.setValueAtTime(pitch === 45 ? 120 : 140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
        g.gain.setValueAtTime(level * 1.4, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.38);
      } else {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuffer;
        const f = ctx.createBiquadFilter();
        f.type = pitch === 42 || pitch === 46 || pitch === 49 ? 'highpass' : 'bandpass';
        f.frequency.value = pitch === 50 ? 800 : pitch === 38 ? 1800 : 5800;
        const g = ctx.createGain();
        const dur = pitch === 49 ? 0.55 : pitch === 46 ? 0.25 : 0.09;
        g.gain.setValueAtTime(level * 0.75, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        src.connect(f);
        f.connect(g);
        g.connect(masterGain);
        src.start(now);
        src.stop(now + dur + 0.02);
      }
    }

    // ====== 3. 播放控制与可视化渲染 ======
    let isPlaying = false;
    let currentStep = 0;
    let timerId = null;
    const totalSteps = PROJECT.bars * 16;

    document.getElementById('song-title').textContent = PROJECT.title;
    document.getElementById('song-meta').textContent =
      PROJECT.rootName + ' · ' + PROJECT.scaleName + ' · ' + PROJECT.bars + ' 小节循环';
    const bpmVal = document.getElementById('bpm-val');
    const bpmSlider = document.getElementById('bpm-slider');
    bpmVal.textContent = PROJECT.bpm;
    bpmSlider.value = PROJECT.bpm;

    bpmSlider.addEventListener('input', (e) => {
      PROJECT.bpm = Number(e.target.value);
      bpmVal.textContent = PROJECT.bpm;
      if (isPlaying) { stopLoop(); startLoop(); }
    });

    const chordStrip = document.getElementById('chord-strip');
    PROJECT.chords.forEach((c, idx) => {
      const div = document.createElement('div');
      div.className = 'chord-cell';
      div.id = 'chord-bar-' + idx;
      div.innerHTML = '<div class="bar-num">第 ' + c.bar + ' 小节 · ' + c.roman + '</div>' +
                      '<div class="chord-name">' + c.label + '</div>';
      chordStrip.appendChild(div);
    });

    const trackList = document.getElementById('track-list');
    PROJECT.tracks.forEach((t, idx) => {
      const row = document.createElement('div');
      row.className = 'track-row';
      row.innerHTML =
        '<div class="track-info">' +
          '<div class="color-bar" style="background:' + t.color + '"></div>' +
          '<div><strong>' + t.name + '</strong> · <span style="color:#94A3B8">' + t.instrumentName + ' (' + t.notes.length + ' 音符)</span></div>' +
        '</div>' +
        '<button class="mute-btn ' + (t.muted ? 'muted' : '') + '" data-idx="' + idx + '">' +
          (t.muted ? '已静音' : '发声中') +
        '</button>';
      trackList.appendChild(row);
    });

    trackList.addEventListener('click', (e) => {
      const btn = e.target.closest('.mute-btn');
      if (!btn) return;
      const idx = Number(btn.dataset.idx);
      PROJECT.tracks[idx].muted = !PROJECT.tracks[idx].muted;
      btn.classList.toggle('muted', PROJECT.tracks[idx].muted);
      btn.textContent = PROJECT.tracks[idx].muted ? '已静音' : '发声中';
    });

    function stepTick() {
      const stepDurSec = 60 / PROJECT.bpm / 4;
      PROJECT.tracks.forEach((t) => {
        if (t.muted) return;
        t.notes.forEach((n) => {
          if (n.startStep === currentStep) {
            playNote(t.instrument, n.pitch, n.durationSteps * stepDurSec, n.velocity, t.volume);
          }
        });
      });

      const activeBar = Math.floor(currentStep / 16);
      PROJECT.chords.forEach((_, idx) => {
        const el = document.getElementById('chord-bar-' + idx);
        if (el) el.classList.toggle('active', idx === activeBar);
      });

      drawCanvas();
      currentStep = (currentStep + 1) % totalSteps;
    }

    function startLoop() {
      initAudio();
      isPlaying = true;
      document.getElementById('play-btn').textContent = '⏸ 暂停播放';
      const stepMs = (60 / PROJECT.bpm / 4) * 1000;
      stepTick();
      timerId = setInterval(stepTick, stepMs);
    }

    function stopLoop() {
      isPlaying = false;
      document.getElementById('play-btn').textContent = '▶ 播放编曲';
      if (timerId) clearInterval(timerId);
    }

    document.getElementById('play-btn').addEventListener('click', () => {
      if (isPlaying) stopLoop();
      else startLoop();
    });

    const canvas = document.getElementById('visualizer');
    const c = canvas.getContext('2d');

    function drawCanvas() {
      c.clearRect(0, 0, canvas.width, canvas.height);
      const stepW = canvas.width / totalSteps;

      // Grid lines
      for (let s = 0; s < totalSteps; s++) {
        c.fillStyle = s % 16 === 0 ? '#1E293B' : s % 4 === 0 ? '#131A26' : 'transparent';
        if (s % 4 === 0) c.fillRect(s * stepW, 0, 1, canvas.height);
      }

      // Notes
      PROJECT.tracks.forEach((t) => {
        if (t.muted) return;
        c.fillStyle = t.color;
        t.notes.forEach((n) => {
          const x = n.startStep * stepW;
          const w = Math.max(4, n.durationSteps * stepW - 2);
          const normP = Math.max(0, Math.min(1, (n.pitch - 36) / 48));
          const y = canvas.height - 20 - normP * (canvas.height - 40);
          c.globalAlpha = n.startStep <= currentStep && n.startStep + n.durationSteps > currentStep ? 1.0 : 0.72;
          c.beginPath();
          c.roundRect(x, y, w, 7, 3);
          c.fill();
        });
      });

      // Playhead
      c.globalAlpha = 1;
      c.fillStyle = '#F59E0B';
      c.fillRect(currentStep * stepW, 0, 2, canvas.height);
    }

    drawCanvas();
  </script>
</body>
</html>`;
}

/**
 * Triggers a browser download of the standalone H5 file (.html).
 */
export function downloadH5SourceFile(project: ProjectState) {
  const html = generateStandaloneH5Source(project);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (project.title || 'lingyun_music').replace(/\s+/g, '_');
  a.href = url;
  a.download = `${safeName}_h5_player.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
