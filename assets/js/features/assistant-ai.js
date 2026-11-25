// Optional on-device language model for the site assistant («✨ الإجابة الذكية»).
//
// * Runs entirely in the visitor's browser with WebGPU (WebLLM, self-hosted in assets/vendor). No question and no
//   answer is ever sent to a server; the only downloads are the model files, once, after the visitor agrees.
// * The model only rephrases the verified passages the assistant's search already found (core/assistant.js:
//   buildPrompt). Its answer is filtered (guardAnswer: no Quran quotation that is not in the sources), labelled as
//   machine-written, and always shown above the sources themselves, which remain the reference.
// * Off by default. Devices without WebGPU keep the assistant exactly as it was.

import { buildPrompt, guardAnswer, looksBroken } from '../core/assistant.js';
import { KEYS, getJSON, setJSON } from '../core/storage.js';

// q4f16 needs the GPU's 'shader-f16' feature; q4f32 variants run on GPUs without it (more memory).
export const MODELS = Object.freeze({
  standard: { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', sizeMB: 900 },
  light: { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', sizeMB: 300 },
  standard32: { id: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC', sizeMB: 1000 },
  light32: { id: 'Qwen2.5-0.5B-Instruct-q4f32_1-MLC', sizeMB: 350 },
});
const LIB = '../../vendor/web-llm-0.2.86/index.js';
const WORKER = '../../workers/llm-worker.js';

const state = { status: 'off', engine: null, progress: 0, error: '', loading: null };
const listeners = new Set();
export const onAIChange = (fn) => listeners.add(fn);
const emit = () => { for (const fn of listeners) fn({ ...state }); };
export const aiState = () => ({ ...state });

let gpu = null;
/** WebGPU present and an adapter obtainable (the model cannot run without it); remembers 16-bit float support. */
export async function aiSupported() {
  try {
    if (!globalThis.navigator?.gpu) return false;
    const adapter = await navigator.gpu.requestAdapter();
    if (adapter) gpu = { f16: adapter.features?.has?.('shader-f16') === true };
    return !!adapter;
  } catch { return false; }
}

/** The lighter model on devices that report 4 GB of memory or less; a 32-bit variant on GPUs without f16. */
export function chooseModel({ deviceMemory = globalThis.navigator?.deviceMemory, f16 = gpu ? gpu.f16 : true } = {}) {
  const light = Number(deviceMemory) > 0 && Number(deviceMemory) <= 4;
  if (f16) return light ? MODELS.light : MODELS.standard;
  return light ? MODELS.light32 : MODELS.standard32;
}

export const aiPreference = () => {
  const p = getJSON(KEYS.assistantAI, null);
  return p && typeof p === 'object' && p.enabled === true ? p : null;
};

async function createEngine(modelId, onProgress) {
  // Tests replace the engine; nothing else defines this.
  if (typeof globalThis.__assistantEngineFactory === 'function') return globalThis.__assistantEngineFactory(modelId, onProgress);
  const lib = await import(LIB);
  const worker = new Worker(new URL(WORKER, import.meta.url), { type: 'module' });
  return lib.CreateWebWorkerMLCEngine(worker, modelId, { initProgressCallback: onProgress });
}

/** Load (downloading the first time) and keep the engine ready. Resolves true when ready. */
export function enableAI(model = chooseModel()) {
  if (state.status === 'ready') return Promise.resolve(true);
  if (state.loading) return state.loading;
  state.status = 'loading';
  state.progress = 0;
  state.error = '';
  emit();
  state.loading = (async () => {
    try {
      state.engine = await createEngine(model.id, (report) => {
        state.progress = Math.max(state.progress, Math.round((Number(report?.progress) || 0) * 100));
        emit();
      });
      state.status = 'ready';
      setJSON(KEYS.assistantAI, { enabled: true, model: model.id });
      return true;
    } catch (err) {
      state.status = 'error';
      state.error = String(err?.message || err).slice(0, 200);
      state.engine = null;
      return false;
    } finally {
      state.loading = null;
      emit();
    }
  })();
  return state.loading;
}

/** Turn off and free memory; with `deleteFiles`, also remove the downloaded model from the browser's storage. */
export async function disableAI({ deleteFiles = false } = {}) {
  const pref = aiPreference();
  try { await state.engine?.unload?.(); } catch { /* already gone */ }
  state.engine = null;
  state.status = 'off';
  setJSON(KEYS.assistantAI, { enabled: false });
  if (deleteFiles && pref?.model && typeof globalThis.__assistantEngineFactory !== 'function') {
    try { const lib = await import(LIB); await lib.deleteModelAllInfoInCache(pref.model); } catch { /* nothing cached */ }
  }
  emit();
}

/**
 * Answer a question from verified sources, streaming the text through onText(text). Returns the final guarded
 * text. Throws if the engine is not ready.
 */
export async function answerFromSources(question, sources, { lang = 'ar', onText = () => {} } = {}) {
  if (state.status !== 'ready' || !state.engine) throw new Error('not ready');
  const messages = buildPrompt(question, sources, lang);
  const stream = await state.engine.chat.completions.create({ messages, stream: true, temperature: 0.2, max_tokens: 380 });
  let raw = '';
  for await (const chunk of stream) {
    raw += chunk?.choices?.[0]?.delta?.content || '';
    if (looksBroken(raw, lang)) {
      // Gibberish (e.g. a GPU that computes incorrectly): stop and never show it.
      try { await state.engine.interruptGenerate?.(); } catch { /* already finished */ }
      throw new Error('broken output');
    }
    onText(guardAnswer(raw, sources).text);
  }
  const final = guardAnswer(raw, sources);
  onText(final.text);
  return final;
}
