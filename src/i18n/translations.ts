import {
  AcousticHallType,
  InstrumentCategory,
  InstrumentId,
  MotifDevelopmentMode,
  ScaleType,
  TrackRole,
} from '../types/music';

export type Language = 'zh' | 'en';

export function tr(lang: Language, zh: string, en: string): string {
  return lang === 'en' ? en : zh;
}

export const INSTRUMENT_CATEGORY_EN: Record<InstrumentCategory, string> = {
  chinese: 'Chinese Traditional & Ancient',
  orchestral: 'Symphonic & Epic Orchestra',
  vocal: 'Solo & Choir Vocals',
  keyboard: 'Keyboards, Organ & Bells',
  modern: 'Guitars, 8-Bit & Synths',
  percussion: 'Percussion & Drums',
};

export const INSTRUMENT_EN_MAP: Record<
  InstrumentId,
  { name: string; subtitle: string; desc: string; tip: string }
> = {
  grand_piano: {
    name: 'Concert Grand Piano',
    subtitle: 'Steinway Acoustic Modeling',
    desc: 'Warm spruce soundboard resonance with realistic string inharmonicity and felt hammer attack.',
    tip: 'Ideal for lead melodies, arpeggios, or full chordal accompaniment.',
  },
  pipe_organ: {
    name: 'Cathedral Pipe Organ',
    subtitle: '7-Rank Baroque Registration',
    desc: 'Majestic multi-rank organ pipes (16’ to 1-3/5’) with authentic wind-chest chiff transient.',
    tip: 'Best for sacred hymns, gothic castles, and grand sustained chords.',
  },
  harpsichord: {
    name: 'Baroque Harpsichord',
    subtitle: '8’ + 4’ Quill Plucked Strings',
    desc: 'Crisp quill-plucked brass strings with bright upper harmonics and courtly Baroque articulation.',
    tip: 'Great for rapid 16th-note runs, counterpoint, and Baroque concertos.',
  },
  church_bells: {
    name: 'Cathedral Tubular Bells',
    subtitle: '7-Mode Bronze Chime Synthesis',
    desc: 'Solemn cathedral chimes with authentic hum tone, prime, minor third, and clang overtones.',
    tip: 'Use on downbeats or phrase endings for ceremonial grandeur.',
  },
  guzheng: {
    name: 'Chinese Guzheng (21-String Zither)',
    subtitle: 'Paulownia Soundboard & Micro-Bend',
    desc: 'Resonant Paulownia wood cavity with delicate tortoiseshell pick transient and pitch grace.',
    tip: 'Shines in pentatonic melodies and flowing waterfall arpeggios.',
  },
  pipa: {
    name: 'Chinese Pipa (Pearwood Lute)',
    subtitle: 'Crisp Fret Metallic Resonance',
    desc: 'Articulate pearwood body with signature bamboo-fret metallic brilliance ("Pearls on Jade Plate").',
    tip: 'Perfect for rhythmic plucked melodies, martial themes, and agile counter-lines.',
  },
  dizi: {
    name: 'Chinese Bamboo Dizi Flute',
    subtitle: 'Reed Membrane (Dimo) Buzz & Breath',
    desc: 'Expressive bamboo flute featuring nonlinear reed-membrane harmonic buzz and abdominal vibrato.',
    tip: 'Best for soaring lyrical melodies in Guofeng and Xianxia scenes.',
  },
  ancient_bianzhong: {
    name: 'Ancient Bronze Bianzhong Bells',
    subtitle: 'Marquis Yi Dual-Tone Ritual Chimes',
    desc: '2400-year-old royal bronze bells with dual-pitch major/minor third modal shimmer and jade chimes.',
    tip: 'Essential for imperial ceremonies, historical epics, and sacred accents.',
  },
  string_concerto: {
    name: 'Violin Concerto Solo & Ripieno',
    subtitle: 'Stradivarius 3-Formant Wood Body',
    desc: 'Virtuosic lead violin with Cremonese spruce/maple corpus resonance and chamber string ripieno.',
    tip: 'Ideal for Vivaldi/Bach style concertos and expressive lead themes.',
  },
  epic_strings: {
    name: 'Epic Symphonic Strings',
    subtitle: 'Multi-Octave Cinema Ensemble',
    desc: 'Wide-screen Hollywood string section spanning cellos, violas, and violins with marcato bite.',
    tip: 'Provides massive emotional lift for film scores and boss battles.',
  },
  epic_brass: {
    name: 'Epic Cinema Brass',
    subtitle: 'Horns, Trombones & Tuba Ensemble',
    desc: 'Heroic brass ensemble with dynamic harmonic filter bloom and deep sub-octave foundation.',
    tip: 'Use for heroic fanfares, climaxes, and powerful bass/chordal hits.',
  },
  violin_section: {
    name: 'Symphonic Violin Section',
    subtitle: '16-Player Lush Legato Ensemble',
    desc: 'Warm ensemble violins with natural detuned chorus, woody bridge peak, and delayed vibrato.',
    tip: 'Versatile for lyrical melodies, counter-melodies, and harmonic pads.',
  },
  cello_solo: {
    name: 'Solo Concert Cello',
    subtitle: 'Deep Montagnana Chest Resonance',
    desc: 'Rich, soulful solo cello with deep 175Hz cavity resonance and expressive bow friction.',
    tip: 'Wonderful for noble basslines, melancholic solos, and low counter-melodies.',
  },
  french_horn: {
    name: 'Symphonic French Horn',
    subtitle: 'Warm Noble Brass',
    desc: 'Mellow, rounded brass tone that bridges woodwinds and strings effortlessly.',
    tip: 'Great for heroic motifs, counter-melodies, and warm mid-register chords.',
  },
  flute_orchestral: {
    name: 'Concert Silver Flute',
    subtitle: 'Pure Airy Overtones & Vibrato',
    desc: 'Crystalline silver tube tone with delicate embouchure air chiff and gentle vibrato.',
    tip: 'Suited for pastoral themes, forest scenes, and upper-register ornaments.',
  },
  orchestral_harp: {
    name: 'Concert Pedal Harp',
    subtitle: 'Luminous Plucked Arpeggios',
    desc: 'Spruce soundboard warmth paired with crystalline upper harmonics and long natural decay.',
    tip: 'The #1 choice for flowing arpeggio tracks and magical transitions.',
  },
  female_soprano: {
    name: 'Female Soprano Solo',
    subtitle: '3-Formant Vocal Tract Synthesis',
    desc: 'Luminous high female voice modeled with vowel formants (800Hz / 1250Hz / 2900Hz) and natural vibrato.',
    tip: 'Perfect for ethereal celestial themes and operatic climaxes.',
  },
  female_mezzo: {
    name: 'Female Mezzo-Soprano',
    subtitle: 'Warm Narrative Vocal',
    desc: 'Balanced, expressive mid-high female vocal with warm chest-to-head resonance.',
    tip: 'Great for lyrical song melodies and emotional storytelling.',
  },
  female_alto: {
    name: 'Female Alto Solo',
    subtitle: 'Deep Velvety Vocal',
    desc: 'Rich, grounded female alto timbre with intimate breath texture.',
    tip: 'Works beautifully for soulful melodies and inner vocal harmonies.',
  },
  male_tenor: {
    name: 'Male Tenor Solo',
    subtitle: 'Bright Heroic Vocal',
    desc: 'Clear, resonant male tenor voice with expressive vibrato and ringing upper formant.',
    tip: 'Suited for passionate lead melodies or duet counter-melodies.',
  },
  male_baritone: {
    name: 'Male Baritone Solo',
    subtitle: 'Noble Warm Vocal',
    desc: 'Full-bodied male baritone with rich chest resonance.',
    tip: 'Ideal for grounded themes, ballads, and heroic choral support.',
  },
  male_bass: {
    name: 'Male Bass Solo',
    subtitle: 'Profound Low Vocal',
    desc: 'Deep, resonant cathedral bass voice anchoring the lowest vocal register.',
    tip: 'Use on bass or pad tracks for ancient chant and solemn depth.',
  },
  grand_choir: {
    name: 'Symphonic Mixed Choir',
    subtitle: 'Multi-Voice Cathedral Chorus',
    desc: 'Lush SATB choir ensemble with blended vowel formants and spacious hall bloom.',
    tip: 'Essential for pad tracks, epic boss themes, and sacred ceremonies.',
  },
  soft_humming: {
    name: 'Ethereal Soft Humming',
    subtitle: 'Intimate Closed-Lip Vocal',
    desc: 'Gentle, airy humming timbre with subtle nasal resonance and warm breath.',
    tip: 'Wonderful for healing music, lullabies, and misty forest atmospheres.',
  },
  classical_guitar: {
    name: 'Classical Nylon Guitar',
    subtitle: 'Spanish Cedar Body & Finger Pluck',
    desc: 'Warm nylon strings over a multi-formant cedar soundboard with delicate fingernail articulation.',
    tip: 'Ideal for folk melodies, acoustic arpeggios, and intimate chords.',
  },
  electric_guitar_lead: {
    name: 'Overdrive Lead Guitar',
    subtitle: 'Tube Amp Saturation & Cabinet',
    desc: 'Singing tube-overdriven electric guitar with expressive vibrato and midrange bite.',
    tip: 'Best for rock/game lead melodies and high-energy solos.',
  },
  electric_guitar_clean: {
    name: 'Clean Chorus Guitar',
    subtitle: 'Stereo Detuned Shimmer',
    desc: 'Sparkling clean electric guitar with warm chorus modulation.',
    tip: 'Great for pop/anime rhythm chords and bright arpeggio patterns.',
  },
  chiptune_8bit: {
    name: '8-Bit Retro Chiptune',
    subtitle: 'NES Pulse Wave & Pitch Blip',
    desc: 'Authentic square-wave chip synth with rapid 22ms fifth-interval onset ornament.',
    tip: 'Essential for retro pixel games, dungeon themes, and chiptune leads.',
  },
  synth_lead: {
    name: 'Analog Poly Synth Lead',
    subtitle: 'Resonant Filter Sweep',
    desc: 'Fat dual-oscillator sawtooth/square synth with punchy resonant lowpass envelope.',
    tip: 'Great for cyberpunk leads, synthwave themes, and electronic hooks.',
  },
  synth_pad: {
    name: 'Nebula Warm Synth Pad',
    subtitle: 'Detuned Stereo Analog Pad',
    desc: 'Slow-blooming 3-oscillator analog pad that fills the stereo field with warmth.',
    tip: 'Use on Pad or Chord tracks to glue the entire arrangement together.',
  },
  synth_bass: {
    name: 'Sub & Pluck Synth Bass',
    subtitle: 'Deep Sine Sub + Saw Punch',
    desc: 'Tight electronic bass combining a pure sub-octave sine with a resonant saw pluck.',
    tip: 'Drives modern pop, cyberpunk, and electronic rhythm sections.',
  },
  percussion_kit: {
    name: 'Hybrid World & Studio Drum Kit',
    subtitle: '8-Pad Chinese & Modern Percussion',
    desc: 'Combines Tanggu/Timpani, Woodblock, Chimes, Kick, Snare, Clap, and Hi-Hats.',
    tip: 'Automatically generates Euclidean grooves and 4-bar drum fills.',
  },
};

