import { useState, useEffect, useRef, useCallback } from 'react';

export type VoiceState = 'idle' | 'listening' | 'transcribing' | 'speaking';

export type ArcVoiceId =
  | 'arc-precision'
  | 'arc-studio'
  | 'arc-lead'
  | 'arc-cadence'
  | 'arc-specialist'
  | 'arc-agile'
  | 'arc-calm'
  | 'arc-academic'
  | string;

export interface ArcVoiceOption {
  id: ArcVoiceId;
  name: string;
  gender: 'Female' | 'Male';
  accent: 'American' | 'British';
  tag: string;
  desc: string;
}

export const ARC_VOICES: ArcVoiceOption[] = [
  {
    id: 'arc-precision',
    name: 'Precision — Primary Cadence',
    gender: 'Female',
    accent: 'American',
    tag: 'Flagship Female',
    desc: 'Crisp, articulate technical diction optimized for study analysis and concept reviews',
  },
  {
    id: 'arc-studio',
    name: 'Studio — Clear Analytical',
    gender: 'Female',
    accent: 'American',
    tag: 'Studio Female',
    desc: 'Bright, articulate persona ideal for step-by-step mathematical derivations, essays, and formulas',
  },
  {
    id: 'arc-lead',
    name: 'Lead — Academic Architecture',
    gender: 'Male',
    accent: 'American',
    tag: 'Academic Male',
    desc: 'Composed, analytical American voice tailored for structured academic explanations',
  },
  {
    id: 'arc-cadence',
    name: 'Cadence — British Scholar',
    gender: 'Male',
    accent: 'British',
    tag: 'British Male',
    desc: 'Deep, steady British cadence suited for scholarly research and technical specifications',
  },
  {
    id: 'arc-specialist',
    name: 'Specialist — Resolute Deep',
    gender: 'Male',
    accent: 'American',
    tag: 'Deep Resonant',
    desc: 'Authoritative, resonant delivery tuned for core diagnostic conclusions and thesis reviews',
  },
  {
    id: 'arc-agile',
    name: 'Agile — Fast Prototyping',
    gender: 'Male',
    accent: 'American',
    tag: 'Conversational Male',
    desc: 'Brisk, energetic American cadence designed for rapid study iteration and live review',
  },
  {
    id: 'arc-calm',
    name: 'Calm — Focused Review',
    gender: 'Female',
    accent: 'American',
    tag: 'Calm Studio',
    desc: 'Gentle, focused female persona tailored for deep review sessions and lengthy readings',
  },
  {
    id: 'arc-academic',
    name: 'Academic — British Formal',
    gender: 'Female',
    accent: 'British',
    tag: 'British Academic',
    desc: 'Refined, articulate British cadence suited for academic papers and mathematical proofs',
  },
];

export function normalizeVoiceId(id?: string): ArcVoiceId {
  if (!id) return 'arc-precision';
  const legacyMap: Record<string, ArcVoiceId> = {
    af_heart: 'arc-precision',
    af_bella: 'arc-studio',
    am_michael: 'arc-lead',
    bm_george: 'arc-cadence',
    am_fenrir: 'arc-specialist',
    am_puck: 'arc-agile',
    af_nicole: 'arc-calm',
    bf_emma: 'arc-academic',
  };
  return legacyMap[id] || (id as ArcVoiceId) || 'arc-precision';
}

export interface VoicePreviewStatus {
  voiceId: ArcVoiceId;
  voiceName: string;
  systemVoiceCount: number;
  isSingleSystemVoice: boolean;
  note?: string;
}

