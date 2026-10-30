import {
  InstrumentDefinition,
  InstrumentCategory,
  ScaleDefinition,
  ChordProgressionPreset,
  StylePreset,
  PercussionPadDefinition,
} from '../types/music';

export const PITCH_CLASS_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export const PITCH_CLASS_CHINESE_NAMES: Record<number, string> = {
  0: 'C调 (标准易上手)',
  2: 'D调 (明亮开阔)',
  4: 'E调 (清越柔美)',
  5: 'F调 (温暖抒情)',
  7: 'G调 (庄重古雅)',
  9: 'A调 (深情叙事)',
  10: 'Bb调 (恢弘管弦)',
};

export const INSTRUMENT_CATEGORIES: Array<{
  id: InstrumentCategory;
  label: string;
  description: string;
}> = [
  { id: 'chinese', label: '中国民族与上古礼乐', description: '上古钟磬、古筝、琵琶、中国传统竹笛' },
  { id: 'orchestral', label: '管弦与史诗交响', description: '弦乐协奏、史诗弦乐、史诗管乐、小提琴群、大提琴、圆号、长笛、竖琴' },
  { id: 'vocal', label: '人声独唱与合唱', description: '男女高/中/低音独唱、交响合唱、空灵吟唱' },
  { id: 'keyboard', label: '键盘与教堂钟声', description: '三角钢琴、教堂管风琴、羽管键琴、教堂钟声' },
  { id: 'modern', label: '吉他/合成器/8-bit', description: '古典吉他、8-bit芯片、电吉他、合成器主音/铺底/贝斯' },
  { id: 'percussion', label: '打击乐与鼓组采样', description: '堂鼓/定音鼓、木鱼梆子、架子鼓、吊镲风铃' },
];

