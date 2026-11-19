// Electronic rosary: tap (or Enter/Space) to count, vibration feedback, reset. The count now
// survives a page reload.

import { KEYS, getJSON, setJSON } from '../core/storage.js';

export function initRosary() {
  const counter = document.getElementById('rosaryCounter');
  let count = Number(getJSON(KEYS.rosary, 0)) || 0;
  const render = () => { counter.textContent = String(count); };

  counter.addEventListener('click', () => {
    count += 1;
    setJSON(KEYS.rosary, count);
    render();
    if (navigator.vibrate) navigator.vibrate(50);
  });
  document.getElementById('rosaryReset').addEventListener('click', () => {
    count = 0;
    setJSON(KEYS.rosary, 0);
    render();
  });
  render();
}