export const SCALE_EN_MAP: Record<ScaleType, { name: string; subtitle: string }> = {
  pentatonic_major: {
    name: 'Major Pentatonic (Gong Mode)',
    subtitle: 'Gong-Shang-Jue-Zhi-Yu · Zero dissonance',
  },
  pentatonic_minor: {
    name: 'Minor Pentatonic (Yu Mode)',
    subtitle: 'Yu-Gong-Shang-Jue-Zhi · Soulful Xianxia',
  },
  major: {
    name: 'Natural Major (Ionian)',
    subtitle: 'Bright, uplifting & classical',
  },
  minor: {
    name: 'Natural Minor (Aeolian)',
    subtitle: 'Narrative, emotional & cinematic',
  },
  dorian: {
    name: 'Dorian Mode',
    subtitle: 'Celtic, fantasy & ethereal mystery',
  },
  harmonic_minor: {
    name: 'Harmonic Minor',
    subtitle: 'Baroque drama & gothic tension',
  },
};

export const PROGRESSION_EN_MAP: Record<
  string,
  { name: string; tag: string; desc: string }
> = {
  pop_canon: {
    name: 'Golden Canon Progression (I-V-vi-IV)',
    tag: 'Uplifting · Pop & Symphonic',
    desc: 'The most beloved progression in modern and classical crossover music.',
  },
  guofeng_classic: {
    name: 'Guofeng Lyrical Cycle (IV-V-iii-vi)',
    tag: 'Oriental Poetic · Xianxia & Folk',
    desc: 'Starts on the subdominant for an immediate sense of longing and poetic flow.',
  },
  epic_heroic: {
    name: 'Epic Cinema Progression (i-bVI-bIII-bVII)',
    tag: 'Widescreen · Film & Game Boss',
    desc: 'Minor tonic expanding into major flat-VI and flat-III chords for heroic scale.',
  },
  healing_warm: {
    name: 'Pastoral Healing Cycle (I-vi-IV-V)',
    tag: 'Warm & Nostalgic · Acoustic',
    desc: 'Gentle harmonic arc ideal for solo piano, harp, guitar, and soft humming.',
  },
  royal_ceremony: {
    name: 'Imperial Ritual Progression (I-IV-I-V)',
    tag: 'Solemn · Ancient Bells & Orchestra',
    desc: 'Plagal and authentic cadences evoking grand palace ceremonies.',
  },
  baroque_court: {
    name: 'Baroque Sequence (i-iv-V-i)',
    tag: 'Classical Counterpoint · Organ & Strings',
    desc: 'Authentic Baroque harmonic drive suited for concertos and fugues.',
  },
  dorian_fantasy: {
    name: 'Dorian Fantasy (i-IV-i-bVII)',
    tag: 'Mystic Forest · Celtic & Sci-Fi',
    desc: 'Signature minor tonic to major subdominant shift creating luminous wonder.',
  },
};

