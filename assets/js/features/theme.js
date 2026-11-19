// Dark-mode toggle (persisted under the original "theme" key).

import { KEYS, setString } from '../core/storage.js';

export function initTheme() {
  const button = document.getElementById('themeToggle');
  const icon = button.querySelector('.theme-icon');
  const root = document.documentElement;

  const render = () => {
    const dark = root.classList.contains('dark-mode');
    icon.textContent = dark ? '☀️' : '🌙';
    button.setAttribute('aria-pressed', String(dark));
  };

  button.addEventListener('click', () => {
    const dark = root.classList.toggle('dark-mode');
    setString(KEYS.theme, dark ? 'dark' : 'light');
    render();
  });
  render();
}