export const INSTRUMENTS: InstrumentDefinition[] = [
  // 1. 中国民族与上古礼乐 (Chinese Traditional & Ancient)
  {
    id: 'ancient_bianzhong',
    name: '中国上古钟磬',
    subtitle: 'Ancient Bianzhong & Qing · 金石交鸣',
    category: 'chinese',
    categoryLabel: '中国民族与上古礼乐',
    gmProgram: 14,
    recommendedRange: [48, 84],
    defaultOctave: 4,
    acousticDescription: '模拟曾侯乙青铜编钟“一钟双音”大三度非谐波金属泛音与玉石编磬清越敲击共鸣。',
    beginnerTip: '极适合演奏皇家礼乐主音、庄严开篇或古风高音区的金石点缀。',
  },
  {
    id: 'guzheng',
    name: '敦煌古筝',
    subtitle: 'Guzheng · 吟揉清韵',
    category: 'chinese',
    categoryLabel: '中国民族与上古礼乐',
    gmProgram: 107,
    recommendedRange: [55, 84],
    defaultOctave: 4,
    acousticDescription: '拨弦木质共鸣箱声学建模，自带微颤音与面板泛音余韵。',
    beginnerTip: '极适合演奏五声音阶主旋律或流水般的分解和弦伴奏。',
  },
  {
    id: 'pipa',
    name: '大曲琵琶',
    subtitle: 'Pipa · 珠落玉盘',
    category: 'chinese',
    categoryLabel: '中国民族与上古礼乐',
    gmProgram: 105,
    recommendedRange: [55, 84],
    defaultOctave: 4,
    acousticDescription: '清脆指甲弹挑瞬态与紧凑梨形木腔共鸣，颗粒感极强。',
    beginnerTip: '适合节奏明快的国风主旋律、《春江花月夜》式领奏或灵动副旋律。',
  },
  {
    id: 'dizi',
    name: '中国传统竹笛',
    subtitle: 'Chinese Bamboo Dizi · 笛膜悠扬',
    category: 'chinese',
    categoryLabel: '中国民族与上古礼乐',
    gmProgram: 72,
    recommendedRange: [60, 84],
    defaultOctave: 5,
    acousticDescription: '模拟竹管空气柱振动与芦苇笛膜高频泛音，含自然气声与尾音颤音。',
    beginnerTip: '适合悠长抒情的仙侠/古风/江南民歌主旋律，长音自动触发自然颤音。',
  },

  // 2. 管弦与史诗交响 (Orchestral & Epic Cinema)
  {
    id: 'string_concerto',
    name: '弦乐协奏',
    subtitle: 'String Concerto · 巴洛克/古典领奏协奏',
    category: 'orchestral',
    categoryLabel: '管弦与史诗交响',
    gmProgram: 40,
    recommendedRange: [55, 84],
    defaultOctave: 4,
    acousticDescription: '突出首席小提琴敏锐运弓擦弦质感，同时融合室内弦乐团协奏共鸣，层次分明。',
    beginnerTip: '专为维瓦尔第《四季》等快速、灵动、颗粒感强的古典弦乐主旋律打造。',
  },
  {
    id: 'epic_strings',
    name: '史诗弦乐',
    subtitle: 'Epic Symphonic Strings · 宽银幕巨制弦乐群',
    category: 'orchestral',
    categoryLabel: '管弦与史诗交响',
    gmProgram: 49,
    recommendedRange: [43, 84],
    defaultOctave: 4,
    acousticDescription: '60人编制交响弦乐团双八度层叠建模，起音极具冲击力，声场宽广深邃。',
    beginnerTip: '好莱坞交响与史诗配乐核心，用作和弦铺底或大跳主旋律气势磅礴。',
  },
  {
    id: 'epic_brass',
    name: '史诗管乐',
    subtitle: 'Epic Cinema Brass · 好莱坞铜管咆哮齐奏',
    category: 'orchestral',
    categoryLabel: '管弦与史诗交响',
    gmProgram: 61,
    recommendedRange: [36, 76],
    defaultOctave: 3,
    acousticDescription: '圆号、长号与大号多声部齐奏，带动态非线性金属泛音张开效果。',
    beginnerTip: '适合好莱坞大片感主旋律号角、低音轰鸣支撑或皇家礼乐铜管声部。',
  },
  {
    id: 'violin_section',
    name: '管弦小提琴群',
    subtitle: 'Orchestral Violins · 丝绸抒情弦乐',
    category: 'orchestral',
    categoryLabel: '管弦与史诗交响',
    gmProgram: 48,
    recommendedRange: [55, 84],
    defaultOctave: 4,
    acousticDescription: '多把小提琴柔和擦弦起音模拟，带有细腻运弓包络与温暖木腔滤波。',
    beginnerTip: '适合连贯深情的慢板主旋律或柔和管弦和声铺底。',
  },
  {
    id: 'cello_solo',
    name: '独奏大提琴',
    subtitle: 'Solo Cello · 深情低吟',
    category: 'orchestral',
    categoryLabel: '管弦与史诗交响',
    gmProgram: 42,
    recommendedRange: [36, 67],
    defaultOctave: 3,
    acousticDescription: '浑厚温暖的低频琴箱共鸣与极具表现力的揉弦颤音。',
    beginnerTip: '最适合作为低音轨道或深沉感人的副旋律声部。',
  },
  {
    id: 'french_horn',
    name: '交响圆号',
    subtitle: 'French Horn · 温暖号角',
    category: 'orchestral',
    categoryLabel: '管弦与史诗交响',
    gmProgram: 60,
    recommendedRange: [43, 72],
    defaultOctave: 3,
    acousticDescription: '圆润柔和的铜管泛音包络，兼具古典高贵感与温暖包裹力。',
    beginnerTip: '适合管弦内声部和声填充或温暖低音支撑。',
  },
  {
    id: 'flute_orchestral',
    name: '西洋银质长笛',
    subtitle: 'Concert Flute · 清澈灵动',
    category: 'orchestral',
    categoryLabel: '管弦与史诗交响',
    gmProgram: 73,
    recommendedRange: [60, 84],
    defaultOctave: 5,
    acousticDescription: '纯净基音搭配柔和唇口气流声，音色通透明亮。',
    beginnerTip: '适合空灵多利亚旋律、童话或古典木管独奏。',
  },
  {
    id: 'orchestral_harp',
    name: '音乐会踏板竖琴',
    subtitle: 'Concert Harp · 晶莹琶音',
    category: 'orchestral',
    categoryLabel: '管弦与史诗交响',
    gmProgram: 46,
    recommendedRange: [48, 84],
    defaultOctave: 4,
    acousticDescription: '清澈指腹拨弦瞬态与悠长共鸣，泛音纯净如水滴。',
    beginnerTip: '搭配“流水琶音”和弦模式可瞬间产生梦幻伴奏效果。',
  },

  // 3. 人声独唱、合唱与轻声吟唱 (Vocals)
  {
    id: 'female_soprano',
    name: '女高音独唱',
    subtitle: 'Female Soprano · 清亮花腔',
    category: 'vocal',
    categoryLabel: '人声独唱与合唱',
    gmProgram: 53,
    recommendedRange: [60, 84],
    defaultOctave: 5,
    acousticDescription: '三段共振峰(F1/F2/F3)人声建模，模拟清澈明亮的女高音头腔共鸣。',
    beginnerTip: '适合高潮段落的高空主旋律，穿透力极强。',
  },
  {
    id: 'female_mezzo',
    name: '女中音独唱',
    subtitle: 'Female Mezzo · 温润叙事',
    category: 'vocal',
    categoryLabel: '人声独唱与合唱',
    gmProgram: 53,
    recommendedRange: [55, 79],
    defaultOctave: 4,
    acousticDescription: '温暖圆润的元音共振峰调校，富有情感张力与自然气息。',
    beginnerTip: '适合抒情主歌旋律或与古典吉他、钢琴搭配。',
  },
  {
    id: 'female_alto',
    name: '女低音独唱',
    subtitle: 'Female Alto · 醇厚深沉',
    category: 'vocal',
    categoryLabel: '人声独唱与合唱',
    gmProgram: 52,
    recommendedRange: [50, 74],
    defaultOctave: 4,
    acousticDescription: '深邃丝绒质感的女性胸腔共鸣，温暖而稳重。',
    beginnerTip: '适合深沉内敛的慢板旋律或中声部厚实和声。',
  },
  {
    id: 'male_tenor',
    name: '男高音独唱',
    subtitle: 'Male Tenor · 辉煌金属感',
    category: 'vocal',
    categoryLabel: '人声独唱与合唱',
    gmProgram: 52,
    recommendedRange: [48, 72],
    defaultOctave: 4,
    acousticDescription: '具备歌手共振峰(2.8kHz高频泛音)的辉煌男高音音色。',
    beginnerTip: '适合史诗、歌剧感或《欢乐颂》式热血主旋律。',
  },
  {
    id: 'male_baritone',
    name: '男中音独唱',
    subtitle: 'Male Baritone · 磁性温暖',
    category: 'vocal',
    categoryLabel: '人声独唱与合唱',
    gmProgram: 52,
    recommendedRange: [43, 67],
    defaultOctave: 3,
    acousticDescription: '磁性均衡的胸腔与咽腔共鸣，亲切自然的叙事感。',
    beginnerTip: '适合温和深情的男声独唱旋律或男声部呼应。',
  },
  {
    id: 'male_bass',
    name: '男低音独唱',
    subtitle: 'Male Bass · 浑厚胸腔',
    category: 'vocal',
    categoryLabel: '人声独唱与合唱',
    gmProgram: 52,
    recommendedRange: [36, 60],
    defaultOctave: 3,
    acousticDescription: '极富包围感的低频声带基音与宽厚胸腔共鸣。',
    beginnerTip: '可用于低音根音铺底或庄严圣咏式低音旋律。',
  },
  {
    id: 'grand_choir',
    name: '交响混声合唱',
    subtitle: 'Symphonic SATB Choir · 宏伟圣咏',
    category: 'vocal',
    categoryLabel: '人声独唱与合唱',
    gmProgram: 52,
    recommendedRange: [45, 79],
    defaultOctave: 4,
    acousticDescription: '多声部微失谐共振峰群感合成，模拟音乐厅混声大合唱空间感。',
    beginnerTip: '强烈推荐用于好莱坞交响与《欢乐颂》和弦/主音轨道。',
  },
  {
    id: 'soft_humming',
    name: '空灵轻声吟唱',
    subtitle: 'Ethereal Humming · 闭口柔声哼鸣',
    category: 'vocal',
    categoryLabel: '人声独唱与合唱',
    gmProgram: 54,
    recommendedRange: [55, 81],
    defaultOctave: 4,
    acousticDescription: '柔和鼻腔共鸣与空气感气声包络，如耳畔轻声哼唱。',
    beginnerTip: '适合空灵多利亚旋律、秘境氛围的副歌呼应或轻柔主旋律。',
  },

  // 4. 键盘与教堂钟声 (Keyboards & Cathedral Bells)
  {
    id: 'grand_piano',
    name: '音乐会三角钢琴',
    subtitle: 'Concert Grand Piano · 万能经典',
    category: 'keyboard',
    categoryLabel: '键盘与教堂钟声',
    gmProgram: 0,
    recommendedRange: [36, 84],
    defaultOctave: 4,
    acousticDescription: '槌击琴弦多泛音衰减建模，低音浑厚、高音清亮。',
    beginnerTip: '百搭之选，无论是主旋律、柱式和弦还是分解伴奏都自然动听。',
  },
  {
    id: 'pipe_organ',
    name: '大教堂管风琴',
    subtitle: 'Cathedral Pipe Organ · 恢弘音栓',
    category: 'keyboard',
    categoryLabel: '键盘与教堂钟声',
    gmProgram: 19,
    recommendedRange: [36, 79],
    defaultOctave: 4,
    acousticDescription: '16尺、8尺、4尺与2尺复合音栓叠加，长音持续不衰减。',
    beginnerTip: '适合哥特、巴洛克、神圣教堂风格的和声与低音轨道。',
  },
  {
    id: 'harpsichord',
    name: '巴洛克羽管键琴',
    subtitle: 'Baroque Harpsichord · 复古拨弦',
    category: 'keyboard',
    categoryLabel: '键盘与教堂钟声',
    gmProgram: 6,
    recommendedRange: [48, 84],
    defaultOctave: 4,
    acousticDescription: '羽管拨片钩动金属琴弦的明亮清脆瞬态，极具宫廷古典感。',
    beginnerTip: '适合维瓦尔第《四季》等巴洛克通奏低音与分解和弦伴奏。',
  },
  {
    id: 'church_bells',
    name: '教堂钟声',
    subtitle: 'Cathedral Tubular Bells · 庄严管钟',
    category: 'keyboard',
    categoryLabel: '键盘与教堂钟声',
    gmProgram: 14,
    recommendedRange: [48, 84],
    defaultOctave: 4,
    acousticDescription: '模拟欧洲大教堂青铜管钟的槌击金属瞬态、八度哼鸣音与悠长圣殿混响。',
    beginnerTip: '适合史诗交响高潮点缀、圣诞/圣咏氛围或《山魔王宫殿》戏剧性重音。',
  },

  // 5. 吉他、合成器与 8-bit 芯片 (Modern, Classical Guitar & 8-bit)
  {
    id: 'classical_guitar',
    name: '古典吉他',
    subtitle: 'Classical Nylon Guitar · 温暖尼龙弦',
    category: 'modern',
    categoryLabel: '吉他/合成器/8-bit',
    gmProgram: 24,
    recommendedRange: [45, 79],
    defaultOctave: 4,
    acousticDescription: '指腹拨动尼龙琴弦的温润瞬态与雪松木面板共鸣腔体建模，音色甜美柔和。',
    beginnerTip: '极适合空灵多利亚民谣、西班牙风情旋律或温暖指弹分解和弦。',
  },
  {
    id: 'chiptune_8bit',
    name: '8-bit 复古芯片',
    subtitle: '8-Bit Chiptune · 红白机脉冲方波',
    category: 'modern',
    categoryLabel: '吉他/合成器/8-bit',
    gmProgram: 80,
    recommendedRange: [48, 84],
    defaultOctave: 4,
    acousticDescription: '经典2A03/PSG芯片脉冲方波建模，带阶梯式包络与快速芯片叠音质感。',
    beginnerTip: '8-bit像素游戏风核心音色，同时用于主旋律和琶音伴奏秒回童年街机时代。',
  },
  {
    id: 'electric_guitar_lead',
    name: '失真主音电吉他',
    subtitle: 'Overdrive Lead Guitar · 热血摇滚',
    category: 'modern',
    categoryLabel: '吉他/合成器/8-bit',
    gmProgram: 29,
    recommendedRange: [48, 79],
    defaultOctave: 4,
    acousticDescription: '电子管过载波形塑形与箱体共振滤波，延音饱满激昂。',
    beginnerTip: '适合摇滚燃曲、动漫风主音Solo或强力五度和弦。',
  },
  {
    id: 'electric_guitar_clean',
    name: '清音合唱电吉他',
    subtitle: 'Clean Chorus Guitar · 都市微风',
    category: 'modern',
    categoryLabel: '吉他/合成器/8-bit',
    gmProgram: 27,
    recommendedRange: [48, 79],
    defaultOctave: 4,
    acousticDescription: '双声道微调合唱效果与清亮拾音器拨弦音色。',
    beginnerTip: '适合现代流行、民谣抒情风格的分解和弦伴奏。',
  },
  {
    id: 'synth_lead',
    name: '复古模拟合成器',
    subtitle: 'Analog Poly Synth · 赛博流光',
    category: 'modern',
    categoryLabel: '吉他/合成器/8-bit',
    gmProgram: 81,
    recommendedRange: [48, 84],
    defaultOctave: 4,
    acousticDescription: '双锯齿波与方波失谐叠加，配动态谐振低通滤波器包络。',
    beginnerTip: '适合电子乐、Synthwave复古合成器主旋律。',
  },
  {
    id: 'synth_pad',
    name: '星云氛围合成器',
    subtitle: 'Nebula Warm Pad · 梦幻包裹',
    category: 'modern',
    categoryLabel: '吉他/合成器/8-bit',
    gmProgram: 89,
    recommendedRange: [45, 76],
    defaultOctave: 4,
    acousticDescription: '慢起音多振荡器立体声铺底，营造深邃温暖的空间包裹感。',
    beginnerTip: '和弦轨道神器，能无缝填补声部空隙，让整首曲子瞬间饱满。',
  },
  {
    id: 'synth_bass',
    name: '电音合成贝斯',
    subtitle: 'Sub & Pluck Synth Bass · 强劲低频',
    category: 'modern',
    categoryLabel: '吉他/合成器/8-bit',
    gmProgram: 38,
    recommendedRange: [36, 55],
    defaultOctave: 2,
    acousticDescription: '下潜极深的超低频正弦基音叠加瞬态滤波器冲击。',
    beginnerTip: '专为低音轨道设计，为8-bit或现代电子乐提供稳健有力的低频律动。',
  },

  // 6. 打击乐采样
  {
    id: 'percussion_kit',
    name: '全能中西打击乐组',
    subtitle: 'Multi-Style Percussion · 鼓组与民乐打击',
    category: 'percussion',
    categoryLabel: '打击乐与鼓组采样',
    gmProgram: 0,
    recommendedRange: [36, 50],
    defaultOctave: 3,
    acousticDescription: '内置8种高还原采样合成打击乐：底鼓、军鼓、闭镲、开镲、中国堂鼓/定音鼓、木鱼梆子、手拍与风铃吊镲。',
    beginnerTip: '点击网格即可编写节奏，或点击“补齐打击节奏”一键生成带过门加花的鼓点。',
  },
];