export const ROLE_EN_MAP: Record<
  TrackRole,
  { label: string; shortLabel: string }
> = {
  melody: { label: 'Lead Melody Track', shortLabel: 'Melody' },
  counter: { label: 'Counter-Melody Track', shortLabel: 'Counter' },
  chords: { label: 'Chord Voicing Track', shortLabel: 'Chords' },
  arpeggio: { label: 'Flowing Arpeggio Track', shortLabel: 'Arpeggio' },
  pad: { label: 'Atmospheric Pad Track', shortLabel: 'Pad' },
  accent: { label: 'Bell & Chime Accent Track', shortLabel: 'Accent' },
  bass: { label: 'Root & Walking Bass Track', shortLabel: 'Bass' },
  rhythm: { label: 'Percussion Rhythm Track', shortLabel: 'Rhythm' },
};

export const HALL_EN_MAP: Record<
  AcousticHallType,
  { name: string; subtitle: string }
> = {
  golden_hall: {
    name: 'Vienna Golden Hall',
    subtitle: '2.7s Warm Wooden Concert Hall',
  },
  cathedral: {
    name: 'Gothic Cathedral',
    subtitle: '3.8s Vast Stone Dome Reverb',
  },
  oriental_courtyard: {
    name: 'Bamboo Water Courtyard',
    subtitle: '2.0s Airy Natural Reflections',
  },
  studio_intimate: {
    name: 'Master Scoring Stage',
    subtitle: '1.15s Intimate High-Res Room',
  },
};

