// Accessible dialogs built on the native <dialog> element:
// focus is moved into the dialog and trapped, Escape closes it, the page behind becomes inert,
// and focus returns to the control that opened it. Clicking the backdrop closes it (as before).
//
// Multi-page layout: feature dialogs that became pages carry `data-page-dialog` and live inside their page.
// They are shown in place (non-modal) by core/router.js while their page is visible; openDialog(id) for one
// of them navigates to that page instead (core/routes.js PAGE_DIALOGS), so every existing opener still works.

import { $, $$ } from './dom.js';

const openHooks = new Map();

export function onDialogOpen(id, fn) {
  openHooks.set(id, fn);
}

// Dialogs that were merged into another one keep working under their old id (e.g. "rosaryModal",
// now the «المسبحة» tab of Hisn al-Muslim): openDialog(oldId) runs the alias instead.
const aliases = new Map();
export function registerDialogAlias(id, fn) {
  aliases.set(id, fn);
}

// Page dialogs: id → route, and the navigation function (set by main.js once the router is ready).
const pageRoutes = new Map();
let goToPage = null;
let pageOf = () => null;
export function bindPageDialogs(map, navigate, currentPage) {
  for (const [id, route] of Object.entries(map)) pageRoutes.set(id, route);
  goToPage = navigate;
  pageOf = currentPage;
}

const isPageDialog = (dialog) => !!dialog?.hasAttribute?.('data-page-dialog');

/** Close every open modal dialog (the page dialogs stay as they are). */
export function closeModalDialogs() {
  for (const other of $$('dialog[open]')) if (!isPageDialog(other)) other.close();
}

/** Show a page dialog in place (called by the router when its page becomes visible). */
export function activatePageDialog(dialog, { refresh = false } = {}) {
  if (dialog.open) { if (refresh) openHooks.get(dialog.id)?.(dialog); return; }
  dialog.show();
  openHooks.get(dialog.id)?.(dialog);
}

export function deactivatePageDialog(dialog) {
  if (dialog.open) dialog.close();
}

export function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog && aliases.has(id)) return aliases.get(id)();
  if (isPageDialog(dialog) && goToPage && pageRoutes.has(id)) {
    if (pageOf() !== pageRoutes.get(id) || !dialog.open) goToPage(pageRoutes.get(id));
    else openHooks.get(id)?.(dialog); // already shown: refresh it, as re-opening the dialog used to
    return dialog;
  }
  if (!dialog || dialog.open) return dialog;
  // Only one dialog at a time (e.g. "Login" → "My profile" swaps dialogs).
  closeModalDialogs();
  dialog.showModal();
  document.documentElement.classList.add('has-dialog');
  openHooks.get(id)?.(dialog);
  const autofocus = $('[autofocus]', dialog);
  if (autofocus) autofocus.focus();
  return dialog;
}

export function closeDialog(id) {
  const dialog = typeof id === 'string' ? document.getElementById(id) : id;
  if (isPageDialog(dialog)) return; // a page stays open; leaving the page closes it
  if (dialog?.open) dialog.close();
}

export function initDialogs() {
  for (const dialog of $$('dialog')) {
    if (isPageDialog(dialog)) {
      dialog.addEventListener('cancel', (event) => event.preventDefault()); // Escape does not close a page
      continue;
    }
    dialog.addEventListener('click', (event) => {
      // A click whose target is the <dialog> itself landed on the backdrop.
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (!$$('dialog[open]').some((d) => !isPageDialog(d))) document.documentElement.classList.remove('has-dialog');
    });
  }
  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open]');
    if (opener) { event.preventDefault(); openDialog(opener.dataset.open); return; }
    const closer = event.target.closest('[data-close]');
    if (closer) closeDialog(closer.closest('dialog'));
  });
}