export const PERCUSSION_PADS: PercussionPadDefinition[] = [
  { pitch: 49, name: '吊镲 / 金石风铃 (Crash & Chime)', shortName: '吊镲/风铃', category: 'traditional', description: '用于小节开头重音渲染或古风金石点缀' },
  { pitch: 50, name: '木鱼 / 戏曲梆子 (Woodblock)', shortName: '木鱼/梆子', category: 'traditional', description: '清脆木质敲击，国风与轻快节奏精髓' },
  { pitch: 45, name: '中国堂鼓 / 管弦定音鼓 (Tanggu / Timpani)', shortName: '堂鼓/定音鼓', category: 'traditional', description: '恢弘震撼的大鼓共鸣，适合史诗与国风重拍' },
  { pitch: 46, name: '开镲 (Open Hi-Hat)', shortName: '开镲 OH', category: 'modern', description: '延音沙沙金属声，用于律动反拍或段落衔接' },
  { pitch: 42, name: '闭镲 (Closed Hi-Hat)', shortName: '闭镲 CH', category: 'modern', description: '紧凑高频节拍器，维持全曲速度感与律动' },
  { pitch: 39, name: '拍手 / 响指 (Hand Clap)', shortName: '拍手 Clap', category: 'modern', description: '增强现代流行与轻快曲风的互动感' },
  { pitch: 38, name: '军鼓 (Acoustic Snare)', shortName: '军鼓 Snare', category: 'modern', description: '通常落在第2、4拍，构成现代音乐的核心骨架' },
  { pitch: 36, name: '低音底鼓 (Punchy Kick)', shortName: '底鼓 Kick', category: 'modern', description: '通常落在第1、3强拍，驱动整首乐曲的心跳' },
];

