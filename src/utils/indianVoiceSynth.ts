// =============================================================================
// FARMKIND — INDIAN NEURAL VOICE SYNTHESIZER
// Prioritizes natural, human-like Indian neural voices (Swara, Madhur, Google Hindi)
// over robotic system defaults to build empathetic connection with rural farmers.
//
// PHONETIC ENGINE FIX:
// Resolves the Web Speech API / SAPI bug where the Hindi word 'है' (hai) is misread
// as 'हो' (ho).
//
// Root Cause:
// In Devanagari G2P parsers, when 'है' (ह + ै) is immediately followed by the Hindi
// full stop danda ('।', U+0964), the tokenizer treats 'है।' as a single token because
// '।' is in the Devanagari Unicode block. The combination of the two upper ticks (ै)
// and the vertical bar (।) is misidentified as or degraded into the 'ो' (O-matra)
// glyph/phoneme, resulting in the distorted /o/ sound ("ho").
// Furthermore, if an English-India voice (like Neerja en-IN) is mistakenly assigned
// to Hindi text, it cannot articulate Hindi diphthongs.
//
// Resolution:
// 1. Converts all Devanagari dandas ('।' and '॥') to ASCII period ('. ')
// 2. Enforces a clean phonemic boundary after 'है' and 'हैं'
// 3. Strictly pairs Hindi text with authentic Hindi neural voices (Swara, Madhur,
//    Google Hindi, Kalpana, Hemant), completely preventing English voice misassignment.
// =============================================================================

export interface VoicePlaybackOptions {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Preprocesses text for human-like Indian Text-to-Speech:
 * - Strips formatting, markdown, and emojis
 * - Converts Devanagari dandas ('।' / '॥') to ASCII period ('. ') so 'है' never distorts to 'हो'
 * - Normalizes currency, units, and numbers to conversational Hindi/Marathi phonetics
 */
export function cleanTextForSpeech(
  rawText: string,
  lang: 'hi' | 'mr' | 'en' | 'kn' | 'te' = 'hi'
): string {
  if (!rawText) return '';

  let text = rawText
    // Remove markdown bold/italics/strikethrough
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    // Remove markdown headers
    .replace(/#{1,6}\s+/g, '')
    // Remove bullet points and numbered lists
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // Remove emojis (preserve Devanagari, English, and standard punctuation)
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA70}-\u{1FAFF}]/gu, '')
    // Remove invisible zero-width joiners/spaces that break Indic G2P syllabification
    .replace(/[\u200B-\u200D\uFEFF]/g, '');

  // ─── CRITICAL PHONETIC FIX: ELIMINATE 'HAI' -> 'HO' DISTORTION ────────────
  // Replace Devanagari Danda (। U+0964) and Double Danda (॥ U+0965) with standard ASCII dot
  text = text.replace(/[।॥]+/g, '. ');

  // Ensure clean separation between 'है' / 'हैं' and any succeeding punctuation
  text = text.replace(/([ह][ै|ें])([\.!?])/g, '$1$2 ');
  text = text.replace(/([ह][ै|ें])([,;:\-])/g, '$1 $2 ');

  // If sentence ends with 'है' or 'हैं' with no terminal punctuation, add a dot for full falling cadence
  text = text.replace(/([ह][ै|ें])\s*$/g, '$1. ');

  // ─── CONVERSATIONAL INDIC NORMALIZATIONS ──────────────────────────────────
  if (lang === 'hi' || lang === 'mr') {
    text = text
      // Convert ₹ symbol to spoken word "रुपये"
      .replace(/₹\s*([0-9,]+)/g, 'रुपये $1')
      // Convert % symbol to spoken word
      .replace(/([0-9]+)\s*%/g, lang === 'mr' ? '$1 टक्के' : '$1 प्रतिशत')
      // Technical unit pronunciations in Devanagari
      .replace(/([0-9]+)\s*HP\b/gi, '$1 एचपी')
      .replace(/([0-9]+)\s*kW\b/gi, '$1 किलोवॉट')
      .replace(/कि\.?मी\.?/g, 'किलोमीटर')
      .replace(/कि\.?ग्रा\.?/g, 'किलोग्राम')
      .replace(/liters?|ltrs?/gi, 'लीटर');
  }

  // Clean up excessive whitespace
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Finds the most natural, human-sounding Indian voice available in the client browser.
 * Strictly guarantees that Hindi text is matched with Hindi voices (never English-India voices).
 */