export function matchBrowserVoice(
  voices: SpeechSynthesisVoice[],
  targetVoiceId: string
): { voice: SpeechSynthesisVoice | null; pitch: number; rate: number; isSingleVoice: boolean } {
  if (!voices || voices.length === 0) {
    return { voice: null, pitch: 1.0, rate: 1.0, isSingleVoice: true };
  }

  const vId = normalizeVoiceId(targetVoiceId);
  const isBritish = vId === 'arc-cadence' || vId === 'arc-academic' || vId.includes('british');
  const isFemale = vId === 'arc-precision' || vId === 'arc-studio' || vId === 'arc-calm' || vId === 'arc-academic';

  let basePitch = 1.0;
  let baseRate = 1.0;

  switch (vId) {
    case 'arc-precision':
      basePitch = 1.15;
      baseRate = 1.0;
      break;
    case 'arc-studio':
      basePitch = 1.25;
      baseRate = 1.05;
      break;
    case 'arc-calm':
      basePitch = 1.08;
      baseRate = 0.92;
      break;
    case 'arc-academic':
      basePitch = 1.2;
      baseRate = 1.0;
      break;
    case 'arc-lead':
      basePitch = 1.0;
      baseRate = 1.0;
      break;
    case 'arc-specialist':
      basePitch = 0.82;
      baseRate = 0.95;
      break;
    case 'arc-agile':
      basePitch = 1.1;
      baseRate = 1.15;
      break;
    case 'arc-cadence':
      basePitch = 0.95;
      baseRate = 0.95;
      break;
    default:
      if (isFemale) basePitch = 1.18;
      break;
  }

  const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
  const candidatePool = englishVoices.length > 0 ? englishVoices : voices;
  const isSingleVoice = candidatePool.length <= 1;

  if (isSingleVoice) {
    return {
      voice: candidatePool[0] || null,
      pitch: basePitch,
      rate: baseRate,
      isSingleVoice: true,
    };
  }

  const femaleKeywords = ['zira', 'samantha', 'jenny', 'aria', 'hazel', 'susan', 'victoria', 'karen', 'katherine', 'linda', 'eva', 'stephanie', 'catherine', 'female', 'woman', 'girl'];
  const maleKeywords = ['david', 'george', 'michael', 'mark', 'guy', 'ryan', 'daniel', 'oliver', 'james', 'richard', 'male', 'man', 'boy'];

  const scored = candidatePool.map((v, index) => {
    let score = 0;
    const nameLower = v.name.toLowerCase();
    const langLower = v.lang.toLowerCase();

    if (isBritish) {
      if (langLower.includes('gb') || langLower.includes('uk') || nameLower.includes('british') || nameLower.includes('uk') || nameLower.includes('english (united kingdom)')) {
        score += 30;
      }
    } else {
      if (langLower.includes('us') || nameLower.includes('united states') || nameLower.includes('us') || nameLower.includes('english (united states)')) {
        score += 20;
      }
    }

    const hasFemaleKeyword = femaleKeywords.some(kw => nameLower.includes(kw));
    const hasMaleKeyword = maleKeywords.some(kw => nameLower.includes(kw));

    if (isFemale) {
      if (hasFemaleKeyword) score += 40;
      else if (hasMaleKeyword) score -= 30;
    } else {
      if (hasMaleKeyword) score += 40;
      else if (hasFemaleKeyword) score -= 30;
    }

    if (vId === 'arc-studio' && (nameLower.includes('zira') || nameLower.includes('aria'))) score += 5;
    if (vId === 'arc-precision' && (nameLower.includes('samantha') || nameLower.includes('jenny'))) score += 5;
    if (vId === 'arc-lead' && (nameLower.includes('david') || nameLower.includes('alex'))) score += 5;
    if (vId === 'arc-specialist' && (nameLower.includes('mark') || nameLower.includes('guy') || nameLower.includes('fred'))) score += 5;
    if (vId === 'arc-cadence' && (nameLower.includes('george') || nameLower.includes('daniel') || nameLower.includes('oliver'))) score += 10;
    if (vId === 'arc-academic' && (nameLower.includes('hazel') || nameLower.includes('susan') || nameLower.includes('stephanie'))) score += 10;

    return { voice: v, score, index };
  });

  scored.sort((a, b) => b.score - a.score);
  const bestMatch = scored[0]?.voice || candidatePool[0];

  return {
    voice: bestMatch,
    pitch: basePitch,
    rate: baseRate,
    isSingleVoice: false,
  };
}

export interface VoiceSettings {
  voiceId: ArcVoiceId;
  interactionMode: 'single' | 'live';
  speechRate: number;
  autoSpeak: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceId: 'arc-precision',
  interactionMode: 'single',
  speechRate: 1.0,
  autoSpeak: false,
};

const SETTINGS_STORAGE_KEY = 'arc_voice_settings';
const LEGACY_SETTINGS_STORAGE_KEY = 'circuitsnap_voice_settings';
const VOICE_ENABLED_STORAGE_KEY = 'arc_voice_enabled';
const LEGACY_VOICE_ENABLED_STORAGE_KEY = 'circuitsnap_voice_enabled';

export function loadVoiceSettings(): VoiceSettings {
  if (typeof window === 'undefined') return DEFAULT_VOICE_SETTINGS;
  try {
    let raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
      if (legacyRaw) {
        raw = legacyRaw;
        localStorage.setItem(SETTINGS_STORAGE_KEY, legacyRaw);
        localStorage.removeItem(LEGACY_SETTINGS_STORAGE_KEY);
      }
    }
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_VOICE_SETTINGS,
      ...parsed,
      voiceId: normalizeVoiceId(parsed.voiceId),
      autoSpeak: Boolean(parsed.autoSpeak === true),
    };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    localStorage.removeItem(LEGACY_SETTINGS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function loadVoiceEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    let saved = localStorage.getItem(VOICE_ENABLED_STORAGE_KEY);
    if (saved === null) {
      const legacySaved = localStorage.getItem(LEGACY_VOICE_ENABLED_STORAGE_KEY);
      if (legacySaved !== null) {
        saved = legacySaved;
        localStorage.setItem(VOICE_ENABLED_STORAGE_KEY, legacySaved);
        localStorage.removeItem(LEGACY_VOICE_ENABLED_STORAGE_KEY);
      }
    }
    return saved === 'true';
  } catch {
    return false;
  }
}