export const MOTIF_EN_MAP: Record<
  string,
  { name: string; subtitle: string }
> = {
  motif_guofeng_stream: {
    name: 'Pentatonic Cloud Stream',
    subtitle: 'Stepwise Oriental Grace',
  },
  motif_fate_knock: {
    name: 'Fate Knocking Motif',
    subtitle: 'Short-Short-Short-Long Drama',
  },
  motif_heroic_horn: {
    name: 'Skyward Heroic Fanfare',
    subtitle: '4th/5th Leap Epic Opening',
  },
  motif_lyrical_sigh: {
    name: 'Moonlight Lyrical Sigh',
    subtitle: '6th Leap & Stepwise Descent',
  },
  motif_baroque_spin: {
    name: 'Baroque Concerto Spin',
    subtitle: '16th-Note Scale Flourish',
  },
  motif_xianxia_sword: {
    name: 'Sword Flight Motif',
    subtitle: 'Syncopated Octave Soar',
  },
  motif_sacred_chime: {
    name: 'Imperial Bell Hymn',
    subtitle: 'Solemn Octave & Fifth Resonance',
  },
  motif_cyber_sync: {
    name: 'Cyber Pulse Syncopation',
    subtitle: 'Rhythmic Accent & Octave Jump',
  },
};

export const DEV_MODE_EN_MAP: Record<
  MotifDevelopmentMode,
  { label: string; desc: string }
