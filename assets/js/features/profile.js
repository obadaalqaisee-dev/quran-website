// Local profile (name, goal), statistics, data reset and prayer notifications.
// Everything stays on this device, exactly as in the original.

import { t } from '../core/i18n.js';
import { closeDialog, onDialogOpen } from '../core/modal.js';
import { KEYS, RESETTABLE, getJSON, remove, setJSON } from '../core/storage.js';
import { toast } from '../core/toast.js';
import { getFavorites } from './favorites.js';
import { renderNotifyButton, requestPrayerNotifications } from './prayer.js';
import { renderWird, wirdPercent } from './wird.js';

export function initProfile({ onReset }) {
  const name = document.getElementById('profileName');
  const goal = document.getElementById('profileGoal');
  const notifyBtn = document.getElementById('notifyBtn');

  const fill = () => {
    const p = getJSON(KEYS.profile, {}) || {};
    name.value = typeof p.name === 'string' ? p.name : '';
    goal.value = typeof p.goal === 'string' ? p.goal : '';
    document.getElementById('profileWirdStat').textContent = `${wirdPercent()}%`;
    document.getElementById('profileFavStat').textContent = String(getFavorites().length);
    renderNotifyButton(notifyBtn);
  };
  onDialogOpen('profileModal', fill);

  document.getElementById('profileForm').addEventListener('submit', (event) => {
    event.preventDefault();
    setJSON(KEYS.profile, { name: name.value.trim().slice(0, 60), goal: goal.value.trim().slice(0, 120) });
    toast(t('toast_profile_save'));
    closeDialog('profileModal');
  });

  document.getElementById('resetLocalData').addEventListener('click', () => {
    if (!window.confirm(t('reset_confirm'))) return;
    for (const key of RESETTABLE) remove(key);
    renderWird();
    onReset();
    fill();
    toast(t('toast_reset'));
  });

  notifyBtn.addEventListener('click', () => requestPrayerNotifications(notifyBtn));
}

export function welcome() {
  const p = getJSON(KEYS.profile, {}) || {};
  if (typeof p.name === 'string' && p.name.trim()) toast(t('toast_welcome', { name: p.name.trim() }));
}
