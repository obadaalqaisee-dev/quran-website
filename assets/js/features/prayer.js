// Prayer times (geolocation, falling back to Amman as before), Hijri date, next-prayer countdown,
// and prayer notifications: a warning within the last N minutes (10 by default, configurable in the
// settings) and one at prayer time, while the site is open.

import { getPrayerTimes } from '../core/api.js';
import { h, localDateKey, pad2 } from '../core/dom.js';
import { isArabic, locale, onLanguageChange, t } from '../core/i18n.js';
import { getSettings } from '../core/settings.js';
import { KEYS, getJSON, setJSON } from '../core/storage.js';
import { toast } from '../core/toast.js';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const notifyBeforeMin = () => getSettings().notifyBefore; // default 10, as the original

const state = { data: null, source: null, dateKey: null, timer: null, notified: new Set() };
const el = {};

export const prayerLabel = (key) => t(`prayer_${key.toLowerCase()}`);

/** "HH:MM" (24 h) → "hh:mm AM/PM" like the original. */
export function formatTime(hhmm) {
  if (!hhmm) return '--:--';
  const [hh, mm] = hhmm.split(':').map(Number);
  return `${pad2(hh % 12 || 12)}:${pad2(mm)} ${hh >= 12 ? 'PM' : 'AM'}`;
}

function at(hhmm, base = new Date()) {
  const [hh, mm] = hhmm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(hh, mm, 0, 0);
  return d;
}

export function nextPrayer(timings, now = new Date()) {
  if (!timings) return null;
  for (const key of PRAYERS) {
    const time = at(timings[key], now);
    if (time > now) return { key, time };
  }
  const time = at(timings.Fajr, now);
  time.setDate(time.getDate() + 1);
  return { key: 'Fajr', time };
}

function renderGrid() {
  if (!state.data) return;
  const next = nextPrayer(state.data.timings);
  el.grid.replaceChildren(...PRAYERS.map((key) => h('div', {
    class: `prayer-card${next?.key === key ? ' next' : ''}`,
    attrs: next?.key === key ? { 'aria-current': 'time' } : {},
  }, h('h3', { text: prayerLabel(key) }), h('p', { dir: 'ltr', text: formatTime(state.data.timings[key]) }))));
  document.dispatchEvent(new CustomEvent('prayerupdate')); // the home page's compact list follows the grid
}

