// Accessible dialogs built on the native <dialog> element:
// focus is moved into the dialog and trapped, Escape closes it, the page behind becomes inert,
// and focus returns to the control that opened it. Clicking the backdrop closes it (as before).

import { $, $$ } from './dom.js';

const openHooks = new Map();

export function onDialogOpen(id, fn) {
  openHooks.set(id, fn);
}

export function openDialog(id) {
  const dialog = document.getElementById(id);
  if (!dialog || dialog.open) return dialog;
  // Only one dialog at a time (e.g. "Login" → "My profile" swaps dialogs).
  for (const other of $$('dialog[open]')) if (other !== dialog) other.close();
  dialog.showModal();
  document.documentElement.classList.add('has-dialog');
  openHooks.get(id)?.(dialog);
  const autofocus = $('[autofocus]', dialog);
  if (autofocus) autofocus.focus();
  return dialog;
}

export function closeDialog(id) {
  const dialog = typeof id === 'string' ? document.getElementById(id) : id;
  if (dialog?.open) dialog.close();
}

export function initDialogs() {
  for (const dialog of $$('dialog')) {
    dialog.addEventListener('click', (event) => {
      // A click whose target is the <dialog> itself landed on the backdrop.
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (!$('dialog[open]')) document.documentElement.classList.remove('has-dialog');
    });
  }
  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-open]');
    if (opener) { event.preventDefault(); openDialog(opener.dataset.open); return; }
    const closer = event.target.closest('[data-close]');
    if (closer) closeDialog(closer.closest('dialog'));
  });
}
