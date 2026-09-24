/**
 * Voice preview for the Voice Bot wizard. Uses the browser's Web Speech API as a stand-in for
 * pre-recorded sample calls (same behaviour as the original site).
 */
export const LANGUAGES = [
  { label: 'English', code: 'en-IN', sampleKey: 'en-IN' },
  { label: 'Hindi', code: 'hi-IN', sampleKey: 'hi-IN' },
  { label: 'Hinglish', code: 'hi-IN', sampleKey: 'hinglish' },
  { label: 'British English', code: 'en-GB', sampleKey: 'en-GB' },
  { label: 'American English', code: 'en-US', sampleKey: 'en-US' },
];

const SAMPLE_LINES = {
  'en-IN': 'Hi, this is CallMaster calling — I can help with product questions, order updates, or booking a callback.',
  'en-US': 'Hi there, this is CallMaster calling — I can help with product questions, order updates, or booking a callback.',
  'en-GB': 'Hello, this is CallMaster calling — I can help with product questions, order updates, or booking a callback.',
  'hi-IN': 'नमस्ते, मैं CallMaster की ओर से बात कर रहा हूँ। मैं आपकी कैसे मदद कर सकता हूँ?',
  hinglish: 'Hi, main CallMaster ki taraf se baat kar raha hoon. Aapki kaise help kar sakta hoon?',
};

export const speechReady = typeof window !== 'undefined' && 'speechSynthesis' in window;
let cachedVoices = [];
if (speechReady) {
  const load = () => { cachedVoices = window.speechSynthesis.getVoices(); };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

function pickVoiceFor(langCode, gender) {
  if (!cachedVoices.length) return null;
  const g = gender.toLowerCase();
  const exact = cachedVoices.filter((v) => v.lang === langCode);
  const byName = exact.find((v) => v.name.toLowerCase().includes(g));
  if (byName) return byName;
  if (exact.length) return gender === 'Male' ? exact[0] : exact[exact.length - 1];
  const prefix = langCode.split('-')[0];
  const loose = cachedVoices.filter((v) => v.lang.startsWith(prefix));
  if (loose.length) return gender === 'Male' ? loose[0] : loose[loose.length - 1];
  return cachedVoices[0];
}

export function cancelSpeech() {
  try { if (speechReady) window.speechSynthesis.cancel(); } catch { /* ignore */ }
}

export function playLanguagePreview(language, gender) {
  if (!speechReady) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(SAMPLE_LINES[language.sampleKey] || SAMPLE_LINES['en-IN']);
    const voice = pickVoiceFor(language.code, gender);
    if (voice) utter.voice = voice;
    utter.lang = language.code;
    utter.pitch = gender === 'Male' ? 0.85 : 1.25;
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  } catch { /* preview is best-effort */ }
}