> = {
  classic_variation: {
    label: 'Classic A-B-C-D Arc',
    desc: 'Statement → Harmonic Shift → Climax Lift → Tonic Cadence',
  },
  sequence_ascend: {
    label: 'Ascending Sequence',
    desc: 'Transposes the motif progressively higher across phrases',
  },
  inversion_mirror: {
    label: 'Mirror Inversion',
    desc: 'Inverts intervals upside-down on alternating phrases (Baroque style)',
  },
  call_response: {
    label: 'Call & Response',
    desc: 'Alternates your motif with an algorithmic answering phrase',
  },
};

export const SCENE_EN_MAP: Record<
  string,
  { name: string; categoryLabel: string; imagery: string; desc: string }
> = {
  scene_imperial_ceremony: {
    name: 'Forbidden City · Imperial Grand Ceremony',
    categoryLabel: 'Guofeng Ritual',
    imagery: 'Morning sunlight over golden palace roofs, ancient bronze Bianzhong bells and royal orchestra.',
    desc: '8-track ceremonial orchestration featuring Bianzhong bells, Dizi, Guzheng, Epic Strings, Brass, Choir, Cello & Tanggu.',
  },
  scene_xianxia_cloud: {
    name: 'Kunlun Sea of Clouds · Sword Flight',
    categoryLabel: 'Xianxia Fantasy',
    imagery: 'Soaring through misty mountain peaks on a flying sword with celestial flutes and zithers.',
    desc: '7-track arrangement with Dizi lead, Guzheng arpeggios, Pipa counterpoint, Soprano solo, Humming pad & Cello.',
  },
  scene_dragon_boss: {
    name: 'Abyssal Dragon · Final Boss Battle',
    categoryLabel: 'Epic Game Score',
    imagery: 'Lightning pierces dark clouds as an ancient dragon awakens amidst roaring brass and choir.',
    desc: '8-track Hollywood symphony with Epic Brass, String Concerto, Epic Strings, Grand Choir, Pipe Organ & War Drums.',
  },
  scene_8bit_dungeon: {
    name: 'Pixel Castle · 8-Bit Arcade Adventure',
    categoryLabel: 'Retro Chiptune',
    imagery: 'Classic 8-bit pixel hero dashing through a neon-lit retro dungeon.',
    desc: '6-track chiptune setup with dual 8-Bit square leads, fast chip arpeggios, synth bass, and crisp arcade drums.',
  },
  scene_cathedral_hymn: {
    name: 'Rose Window · Sacred Cathedral Hymn',
    categoryLabel: 'Sacred Classical',
    imagery: 'Shafts of light through stained glass as the cathedral pipe organ and soprano voice resound.',
    desc: '7-track sacred arrangement featuring Pipe Organ, Soprano Solo, Harpsichord, Grand Choir, Church Bells & Cello.',
  },
  scene_jiangnan_rain: {
    name: 'Misty Jiangnan · Bamboo Pavilion Tea',
    categoryLabel: 'Oriental Healing',
    imagery: 'Gentle spring rain over willow bridges, lotus ponds, and a quietwaterside pavilion.',
    desc: '6-track chamber ensemble with Guzheng, Dizi, Pipa, Concert Harp, Soft Humming & Solo Cello.',
  },
  scene_starlight_odyssey: {
    name: 'Interstellar · Deep Space Odyssey',
    categoryLabel: 'Sci-Fi Cinema',
    imagery: 'A lone starship gliding past luminous nebulae and event horizons.',
    desc: '7-track cosmic score combining Pipe Organ, French Horn, Synth Pad, Harp harmonics, Choir & Church Bells.',
  },
  scene_elf_forest: {
    name: 'Moonlit Woods · Elven Waltz',
    categoryLabel: 'Fantasy Pastoral',
    imagery: 'Bioluminescent fireflies dancing in an ancient forest under silver moonlight.',
    desc: '7-track Dorian fantasy with Concert Flute, Pedal Harp, Classical Guitar, Soft Humming & Violin Section.',
  },
  scene_cyber_night: {
    name: 'Neo-Tokyo 2099 · Neon Rain Chase',
    categoryLabel: 'Cyberpunk Synth',
    imagery: 'Holographic billboards reflecting on wet asphalt during a midnight highway pursuit.',
    desc: '7-track electronic score with Analog Synth Lead, Overdrive Guitar, Arpeggiator, Warm Pad, Sub Bass & Drums.',
  },
  scene_sunset_memory: {
    name: 'Seaside Breeze · Youthful Memories',
    categoryLabel: 'Lyrical Cinema',
    imagery: 'Golden sunset over a coastal train station as cherry blossoms drift in the breeze.',
    desc: '7-track warm arrangement with Grand Piano, Violin Concerto, Classical Guitar, Clean Guitar, Pad & Cello.',
  },
};

