// Small DOM helpers. Remote text is only ever inserted through textContent
// (h() children / setText) — never through innerHTML.

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/**
 * Create an element. `props` keys: class, text, html (trusted static markup only),
 * dataset, attrs, on (event map), and any DOM property (e.g. type, value, disabled).
 * Children may be nodes or strings (strings become text nodes).
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'attrs') for (const [a, v] of Object.entries(value)) { if (v !== false && v != null) el.setAttribute(a, v === true ? '' : v); }
    else if (key === 'on') for (const [evt, fn] of Object.entries(value)) el.addEventListener(evt, fn);
    else el[key] = value;
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function setText(target, text) {
  const el = typeof target === 'string' ? $(target) : target;
  if (el) el.textContent = text;
}

/** Delegate clicks on [data-action] elements to handlers: { actionName(el, event) }. */
export function delegateActions(root, handlers) {
  root.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (!el || !root.contains(el)) return;
    const handler = handlers[el.dataset.action];
    if (handler) handler(el, event);
  });
}

export function debounce(fn, wait = 150) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
}

export const pad2 = (n) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD (the original used UTC, which reset the wird at the wrong time). */
export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function scrollIntoViewSmart(el, block = 'start') {
  el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block });
}
