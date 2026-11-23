// Daily wird checklist (original key "dailyWird", one entry per day). The day now follows the
// visitor's local calendar instead of UTC.

import { $$, localDateKey } from '../core/dom.js';
import { onLanguageChange, t } from '../core/i18n.js';
import { KEYS, getJSON, setJSON } from '../core/storage.js';
import { toast } from '../core/toast.js';

const ITEMS = ['quran', 'morning', 'evening', 'prayer'];

function readAll() {
  const all = getJSON(KEYS.wird, {});
  return all && typeof all === 'object' && !Array.isArray(all) ? all : {};
}

export function getToday() {
  const all = readAll();
  const today = all[localDateKey()] || {};
  return Object.fromEntries(ITEMS.map((k) => [k, !!today[k]]));
}

export function setWird(item, done, { announce = true } = {}) {
  if (!ITEMS.includes(item)) return;
  const all = readAll();
  const key = localDateKey();
  all[key] = { ...getToday(), [item]: !!done };
  setJSON(KEYS.wird, all);
  renderWird();
  if (done && announce) toast(t('toast_wird'));
}

export function wirdPercent() {
  return Object.values(getToday()).filter(Boolean).length * 25;
}

export function renderWird() {
  const today = getToday();
  const done = Object.values(today).filter(Boolean).length;
  for (const box of $$('[data-wird]')) box.checked = today[box.dataset.wird];
  document.getElementById('wirdSummary').textContent = t('wird_summary', { done });
  document.getElementById('wirdProgressBar').style.width = `${done * 25}%`;
  document.getElementById('wirdProgress').setAttribute('aria-valuenow', String(done * 25));
  const stat = document.getElementById('profileWirdStat');
  if (stat) stat.textContent = `${done * 25}%`;
  document.dispatchEvent(new CustomEvent('wirdchange')); // lets the dashboard refresh
}

export function initWird() {
  for (const box of $$('[data-wird]')) {
    box.addEventListener('change', () => setWird(box.dataset.wird, box.checked));
  }
  onLanguageChange(renderWird);
  renderWird();
}
