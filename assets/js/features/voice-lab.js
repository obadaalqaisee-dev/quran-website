// Memorisation lab (التسميع): recite a surah ayah by ayah; each correctly recited ayah is revealed.
//
// History: the original crashed on every speech result (`getSkeleton` was never defined) and accepted an
// ayah after one shared word. That was fixed with consonant-skeleton matching (isRecitationCorrect,
// kept below unchanged). This version adds, without removing anything:
//   * a word-level comparison (core/recitation.js): correct / missing / substituted / repeated words,
//     the reciter's position in the ayah, retry, hint and skip;
//   * a robust recogniser (core/speech.js): bounded restarts, classified errors, tab-visibility handling,
//     no restart between ayahs (the transcript is "consumed" instead — lower latency);
//   * microphone checks (core/mic.js): permission state, device list, level meter, full cleanup;
//   * modes: sequential (the original behaviour, default), ayah by ayah, hide & reveal, listen first,
//     repetition, self-test; an ayah range; progress, revision schedule and mistake history
//     (features/memorization.js, stored under a new key).
//
// Limitation shown to the user: browser speech recognition returns words, so the lab checks the words
// of the recitation. It does not and cannot judge tajweed or pronunciation.

import { AYAH_AUDIO, getSurah } from '../core/api.js';
import { stripBasmala } from '../core/arabic.js';
import { $$, h } from '../core/dom.js';
import { onLanguageChange, t } from '../core/i18n.js';
import { MicManager, micPermission, micSupported } from '../core/mic.js';
import {
  loadMemo, recordAyah, recordCompletion, recordMistake, saveMemo,
} from '../core/memorization-store.js';
import { surahName, surahs } from '../core/quran.js';
import { alignRecitation, isPerfect, recitationScore } from '../core/recitation.js';
import { RecitationListener, speechSupported } from '../core/speech.js';
import { KEYS, getString, setString } from '../core/storage.js';

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

export const isMuqattaat = (expected) => spelledMuqattaat(expected) !== null;

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

// --------------------------------------------------------------------------- modes
export const MODES = ['classic', 'ayah', 'hide', 'listen', 'repeat', 'test'];
// Whether the words of the current ayah are shown before they are recited.
const SHOWS_TEXT = { classic: false, ayah: true, hide: false, listen: true, repeat: true, test: false };

// --------------------------------------------------------------------------- UI
const el = {};
const state = {
  surah: 0, ayahs: [], index: 0, from: 0, to: 0, listening: false, recognition: null,
  mode: 'classic', repeatTarget: 3, repeatDone: 0, awaitingNext: false, hinted: new Set(), peek: false,
  analysis: null, sessionMistakes: 0, scores: [], micState: 'unknown', ayahAudio: null,
};
const mic = new MicManager();
let onProgress = () => {};

function setFeedback(key, kind = '', vars) {
  el.feedback.textContent = key ? t(key, vars) : '';
  el.feedback.className = `center voice-feedback ${kind}`;
}

const rangeLength = () => (state.ayahs.length ? state.to - state.from + 1 : 0);

function renderProgress() {
  if (!state.ayahs.length) { el.progress.textContent = ''; el.bar.hidden = true; return; }
  const done = Math.min(state.index - state.from, rangeLength());
  el.progress.textContent = t('voice_progress', { current: Math.min(done + 1, rangeLength()), total: rangeLength() });
  el.bar.hidden = false;
  const pct = Math.round((done / rangeLength()) * 100);
  el.barFill.style.width = `${pct}%`;
  el.bar.setAttribute('aria-valuenow', String(pct));
}

function populateSelect() {
  const selected = el.select.value;
  el.select.replaceChildren(
    h('option', { value: '', text: t('voice_select') }),
    ...surahs.map((s) => h('option', { value: String(s.number), text: `${s.number} - ${surahName(s.number)}` })),
  );
  el.select.value = selected;
}

function populateModes() {
  el.mode.replaceChildren(...MODES.map((m) => h('option', { value: m, text: t(`lab_mode_${m}`) })));
  el.mode.value = state.mode;
  el.modeHint.textContent = t(`lab_mode_${state.mode}_hint`);
  el.repeatWrap.hidden = state.mode !== 'repeat';
}

