// Sidebar navigation: every feature of the site, grouped by category (markup in index.html).
//
// * Desktop: always visible; can be collapsed to icons only (remembered on this device).
// * Tablet / mobile: an off-canvas panel opened by the ☰ button; Escape, the backdrop or choosing a page
//   closes it, and focus returns to the button. The page behind is inert while it is open.
// * Groups can be folded; the group holding the current page is always unfolded.
// * The current page's link carries aria-current="page".
// The old drawer's id ("sideMenu") still opens the navigation (registered as a dialog alias).

import { $, $$ } from '../core/dom.js';
import { onLanguageChange } from '../core/i18n.js';
import { closeModalDialogs, registerDialogAlias } from '../core/modal.js';
import { onRouteChange } from '../core/router.js';
import { activeRouteKey } from '../core/routes.js';
import { KEYS, getJSON, setJSON } from '../core/storage.js';

const el = {};
const mobile = () => window.matchMedia('(max-width: 1023px)').matches;

function loadState() {
  const raw = getJSON(KEYS.sidebar, null);
  return {
    collapsed: raw?.collapsed === true,
    groups: raw?.groups && typeof raw.groups === 'object' && !Array.isArray(raw.groups) ? raw.groups : {},
  };
}
let state = loadState();
const save = () => setJSON(KEYS.sidebar, state);

// ------------------------------------------------------------------ mobile panel
export function isSidebarOpen() { return document.documentElement.classList.contains('sidebar-open'); }

export function openSidebar() {
  if (!mobile()) { // on a wide screen the sidebar is always there: un-collapse it and focus it
    if (state.collapsed) setCollapsed(false);
    ($('.side-link[aria-current="page"]', el.sidebar) || $('.side-link', el.sidebar))?.focus();
    return el.sidebar;
  }
  closeModalDialogs();
  document.documentElement.classList.add('sidebar-open');
  el.backdrop.hidden = false;
  el.toggle.setAttribute('aria-expanded', 'true');
  for (const node of el.inertTargets) node.inert = true;
  ($('.side-link[aria-current="page"]', el.sidebar) || el.close).focus();
  return el.sidebar;
}

export function closeSidebar({ restoreFocus = true } = {}) {
  if (!isSidebarOpen()) return;
  document.documentElement.classList.remove('sidebar-open');
  el.backdrop.hidden = true;
  el.toggle.setAttribute('aria-expanded', 'false');
  for (const node of el.inertTargets) node.inert = false;
  if (restoreFocus) el.toggle.focus();
}

// ------------------------------------------------------------------ desktop collapse
function setCollapsed(collapsed) {
  state.collapsed = collapsed;
  document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
  el.collapse.setAttribute('aria-pressed', String(collapsed));
  save();
}

// ------------------------------------------------------------------ groups
function setGroup(group, open, { persist = true } = {}) {
  const button = $('.side-group-btn', group);
  const list = document.getElementById(button.getAttribute('aria-controls'));
  button.setAttribute('aria-expanded', String(open));
  list.hidden = !open;
  if (persist) { state.groups[group.dataset.group] = open; save(); }
}

// ------------------------------------------------------------------ active page
function highlight(parsed) {
  const links = $$('.side-link[data-route]', el.sidebar);
  const key = activeRouteKey(parsed, links.map((a) => a.dataset.route));
  for (const link of links) {
    if (link.dataset.route === key) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  const active = key ? links.find((a) => a.dataset.route === key) : null;
  const group = active?.closest('.side-group');
  if (group && $('.side-group-btn', group).getAttribute('aria-expanded') === 'false') setGroup(group, true, { persist: false });
}

/** Native tooltips with each label, for the icon-only (collapsed) sidebar. */
function labelTooltips() {
  for (const link of $$('.side-link', el.sidebar)) {
    const label = $('.side-label', link)?.textContent.trim();
    if (label) link.title = label;
  }
}

export function initSidebar() {
  Object.assign(el, {
    sidebar: document.getElementById('sidebar'),
    toggle: document.getElementById('sidebarToggle'),
    close: document.getElementById('sidebarClose'),
    collapse: document.getElementById('sidebarCollapse'),
    backdrop: document.getElementById('sidebarBackdrop'),
    inertTargets: [document.querySelector('.app-content'), document.getElementById('siteHeader')].filter(Boolean),
  });
  if (!el.sidebar) return;

  // The ☰ button keeps data-open="sideMenu" (the old drawer); the alias opens or closes the sidebar.
  registerDialogAlias('sideMenu', () => (isSidebarOpen() ? closeSidebar() : openSidebar()));
  el.close.addEventListener('click', () => closeSidebar());
  el.backdrop.addEventListener('click', () => closeSidebar());
  el.collapse.addEventListener('click', () => setCollapsed(!state.collapsed));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isSidebarOpen()) { event.preventDefault(); closeSidebar(); }
  });
  // Choosing anything in the panel closes it on small screens (dialog openers included).
  el.sidebar.addEventListener('click', (event) => {
    if (event.target.closest('.side-link') && mobile()) closeSidebar({ restoreFocus: false });
  });
  window.matchMedia('(max-width: 1023px)').addEventListener?.('change', () => closeSidebar({ restoreFocus: false }));

  for (const group of $$('.side-group', el.sidebar)) {
    const saved = state.groups[group.dataset.group];
    if (typeof saved === 'boolean') setGroup(group, saved, { persist: false });
    $('.side-group-btn', group).addEventListener('click', (event) => {
      setGroup(group, event.currentTarget.getAttribute('aria-expanded') !== 'true');
    });
  }
  setCollapsed(state.collapsed);
  labelTooltips();
  onLanguageChange(labelTooltips);
  onRouteChange((parsed) => { highlight(parsed); if (mobile()) closeSidebar({ restoreFocus: false }); });
}