export const SCALES: ScaleDefinition[] = [
  {
    id: 'pentatonic_major',
    name: '中国五声宫调 (大调五声)',
    subtitle: '1 2 3 5 6 · 怎么弹都好听',
    intervals: [0, 2, 4, 7, 9],
    jianpuLabels: { 0: '1 宫', 2: '2 商', 4: '3 角', 7: '5 徵', 9: '6 羽' },
    moodDescription: '剔除了容易产生不协和尖锐感的4(Fa)和7(Si)，零基础随便点击音符都优美和谐，兼具国风雅韵与流行悦耳感。',
  },
  {
    id: 'pentatonic_minor',
    name: '中国五声羽调 (古风小调五声)',
    subtitle: '6 1 2 3 5 · 仙侠与江湖感',
    intervals: [0, 3, 5, 7, 10],
    jianpuLabels: { 0: '6 羽', 3: '1 宫', 5: '2 商', 7: '3 角', 10: '5 徵' },
    moodDescription: '深情、苍凉又略带侠气的五声音阶，无论搭配古筝竹笛还是电吉他合成器都非常出彩。',
  },
  {
    id: 'major',
    name: '自然大调 (明亮温暖)',
    subtitle: '1 2 3 4 5 6 7 · 阳光治愈',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    jianpuLabels: { 0: '1 Do', 2: '2 Re', 4: '3 Mi', 5: '4 Fa', 7: '5 Sol', 9: '6 La', 11: '7 Si' },
    moodDescription: '最经典的七声音阶，色彩明朗、积极温暖，适合流行抒情、童话配乐与颂歌。',
  },
  {
    id: 'minor',
    name: '自然小调 (叙事深情)',
    subtitle: '6 7 1 2 3 4 5 · 电影感与忧郁',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    jianpuLabels: { 0: '6 La', 2: '7 Si', 3: '1 Do', 5: '2 Re', 7: '3 Mi', 8: '4 Fa', 10: '5 Sol' },
    moodDescription: '富有故事感与戏剧张力，广泛用于影视配乐、慢板抒情与史诗交响。',
  },
  {
    id: 'dorian',
    name: '多利亚调式 (空灵奇幻)',
    subtitle: '凯尔特/空灵吟唱/科幻感',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    jianpuLabels: { 0: '1 主', 2: '2 二', 3: 'b3 三', 5: '4 四', 7: '5 五', 9: '6 升六', 10: 'b7 七' },
    moodDescription: '在小调基础上将六级音升高半音，带来神秘、神圣而充满希望的空灵色彩。',
  },
  {
    id: 'harmonic_minor',
    name: '和声小调 (古典巴洛克)',
    subtitle: '古典宫廷/管风琴/哥特感',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    jianpuLabels: { 0: '6 主', 2: '7 二', 3: '1 三', 5: '2 四', 7: '3 五', 8: '4 六', 11: '#5 导' },
    moodDescription: '具有强烈的古典戏剧张力与导音倾向，非常适合弦乐协奏、羽管键琴与管风琴。',
  },
];

