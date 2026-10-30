import { ScenePreset, TrackRole } from '../types/music';

export const TRACK_ROLE_DEFINITIONS: Array<{
  role: TrackRole;
  label: string;
  shortLabel: string;
  defaultColor: string;
  description: string;
}> = [
  {
    role: 'melody',
    label: '主旋律轨道 (Melody)',
    shortLabel: '主旋律',
    defaultColor: '#F59E0B',
    description: '全曲核心歌唱性旋律线，遵循起承转合与尾音归主音规律',
  },
  {
    role: 'counter',
    label: '副歌/对位轨道 (Counter)',
    shortLabel: '副旋律',
    defaultColor: '#38BDF8',
    description: '在主旋律留白处进行三度/六度协和呼应与复调填充',
  },
  {
    role: 'chords',
    label: '和弦织体轨道 (Chords)',
    shortLabel: '和弦轨',
    defaultColor: '#10B981',
    description: '承载全曲和声走向骨架，支持琶音、长音与律动切分',
  },
  {
    role: 'arpeggio',
    label: '流水琶音轨道 (Arpeggio)',
    shortLabel: '流水琶音',
    defaultColor: '#2DD4BF',
    description: '十六分/八分音符高频分解和弦织体，适合古筝、竖琴、羽管键琴',
  },
  {
    role: 'pad',
    label: '交响/人声铺底 (Symphonic Pad)',
    shortLabel: '氛围铺底',
    defaultColor: '#818CF8',
    description: '宽广绵延的多声部声场包裹，适合混声合唱、史诗弦乐、星云合成器',
  },
  {
    role: 'accent',
    label: '金石/高音点缀 (Bell & Accent)',
    shortLabel: '高音点缀',
    defaultColor: '#FBBF24',
    description: '小节强拍或句尾的高频灵动点缀，适合上古钟磬、教堂钟声、高音长笛',
  },
  {
    role: 'bass',
    label: '低音根音轨道 (Bass)',
    shortLabel: '低音轨',
    defaultColor: '#A78BFA',
    description: '稳固全曲低频下潜与根音五度律动支撑',
  },
  {
    role: 'rhythm',
    label: '打击乐节奏轨道 (Rhythm)',
    shortLabel: '打击节奏',
    defaultColor: '#F43F5E',
    description: '欧几里得节奏计算与中西鼓组律动，第4/8/12/16小节自动过门加花',
  },
];

export const SCENE_DIMENSION_TAGS = [
  { category: '时代与国度', tags: ['华夏上古/皇家', '仙侠江湖', '欧洲巴洛克/哥特', '未来星际/赛博', '8-bit童年红白机', '奇幻精灵森林'] },
  { category: '情绪与张力', tags: ['庄严神圣', '悲壮史诗', '热血激昂', '空灵神秘', '温柔治愈', '欢快跳跃'] },
  { category: '画面与用途', tags: ['朝堂大典', '御剑飞行', 'BOSS终极决战', '太空深空探索', '江南烟雨茶寮', '深夜书房伴读'] },
];