function populateRange() {
  const n = state.ayahs.length;
  const opts = (sel) => Array.from({ length: n }, (_, i) => h('option', { value: String(i), text: String(state.ayahs[i].numberInSurah), selected: i === sel }));
  el.from.replaceChildren(...opts(state.from));
  el.to.replaceChildren(...opts(state.to));
  el.rangeWrap.hidden = !n;
}

function resetSession() {
  state.index = state.from;
  state.repeatDone = 0;
  state.awaitingNext = false;
  state.hinted = new Set();
  state.peek = false;
  state.analysis = null;
  state.sessionMistakes = 0;
  state.scores = [];
  el.summary.hidden = true;
  el.next.hidden = true;
  setFeedback('');
  renderProgress();
  renderReady();
  renderLive();
}

function renderReady() {
  if (!state.ayahs.length) return;
  if (state.mode === 'hide') { renderHiddenRange(); return; }
  el.recited.replaceChildren(h('div', { class: 'recited-ready', text: t('voice_loaded') }));
}

async function chooseSurah() {
  const n = Number(el.select.value);
  stopListening();
  state.surah = n;
  state.ayahs = [];
  state.index = 0;
  setFeedback('');
  renderProgress();
  el.live.hidden = true;
  el.rangeWrap.hidden = true;
  if (!n) { el.recited.hidden = true; return; }
  el.recited.hidden = false;
  el.recited.replaceChildren(h('div', { class: 'loading', text: t('voice_loading') }));
  try {
    const data = await getSurah(n);
    if (state.surah !== n) return;
    state.ayahs = data.ayahs.map((a) => ({ ...a, text: stripBasmala(a.text, n, a.numberInSurah) }));
    state.from = 0;
    state.to = state.ayahs.length - 1;
    populateRange();
    resetSession();
  } catch {
    if (state.surah === n) el.recited.replaceChildren(h('p', { class: 'error-state', text: t('voice_load_error') }));
  }
}

// ---------------------------------------------------------------- live word view
function wordChip(w, i, reveal) {
  const shown = reveal || w.status === 'correct' || state.hinted.has(i);
  return h('span', {
    class: `lab-word is-${w.status}${i === state.analysis?.position ? ' is-current' : ''}${shown ? '' : ' is-masked'}`,
    lang: 'ar',
    attrs: { 'aria-label': shown ? `${w.text} — ${t(`lab_word_${w.status}`)}` : t('lab_word_hidden') },
  }, shown ? w.text : '•••');
}

function currentAnalysis() {
  const ayah = state.ayahs[state.index];
  return state.analysis ?? (ayah ? alignRecitation(ayah.text, '') : null);
}

function renderLive() {
  const ayah = state.ayahs[state.index];
  if (!ayah || state.index > state.to) { el.live.hidden = true; return; }
  el.live.hidden = false;
  const analysis = currentAnalysis();
  const reveal = SHOWS_TEXT[state.mode] || state.peek;
  el.words.replaceChildren(...analysis.words.map((w, i) => wordChip(w, i, reveal)));
  el.position.textContent = t('lab_position', {
    ayah: ayah.numberInSurah, word: Math.min(analysis.position + 1, analysis.total), total: analysis.total,
  });
  const notes = [];
  if (analysis.missing.length) notes.push(t('lab_note_missing', { n: analysis.missing.length }));
  if (analysis.substitutions.length) notes.push(t('lab_note_substituted', { words: analysis.substitutions.map((s) => `«${s.heard}»`).join('، ') }));
  if (analysis.repeated.length) notes.push(t('lab_note_repeated', { n: analysis.repeated.length }));
  if (state.mode === 'repeat') notes.push(t('lab_repeat_count', { done: state.repeatDone, total: state.repeatTarget }));
  el.notes.textContent = notes.join(' · ');
  el.hint.disabled = state.mode === 'test';
  el.peek.hidden = state.mode !== 'hide';
  el.peek.setAttribute('aria-pressed', String(state.peek));
  if (state.mode === 'hide') updateHiddenAyah(state.index);
}