function renderHeader() {
  if (state.source) el.location.textContent = t(state.source === 'geo' ? 'prayer_loc_current' : 'prayer_loc_default');
  const hijri = state.data?.hijri;
  if (hijri) {
    el.hijri.textContent = `${hijri.day} ${isArabic() ? hijri.month_ar : hijri.month_en} ${hijri.year} ${t('hijri_suffix')}`;
  } else {
    try {
      el.hijri.textContent = new Intl.DateTimeFormat(`${locale()}-u-ca-islamic`, { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    } catch { /* Intl calendar unsupported */ }
  }
}

function tick() {
  if (!state.data) return;
  if (localDateKey() !== state.dateKey) { load(); return; } // a new day: refresh times
  const n = nextPrayer(state.data.timings);
  const diff = Math.max(0, n.time - new Date());
  const sec = Math.floor(diff / 1000);
  el.nextName.textContent = prayerLabel(n.key);
  el.nextTime.textContent = formatTime(state.data.timings[n.key]);
  el.countdown.textContent = `${pad2(Math.floor(sec / 3600))}:${pad2(Math.floor((sec % 3600) / 60))}:${pad2(sec % 60)}`;
  if (sec === 0 || diff % 60000 < 1000) renderGrid(); // keep the "next" highlight correct
  maybeNotify(n, sec);
}

// ---------------------------------------------------------------- notifications
const notificationsEnabled = () => getJSON(KEYS.notify, false) === true
  && 'Notification' in window && Notification.permission === 'granted';

async function showNotification(body) {
  const title = t('notify_title');
  const options = { body, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/favicon-32.png', lang: locale(), tag: 'prayer' };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification(title, options); return; }
  } catch { /* fall back to the page API */ }
  try { new Notification(title, options); } catch { /* ignore */ }
}

// Browsers throttle timers in background tabs (to about once a minute), so notifications must not
// depend on a tick landing in a narrow window:
//  * "before": sent once, at any moment within the last notifyBeforeMin() minutes, stating the
//    real number of minutes left (e.g. when notifications are enabled 4 minutes before a prayer);
//  * "now": sent when the upcoming prayer changes because the previous one's time has passed.
function maybeNotify(next, secondsLeft) {
  const previous = state.lastNext;
  state.lastNext = next;
  if (!notificationsEnabled()) return;
  if (previous && previous.time.getTime() !== next.time.getTime() && previous.time <= new Date()
      && Date.now() - previous.time < 5 * 60 * 1000) {
    const key = `${localDateKey(previous.time)}:${previous.key}:now`;
    if (!state.notified.has(key)) {
      state.notified.add(key);
      showNotification(t('notify_now', { prayer: prayerLabel(previous.key) }));
    }
  }
  const before = `${localDateKey(next.time)}:${next.key}:before`;
  if (secondsLeft > 0 && secondsLeft <= notifyBeforeMin() * 60 && !state.notified.has(before)) {
    state.notified.add(before);
    showNotification(t('notify_before', { min: Math.ceil(secondsLeft / 60), prayer: prayerLabel(next.key) }));
  }
}

export function renderNotifyButton(button) {
  const on = notificationsEnabled();
  button.textContent = on ? t('notify_enabled_state') : t('profile_notify_btn');
  button.setAttribute('aria-pressed', String(on));
}

export async function requestPrayerNotifications(button) {
  if (!('Notification' in window)) { toast(t('toast_notify_unsupported')); return; }
  if (notificationsEnabled()) { // second press turns them off
    setJSON(KEYS.notify, false);
    renderNotifyButton(button);
    return;
  }
  const permission = await Notification.requestPermission();
  setJSON(KEYS.notify, permission === 'granted');
  toast(permission === 'granted' ? t('toast_notify_granted') : t('toast_notify_denied'));
  renderNotifyButton(button);
}

// ---------------------------------------------------------------- loading
function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('unsupported')); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: +pos.coords.latitude.toFixed(4), longitude: +pos.coords.longitude.toFixed(4) }),
      reject,
      { timeout: 10000, maximumAge: 30 * 60 * 1000 },
    );
  });
}

async function load({ useLocation = true } = {}) {
  state.dateKey = localDateKey();
  let coords = null;
  if (useLocation) {
    try { coords = await getPosition(); } catch { coords = null; }
  }
  try {
    state.data = await getPrayerTimes(coords);
    state.source = coords ? 'geo' : 'default';
  } catch {
    if (coords) { // location lookup failed upstream: fall back to the default city, as the original did
      try { state.data = await getPrayerTimes(null); state.source = 'default'; } catch { state.data = null; }
    }
  }
  el.locate.hidden = state.source !== 'default' || !navigator.geolocation;
  if (!state.data) {
    el.grid.replaceChildren(h('div', { class: 'error-state' }, h('p', { text: t('prayer_error') }),
      h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('btn_retry'), on: { click: () => load() } })));
    el.nextName.textContent = '--';
    return;
  }
  renderHeader();
  renderGrid();
  tick();
  clearInterval(state.timer);
  state.timer = setInterval(tick, 1000);
}

export function initPrayer() {
  Object.assign(el, {
    grid: document.getElementById('prayerGrid'),
    location: document.getElementById('prayerLocation'),
    hijri: document.getElementById('hijriDateDisplay'),
    nextName: document.getElementById('nextPrayerName'),
    nextTime: document.getElementById('nextPrayerTime'),
    countdown: document.getElementById('prayerCountdown'),
    locate: document.getElementById('prayerLocateBtn'),
  });
  el.locate.addEventListener('click', () => load({ useLocation: true }));
  renderHeader();
  onLanguageChange(() => { renderHeader(); renderGrid(); tick(); });
  load();
}

/** Next prayer for the dashboard: { key, time } or null while loading. */
export const upcomingPrayer = () => (state.data ? nextPrayer(state.data.timings) : null);

/** Today's timings and Hijri date as loaded for the prayer page ({ timings, hijri }), or null while loading. */
export const prayerData = () => state.data;
export const PRAYER_KEYS = PRAYERS;

export const _prayerState = state; // for tests
