// Client-side page switching for the multi-page layout (see core/routes.js for the route table).
//
// * One <section class="page" data-page="…"> is visible at a time; the others are `hidden`.
// * Navigation uses the location hash, so direct links, refresh, back/forward and the installed app's
//   shortcuts work on GitHub Pages, and the service worker keeps serving the same index.html offline.
// * Dialogs that became pages (`<dialog data-page-dialog>`) are shown in place (non-modal) while their page is
//   active, and closed when it is left, so their existing "open"/"close" behaviour (e.g. the memorisation lab
//   releasing the microphone) is unchanged.
// * Code that scrolls to an element on another page (e.g. readSurah() scrolling to the reader) reveals that
//   page first, through revealElement() (called by dom.js scrollIntoViewSmart).

import { $, $$ } from './dom.js';
import { activatePageDialog, closeModalDialogs, deactivatePageDialog } from './modal.js';
import { hashFor, parseHash } from './routes.js';

const listeners = new Set();
const actions = new Map();
let current = null; // name of the visible page
let lastHash = null;
let started = false;

export const currentPage = () => current;
export const currentRoute = () => parseHash(location.hash);

/** Subscribe to page changes: fn({ page, route, param, path }). */
export function onRouteChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** Run fn(param) whenever route `name` is entered (e.g. 'quran' with param '18', or 'tasbih'). */
export function registerRouteAction(name, fn) { actions.set(name, fn); }

function pageElement(name) {
  return document.querySelector(`.page[data-page="${CSS.escape(name)}"]`);
}

/**
 * Show a page. `scroll`: 'top' (normal navigation), 'keep' (revealing an element the caller scrolls to).
 * Returns true when the page exists.
 */
function showPage(name, { scroll = 'top', focus = false } = {}) {
  const target = pageElement(name) || pageElement('home');
  if (!target) return false;
  const changed = current !== target.dataset.page;
  for (const page of $$('.page')) {
    const active = page === target;
    if (page.hidden === active) page.hidden = !active;
    page.classList.toggle('is-active', active);
  }
  for (const dialog of $$('dialog[data-page-dialog]')) {
    if (target.contains(dialog)) activatePageDialog(dialog);
    else deactivatePageDialog(dialog);
  }
  current = target.dataset.page;
  document.documentElement.dataset.page = current;
  if (changed) {
    if (scroll === 'top') window.scrollTo({ top: 0, behavior: 'auto' });
    if (focus) {
      // Move focus to the new page for keyboard and screen-reader users (not on the first load).
      const heading = $('h1, h2', target);
      const into = heading || target;
      if (!into.hasAttribute('tabindex')) into.setAttribute('tabindex', '-1');
      into.focus({ preventScroll: true });
    }
  }
  return true;
}

function notify(parsed) {
  for (const fn of listeners) {
    try { fn(parsed); } catch (err) { console.error('[router] listener failed', err); }
  }
}

function apply({ initial = false } = {}) {
  const hash = location.hash;
  if (hash === lastHash && !initial) return;
  lastHash = hash;
  const parsed = parseHash(hash);
  closeModalDialogs();
  if (parsed.anchor) {
    // Legacy anchor ("#surahs", "#learnSection"…): show the page holding it, then scroll to it.
    const el = document.getElementById(parsed.anchor);
    const page = el?.closest('.page');
    showPage(page ? page.dataset.page : (current || 'home'), { scroll: 'keep', focus: !initial });
    if (el && !el.hidden) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
    notify({ page: current, route: current, param: null, path: current, anchor: parsed.anchor });
    return;
  }
  showPage(parsed.page, { scroll: 'top', focus: !initial });
  const action = actions.get(parsed.route) || (parsed.param ? actions.get(parsed.page) : null);
  if (action) {
    try { action(parsed.param, parsed); } catch (err) { console.error('[router] action failed', err); }
  }
  notify(parsed);
}

/** Go to a path ("quran/18", "settings", "" for home). Runs synchronously (callers can act right after). */
export function navigate(path = '') {
  const hash = hashFor(path);
  if (location.hash === hash || (hash === '#/' && !location.hash)) {
    lastHash = null; // same route again: re-run its action (e.g. open another surah)
    apply();
    return;
  }
  history.pushState(null, '', hash);
  apply();
}

/**
 * Make sure the page that contains `el` is visible (without scrolling to the top), and record it in the
 * history so the back button returns to where the visitor was.
 */
export function revealElement(el) {
  if (!started || !el?.closest) return;
  const page = el.closest('.page');
  if (!page || page.dataset.page === current) return;
  const hash = hashFor(page.dataset.page);
  history.pushState(null, '', hash);
  lastHash = hash;
  closeModalDialogs();
  showPage(page.dataset.page, { scroll: 'keep' });
  notify(parseHash(hash));
}

export function initRouter() {
  if (started) return;
  started = true;
  window.addEventListener('hashchange', () => apply());
  window.addEventListener('popstate', () => apply());
  apply({ initial: true });
}