export const SCENE_PRESETS: ScenePreset[] = [
  {
    id: 'scene_imperial_ceremony',
    name: '紫禁大典 · 盛世朝贺',
    category: 'guofeng',
    categoryLabel: '国风礼乐与仙侠',
    keywords: ['皇家', '礼乐', '宫廷', '登基', '大典', '上古', '钟磬', '庄严', '华夏', '朝堂', '历史', '盛世', '周汉'],
    moodTags: ['华夏上古/皇家', '庄严神圣', '朝堂大典'],
    visualImagery: '晨光初照太和殿丹陛，青铜曾侯乙编钟与玉石编磬金石交鸣，百官肃立，礼乐齐奏。',
    description: '8轨大型礼乐编制：上古钟磬领奏 + 传统竹笛 + 敦煌古筝 + 史诗管乐 + 史诗弦乐 + 交响混声合唱 + 独奏大提琴 + 皇家堂鼓。',
    bpm: 76,
    bars: 8,
    rootNote: 0, // C
    scale: 'pentatonic_major',
    progressionId: 'royal_ritual_prog',
    tracksSpec: [
      { name: '上古钟磬主音', role: 'melody', instrument: 'ancient_bianzhong', volume: 0.92, color: '#F59E0B' },
      { name: '竹笛礼乐对位', role: 'counter', instrument: 'dizi', volume: 0.78, color: '#38BDF8' },
      { name: '敦煌古筝琶音', role: 'arpeggio', instrument: 'guzheng', volume: 0.76, color: '#2DD4BF' },
      { name: '史诗弦乐长音', role: 'chords', instrument: 'epic_strings', volume: 0.75, color: '#10B981' },
      { name: '盛世混声合唱', role: 'pad', instrument: 'grand_choir', volume: 0.7, color: '#818CF8' },
      { name: '大曲琵琶点缀', role: 'accent', instrument: 'pipa', volume: 0.72, color: '#FBBF24' },
      { name: '史诗铜管低音', role: 'bass', instrument: 'epic_brass', volume: 0.84, color: '#A78BFA' },
      { name: '皇家堂鼓金石', role: 'rhythm', instrument: 'percussion_kit', volume: 0.82, color: '#F43F5E' },
    ],
    algorithmParams: {
      melodyDensity: 0.48,
      pitchSmoothness: 0.82,
      chordStyle: 'sustained',
      rhythmIntensity: 0.58,
    },
  },
  {
    id: 'scene_xianxia_cloud',
    name: '仙侠御剑 · 云海苍穹',
    category: 'guofeng',
    categoryLabel: '国风礼乐与仙侠',
    keywords: ['仙侠', '御剑', '武侠', '江湖', '古风', '云海', '修仙', '竹笛', '古筝', '琵琶', '飞仙', '苍穹'],
    moodTags: ['仙侠江湖', '空灵神秘', '御剑飞行'],
    visualImagery: '白衣剑客御剑穿行于万丈云海之间，远处仙山浮岛若隐若现，笛声穿云裂石，女高音花腔吟唱回荡天际。',
    description: '7轨仙侠影视编制：传统竹笛主旋律 + 大曲琵琶轮指对位 + 敦煌古筝流水琶音 + 女高音空灵花腔 + 管弦小提琴群 + 大提琴 + 国风打击乐。',
    bpm: 92,
    bars: 8,
    rootNote: 0, // C
    scale: 'pentatonic_major',
    progressionId: 'guofeng_jade',
    tracksSpec: [
      { name: '云海竹笛主音', role: 'melody', instrument: 'dizi', volume: 0.92, color: '#F59E0B' },
      { name: '大曲琵琶呼应', role: 'counter', instrument: 'pipa', volume: 0.78, color: '#38BDF8' },
      { name: '古筝流水琶音', role: 'arpeggio', instrument: 'guzheng', volume: 0.8, color: '#2DD4BF' },
      { name: '管弦小提琴群', role: 'chords', instrument: 'violin_section', volume: 0.74, color: '#10B981' },
      { name: '女高音仙音铺底', role: 'pad', instrument: 'female_soprano', volume: 0.68, color: '#818CF8' },
      { name: '独奏大提琴低音', role: 'bass', instrument: 'cello_solo', volume: 0.82, color: '#A78BFA' },
      { name: '堂鼓风铃节拍', role: 'rhythm', instrument: 'percussion_kit', volume: 0.75, color: '#F43F5E' },
    ],
    algorithmParams: {
      melodyDensity: 0.62,
      pitchSmoothness: 0.78,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.5,
    },
  },
  {
    id: 'scene_interstellar_opera',
    name: '星际远征 · 太空歌剧',
    category: 'film',
    categoryLabel: '好莱坞与科幻史诗',
    keywords: ['星际', '太空', '宇宙', '黑洞', '科幻', '管风琴', '好莱坞', '大片', '交响', '星云', '探索', '恢弘'],
    moodTags: ['未来星际/赛博', '悲壮史诗', '太空深空探索'],
    visualImagery: '巨型星际母舰缓缓驶过土星光环与深空巨型黑洞，大教堂管风琴与史诗铜管齐鸣，诉说人类跨越光年的孤独与壮举。',
    description: '8轨宽银幕科幻交响编制：史诗管乐 + 大教堂管风琴琶音 + 史诗弦乐 + 交响混声合唱 + 星云氛围合成器 + 教堂钟声点缀 + 电音贝斯 + 定音大鼓。',
    bpm: 96,
    bars: 8,
    rootNote: 2, // D Minor
    scale: 'minor',
    progressionId: 'epic_heroic',
    tracksSpec: [
      { name: '史诗铜管主旋律', role: 'melody', instrument: 'epic_brass', volume: 0.9, color: '#F59E0B' },
      { name: '大教堂管风琴琶音', role: 'arpeggio', instrument: 'pipe_organ', volume: 0.84, color: '#2DD4BF' },
      { name: '宽银幕史诗弦乐', role: 'chords', instrument: 'epic_strings', volume: 0.82, color: '#10B981' },
      { name: '宇宙交响大合唱', role: 'pad', instrument: 'grand_choir', volume: 0.78, color: '#818CF8' },
      { name: '星云合成器氛围', role: 'counter', instrument: 'synth_pad', volume: 0.72, color: '#38BDF8' },
      { name: '深空教堂钟声', role: 'accent', instrument: 'church_bells', volume: 0.76, color: '#FBBF24' },
      { name: '超低频合成贝斯', role: 'bass', instrument: 'synth_bass', volume: 0.86, color: '#A78BFA' },
      { name: '巨型定音大鼓', role: 'rhythm', instrument: 'percussion_kit', volume: 0.82, color: '#F43F5E' },
    ],
    algorithmParams: {
      melodyDensity: 0.52,
      pitchSmoothness: 0.74,
      chordStyle: 'sustained',
      rhythmIntensity: 0.72,
    },
  },
  {
    id: 'scene_boss_battle',
    name: '魔王降临 · 史诗BOSS决战',
    category: 'game',
    categoryLabel: '游戏配乐与像素冒险',
    keywords: ['BOSS', '战斗', '魔王', '决战', '燃曲', '热血', '紧张', '游戏', '史诗', '合唱', '哥特', '电吉他'],
    moodTags: ['欧洲巴洛克/哥特', '热血激昂', 'BOSS终极决战'],
    visualImagery: '暗黑哥特神殿穹顶雷电交加，最终BOSS展开双翼，失真电吉他与史诗弦乐、管风琴、拉丁圣咏合唱正面交锋！',
    description: '8轨高燃战斗交响编制：史诗弦乐疾速主音 + 失真电吉他Solo对位 + 史诗管乐 + 混声大合唱 + 大教堂管风琴 + 教堂钟声 + 电音贝斯 + 疾速战鼓。',
    bpm: 136,
    bars: 8,
    rootNote: 9, // A Harmonic Minor
    scale: 'harmonic_minor',
    progressionId: 'baroque_court',
    tracksSpec: [
      { name: '史诗弦乐主战线', role: 'melody', instrument: 'epic_strings', volume: 0.92, color: '#F59E0B' },
      { name: '失真电吉他对位', role: 'counter', instrument: 'electric_guitar_lead', volume: 0.82, color: '#38BDF8' },
      { name: '咆哮史诗管乐', role: 'chords', instrument: 'epic_brass', volume: 0.84, color: '#10B981' },
      { name: '大教堂管风琴琶音', role: 'arpeggio', instrument: 'pipe_organ', volume: 0.78, color: '#2DD4BF' },
      { name: '圣殿混声大合唱', role: 'pad', instrument: 'grand_choir', volume: 0.82, color: '#818CF8' },
      { name: '审判教堂钟声', role: 'accent', instrument: 'church_bells', volume: 0.8, color: '#FBBF24' },
      { name: '重型合成低音', role: 'bass', instrument: 'synth_bass', volume: 0.88, color: '#A78BFA' },
      { name: '狂暴战鼓节拍', role: 'rhythm', instrument: 'percussion_kit', volume: 0.9, color: '#F43F5E' },
    ],
    algorithmParams: {
      melodyDensity: 0.78,
      pitchSmoothness: 0.65,
      chordStyle: 'rhythmic',
      rhythmIntensity: 0.92,
    },
  },
  {
    id: 'scene_8bit_dungeon',
    name: '红白机勇者 · 像素地下城',
    category: 'game',
    categoryLabel: '游戏配乐与像素冒险',
    keywords: ['8bit', '8-bit', '像素', '红白机', 'FC', '街机', '复古', '勇者', '闯关', '游戏', '芯片', '童年'],
    moodTags: ['8-bit童年红白机', '欢快跳跃', 'BOSS终极决战'],
    visualImagery: '经典的8-bit像素勇者手持火把踏入复古地下城迷宫，清脆的2A03脉冲方波旋律与高速芯片琶音令人瞬间热血沸腾。',
    description: '6轨纯正芯片音乐编制：8-bit复古芯片主旋律 + 8-bit二声部和声对位 + 高速芯片琶音轨 + 模拟合成器铺底 + 电音合成贝斯 + 像素电子鼓组。',
    bpm: 138,
    bars: 8,
    rootNote: 0, // C Minor Pentatonic
    scale: 'pentatonic_minor',
    progressionId: 'energetic_rock',
    tracksSpec: [
      { name: '8-bit脉冲主音 (Pulse 1)', role: 'melody', instrument: 'chiptune_8bit', volume: 0.92, color: '#F59E0B' },
      { name: '8-bit芯片副旋律 (Pulse 2)', role: 'counter', instrument: 'chiptune_8bit', volume: 0.78, color: '#38BDF8' },
      { name: '高速芯片琶音轨', role: 'arpeggio', instrument: 'synth_lead', volume: 0.74, color: '#2DD4BF' },
      { name: '复古合成器支撑', role: 'chords', instrument: 'synth_pad', volume: 0.68, color: '#10B981' },
      { name: '三角波芯片低音', role: 'bass', instrument: 'synth_bass', volume: 0.88, color: '#A78BFA' },
      { name: '8-bit噪波打击乐', role: 'rhythm', instrument: 'percussion_kit', volume: 0.85, color: '#F43F5E' },
    ],
    algorithmParams: {
      melodyDensity: 0.8,
      pitchSmoothness: 0.66,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.86,
    },
  },
  {
    id: 'scene_elven_forest',
    name: '迷雾森林 · 精灵多利亚秘境',
    category: 'healing',
    categoryLabel: '空灵秘境与治愈伴读',
    keywords: ['森林', '精灵', '多利亚', '空灵', '吟唱', '奇幻', '秘境', '竖琴', '长笛', '吉他', '凯尔特', '迷雾'],
    moodTags: ['奇幻精灵森林', '空灵神秘', '温柔治愈'],
    visualImagery: '阳光透过古老精灵森林的晨雾洒在苔藓溪流上，银质长笛与尼龙弦古典吉他轻柔对话，远处传来空灵的闭口轻声吟唱。',
    description: '7轨多利亚奇幻编制：西洋银质长笛主音 + 空灵轻声吟唱对位 + 古典吉他指弹和弦 + 音乐会踏板竖琴流水琶音 + 女中音柔声铺底 + 独奏大提琴 + 森林风铃。',
    bpm: 84,
    bars: 8,
    rootNote: 2, // D Dorian
    scale: 'dorian',
    progressionId: 'ethereal_dream',
    tracksSpec: [
      { name: '银质长笛主旋律', role: 'melody', instrument: 'flute_orchestral', volume: 0.9, color: '#F59E0B' },
      { name: '空灵轻声吟唱', role: 'counter', instrument: 'soft_humming', volume: 0.82, color: '#38BDF8' },
      { name: '古典吉他指弹', role: 'chords', instrument: 'classical_guitar', volume: 0.8, color: '#10B981' },
      { name: '音乐会竖琴琶音', role: 'arpeggio', instrument: 'orchestral_harp', volume: 0.76, color: '#2DD4BF' },
      { name: '女中音温润和声', role: 'pad', instrument: 'female_mezzo', volume: 0.66, color: '#818CF8' },
      { name: '独奏大提琴低吟', role: 'bass', instrument: 'cello_solo', volume: 0.8, color: '#A78BFA' },
      { name: '秘境风铃轻击', role: 'rhythm', instrument: 'percussion_kit', volume: 0.65, color: '#F43F5E' },
    ],
    algorithmParams: {
      melodyDensity: 0.5,
      pitchSmoothness: 0.88,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.3,
    },
  },
  {
    id: 'scene_jiangnan_rain',
    name: '江南春雨 · 茶寮听琴',
    category: 'guofeng',
    categoryLabel: '国风礼乐与仙侠',
    keywords: ['江南', '春雨', '喝茶', '茶寮', '古琴', '古筝', '琵琶', '竹笛', '安静', '山水', '水墨', '园林'],
    moodTags: ['仙侠江湖', '温柔治愈', '江南烟雨茶寮'],
    visualImagery: '烟雨朦胧的江南水乡乌篷船畔，临水茶寮内古筝与琵琶珠落玉盘，竹笛温润吹奏，心境澄明如画。',
    description: '6轨江南丝竹雅集：敦煌古筝主奏 + 中国传统竹笛对位 + 大曲琵琶分解伴奏 + 空灵轻声吟唱 + 独奏大提琴低音 + 木鱼碰铃轻点。',
    bpm: 74,
    bars: 8,
    rootNote: 7, // G Pentatonic
    scale: 'pentatonic_major',
    progressionId: 'guofeng_jade',
    tracksSpec: [
      { name: '敦煌古筝主奏', role: 'melody', instrument: 'guzheng', volume: 0.92, color: '#F59E0B' },
      { name: '姑苏竹笛呼应', role: 'counter', instrument: 'dizi', volume: 0.78, color: '#38BDF8' },
      { name: '大曲琵琶伴奏', role: 'arpeggio', instrument: 'pipa', volume: 0.74, color: '#2DD4BF' },
      { name: '轻声吟唱意境', role: 'pad', instrument: 'soft_humming', volume: 0.68, color: '#818CF8' },
      { name: '大提琴温润低音', role: 'bass', instrument: 'cello_solo', volume: 0.78, color: '#A78BFA' },
      { name: '清脆木鱼风铃', role: 'rhythm', instrument: 'percussion_kit', volume: 0.62, color: '#F43F5E' },
    ],
    algorithmParams: {
      melodyDensity: 0.52,
      pitchSmoothness: 0.86,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.28,
    },
  },
  {
    id: 'scene_gothic_cathedral',
    name: '哥特古堡 · 巴洛克暗夜圣咏',
    category: 'film',
    categoryLabel: '好莱坞与科幻史诗',
    keywords: ['哥特', '巴洛克', '古堡', '教堂', '羽管键琴', '管风琴', '弦乐协奏', '古典', '宫廷', '悬疑', '华丽'],
    moodTags: ['欧洲巴洛克/哥特', '庄严神圣', '空灵神秘'],
    visualImagery: '烛光摇曳的欧洲巴洛克古堡长廊，羽管键琴清脆的金属拨弦与首席小提琴弦乐协奏交错，大教堂管风琴与钟声庄严回响。',
    description: '7轨古典宫廷协奏编制：弦乐协奏主旋律 + 巴洛克羽管键琴复调对位 + 大教堂管风琴和声 + 交响混声合唱 + 教堂钟声 + 男低音圣咏 + 定音鼓。',
    bpm: 104,
    bars: 8,
    rootNote: 9, // A Harmonic Minor
    scale: 'harmonic_minor',
    progressionId: 'baroque_court',
    tracksSpec: [
      { name: '首席弦乐协奏', role: 'melody', instrument: 'string_concerto', volume: 0.92, color: '#F59E0B' },
      { name: '巴洛克羽管键琴', role: 'arpeggio', instrument: 'harpsichord', volume: 0.82, color: '#2DD4BF' },
      { name: '大教堂管风琴', role: 'chords', instrument: 'pipe_organ', volume: 0.78, color: '#10B981' },
      { name: '唱诗班混声合唱', role: 'pad', instrument: 'grand_choir', volume: 0.74, color: '#818CF8' },
      { name: '古堡教堂钟声', role: 'accent', instrument: 'church_bells', volume: 0.76, color: '#FBBF24' },
      { name: '男低音圣咏根音', role: 'bass', instrument: 'male_bass', volume: 0.84, color: '#A78BFA' },
      { name: '古典管弦定音鼓', role: 'rhythm', instrument: 'percussion_kit', volume: 0.72, color: '#F43F5E' },
    ],
    algorithmParams: {
      melodyDensity: 0.66,
      pitchSmoothness: 0.76,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.45,
    },
  },
  {
    id: 'scene_healing_study',
    name: '深夜书房 · 治愈星光伴读',
    category: 'healing',
    categoryLabel: '空灵秘境与治愈伴读',
    keywords: ['治愈', '学习', '看书', '书房', '深夜', '钢琴', '睡眠', '放松', '温暖', '抒情', '安静', 'Vlog'],
    moodTags: ['温柔治愈', '深夜书房伴读'],
    visualImagery: '台灯温暖的光晕洒在书页上，窗外夜色静谧，音乐会三角钢琴与温暖的古典吉他、大提琴低吟相伴，抚平一切疲惫。',
    description: '6轨温暖治愈编制：音乐会三角钢琴主音 + 古典吉他对位 + 音乐会竖琴琶音 + 空灵轻声吟唱 + 独奏大提琴 + 极简轻柔节拍。',
    bpm: 72,
    bars: 8,
    rootNote: 5, // F Major (Warm)
    scale: 'major',
    progressionId: 'canon_warm',
    tracksSpec: [
      { name: '三角钢琴温润主音', role: 'melody', instrument: 'grand_piano', volume: 0.9, color: '#F59E0B' },
      { name: '古典吉他暖音呼应', role: 'counter', instrument: 'classical_guitar', volume: 0.78, color: '#38BDF8' },
      { name: '音乐会竖琴流水', role: 'arpeggio', instrument: 'orchestral_harp', volume: 0.72, color: '#2DD4BF' },
      { name: '空灵轻声吟唱铺底', role: 'pad', instrument: 'soft_humming', volume: 0.7, color: '#818CF8' },
      { name: '独奏大提琴低音', role: 'bass', instrument: 'cello_solo', volume: 0.8, color: '#A78BFA' },
      { name: '轻柔心跳节拍', role: 'rhythm', instrument: 'percussion_kit', volume: 0.55, color: '#F43F5E' },
    ],
    algorithmParams: {
      melodyDensity: 0.44,
      pitchSmoothness: 0.9,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.25,
    },
  },
  {
    id: 'scene_cyber_outrun',
    name: '赛博霓虹 · 暗夜极速狂飙',
    category: 'game',
    categoryLabel: '游戏配乐与像素冒险',
    keywords: ['赛博', '霓虹', '电音', '合成器', '飙车', '摇滚', '科技', '现代', '动感', '燃', '电子'],
    moodTags: ['未来星际/赛博', '热血激昂'],
    visualImagery: '流光溢彩的赛博朋克不夜城高速公路，复古模拟合成器与失真主音电吉他撕裂夜空，强劲电音合成贝斯驱动肾上腺素。',
    description: '7轨现代电声合成编制：复古模拟合成器主音 + 失真主音电吉他Solo + 8-bit芯片琶音 + 星云氛围铺底 + 清音合唱电吉他 + 电音合成贝斯 + 劲爆鼓组。',
    bpm: 126,
    bars: 8,
    rootNote: 4, // E Minor Pentatonic
    scale: 'pentatonic_minor',
    progressionId: 'energetic_rock',
    tracksSpec: [
      { name: '模拟合成器主音', role: 'melody', instrument: 'synth_lead', volume: 0.9, color: '#F59E0B' },
      { name: '失真电吉他Solo', role: 'counter', instrument: 'electric_guitar_lead', volume: 0.82, color: '#38BDF8' },
      { name: '8-bit高速脉冲琶音', role: 'arpeggio', instrument: 'chiptune_8bit', volume: 0.7, color: '#2DD4BF' },
      { name: '清音合唱电吉他', role: 'chords', instrument: 'electric_guitar_clean', volume: 0.76, color: '#10B981' },
      { name: '深空星云合成铺底', role: 'pad', instrument: 'synth_pad', volume: 0.74, color: '#818CF8' },
      { name: '电音合成贝斯', role: 'bass', instrument: 'synth_bass', volume: 0.9, color: '#A78BFA' },
      { name: '赛博劲爆电子鼓', role: 'rhythm', instrument: 'percussion_kit', volume: 0.88, color: '#F43F5E' },
    ],
    algorithmParams: {
      melodyDensity: 0.74,
      pitchSmoothness: 0.68,
      chordStyle: 'rhythmic',
      rhythmIntensity: 0.88,
    },
  },
];