function renderHiddenRange() {
  const nodes = [];
  for (let i = state.from; i <= state.to; i += 1) {
    nodes.push(h('span', { class: 'ayah-span hidden-ayah', id: `lab-ayah-${i}` }), ' ');
  }
  el.recited.replaceChildren(...nodes);
  for (let i = state.from; i <= state.to; i += 1) updateHiddenAyah(i);
}

function updateHiddenAyah(i) {
  const span = document.getElementById(`lab-ayah-${i}`);
  const ayah = state.ayahs[i];
  if (!span || !ayah) return;
  const number = h('span', { class: 'ayah-number', text: `﴿${ayah.numberInSurah}﴾` });
  if (i < state.index) { span.className = 'ayah-span hidden-ayah is-revealed'; span.replaceChildren(ayah.text, ' ', number); return; }
  if (i === state.index) {
    const analysis = currentAnalysis();
    span.className = 'ayah-span hidden-ayah is-current';
    span.replaceChildren(...analysis.words.flatMap((w, k) => [wordChip(w, k, state.peek), ' ']), number);
    return;
  }
  span.className = 'ayah-span hidden-ayah';
  span.replaceChildren(h('span', { class: 'lab-mask', attrs: { 'aria-hidden': 'true' }, text: '• • •' }), ' ', number);
}

// ---------------------------------------------------------------- recognition results
function memo(fn) { const m = loadMemo(); fn(m); saveMemo(m); onProgress(); }

function mistakeDetails(analysis) {
  return {
    missing: analysis.missing.map((i) => analysis.words[i].text),
    substituted: analysis.substitutions.map((s) => `${s.expected} ← ${s.heard}`),
  };
}

function accept(analysis) {
  const expected = state.ayahs[state.index];
  const score = recitationScore(analysis);
  state.scores.push(score);
  memo((m) => {
    recordAyah(m, state.surah, expected.numberInSurah, { score });
    if (analysis.missing.length || analysis.substitutions.length) {
      state.sessionMistakes += 1;
      recordMistake(m, state.surah, expected.numberInSurah, mistakeDetails(analysis));
    }
  });

  if (state.mode === 'repeat' && state.repeatDone + 1 < state.repeatTarget) {
    state.repeatDone += 1;
    state.analysis = null;
    setFeedback('lab_repeat_again', 'ok', { done: state.repeatDone, total: state.repeatTarget });
    state.recognition?.consume();
    renderLive();
    return;
  }

  setFeedback('voice_correct', 'ok');
  if (state.mode !== 'hide') {
    if (state.index === state.from) el.recited.replaceChildren();
    el.recited.append(h('span', { class: 'ayah-span' }, expected.text, ' ', h('span', { class: 'ayah-number', text: `﴿${expected.numberInSurah}﴾` })), ' ');
    el.recited.scrollTop = el.recited.scrollHeight;
  }
  state.recognition?.consume();

  if (state.mode === 'ayah' && state.index < state.to) {
    // Ayah by ayah: pause after each ayah; the user chooses "next" or "retry".
    state.awaitingNext = true;
    stopListening();
    el.next.hidden = false;
    setFeedback('lab_ayah_done', 'ok', { score });
    el.next.focus();
    return;
  }
  advance();
}

function advance() {
  state.index += 1;
  state.repeatDone = 0;
  state.analysis = null;
  state.hinted = new Set();
  state.peek = false;
  state.awaitingNext = false;
  el.next.hidden = true;
  if (state.mode === 'hide') updateHiddenAyah(state.index - 1);
  renderProgress();
  if (state.index > state.to) { finish(); return; }
  renderLive();
  if (state.mode === 'hide') updateHiddenAyah(state.index);
  if (state.mode === 'listen' && state.listening) playCurrentAyah({ thenListen: true });
}

function finish() {
  setFeedback('voice_done', 'ok');
  stopListening();
  el.live.hidden = true;
  const avg = state.scores.length ? Math.round(state.scores.reduce((a, b) => a + b, 0) / state.scores.length) : 0;
  memo((m) => recordCompletion(m, state.surah, { clean: state.sessionMistakes === 0, mode: state.mode, score: avg }));
  el.summary.hidden = false;
  el.summary.replaceChildren(
    h('strong', { text: t('lab_summary_title') }),
    h('span', { text: t('lab_summary_body', { n: rangeLength(), score: avg, mistakes: state.sessionMistakes }) }),
  );
}

