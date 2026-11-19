// Memorisation lab (التسميع): recite a surah ayah by ayah; each correctly recited ayah is revealed.
//
// The original crashed on every speech result (`getSkeleton` was called but never defined), and its
// check accepted an ayah after a single shared word. Matching is now done on consonant skeletons with
// a word-coverage threshold, and the Quranic opening letters (الم، طه، يس …) can be recited by name.

import { getSurah } from '../core/api.js';
import { stripBasmala } from '../core/arabic.js';
import { h } from '../core/dom.js';
import { onLanguageChange, t } from '../core/i18n.js';
import { surahName, surahs } from '../core/quran.js';

// --------------------------------------------------------------------------- matching (pure)
/** Letters only, unified forms (no diacritics, hamza or long vowels): robust to ASR spelling. */
export function skeleton(text) {
  return String(text ?? '')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/[ةه]/g, 'ه').replace(/[ىئ]/g, 'ي').replace(/ؤ/g, 'و').replace(/ء/g, '')
    .replace(/[^ء-ي]/g, '')
    .replace(/[اوي]/g, '');
}

const words = (text) => String(text ?? '')
  .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
  .split(/\s+/).map(skeleton).filter(Boolean);

const LETTER_NAMES = {
  ا: 'الف', ل: 'لام', م: 'ميم', ر: 'را', ص: 'صاد', ك: 'كاف', ه: 'ها', ي: 'يا', ع: 'عين',
  ط: 'طا', س: 'سين', ح: 'حا', ق: 'قاف', ن: 'نون',
};
const MUQATTAAT = new Set(['الم', 'المص', 'الر', 'المر', 'كهيعص', 'طه', 'طسم', 'طس', 'يس', 'ص', 'حم', 'عسق', 'ق', 'ن']);

/** If an ayah consists only of disjoined letters, return them spelled out by name, else null. */
function spelledMuqattaat(expected) {
  const plain = String(expected).replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '').trim();
  const parts = plain.split(/\s+/);
  if (!parts.length || !parts.every((p) => MUQATTAAT.has(p))) return null;
  return parts.map((p) => [...p].map((c) => LETTER_NAMES[c] ?? c).join(' ')).join(' ');
}

/** @returns {boolean} whether `spoken` is an acceptable recitation of `expected`. */
export function isRecitationCorrect(expected, spoken) {
  const spokenSkel = skeleton(spoken);
  if (spokenSkel.length < 2) return false;
  const spelled = spelledMuqattaat(expected);
  if (spelled) {
    return spokenSkel.includes(skeleton(spelled)) || skeleton(String(spoken).replace(/\s+/g, '')) === skeleton(expected.replace(/\s+/g, ''));
  }
  const expectedSkel = skeleton(expected);
  if (expectedSkel.length >= 3 && spokenSkel.includes(expectedSkel)) return true;
  const expectedWords = words(expected);
  if (!expectedWords.length) return false;
  const spokenWords = new Set(words(spoken));
  const matched = expectedWords.filter((w) => spokenWords.has(w)).length;
  const needed = expectedWords.length <= 2 ? expectedWords.length : Math.ceil(expectedWords.length * 0.7);
  return matched >= needed;
}

// --------------------------------------------------------------------------- UI
const el = {};
const state = { surah: 0, ayahs: [], index: 0, listening: false, recognition: null };

function setFeedback(key, kind = '') {
  el.feedback.textContent = key ? t(key) : '';
  el.feedback.className = `center voice-feedback ${kind}`;
}

function renderProgress() {
  el.progress.textContent = state.ayahs.length ? t('voice_progress', { current: Math.min(state.index + 1, state.ayahs.length), total: state.ayahs.length }) : '';
}

function populateSelect() {
  const selected = el.select.value;
  el.select.replaceChildren(
    h('option', { value: '', text: t('voice_select') }),
    ...surahs.map((s) => h('option', { value: String(s.number), text: `${s.number} - ${surahName(s.number)}` })),
  );
  el.select.value = selected;
}