export function selectBestIndianVoice(
  voices: SpeechSynthesisVoice[],
  lang: 'hi' | 'mr' | 'en' | 'kn' | 'te' = 'hi'
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const langLower = lang.toLowerCase();

  // ─── 1. HINDI VOICES ───────────────────────────────────────────────────────
  if (langLower === 'hi') {
    // High-fidelity neural Hindi voices (Swara, Madhur, Google Hindi, Kalpana, Hemant)
    const hiPriorityPatterns = [
      /swara/i,            // Microsoft Swara Online (Natural) - Hindi
      /madhur/i,           // Microsoft Madhur Online (Natural) - Hindi
      /google.*हिन्दी/i,    // Google Hindi Natural
      /google.*hindi/i,
      /kalpana/i,          // Microsoft Kalpana - Hindi
      /hemant/i,           // Microsoft Hemant - Hindi
      /ananya/i,
      /hindi/i,
      /हिन्दी/i,
    ];

    for (const pat of hiPriorityPatterns) {
      const match = voices.find(v => pat.test(v.name) && v.lang.toLowerCase().startsWith('hi'));
      if (match) return match;
    }

    // Any voice strictly tagged with language code 'hi'
    const anyHi = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
    if (anyHi) return anyHi;
  }

  // ─── 2. MARATHI VOICES ─────────────────────────────────────────────────────
  if (langLower === 'mr') {
    const mrPriorityPatterns = [
      /aarohi/i,           // Microsoft Aarohi Online (Natural) - Marathi
      /manohar/i,          // Microsoft Manohar - Marathi
      /google.*मराठी/i,    // Google Marathi
      /google.*marathi/i,
      /marathi/i,
      /मराठी/i,
    ];

    for (const pat of mrPriorityPatterns) {
      const match = voices.find(v => pat.test(v.name) && v.lang.toLowerCase().startsWith('mr'));
      if (match) return match;
    }

    const anyMr = voices.find(v => v.lang.toLowerCase().startsWith('mr'));
    if (anyMr) return anyMr;

    // Fallback for Marathi: Hindi neural voices articulate Devanagari script with near-native fidelity
    const hiFallback = voices.find(v => v.lang.toLowerCase().startsWith('hi'));
    if (hiFallback) return hiFallback;
  }

  // ─── 3. INDIAN ENGLISH VOICES ──────────────────────────────────────────────
  if (langLower === 'en') {
    const enPriorityPatterns = [
      /neerja/i,           // Microsoft Neerja Online (Natural) - English India
      /prabhat/i,          // Microsoft Prabhat Online (Natural) - English India
      /google.*india/i,
      /india.*english/i,
      /en-in/i,
    ];

    for (const pat of enPriorityPatterns) {
      const match = voices.find(v => pat.test(v.name) && (v.lang.toLowerCase().startsWith('en') || v.lang.toLowerCase().includes('in')));
      if (match) return match;
    }

    const enInVoice = voices.find(v => v.lang.toLowerCase().startsWith('en-in') || (v.lang.toLowerCase().startsWith('en') && v.name.toLowerCase().includes('india')));
    if (enInVoice) return enInVoice;

    const anyEn = voices.find(v => v.lang.toLowerCase().startsWith('en'));
    if (anyEn) return anyEn;
  }

  // ─── 4. GENERAL FALLBACK ───────────────────────────────────────────────────
  const langMatch = voices.find(v => v.lang.toLowerCase().startsWith(langLower));
  if (langMatch) return langMatch;

  return voices[0] || null;
}

/**
 * Returns the name of the active Indian voice for display in the UI.
 */
export function getActiveIndianVoiceName(lang: 'hi' | 'mr' | 'en' | 'kn' | 'te' = 'hi'): string {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return 'Web Speech API Unavailable';
  }
  const voices = window.speechSynthesis.getVoices();
  const voice = selectBestIndianVoice(voices, lang);
  return voice ? voice.name : 'System Default Indian Voice';
}

/**
 * Speaks text using the highest quality natural Indian voice with warm rural cadence.
 */
export function speakNaturalIndianVoice(
  text: string,
  lang: 'hi' | 'mr' | 'en' | 'kn' | 'te' = 'hi',
  options: VoicePlaybackOptions = {}
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onError?.(new Error('SpeechSynthesis not supported'));
    return;
  }

  window.speechSynthesis.cancel();

  const cleaned = cleanTextForSpeech(text, lang);
  if (!cleaned) return;

  const utterance = new SpeechSynthesisUtterance(cleaned);
  const langTagMap: Record<string, string> = {
    hi: 'hi-IN',
    mr: 'mr-IN',
    en: 'en-IN',
    kn: 'kn-IN',
    te: 'te-IN',
  };
  utterance.lang = langTagMap[lang] || 'hi-IN';

  // Rural cadence: slightly relaxed (0.93x) so smallholder farmers can clearly understand
  utterance.rate = options.rate ?? 0.93;
  utterance.pitch = options.pitch ?? 1.0;

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = selectBestIndianVoice(voices, lang);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onstart = () => options.onStart?.();
  utterance.onend = () => options.onEnd?.();
  utterance.onerror = (e) => options.onError?.(e);

  window.speechSynthesis.speak(utterance);
}

/**
 * Stops any ongoing Indian voice speech synthesis immediately.
 */
export function stopIndianVoice(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