export function saveVoiceEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_ENABLED_STORAGE_KEY, String(enabled));
    localStorage.removeItem(LEGACY_VOICE_ENABLED_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export interface UseArcVoiceOptions {
  onTranscript?: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
}

export function stripWakeWord(raw: string): string {
  return raw.trim().replace(/^(?:hey|hi|hello|ok|okay)?\s*arc[\s,.:!?-]*/i, '').trim() || raw.trim();
}

export function cleanTextForSpeech(raw: string): string {
  if (!raw?.trim()) return 'Explanations and study details are displayed on screen.';

  let text = raw
    .replace(/\bARC\b/g, 'ARC')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*\|.*\|\s*$/gm, ' ')
    .replace(/\|[^\n]+\|/g, ' ')
    .replace(/\|+/g, ' ')
    .replace(/(?:^|\n)\s*#{1,6}\s*/g, ' ')
    .replace(/\[\s*(?:CONFIRMED|LIKELY|CANNOT CONFIRM)\s*\]\s*[:\-–—]?/gi, '')
    .replace(/\b(?:CONFIRMED|CANNOT CONFIRM|LIKELY)\b\s*[:\-–—]?/gi, '')
    // Preserve sentence boundaries and numbers for lists before collapsing whitespace
    .replace(/(?:^|\n)\s*(\d+)\.\s+/g, '. Step $1: ')
    .replace(/(?:^|\n)\s*[-*+]\s+/g, '. ')
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$]+)\$/g, ' $1 ')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 over $2')
    .replace(/\\sqrt\{([^}]+)\}/g, 'square root of $1')
    .replace(/\\cdot|\\times/g, ' times ')
    .replace(/\\approx/g, ' approximately ')
    .replace(/\\neq/g, ' not equal ')
    .replace(/\\leq/g, ' less than or equal ')
    .replace(/\\geq/g, ' greater than or equal ')
    .replace(/\\infty/g, ' infinity ')
    .replace(/\\sum/g, ' sum ')
    .replace(/\\int/g, ' integral ')
    .replace(/\\partial/g, ' partial ')
    .replace(/\\implies|=>/g, ' implies ')
    .replace(/\\to|->/g, ' leads to ')
    // Greek letters (lowercase)
    .replace(/\\alpha/g, 'alpha')
    .replace(/\\beta/g, 'beta')
    .replace(/\\gamma/g, 'gamma')
    .replace(/\\delta/g, 'delta')
    .replace(/\\epsilon/g, 'epsilon')
    .replace(/\\varepsilon/g, 'epsilon')
    .replace(/\\zeta/g, 'zeta')
    .replace(/\\eta/g, 'eta')
    .replace(/\\theta/g, 'theta')
    .replace(/\\vartheta/g, 'theta')
    .replace(/\\iota/g, 'iota')
    .replace(/\\kappa/g, 'kappa')
    .replace(/\\lambda/g, 'lambda')
    .replace(/\\mu/g, 'mu')
    .replace(/\\nu/g, 'nu')
    .replace(/\\xi/g, 'xi')
    .replace(/\\omicron/g, 'omicron')
    .replace(/\\pi/g, 'pi')
    .replace(/\\varpi/g, 'pi')
    .replace(/\\rho/g, 'rho')
    .replace(/\\varrho/g, 'rho')
    .replace(/\\sigma/g, 'sigma')
    .replace(/\\varsigma/g, 'sigma')
    .replace(/\\tau/g, 'tau')
    .replace(/\\upsilon/g, 'upsilon')
    .replace(/\\phi/g, 'phi')
    .replace(/\\varphi/g, 'phi')
    .replace(/\\chi/g, 'chi')
    .replace(/\\psi/g, 'psi')
    .replace(/\\omega/g, 'omega')
    // Greek letters (uppercase)
    .replace(/\\Gamma/g, 'Gamma')
    .replace(/\\Delta/g, 'Delta')
    .replace(/\\Theta/g, 'Theta')
    .replace(/\\Lambda/g, 'Lambda')
    .replace(/\\Xi/g, 'Xi')
    .replace(/\\Pi/g, 'Pi')
    .replace(/\\Sigma/g, 'Sigma')
    .replace(/\\Upsilon/g, 'Upsilon')
    .replace(/\\Phi/g, 'Phi')
    .replace(/\\Psi/g, 'Psi')
    .replace(/\\Omega/g, 'Omega')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\[,;!]/g, ' ')
    // Catch-all for any remaining LaTeX commands - must come AFTER specific expansions
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/\$/g, '')
    .replace(/(\d+(?:\.\d+)?)\s*MΩ/g, '$1 mega-ohms')
    .replace(/(\d+(?:\.\d+)?)\s*kΩ/g, '$1 kilo-ohms')
    .replace(/(\d+(?:\.\d+)?)\s*Ω/g, '$1 ohms')
    .replace(/(\d+(?:\.\d+)?)\s*µF/g, '$1 microfarads')
    .replace(/(\d+(?:\.\d+)?)\s*uF/g, '$1 microfarads')
    .replace(/(\d+(?:\.\d+)?)\s*nF/g, '$1 nanofarads')
    .replace(/(\d+(?:\.\d+)?)\s*pF/g, '$1 picofarads')
    .replace(/(\d+(?:\.\d+)?)\s*mH/g, '$1 millihenries')
    .replace(/(\d+(?:\.\d+)?)\s*µH/g, '$1 microhenries')
    .replace(/(\d+(?:\.\d+)?)\s*uH/g, '$1 microhenries')
    .replace(/(\d+(?:\.\d+)?)\s*kHz/g, '$1 kilohertz')
    .replace(/(\d+(?:\.\d+)?)\s*MHz/g, '$1 megahertz')
    .replace(/(\d+(?:\.\d+)?)\s*GHz/g, '$1 gigahertz')
    .replace(/(\d+(?:\.\d+)?)\s*Hz/g, '$1 hertz')
    .replace(/(\d+(?:\.\d+)?)\s*mA/g, '$1 milliamps')
    .replace(/(\d+(?:\.\d+)?)\s*mV/g, '$1 millivolts')
    .replace(/(\d+(?:\.\d+)?)\s*V(?![a-zA-Z])/g, '$1 volts')
    .replace(/(\d+(?:\.\d+)?)\s*W(?![a-zA-Z])/g, '$1 watts')
    // Multi-domain units (Chemistry, Physics, Biology, Medicine, Statistics)
    .replace(/(\d+(?:\.\d+)?)\s*mol\/L/g, '$1 moles per liter')
    .replace(/(\d+(?:\.\d+)?)\s*kPa/g, '$1 kilopascals')
    .replace(/(\d+(?:\.\d+)?)\s*Pa(?![a-zA-Z])/g, '$1 pascals')
    .replace(/(\d+(?:\.\d+)?)\s*kJ(?![a-zA-Z])/g, '$1 kilojoules')
    .replace(/(\d+(?:\.\d+)?)\s*J(?![a-zA-Z])/g, '$1 joules')
    .replace(/(\d+(?:\.\d+)?)\s*m\/s\^2/g, '$1 meters per second squared')
    .replace(/(\d+(?:\.\d+)?)\s*m\/s(?![a-zA-Z])/g, '$1 meters per second')
    .replace(/(\d+(?:\.\d+)?)\s*kg(?![a-zA-Z])/g, '$1 kilograms')
    .replace(/(\d+(?:\.\d+)?)\s*mg(?![a-zA-Z])/g, '$1 milligrams')
    .replace(/(\d+(?:\.\d+)?)\s*µg/g, '$1 micrograms')
    .replace(/(\d+(?:\.\d+)?)\s*ug/g, '$1 micrograms')
    .replace(/(\d+(?:\.\d+)?)\s*mL(?![a-zA-Z])/g, '$1 milliliters')
    .replace(/(\d+(?:\.\d+)?)\s*µL/g, '$1 microliters')
    .replace(/(\d+(?:\.\d+)?)\s*uL/g, '$1 microliters')
    .replace(/(\d+(?:\.\d+)?)\s*bpm/g, '$1 beats per minute')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_~`>#]+/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\\/g, ' ')
    // Preserve pauses at line breaks instead of fusing words
    .replace(/\r?\n+/g, '. ')
    .replace(/\.(?:\s*\.)+/g, '.')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .trim();

  if (!text || !text.replace(/[.\s]/g, '')) return 'Explanations and study details are displayed on screen.';
  return text.endsWith('.') || text.endsWith('!') || text.endsWith('?') ? text : `${text}.`;
}

export function splitIntoSpeechChunks(text: string, maxChunkLen = 220): string[] {
  if (!text?.trim()) return [];
  const rawSentences = text.match(/[^.!?;\n]+[.!?;\n]*/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const raw of rawSentences) {
    const sentence = raw.trim();
    if (!sentence) continue;

    if (sentence.length > maxChunkLen) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      const words = sentence.split(/\s+/);
      let subChunk = '';
      for (const word of words) {
        if ((subChunk + ' ' + word).trim().length > maxChunkLen) {
          if (subChunk) chunks.push(subChunk.trim());
          subChunk = word;
        } else {
          subChunk = subChunk ? `${subChunk} ${word}` : word;
        }
      }
      if (subChunk) chunks.push(subChunk.trim());
    } else if ((currentChunk + ' ' + sentence).trim().length > maxChunkLen) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

const formatMicError = (err: unknown): string => {
  const name = (err as { name?: string })?.name || '';
  switch (name) {
    case 'NotAllowedError': case 'PermissionDeniedError':
      return 'Microphone permission denied. Allow mic access in browser settings, then tap the mic again.';
    case 'NotFoundError': case 'DevicesNotFoundError':
      return 'No microphone detected. Connect a mic or headset, then retry.';
    case 'OverconstrainedError': case 'ConstraintNotSatisfiedError':
      return 'Microphone constraints not satisfied. Try a different input device.';
    case 'NotSupportedError':
      return 'Media devices not supported in this browser or context.';
    case 'AbortError':
      return 'Microphone access interrupted. Please try again.';
    default:
      return `Microphone error: ${(err as Error)?.message || 'unknown error'}`;
  }
};

const pickMimeType = (): string | undefined => {
  for (const t of ['audio/webm', 'audio/mp4', 'audio/ogg']) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
};

export function useArcVoice({ onTranscript, onFinalTranscript }: UseArcVoiceOptions = {}) {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(loadVoiceEnabled);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(loadVoiceSettings);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<VoicePreviewStatus | null>(null);
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.getVoices();
    }
    return [];
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const handleVoicesChanged = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) setSystemVoices(v);
    };
    window.speechSynthesis.addEventListener?.('voiceschanged', handleVoicesChanged);
    window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
    handleVoicesChanged();
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', handleVoicesChanged);
      if (window.speechSynthesis.onvoiceschanged === handleVoicesChanged) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const englishSystemVoices = systemVoices.filter(sv => sv.lang.toLowerCase().startsWith('en'));
  const systemVoiceCount = englishSystemVoices.length > 0 ? englishSystemVoices.length : systemVoices.length;
  const isSingleSystemVoice = systemVoiceCount <= 1;

  const [supported] = useState(() =>
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window))
  );

  // SpeechRecognition is WebKit-prefixed; declare ambient types
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }
  interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionResultList {
    length: number;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    isFinal: boolean;
    0: SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    transcript: string;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
  }

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const hadActiveRecognitionRef = useRef(false);
  const latestLiveTranscriptRef = useRef('');
  const finalTranscriptRef = useRef('');
  const committedRef = useRef(false);
  const vadIntervalRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const rearmTimerRef = useRef<number | null>(null);
  const sttAbortControllerRef = useRef<AbortController | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);
  const speechGenIdRef = useRef(0);
  const hasQualifiedSpeechRef = useRef(false);
  const activeSpeechMsRef = useRef(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const isVoiceEnabledRef = useRef(isVoiceEnabled);
  const voiceStateRef = useRef(voiceState);
  const voiceSettingsRef = useRef(voiceSettings);
  const startListeningRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onFinalTranscriptRef.current = onFinalTranscript;
    isVoiceEnabledRef.current = isVoiceEnabled;
    voiceStateRef.current = voiceState;
    voiceSettingsRef.current = voiceSettings;
  }, [onTranscript, onFinalTranscript, isVoiceEnabled, voiceState, voiceSettings]);

  const updateVoiceSettings = useCallback((partial: Partial<VoiceSettings>) => {
    setVoiceSettingsState((prev) => {
      const next = { ...prev, ...partial };
      saveVoiceSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof Audio !== 'undefined') audioElRef.current = new Audio();
    return () => {
      if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.src = ''; }
    };
  }, []);

  const clearVoiceError = useCallback(() => setVoiceError(null), []);

  const commitFinalTranscript = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;

    const raw = (latestLiveTranscriptRef.current || finalTranscriptRef.current).trim();
    const clean = stripWakeWord(raw).trim();

    if (clean && voiceStateRef.current !== 'speaking') {
      setVoiceError(null);
      setLiveTranscript(clean);
      onTranscriptRef.current?.(clean);
      onFinalTranscriptRef.current?.(clean);
      setTimeout(() => {
        setLiveTranscript('');
      }, 1000);
    } else {
      setLiveTranscript('');
    }

    hasQualifiedSpeechRef.current = false;
    activeSpeechMsRef.current = 0;
    latestLiveTranscriptRef.current = '';
    finalTranscriptRef.current = '';
    hadActiveRecognitionRef.current = false;
  }, []);

  const hardResetVoice = useCallback(() => {
    speechGenIdRef.current++;
    setPreviewingVoiceId(null);
    setPreviewStatus(null);
    [vadIntervalRef, recordingTimerRef, rearmTimerRef].forEach(r => { if (r.current) { clearTimeout(r.current); r.current = null; } });
    if (recognitionRef.current) {
      try {
        const rec = recognitionRef.current;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch {}
      recognitionRef.current = null;
    }
    [sttAbortControllerRef, ttsAbortControllerRef].forEach(r => { if (r.current) { r.current.abort(); r.current = null; } });
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') { try { mr.onstop = null; mr.stop(); } catch {} }
    mediaRecorderRef.current = null; chunksRef.current = [];
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    const actx = audioCtxRef.current;
    if (actx && actx.state !== 'closed') { try { actx.close(); } catch {} audioCtxRef.current = null; }
    analyserRef.current = null;
    if (activeAudioUrlRef.current) {
      URL.revokeObjectURL(activeAudioUrlRef.current);
      activeAudioUrlRef.current = null;
    }
    if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current.currentTime = 0; audioElRef.current.src = ''; }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    committedRef.current = true;
    hasQualifiedSpeechRef.current = false;
    activeSpeechMsRef.current = 0;
    latestLiveTranscriptRef.current = '';
    finalTranscriptRef.current = '';
    setLiveTranscript('');
    setVoiceError(null);
    setVoiceState('idle');
  }, []);

  const cancelSpeech = useCallback(() => {
    speechGenIdRef.current++;
    setPreviewingVoiceId(null);
    setPreviewStatus(null);
    if (rearmTimerRef.current) {
      clearTimeout(rearmTimerRef.current);
      rearmTimerRef.current = null;
    }
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
    }
    if (activeAudioUrlRef.current) {
      URL.revokeObjectURL(activeAudioUrlRef.current);
      activeAudioUrlRef.current = null;
    }
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
      audioElRef.current.src = '';
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (voiceStateRef.current === 'speaking') setVoiceState('idle');
  }, []);

  const stopListeningInternal = useCallback((allowProcessing: boolean) => {
    if (rearmTimerRef.current) { clearTimeout(rearmTimerRef.current); rearmTimerRef.current = null; }
    if (vadIntervalRef.current) { clearInterval(vadIntervalRef.current); vadIntervalRef.current = null; }
    if (recordingTimerRef.current) { clearTimeout(recordingTimerRef.current); recordingTimerRef.current = null; }

    if (recognitionRef.current) {
      try {
        const rec = recognitionRef.current;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (!allowProcessing) {
      committedRef.current = true;
      hasQualifiedSpeechRef.current = false;
      activeSpeechMsRef.current = 0;
      latestLiveTranscriptRef.current = '';
      finalTranscriptRef.current = '';
      setLiveTranscript('');
    } else {
      commitFinalTranscript();
    }

    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = null;
      try { mr.stop(); } catch {}
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];

    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    const actx = audioCtxRef.current;
    if (actx && actx.state !== 'closed') { try { actx.close(); } catch {} audioCtxRef.current = null; }
    analyserRef.current = null;

    if (voiceStateRef.current === 'listening' || voiceStateRef.current === 'transcribing') setVoiceState('idle');
  }, [commitFinalTranscript]);

  // Speech synthesis via Web Speech API with dynamic voice, pitch, and cadence matching
  const speak = useCallback((rawText: string, onEndCallback?: () => void, force = false, overrideVoiceId?: VoiceSettings['voiceId']) => {
    if (!isVoiceEnabledRef.current && !force) return;
    if (!voiceSettingsRef.current.autoSpeak && !force) return;
    stopListeningInternal(false);
    cancelSpeech();

    const cleaned = cleanTextForSpeech(rawText);
    if (!cleaned) { setVoiceState('idle'); onEndCallback?.(); return; }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceState('idle');
      onEndCallback?.();
      return;
    }

    const chunks = splitIntoSpeechChunks(cleaned);
    if (chunks.length === 0) { setVoiceState('idle'); onEndCallback?.(); return; }

    setVoiceState('speaking');
    const genId = ++speechGenIdRef.current;
    const activeVoice = normalizeVoiceId(overrideVoiceId || voiceSettingsRef.current.voiceId || 'arc-precision');
    const voices = systemVoices.length > 0 ? systemVoices : window.speechSynthesis.getVoices();
    const { voice: chosenVoice, pitch, rate } = matchBrowserVoice(voices, activeVoice);

    let chunkIndex = 0;

    const speakNextChunk = () => {
      if (speechGenIdRef.current !== genId) return;
      if (chunkIndex >= chunks.length) {
        setVoiceState('idle');
        onEndCallback?.();
        if (isVoiceEnabledRef.current && voiceSettingsRef.current.interactionMode === 'live') {
          rearmTimerRef.current = window.setTimeout(() => void startListeningRef.current(), 800);
        }
        return;
      }

      const currentChunkText = chunks[chunkIndex++];
      const utterance = new SpeechSynthesisUtterance(currentChunkText);
      utterance.pitch = pitch;
      utterance.rate = (voiceSettingsRef.current.speechRate || 1.0) * rate;
      if (chosenVoice) utterance.voice = chosenVoice;

      utterance.onend = () => {
        if (speechGenIdRef.current === genId) {
          speakNextChunk();
        }
      };

      utterance.onerror = (e) => {
        if (speechGenIdRef.current === genId) {
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            console.warn('SpeechSynthesis error:', e.error);
          }
          speakNextChunk();
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextChunk();
  }, [cancelSpeech, stopListeningInternal, systemVoices]);

  const startListening = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for voice input.');
      setVoiceState('idle');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Microphone access is not supported in this browser environment.');
      setVoiceState('idle');
      return;
    }

    if (voiceStateRef.current === 'listening' || voiceStateRef.current === 'transcribing') return;

    cancelSpeech();
    setVoiceError(null);
    setLiveTranscript('');
    latestLiveTranscriptRef.current = '';
    finalTranscriptRef.current = '';
    committedRef.current = false;
    hasQualifiedSpeechRef.current = false;
    activeSpeechMsRef.current = 0;

    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch (err) {
        setVoiceError(formatMicError(err));
        setVoiceState('idle');
        return;
      }
      streamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = pickMimeType();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        commitFinalTranscript();
      };

      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (e: SpeechRecognitionEvent) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; ++i) {
            const res = e.results[i];
            const phrase = res[0]?.transcript || '';
            if (res.isFinal) {
              finalTranscriptRef.current = (finalTranscriptRef.current ? `${finalTranscriptRef.current} ${phrase.trim()}` : phrase.trim()).trim();
            } else {
              interim += phrase;
            }
          }

          const fullText = (finalTranscriptRef.current ? `${finalTranscriptRef.current} ${interim.trim()}` : interim.trim()).trim();
          if (fullText) {
            latestLiveTranscriptRef.current = fullText;
            hasQualifiedSpeechRef.current = true;
            const cleaned = stripWakeWord(fullText).trim();
            setLiveTranscript(cleaned);
            onTranscriptRef.current?.(cleaned);
          }
        };

        rec.onerror = (ev: SpeechRecognitionErrorEvent) => {
          const err = ev.error;
          switch (err) {
            case 'no-speech':
            case 'aborted':
              // Normal operational occurrences when stopping or pausing; never display error banners.
              break;
            case 'audio-capture':
              setVoiceError('Audio capture failed — check your microphone connection.');
              break;
            case 'not-allowed':
              setVoiceError('Microphone permission denied. Allow mic access in browser settings, then tap the mic again.');
              break;
            case 'network':
              setVoiceError('Speech recognition network error. Please check your internet connection.');
              break;
            case 'service-not-allowed':
              setVoiceError('Speech recognition service not allowed. Check browser settings.');
              break;
            default:
              console.warn('SpeechRecognition error:', err);
          }
        };

        rec.onend = () => {
          hadActiveRecognitionRef.current = false;
          if (voiceStateRef.current === 'listening') {
            if (hasQualifiedSpeechRef.current) {
              commitFinalTranscript();
            }
            stopListeningInternal(false);
          }
        };

        rec.start();
        recognitionRef.current = rec;
        hadActiveRecognitionRef.current = true;
      } catch (e) {
        console.warn('SpeechRecognition start failed:', e);
        setVoiceError('Failed to initialize speech recognition. Try refreshing the page.');
        stopListeningInternal(false);
        return;
      }

      mediaRecorder.start(250);
      setVoiceState('listening');

      let silenceStart: number | null = null;
      const startTime = Date.now();
      const timeDomainData = new Uint8Array(analyser.fftSize);

      recordingTimerRef.current = window.setTimeout(() => stopListeningInternal(true), 15000);

      vadIntervalRef.current = window.setInterval(() => {
        if (voiceStateRef.current === 'speaking') {
          stopListeningInternal(false);
          return;
        }
        analyser.getByteTimeDomainData(timeDomainData);
        let sumSquares = 0;
        for (let i = 0; i < timeDomainData.length; i++) {
          const n = (timeDomainData[i] - 128) / 128;
          sumSquares += n * n;
        }
        const rms = Math.sqrt(sumSquares / timeDomainData.length);
        const hasLiveWords = latestLiveTranscriptRef.current.trim().length > 0;
        if (hasLiveWords) hasQualifiedSpeechRef.current = true;

        if (rms > 0.012 || hasLiveWords) {
          activeSpeechMsRef.current += 50;
          if (activeSpeechMsRef.current >= 150 || hasLiveWords) {
            hasQualifiedSpeechRef.current = true;
            silenceStart = null;
          }
        } else if (hasQualifiedSpeechRef.current) {
          if (silenceStart === null) silenceStart = Date.now();
          else if (Date.now() - silenceStart > 1200) stopListeningInternal(true);
        } else if (Date.now() - startTime > 7000) {
          stopListeningInternal(false);
        }
      }, 50);
    } catch (err) {
      console.warn('Microphone init failed:', err);
      setVoiceState('idle');
    }
  }, [cancelSpeech, commitFinalTranscript, stopListeningInternal]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const stopListening = useCallback(() => {
    stopListeningInternal(true);
  }, [stopListeningInternal]);

  // Pure browser speech synthesis preview for settings modal
  const previewVoice = useCallback((voiceId?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const v = normalizeVoiceId(voiceId || voiceSettingsRef.current.voiceId || 'arc-precision');
    const sample = v.includes('studio')
      ? 'ARC online. Studio Clear analytical persona active.'
      : v.includes('lead')
      ? 'ARC online. Academic Lead research persona active.'
      : v.includes('cadence')
      ? 'ARC online. British Scholar study persona active.'
      : v.includes('specialist')
      ? 'ARC online. Resolute Specialist deep persona active.'
      : v.includes('agile')
      ? 'ARC online. Agile Assistant rapid persona active.'
      : v.includes('calm')
      ? 'ARC online. Whisper Calm focused persona active.'
      : v.includes('academic')
      ? 'ARC online. Academic Precision formal persona active.'
      : 'ARC online. Primary Precision persona active.';

    cancelSpeech();
    setPreviewingVoiceId(v);
    setVoiceState('speaking');
    const genId = ++speechGenIdRef.current;

    const voices = systemVoices.length > 0 ? systemVoices : window.speechSynthesis.getVoices();
    const { voice: chosenVoice, pitch, rate, isSingleVoice } = matchBrowserVoice(voices, v);
    const cleaned = cleanTextForSpeech(sample);
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.pitch = pitch;
    utterance.rate = (voiceSettingsRef.current.speechRate || 1.0) * rate;

    if (chosenVoice) utterance.voice = chosenVoice;

    const totalCount = voices.filter(sv => sv.lang.toLowerCase().startsWith('en')).length || voices.length;
    const voiceDisplayName = chosenVoice ? chosenVoice.name : 'System Default Voice';

    setPreviewStatus({
      voiceId: v,
      voiceName: voiceDisplayName,
      systemVoiceCount: totalCount,
      isSingleSystemVoice: isSingleVoice,
      note: isSingleVoice
        ? `1 system voice detected on OS — pitch & cadence modulated`
        : `Matched system voice: ${voiceDisplayName}`,
    });

    utterance.onend = () => {
      if (speechGenIdRef.current === genId) {
        setPreviewingVoiceId(null);
        setPreviewStatus(null);
        if (voiceStateRef.current === 'speaking') setVoiceState('idle');
      }
    };

    utterance.onerror = () => {
      if (speechGenIdRef.current === genId) {
        setPreviewingVoiceId(null);
        setPreviewStatus(null);
        if (voiceStateRef.current === 'speaking') setVoiceState('idle');
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [cancelSpeech, systemVoices]);

  const testVoicePersona = useCallback((voiceId?: string) => {
    previewVoice(voiceId);
  }, [previewVoice]);

  useEffect(() => () => hardResetVoice(), [hardResetVoice]);
  const toggleVoiceMode = useCallback(() => {
    const next = !isVoiceEnabledRef.current;
    isVoiceEnabledRef.current = next;
    setIsVoiceEnabled(next);
    saveVoiceEnabled(next);
    if (next) {
      updateVoiceSettings({ autoSpeak: true });
      const onSpoken = voiceSettingsRef.current.interactionMode === 'live'
        ? () => void startListeningRef.current()
        : undefined;
      void speak('ARC voice systems online.', onSpoken, true);
    } else {
      updateVoiceSettings({ autoSpeak: false });
      hardResetVoice();
    }
  }, [hardResetVoice, speak, updateVoiceSettings]);

  return { isVoiceEnabled, voiceState, isListening: voiceState === 'listening', isSpeaking: voiceState === 'speaking', isTranscribing: voiceState === 'transcribing', supported, voiceSettings, liveTranscript, voiceError, clearVoiceError, updateVoiceSettings, toggleVoiceMode, startListening, stopListening, speak, cancelSpeech, stopSpeaking: cancelSpeech, hardResetVoice, testVoicePersona, previewingVoiceId, previewStatus, systemVoiceCount, isSingleSystemVoice };
}