/**
 * Intelligent Scene Auto-Matcher:
 * Scores all 10 ScenePresets against user's free-text description and selected mood/scene tags,
 * returning the best matching ScenePreset and a clear musical rationale.
 */
export function matchBestScenePreset(
  userQuery: string,
  selectedTags: string[]
): { preset: ScenePreset; matchScore: number; reason: string } {
  const cleanQuery = userQuery.trim().toLowerCase();

  let bestPreset = SCENE_PRESETS[0];
  let bestScore = -1;
  let matchedTerms: string[] = [];

  for (const scene of SCENE_PRESETS) {
    let score = 0;
    const hits: string[] = [];

    // Check selected tags
    for (const tag of selectedTags) {
      if (scene.moodTags.includes(tag)) {
        score += 25;
        hits.push(tag);
      }
      if (scene.name.includes(tag) || scene.description.includes(tag)) {
        score += 12;
      }
    }

    // Check keywords against user free-text query
    if (cleanQuery.length > 0) {
      for (const kw of scene.keywords) {
        if (cleanQuery.includes(kw.toLowerCase())) {
          score += 20;
          hits.push(kw);
        }
      }
      if (scene.name.toLowerCase().includes(cleanQuery)) {
        score += 30;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestPreset = scene;
      matchedTerms = Array.from(new Set(hits));
    }
  }

  const reason =
    matchedTerms.length > 0
      ? `识别到场景特征「${matchedTerms.slice(0, 4).join(' · ')}」，已自动匹配 ${bestPreset.tracksSpec.length} 轨编制场景【${bestPreset.name}】`
      : `已为您推荐高人气全能场景编制【${bestPreset.name}】（含 ${bestPreset.tracksSpec.length} 条独立声部轨道）`;

  return {
    preset: bestPreset,
    matchScore: Math.max(85, Math.min(99, 82 + bestScore)),
    reason,
  };
}