export const CHORD_PROGRESSIONS: ChordProgressionPreset[] = [
  {
    id: 'canon_warm',
    name: '经典黄金卡农走向 (1 - 5 - 6 - 4)',
    tag: '最受欢迎 · 温暖感人',
    description: '从稳定主音出发，历经明亮下属与柔和关系小调，零基础写歌百试百灵。',
    recommendedScales: ['major', 'pentatonic_major'],
    bars4: [
      { rootOffset: 0, chordType: 'major', roman: 'I', functionHint: '主和弦 · 稳定温暖的开篇' },
      { rootOffset: 7, chordType: 'major', roman: 'V', functionHint: '属和弦 · 视野开阔推进' },
      { rootOffset: 9, chordType: 'minor', roman: 'vi', functionHint: '六级小和弦 · 涌起柔和叙事感' },
      { rootOffset: 5, chordType: 'major', roman: 'IV', functionHint: '下属和弦 · 温柔包裹并准备回归' },
    ],
  },
  {
    id: 'guofeng_jade',
    name: '国风雅韵走向 (4 - 5 - 6m - 3m)',
    tag: '古风仙侠 · 意境悠长',
    description: '极具东方留白美感的王道古风进行，情感层层递进，余音绕梁。',
    recommendedScales: ['pentatonic_major', 'pentatonic_minor', 'major'],
    bars4: [
      { rootOffset: 5, chordType: 'major', roman: 'IV', functionHint: '四级起手 · 如云雾初开的画面感' },
      { rootOffset: 7, chordType: 'major', roman: 'V', functionHint: '五级扬起 · 情绪向上攀升' },
      { rootOffset: 9, chordType: 'minor', roman: 'vi', functionHint: '六级落点 · 宿命感与侠骨柔情' },
      { rootOffset: 4, chordType: 'minor', roman: 'iii', functionHint: '三级回眸 · 婉转过渡意犹未尽' },
    ],
  },
  {
    id: 'royal_ritual_prog',
    name: '华夏雅乐正声进行 (1 - 5 - 4 - 1)',
    tag: '皇家礼乐 · 金石端庄',
    description: '围绕宫音与徵音构建的庄重五声正格进行，大巧不工，气度恢弘。',
    recommendedScales: ['pentatonic_major', 'major'],
    bars4: [
      { rootOffset: 0, chordType: 'major', roman: 'I (宫)', functionHint: '宫音立极 · 天地庄严正声' },
      { rootOffset: 7, chordType: 'major', roman: 'V (徵)', functionHint: '徵音宣礼 · 钟鼓齐鸣开阔' },
      { rootOffset: 5, chordType: 'sus4', roman: 'IVsus4', functionHint: '清商过渡 · 礼仪雍容回旋' },
      { rootOffset: 0, chordType: 'major', roman: 'I (宫)', functionHint: '四海归宫 · 端庄圆满落定' },
    ],
  },
  {
    id: 'epic_heroic',
    name: '好莱坞史诗进行 (1m - b6 - b3 - b7)',
    tag: '电影大片 · 悲壮恢弘',
    description: '好莱坞与史诗交响标志性走向，配合史诗管乐、史诗弦乐与合唱团气势磅礴。',
    recommendedScales: ['minor', 'pentatonic_minor'],
    bars4: [
      { rootOffset: 0, chordType: 'minor', roman: 'i', functionHint: '小调主和弦 · 庄严凝重的序幕' },
      { rootOffset: 8, chordType: 'major', roman: 'bVI', functionHint: '降六级大三 · 宏大银幕画卷展开' },
      { rootOffset: 3, chordType: 'major', roman: 'bIII', functionHint: '降三级大三 · 英雄主义光芒浮现' },
      { rootOffset: 10, chordType: 'major', roman: 'bVII', functionHint: '降七级推进 · 铜管齐鸣推向高潮' },
    ],
  },
  {
    id: 'ethereal_dream',
    name: '空灵多利亚走向 (1m - 4 - b7 - 1m)',
    tag: '空灵多利亚 · 秘境民谣',
    description: '小调主和弦搭配特征性的大三四级和弦(IV)，一秒营造空灵多利亚神秘色彩。',
    recommendedScales: ['dorian', 'pentatonic_minor'],
    bars4: [
      { rootOffset: 0, chordType: 'minor', roman: 'i', functionHint: '静谧小调 · 如森林晨雾般安静' },
      { rootOffset: 5, chordType: 'major', roman: 'IV (多利亚)', functionHint: '特征大四级 · 圣洁光芒穿透迷雾' },
      { rootOffset: 10, chordType: 'major', roman: 'bVII', functionHint: '开阔降七级 · 自由漂浮于天际' },
      { rootOffset: 0, chordType: 'sus4', roman: 'isus4', functionHint: '挂留收束 · 空灵悬浮余韵' },
    ],
  },
  {
    id: 'baroque_court',
    name: '巴洛克古典进行 (1m - 4m - 5 - 1m)',
    tag: '古典宫廷 · 戏剧张力',
    description: '严谨典雅的欧洲巴洛克正格进行，搭配弦乐协奏、羽管键琴与管风琴极具贵族气质。',
    recommendedScales: ['harmonic_minor', 'minor'],
    bars4: [
      { rootOffset: 0, chordType: 'minor', roman: 'i', functionHint: '古典主调 · 严谨端庄的主题呈示' },
      { rootOffset: 5, chordType: 'minor', roman: 'iv', functionHint: '小下属和弦 · 深沉内省的展开' },
      { rootOffset: 7, chordType: 'major', roman: 'V', functionHint: '大属和弦 · 强烈的导音解决张力' },
      { rootOffset: 0, chordType: 'minor', roman: 'i', functionHint: '完全终止 · 圆满回归主调' },
    ],
  },
  {
    id: 'energetic_rock',
    name: '热血8bit/摇滚走向 (6m - 4 - 1 - 5)',
    tag: '像素冒险 · 燃曲律动',
    description: '极具冲劲与旋律记忆点的王道进行，非常适合8-bit像素风、电吉他与合成器。',
    recommendedScales: ['pentatonic_minor', 'major', 'minor'],
    bars4: [
      { rootOffset: 9, chordType: 'minor', roman: 'vi', functionHint: '果断切入 · 充满冒险能量的起点' },
      { rootOffset: 5, chordType: 'major', roman: 'IV', functionHint: '情绪铺垫 · 宽广的声场支撑' },
      { rootOffset: 0, chordType: 'major', roman: 'I', functionHint: '明亮释放 · 豁然开朗的宣泄' },
      { rootOffset: 7, chordType: 'major', roman: 'V', functionHint: '蓄力推进 · 驱动下一轮循环' },
    ],
  },
];

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'royal_ritual_ya',
    name: '中国古典 · 皇家礼乐',
    subtitle: '中国上古钟磬 + 传统竹笛 + 敦煌古筝 + 史诗管乐 + 皇家堂鼓金石',
    description: '采用五声宫调与华夏雅乐正声进行，曾侯乙青铜编钟与玉磬齐鸣，重现周汉盛世礼乐气象。',
    bpm: 76,
    rootNote: 0, // C
    scale: 'pentatonic_major',
    progressionId: 'royal_ritual_prog',
    trackInstruments: {
      melody: 'ancient_bianzhong',
      counter: 'dizi',
      chords: 'guzheng',
      bass: 'epic_brass',
      rhythm: 'percussion_kit',
    },
    algorithmParams: {
      melodyDensity: 0.46,
      pitchSmoothness: 0.82,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.55,
    },
  },
  {
    id: 'hollywood_symphony',
    name: '好莱坞交响 · 银幕巨制',
    subtitle: '史诗管乐 + 史诗弦乐 + 交响混声合唱 + 教堂钟声 + 震撼定音大鼓',
    description: '宽银幕电影配乐编制，咆哮式史诗铜管与双八度史诗弦乐交织，辅以教堂钟声与合唱。',
    bpm: 102,
    rootNote: 2, // D
    scale: 'minor',
    progressionId: 'epic_heroic',
    trackInstruments: {
      melody: 'epic_brass',
      counter: 'church_bells',
      chords: 'epic_strings',
      bass: 'grand_choir',
      rhythm: 'percussion_kit',
    },
    algorithmParams: {
      melodyDensity: 0.56,
      pitchSmoothness: 0.7,
      chordStyle: 'sustained',
      rhythmIntensity: 0.82,
    },
  },
  {
    id: 'ethereal_dorian',
    name: '空灵多利亚旋律 · 迷雾森林',
    subtitle: '古典吉他 + 西洋银质长笛 + 空灵轻声吟唱 + 音乐会竖琴 + 独奏大提琴',
    description: '多利亚调式特有的神秘明亮大四级和弦，温暖尼龙弦古典吉他与长笛、吟唱共筑奇幻秘境。',
    bpm: 84,
    rootNote: 2, // D Dorian
    scale: 'dorian',
    progressionId: 'ethereal_dream',
    trackInstruments: {
      melody: 'flute_orchestral',
      counter: 'soft_humming',
      chords: 'classical_guitar',
      bass: 'cello_solo',
      rhythm: 'percussion_kit',
    },
    algorithmParams: {
      melodyDensity: 0.52,
      pitchSmoothness: 0.86,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.32,
    },
  },
  {
    id: 'chiptune_8bit_style',
    name: '8bit风格 · 像素冒险',
    subtitle: '8-bit复古芯片主音 + 8-bit方波对位 + 复古合成器琶音 + 电音贝斯 + 像素鼓组',
    description: '纯正FC红白机脉冲波音色与高速琶音织体，节奏明快热血，一键生成复古游戏配乐。',
    bpm: 132,
    rootNote: 0, // C
    scale: 'pentatonic_minor',
    progressionId: 'energetic_rock',
    trackInstruments: {
      melody: 'chiptune_8bit',
      counter: 'synth_lead',
      chords: 'chiptune_8bit',
      bass: 'synth_bass',
      rhythm: 'percussion_kit',
    },
    algorithmParams: {
      melodyDensity: 0.78,
      pitchSmoothness: 0.68,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.85,
    },
  },
  {
    id: 'xianxia_guofeng',
    name: '国风仙侠 · 烟雨竹林',
    subtitle: '竹笛主音 + 大曲琵琶 + 敦煌古筝 + 独奏大提琴 + 堂鼓木鱼',
    description: '采用五声宫调与国风雅韵和弦走向，笛声悠扬，古筝流水相伴。',
    bpm: 88,
    rootNote: 0, // C
    scale: 'pentatonic_major',
    progressionId: 'guofeng_jade',
    trackInstruments: {
      melody: 'dizi',
      counter: 'pipa',
      chords: 'guzheng',
      bass: 'cello_solo',
      rhythm: 'percussion_kit',
    },
    algorithmParams: {
      melodyDensity: 0.58,
      pitchSmoothness: 0.78,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.45,
    },
  },
  {
    id: 'epic_orchestra',
    name: '史诗圣殿 · 女高音交响',
    subtitle: '女高音独唱 + 弦乐协奏 + 混声大合唱 + 交响圆号 + 定音大鼓',
    description: '女高音花腔与弦乐协奏交织，混声合唱与定音鼓震撼烘托。',
    bpm: 94,
    rootNote: 2, // D
    scale: 'minor',
    progressionId: 'epic_heroic',
    trackInstruments: {
      melody: 'female_soprano',
      counter: 'string_concerto',
      chords: 'grand_choir',
      bass: 'french_horn',
      rhythm: 'percussion_kit',
    },
    algorithmParams: {
      melodyDensity: 0.52,
      pitchSmoothness: 0.72,
      chordStyle: 'sustained',
      rhythmIntensity: 0.72,
    },
  },
  {
    id: 'baroque_cathedral',
    name: '巴洛克协奏 · 古典宫廷',
    subtitle: '弦乐协奏 + 巴洛克羽管键琴 + 大教堂管风琴 + 独奏大提琴',
    description: '和声小调古典复调织体，弦乐协奏与羽管键琴清脆颗粒感交相辉映。',
    bpm: 106,
    rootNote: 9, // A
    scale: 'harmonic_minor',
    progressionId: 'baroque_court',
    trackInstruments: {
      melody: 'string_concerto',
      counter: 'harpsichord',
      chords: 'pipe_organ',
      bass: 'cello_solo',
      rhythm: 'percussion_kit',
    },
    algorithmParams: {
      melodyDensity: 0.68,
      pitchSmoothness: 0.74,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.4,
    },
  },
  {
    id: 'healing_piano_vocal',
    name: '治愈抒情 · 暮光独白',
    subtitle: '女中音独唱 + 空灵轻声吟唱 + 三角钢琴 + 古典吉他',
    description: '温暖黄金卡农走向，钢琴分解和弦伴随深情人声与空灵吟唱，宁静治愈。',
    bpm: 78,
    rootNote: 0, // C
    scale: 'major',
    progressionId: 'canon_warm',
    trackInstruments: {
      melody: 'female_mezzo',
      counter: 'soft_humming',
      chords: 'grand_piano',
      bass: 'classical_guitar',
      rhythm: 'percussion_kit',
    },
    algorithmParams: {
      melodyDensity: 0.48,
      pitchSmoothness: 0.85,
      chordStyle: 'arpeggio',
      rhythmIntensity: 0.35,
    },
  },
  {
    id: 'cyber_rock',
    name: '电音摇滚 · 星际疾驰',
    subtitle: '失真电吉他 + 复古模拟合成器 + 星云铺底 + 电音贝斯 + 劲爆鼓组',
    description: '充满动感的电吉他Solo与复古合成器交相辉映，配合饱满鼓组引爆能量。',
    bpm: 122,
    rootNote: 4, // E
    scale: 'pentatonic_minor',
    progressionId: 'energetic_rock',
    trackInstruments: {
      melody: 'electric_guitar_lead',
      counter: 'synth_lead',
      chords: 'synth_pad',
      bass: 'synth_bass',
      rhythm: 'percussion_kit',
    },
    algorithmParams: {
      melodyDensity: 0.72,
      pitchSmoothness: 0.65,
      chordStyle: 'rhythmic',
      rhythmIntensity: 0.88,
    },
  },
];

export function getInstrumentById(id: string): InstrumentDefinition {
  return INSTRUMENTS.find((inst) => inst.id === id) || INSTRUMENTS[0];
}

export function getScaleById(id: string): ScaleDefinition {
  return SCALES.find((s) => s.id === id) || SCALES[0];
}

export function getProgressionById(id: string): ChordProgressionPreset {
  return CHORD_PROGRESSIONS.find((p) => p.id === id) || CHORD_PROGRESSIONS[0];
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = PITCH_CLASS_NAMES[midi % 12];
  return `${name}${octave}`;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Returns a beginner-friendly label for a MIDI note given the project's rootNote and scale.
 */
export function getBeginnerNoteLabel(
  midi: number,
  rootNote: number,
  scaleId: string
): { noteName: string; jianpu: string; inScale: boolean; isRoot: boolean } {
  const noteName = midiToNoteName(midi);
  const scale = getScaleById(scaleId);
  const relSemitone = ((midi % 12) - (rootNote % 12) + 12) % 12;
  const inScale = scale.intervals.includes(relSemitone);
  const isRoot = relSemitone === 0;
  const jianpu = scale.jianpuLabels[relSemitone] || '';
  return { noteName, jianpu, inScale, isRoot };
}
