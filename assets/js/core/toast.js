// Non-blocking notifications, announced to screen readers through a polite live region.

let timer;

export function toast(message, { duration = 2800 } = {}) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.classList.add('is-visible');
  clearTimeout(timer);
  timer = setTimeout(() => {
    el.classList.remove('is-visible');
    setTimeout(() => { el.hidden = true; }, 250);
  }, duration);
}