function onTranscript(transcript, isFinal) {
  if (skeleton(transcript).length < 2) return;
  el.result.textContent = t('voice_heard') + transcript;
  const expected = state.ayahs[state.index];
  if (!expected || state.awaitingNext || state.index > state.to) return;
  const analysis = alignRecitation(expected.text, transcript);
  state.analysis = analysis;

  const strict = state.mode === 'test';
  const accepted = strict
    ? (isPerfect(analysis) || (isMuqattaat(expected.text) && isRecitationCorrect(expected.text, transcript)))
    : (isRecitationCorrect(expected.text, transcript) || analysis.complete);
  if (accepted) { accept(analysis); return; }

  renderLive();
  if (!isFinal) return;
  const tooLong = analysis.heardCount > analysis.total * 2 + 4;
  if ((!analysis.onTrack && transcript.length > 5) || tooLong) {
    setFeedback('voice_wrong', 'bad');
    state.sessionMistakes += 1;
    memo((m) => recordMistake(m, state.surah, expected.numberInSurah, mistakeDetails(analysis)));
    state.recognition?.consume();
    state.analysis = null;
    renderLive();
  } else if (analysis.onTrack) {
    // A pause in the middle of a long ayah: keep what was recited and wait for the rest.
    setFeedback('lab_continue', '', { word: analysis.position, total: analysis.total });
  }
}

// ---------------------------------------------------------------- listening
function setMicStatus(key, kind = '') {
  el.micStatus.textContent = key ? t(key) : '';
  el.micStatus.className = `mic-status small ${kind}`;
}

const SPEECH_ERRORS = {
  denied: 'voice_mic_denied', service: 'lab_err_service', 'no-mic': 'lab_err_no_mic', language: 'lab_err_language',
  network: 'lab_err_network', unstable: 'lab_err_unstable', unsupported: 'voice_unsupported', error: 'voice_mic_error',
};

function stopListening() {
  state.listenToken = (state.listenToken || 0) + 1; // cancels a start that is still awaiting permission
  state.listening = false;
  state.recognition?.stop();
  state.ayahAudio?.pause();
  el.mic?.setAttribute('aria-pressed', 'false');
  el.mic?.classList.remove('is-hearing');
}

async function startListening() {
  if (!state.ayahs.length) { setFeedback('voice_choose_first', 'bad'); el.select.focus(); return; }
  if (state.index > state.to) resetSession();
  if (mic.active) { mic.close(); el.micTest.setAttribute('aria-pressed', 'false'); el.micTest.textContent = t('lab_mic_test'); }
  // Permission already refused: explain how to allow it instead of failing silently.
  const token = (state.listenToken || 0) + 1;
  state.listenToken = token;
  state.micState = await micPermission();
  if (token !== state.listenToken) return; // stopped (or restarted) while waiting
  if (state.micState === 'denied') { setMicStatus('lab_mic_denied_help', 'bad'); el.result.textContent = t('voice_mic_denied'); return; }
  state.listening = true;
  el.mic.setAttribute('aria-pressed', 'true');
  setMicStatus('');
  if (state.mode === 'listen' && !state.analysis) { playCurrentAyah({ thenListen: true }); return; }
  state.recognition.start();
}

function toggleListening() {
  if (!state.recognition) return;
  if (state.listening) { stopListening(); el.result.textContent = t('voice_stopped'); return; }
  startListening();
}

/** Listen-first mode: play the ayah (Mishary Alafasy, per ayah) and start listening when it ends. */
function playCurrentAyah({ thenListen = false } = {}) {
  const ayah = state.ayahs[state.index];
  if (!ayah) return;
  state.recognition?.stop(); // the recogniser must not hear the loudspeaker
  state.ayahAudio ??= new Audio();
  const audio = state.ayahAudio;
  const resume = () => { if (thenListen && state.listening) state.recognition.start(); };
  audio.onended = () => { setMicStatus('lab_your_turn'); resume(); };
  audio.onerror = () => { setMicStatus('lab_audio_failed', 'bad'); resume(); };
  audio.src = AYAH_AUDIO(ayah.id);
  setMicStatus('lab_listening_to_ayah');
  audio.play().catch(() => { setMicStatus('lab_audio_failed', 'bad'); resume(); });
}