export const CLASSIC_EN_MAP: Record<
  string,
  { title: string; composer: string; tag: string; desc: string }
> = {
  jasmine_flower: {
    title: 'Mo Li Hua (Jasmine Flower)',
    composer: 'Traditional Chinese Folk · Gong Mode',
    tag: 'Chinese Classic · Graceful',
    desc: 'World-famous Jiangnan pentatonic melody performed on Guzheng and Bamboo Dizi.',
  },
  spring_river_moon: {
    title: 'Moonlight on the Spring River',
    composer: 'Tang Dynasty / Classical Pipa Masterpiece',
    tag: 'Poetic Pipa & Zither',
    desc: 'Uses the classic "Fish Biting Tail" chain phrasing where each bar begins on the previous bar’s ending note.',
  },
  vivaldi_spring: {
    title: 'The Four Seasons: Spring (Allegro)',
    composer: 'Antonio Vivaldi · Baroque Concerto',
    tag: 'Baroque Strings & Harpsichord',
    desc: 'Joyful Baroque violin concerto theme supported by crisp harpsichord continuo and cello.',
  },
  ode_to_joy: {
    title: 'Ode to Joy (Symphony No. 9)',
    composer: 'Ludwig van Beethoven · Classical Symphony',
    tag: 'Triumphant Choir & Brass',
    desc: 'Monumental stepwise melody uniting symphonic strings, brass fanfare, and mixed choir.',
  },
  mountain_king: {
    title: 'In the Hall of the Mountain King',
    composer: 'Edvard Grieg · Peer Gynt Suite',
    tag: 'Nordic Fantasy · Harmonic Minor',
    desc: 'Iconic creeping staccato motif in harmonic minor building dramatic orchestral tension.',
  },
  canon_in_d: {
    title: 'Canon in D Major',
    composer: 'Johann Pachelbel · Baroque Chamber',
    tag: 'Eternal Progression · Harp & Strings',
    desc: 'The foundational 8-chord progression paired with flowing three-voice violin counterpoint.',
  },
  canghai_laugh: {
    title: 'Blue Sea Laughter (Wuxia Anthem)',
    composer: 'James Wong · Classic Wuxia Pentatonic',
    tag: 'Heroic Wuxia · Descending Pentatonic',
    desc: 'Bold descending pentatonic scale (6-5-3-2-1) capturing boundless martial arts spirit.',
  },
  fisherman_evening: {
    title: 'Fisherman’s Song at Eventide',
    composer: 'Traditional Guzheng Masterpiece',
    tag: 'Serene Guzheng & Flute',
    desc: 'Lyrical pentatonic phrases depicting golden sunset ripples and returning fishing boats.',
  },
  tchaikovsky_swan_lake: {
    title: 'Swan Lake Theme (Op. 20)',
    composer: 'Pyotr Ilyich Tchaikovsky · Romantic Ballet',
    tag: 'Poignant Ballet · Flute & Harp',
    desc: 'Soaring minor-key theme over shimmering pedal harp arpeggios and lush strings.',
  },
  bach_toccata: {
    title: 'Toccata and Fugue in D Minor',
    composer: 'Johann Sebastian Bach · Baroque Organ',
    tag: 'Gothic Pipe Organ · Dramatic',
    desc: 'Unmistakable mordent opening and diminished-seventh grandeur on Cathedral Pipe Organ.',
  },
  greensleeves: {
    title: 'Greensleeves (Dorian Folk Ballad)',
    composer: '16th-Century English Ballad',
    tag: 'Celtic Dorian · Guitar & Flute',
    desc: 'Timeless modal melody performed on Classical Nylon Guitar, Concert Flute, and Harp.',
  },
  sky_island_fantasy: {
    title: 'Floating Sky Island Fantasy',
    composer: 'Studio Original · Dorian Orchestral',
    tag: 'Animation Fantasy · Soprano & Horn',
    desc: 'Wide-interval soaring melody with French horn, soprano vocalise, and harp arpeggios.',
  },
};
