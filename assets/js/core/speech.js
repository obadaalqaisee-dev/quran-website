// Speech-recognition controller (Web Speech API) for Arabic recitation.
//
// What it adds over a bare SpeechRecognition object:
//   * continuous listening: browsers end a session after silence or ~60 s; it is restarted
//     automatically, with a back-off, and gives up after repeated failures instead of looping;
//   * classified errors with a reason the interface can explain (permission, no microphone, network,
//     unsupported language, service unavailable) — fatal ones stop, transient ones retry;
//   * language fallback: ar-SA → ar-EG → ar if the engine rejects a locale;
//   * segmentation: callers "consume" what was recognised so far (e.g. after an ayah is accepted)
//     and the next transcript starts empty, without stopping the engine (lower latency than a restart);
//   * background tabs: recognition is paused when the page is hidden and resumed when visible.

export const speechSupported = () => !!(globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition);

const FATAL = { 'not-allowed': 'denied', 'service-not-allowed': 'service', 'audio-capture': 'no-mic', 'language-not-supported': 'language' };
const LANGS = ['ar-SA', 'ar-EG', 'ar'];
const MAX_QUICK_RESTARTS = 6; // within RESTART_WINDOW_MS
const RESTART_WINDOW_MS = 15000;

/** Map a SpeechRecognitionErrorEvent.error to { reason, fatal }. */
export function classifySpeechError(code) {
  if (code === 'no-speech' || code === 'aborted') return { reason: code, fatal: false, silent: true };
  if (code === 'network') return { reason: 'network', fatal: false };
  if (FATAL[code]) return { reason: FATAL[code], fatal: true };
  return { reason: 'error', fatal: false };
}

export class RecitationListener {
  /**
   * @param {{onTranscript?:(text:string, isFinal:boolean)=>void, onState?:(state:string)=>void,
   *          onError?:(reason:string, fatal:boolean)=>void, onSound?:(hearing:boolean)=>void}} handlers
   */
  constructor(handlers = {}) {
    this.h = handlers;
    this.rec = null;
    this.wanted = false; // the user wants to listen
    this.running = false; // the engine session is live
    this.langIndex = 0;
    this.restarts = [];
    this.networkErrors = 0;
    this.consumed = { results: 0, words: 0 };
    this.lastResults = [];
    this.timer = 0;
    this.onVisibility = () => {
      if (document.hidden && this.running) { this.pausedByTab = true; this.abortSession(); this.h.onState?.('paused'); }
      else if (!document.hidden && this.pausedByTab) { this.pausedByTab = false; if (this.wanted) this.startSession(); }
    };
  }

  build() {
    const Ctor = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
    const rec = new Ctor();
    rec.lang = LANGS[this.langIndex];
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => { this.running = true; this.h.onState?.('listening'); };
    rec.onspeechstart = () => this.h.onSound?.(true);
    rec.onspeechend = () => this.h.onSound?.(false);
    rec.onresult = (event) => this.handleResult(event);
    rec.onerror = (event) => this.handleError(event?.error);
    rec.onend = () => this.handleEnd();
    return rec;
  }

  start() {
    if (!speechSupported()) { this.h.onError?.('unsupported', true); return false; }
    this.wanted = true;
    this.restarts = [];
    this.networkErrors = 0;
    document.addEventListener('visibilitychange', this.onVisibility);
    this.startSession();
    return true;
  }

  startSession() {
    if (this.running || !this.wanted) return;
    this.rec ??= this.build();
    this.consumed = { results: 0, words: 0 };
    this.lastResults = [];
    try {
      this.rec.start();
    } catch {
      // InvalidStateError: a previous session is still closing; retry shortly.
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.startSession(), 250);
    }
  }

  abortSession() {
    clearTimeout(this.timer);
    try { this.rec?.abort ? this.rec.abort() : this.rec?.stop(); } catch { /* not started */ }
  }

  stop() {
    this.wanted = false;
    this.pausedByTab = false;
    clearTimeout(this.timer);
    document.removeEventListener('visibilitychange', this.onVisibility);
    try { this.rec?.stop(); } catch { /* not started */ }
  }

  /** Forget everything recognised so far; the next transcript starts empty. */
  consume() {
    const results = this.lastResults;
    const last = results[results.length - 1];
    if (last && !last.isFinal) {
      this.consumed = { results: results.length - 1, words: last.text.split(/\s+/).filter(Boolean).length };
    } else {
      this.consumed = { results: results.length, words: 0 };
    }
  }

  handleResult(event) {
    const list = event.results;
    const results = [];
    for (let i = 0; i < list.length; i += 1) results.push({ text: String(list[i][0]?.transcript ?? '').trim(), isFinal: !!list[i].isFinal });
    this.lastResults = results;
    this.networkErrors = 0;
    this.restarts = []; // a session that produces results is healthy
    const parts = [];
    for (let i = this.consumed.results; i < results.length; i += 1) {
      let text = results[i].text;
      if (i === this.consumed.results && this.consumed.words) text = text.split(/\s+/).slice(this.consumed.words).join(' ');
      if (text) parts.push(text);
    }
    const isFinal = results.length > 0 && results[results.length - 1].isFinal;
    this.h.onTranscript?.(parts.join(' ').trim(), isFinal);
  }

  handleError(code) {
    const { reason, fatal, silent } = classifySpeechError(code);
    if (reason === 'language' && this.langIndex < LANGS.length - 1) {
      this.langIndex += 1; // try the next Arabic locale
      this.rec = null;
      return;
    }
    if (reason === 'network' && ++this.networkErrors >= 3) {
      this.wanted = false;
      this.h.onError?.('network', true);
      return;
    }
    if (fatal) { this.wanted = false; this.h.onError?.(reason, true); return; }
    if (!silent) this.h.onError?.(reason, false);
  }

  handleEnd() {
    this.running = false;
    this.h.onSound?.(false);
    if (!this.wanted || this.pausedByTab) { if (!this.wanted) this.h.onState?.('stopped'); return; }
    // Restart, with a back-off; give up after too many restarts in a short window (broken engine).
    const now = Date.now();
    this.restarts = this.restarts.filter((t) => now - t < RESTART_WINDOW_MS);
    this.restarts.push(now);
    if (this.restarts.length > MAX_QUICK_RESTARTS) {
      this.wanted = false;
      this.h.onError?.('unstable', true);
      this.h.onState?.('stopped');
      return;
    }
    const delay = Math.min(2000, 100 * 2 ** Math.max(0, this.restarts.length - 2));
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.startSession(), delay);
  }
}