async function chooseSurah() {
  const n = Number(el.select.value);
  stopListening();
  state.surah = n;
  state.ayahs = [];
  state.index = 0;
  setFeedback('');
  renderProgress();
  if (!n) { el.recited.hidden = true; return; }
  el.recited.hidden = false;
  el.recited.replaceChildren(h('div', { class: 'loading', text: t('voice_loading') }));
  try {
    const data = await getSurah(n);
    if (state.surah !== n) return;
    state.ayahs = data.ayahs.map((a) => ({ ...a, text: stripBasmala(a.text, n, a.numberInSurah) }));
    el.recited.replaceChildren(h('div', { class: 'recited-ready', text: t('voice_loaded') }));
    renderProgress();
  } catch {
    if (state.surah === n) el.recited.replaceChildren(h('p', { class: 'error-state', text: t('voice_load_error') }));
  }
}

function onResult(event) {
  let transcript = '';
  for (let i = 0; i < event.results.length; i += 1) transcript += `${event.results[i][0].transcript} `;
  transcript = transcript.trim();
  if (skeleton(transcript).length < 2) return;
  el.result.textContent = t('voice_heard') + transcript;
  const expected = state.ayahs[state.index];
  if (!expected) return;

  if (isRecitationCorrect(expected.text, transcript)) {
    setFeedback('voice_correct', 'ok');
    if (state.index === 0) el.recited.replaceChildren();
    el.recited.append(h('span', { class: 'ayah-span' }, expected.text, ' ', h('span', { class: 'ayah-number', text: `﴿${expected.numberInSurah}﴾` })), ' ');
    el.recited.scrollTop = el.recited.scrollHeight;
    state.index += 1;
    renderProgress();
    if (state.index >= state.ayahs.length) {
      setFeedback('voice_done', 'ok');
      stopListening();
      return;
    }
    // Restart recognition so the next ayah starts from an empty transcript (as the original did).
    try { state.recognition.stop(); } catch { /* already stopped */ }
  } else if (event.results[event.results.length - 1].isFinal && transcript.length > 5) {
    setFeedback('voice_wrong', 'bad');
  }
}

function stopListening() {
  state.listening = false;
  try { state.recognition?.stop(); } catch { /* not started */ }
  el.mic?.setAttribute('aria-pressed', 'false');
}

function toggleListening() {
  if (!state.recognition) return;
  if (state.listening) { stopListening(); return; }
  if (!state.ayahs.length) { setFeedback('voice_choose_first', 'bad'); el.select.focus(); return; }
  state.listening = true;
  el.mic.setAttribute('aria-pressed', 'true');
  try { state.recognition.start(); } catch { /* already started */ }
}

export function initVoiceLab() {
  Object.assign(el, {
    select: document.getElementById('voiceSurahSelect'),
    mic: document.getElementById('micBtn'),
    result: document.getElementById('voiceResultText'),
    feedback: document.getElementById('voiceFeedback'),
    progress: document.getElementById('voiceProgress'),
    recited: document.getElementById('recitedAyahsContainer'),
  });
  populateSelect();
  el.select.addEventListener('change', chooseSurah);
  onLanguageChange(() => { populateSelect(); renderProgress(); });
  document.getElementById('voiceTestModal').addEventListener('close', stopListening);

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    el.mic.hidden = true;
    el.result.removeAttribute('data-i18n');
    el.result.dataset.i18n = 'voice_unsupported';
    el.result.textContent = t('voice_unsupported');
    return;
  }
  const rec = new SpeechRec();
  rec.lang = 'ar-SA';
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.onstart = () => { el.result.textContent = t('voice_listening'); };
  rec.onresult = onResult;
  rec.onend = () => {
    if (state.listening && state.index < state.ayahs.length) {
      try { rec.start(); } catch { /* restarting too fast */ }
    } else {
      stopListening();
      el.result.textContent = t('voice_stopped');
    }
  };
  rec.onerror = (event) => {
    if (event.error === 'no-speech' || event.error === 'aborted') return;
    stopListening();
    el.result.textContent = t(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'voice_mic_denied' : 'voice_mic_error');
  };
  state.recognition = rec;
  el.mic.addEventListener('click', toggleListening);
}

export const _voiceState = state; // for tests