// ---------------------------------------------------------------- microphone check
const DEVICE_KEY = 'micDeviceId'; // new key

async function populateDevices() {
  const inputs = await mic.listInputs();
  const saved = getString(DEVICE_KEY, '');
  el.device.replaceChildren(
    h('option', { value: '', text: t('lab_mic_default') }),
    ...inputs.filter((d) => d.id && d.id !== 'default').map((d) => h('option', { value: d.id, text: d.label || t('lab_mic_n', { n: d.index + 1 }) })),
  );
  el.device.value = [...el.device.options].some((o) => o.value === saved) ? saved : '';
  el.deviceWrap.hidden = el.device.options.length <= 1;
}

const MEDIA_ERRORS = {
  denied: 'lab_mic_denied_help', 'no-device': 'lab_err_no_mic', busy: 'lab_mic_busy', insecure: 'lab_mic_insecure', unsupported: 'lab_mic_unsupported',
};

async function testMic() {
  if (mic.active) { mic.close(); el.micTest.setAttribute('aria-pressed', 'false'); el.micTest.textContent = t('lab_mic_test'); setMicStatus(''); return; }
  if (state.listening) stopListening(); // one consumer of the microphone at a time
  setMicStatus('lab_mic_opening');
  const res = await mic.open(el.device.value);
  if (!res.ok) { setMicStatus(MEDIA_ERRORS[res.reason] || 'voice_mic_error', 'bad'); return; }
  const s = res.settings || {};
  const flags = ['echoCancellation', 'noiseSuppression', 'autoGainControl'].filter((k) => s[k]).map((k) => t(`lab_${k}`));
  setMicStatus('lab_mic_ok', 'ok');
  if (flags.length) el.micStatus.textContent = `${t('lab_mic_ok')} (${flags.join('، ')})`;
  el.micTest.setAttribute('aria-pressed', 'true');
  el.micTest.textContent = t('lab_mic_test_stop');
  await populateDevices();
}

function selectTab(tab) {
  for (const other of $$('[data-lab-tab]')) {
    const active = other === tab;
    other.setAttribute('aria-selected', String(active));
    other.tabIndex = active ? 0 : -1;
    document.getElementById(other.getAttribute('aria-controls')).hidden = !active;
  }
}

