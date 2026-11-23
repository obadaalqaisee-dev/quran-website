// Microphone manager for the memorisation lab.
//
// Speech recognition (Web Speech API) opens the microphone by itself; this module adds what it lacks:
//   * availability and permission detection before anything starts (Permissions API where supported);
//   * input-device listing and selection (labels appear only after permission is granted);
//   * a preflight getUserMedia() with echoCancellation / noiseSuppression / autoGainControl requested
//     ONLY when navigator.mediaDevices.getSupportedConstraints() says the browser supports them;
//   * a live input-level meter (AudioContext analyser), so the user can see the microphone works;
//   * complete cleanup: every track stopped and the AudioContext closed (no "recording" indicator left on).
//
// Nothing here records or uploads audio: the stream only feeds the level meter.

const PROCESSING = ['echoCancellation', 'noiseSuppression', 'autoGainControl'];

export const micSupported = () => !!(globalThis.navigator?.mediaDevices?.getUserMedia);

/** Constraints for getUserMedia, limited to what the browser reports it supports. */
export function buildAudioConstraints(deviceId = '', supported = null) {
  const caps = supported ?? (globalThis.navigator?.mediaDevices?.getSupportedConstraints?.() || {});
  const audio = {};
  for (const key of PROCESSING) if (caps[key]) audio[key] = { ideal: true };
  if (caps.channelCount) audio.channelCount = { ideal: 1 };
  if (deviceId && caps.deviceId !== false) audio.deviceId = { exact: deviceId };
  return { audio: Object.keys(audio).length ? audio : true, video: false };
}

/** 'granted' | 'denied' | 'prompt' | 'unknown' (Permissions API is missing in some browsers). */
export async function micPermission() {
  try {
    const status = await navigator.permissions.query({ name: 'microphone' });
    return status.state;
  } catch {
    return 'unknown';
  }
}

/** Classify a getUserMedia failure into a message key the interface can explain. */
export function classifyMediaError(err) {
  switch (err?.name) {
    case 'NotAllowedError': case 'PermissionDeniedError': case 'SecurityError': return 'denied';
    case 'NotFoundError': case 'DevicesNotFoundError': case 'OverconstrainedError': return 'no-device';
    case 'NotReadableError': case 'TrackStartError': case 'AbortError': return 'busy';
    default: return 'error';
  }
}

export class MicManager {
  constructor() {
    this.stream = null;
    this.context = null;
    this.analyser = null;
    this.raf = 0;
    this.deviceId = '';
    this.onLevel = null; // (0..1) => void
    this.onEnded = null; // () => void   (device unplugged, permission revoked)
  }

  get active() { return !!this.stream && this.stream.getAudioTracks().some((t) => t.readyState === 'live'); }

  /** Audio inputs. Without permission the browser hides labels; ids may be empty too. */
  async listInputs() {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      return all.filter((d) => d.kind === 'audioinput').map((d, i) => ({ id: d.deviceId, label: d.label || '', index: i }));
    } catch {
      return [];
    }
  }

  /**
   * Open the microphone. Resolves to { ok: true, settings } or { ok: false, reason }.
   * Any previous stream is released first (switching devices never leaks a track).
   */
  async open(deviceId = this.deviceId) {
    if (!micSupported()) return { ok: false, reason: 'unsupported' };
    if (globalThis.isSecureContext === false) return { ok: false, reason: 'insecure' };
    this.close();
    this.deviceId = deviceId || '';
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(buildAudioConstraints(this.deviceId));
    } catch (err) {
      // A remembered device that is no longer plugged in: retry with the default input.
      if (this.deviceId && classifyMediaError(err) === 'no-device') {
        this.deviceId = '';
        return this.open('');
      }
      this.stream = null;
      return { ok: false, reason: classifyMediaError(err) };
    }
    const [track] = this.stream.getAudioTracks();
    track?.addEventListener('ended', () => { this.close(); this.onEnded?.(); });
    this.startMeter();
    let settings = {};
    try { settings = track?.getSettings?.() || {}; } catch { /* optional */ }
    return { ok: true, settings };
  }

  startMeter() {
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctx || !this.stream) return;
    try {
      this.context = new Ctx();
      const source = this.context.createMediaStreamSource(this.stream);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);
      const data = new Uint8Array(this.analyser.fftSize);
      const loop = () => {
        if (!this.analyser) return;
        this.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const v of data) { const x = (v - 128) / 128; sum += x * x; }
        this.onLevel?.(Math.min(1, Math.sqrt(sum / data.length) * 4));
        this.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      this.analyser = null; // the meter is optional
    }
  }

  /** Release everything: tracks, analyser, AudioContext. Safe to call repeatedly. */
  close() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.analyser = null;
    if (this.context) { this.context.close().catch(() => {}); this.context = null; }
    if (this.stream) { for (const t of this.stream.getTracks()) t.stop(); this.stream = null; }
    this.onLevel?.(0);
  }
}