// ---------------------------------------------------------------- init
export function initVoiceLab({ onMemoChange } = {}) {
  onProgress = onMemoChange || (() => {});
  Object.assign(el, {
    select: document.getElementById('voiceSurahSelect'),
    mic: document.getElementById('micBtn'),
    result: document.getElementById('voiceResultText'),
    feedback: document.getElementById('voiceFeedback'),
    progress: document.getElementById('voiceProgress'),
    recited: document.getElementById('recitedAyahsContainer'),
    mode: document.getElementById('labMode'),
    modeHint: document.getElementById('labModeHint'),
    repeatWrap: document.getElementById('labRepeatWrap'),
    repeat: document.getElementById('labRepeat'),
    rangeWrap: document.getElementById('labRangeWrap'),
    from: document.getElementById('labFrom'),
    to: document.getElementById('labTo'),
    live: document.getElementById('labLive'),
    words: document.getElementById('labWords'),
    position: document.getElementById('labPosition'),
    notes: document.getElementById('labNotes'),
    retry: document.getElementById('labRetry'),
    hint: document.getElementById('labHint'),
    peek: document.getElementById('labPeek'),
    skip: document.getElementById('labSkip'),
    listen: document.getElementById('labListen'),
    next: document.getElementById('labNext'),
    summary: document.getElementById('labSummary'),
    bar: document.getElementById('labBar'),
    barFill: document.getElementById('labBarFill'),
    micStatus: document.getElementById('micStatus'),
    micTest: document.getElementById('micTestBtn'),
    micLevel: document.getElementById('micLevelFill'),
    device: document.getElementById('micDevice'),
    deviceWrap: document.getElementById('micDeviceWrap'),
  });
  const savedMode = getString(KEYS.labMode, 'classic');
  state.mode = MODES.includes(savedMode) ? savedMode : 'classic';
  populateSelect();
  populateModes();
  el.select.addEventListener('change', chooseSurah);
  el.mode.addEventListener('change', () => {
    stopListening();
    state.mode = MODES.includes(el.mode.value) ? el.mode.value : 'classic';
    setString(KEYS.labMode, state.mode);
    populateModes();
    if (state.ayahs.length) resetSession();
  });
  el.repeat.addEventListener('change', () => { state.repeatTarget = Number(el.repeat.value) || 3; renderLive(); });
  const onRange = () => {
    stopListening();
    state.from = Number(el.from.value) || 0;
    state.to = Math.max(state.from, Number(el.to.value) || 0);
    el.to.value = String(state.to);
    resetSession();
  };
  el.from.addEventListener('change', onRange);
  el.to.addEventListener('change', onRange);
  el.retry.addEventListener('click', () => {
    state.analysis = null; state.awaitingNext = false; state.repeatDone = 0; el.next.hidden = true;
    state.recognition?.consume();
    setFeedback('lab_retry_now');
    renderLive();
    if (!state.listening) startListening();
  });
  el.hint.addEventListener('click', () => {
    const a = currentAnalysis();
    if (!a || state.mode === 'test') return;
    const next = a.words.findIndex((w, i) => w.status !== 'correct' && !state.hinted.has(i));
    if (next >= 0) state.hinted.add(next);
    renderLive();
  });
  el.peek.addEventListener('click', () => { state.peek = !state.peek; renderLive(); });
  el.skip.addEventListener('click', () => {
    const ayah = state.ayahs[state.index];
    if (!ayah || state.index > state.to) return;
    state.sessionMistakes += 1;
    memo((m) => recordMistake(m, state.surah, ayah.numberInSurah, { missing: ['—'] }));
    state.recognition?.consume();
    advance();
  });
  el.listen.addEventListener('click', () => playCurrentAyah({ thenListen: state.listening }));
  el.next.addEventListener('click', () => { advance(); startListening(); });
  el.micTest.addEventListener('click', testMic);
  el.device.addEventListener('change', () => { setString(DEVICE_KEY, el.device.value); if (mic.active) { mic.close(); testMic(); } });
  mic.onLevel = (v) => { el.micLevel.style.width = `${Math.round(v * 100)}%`; };
  mic.onEnded = () => { setMicStatus('lab_mic_lost', 'bad'); el.micTest.setAttribute('aria-pressed', 'false'); el.micTest.textContent = t('lab_mic_test'); };

  for (const tab of $$('[data-lab-tab]')) tab.addEventListener('click', () => selectTab(tab));

  onLanguageChange(() => { populateSelect(); populateModes(); renderProgress(); renderLive(); });
  document.getElementById('voiceTestModal').addEventListener('close', () => { stopListening(); mic.close(); });

  if (!micSupported()) el.micTest.hidden = true;
  if (!speechSupported()) {
    el.mic.hidden = true;
    el.result.removeAttribute('data-i18n');
    el.result.dataset.i18n = 'voice_unsupported';
    el.result.textContent = t('voice_unsupported');
    return;
  }
  state.recognition = new RecitationListener({
    onTranscript,
    onState: (s) => {
      if (s === 'listening') el.result.textContent = t('voice_listening');
      else if (s === 'paused') setMicStatus('lab_paused_tab');
    },
    onSound: (hearing) => el.mic.classList.toggle('is-hearing', hearing),
    onError: (reason, fatal) => {
      if (!fatal) { if (reason === 'network') setMicStatus('lab_err_network_retry', 'bad'); return; }
      stopListening();
      el.result.textContent = t(SPEECH_ERRORS[reason] || 'voice_mic_error');
      if (reason === 'denied') setMicStatus('lab_mic_denied_help', 'bad');
    },
  });
  el.mic.addEventListener('click', toggleListening);
}

/** Start a revision of a surah (from the plan panel or the dashboard). */
export async function startRevision(surah) {
  el.select.value = String(surah);
  selectTab(document.getElementById('labTabRecite'));
  await chooseSurah();
}

export const _voiceState = state; // for tests
