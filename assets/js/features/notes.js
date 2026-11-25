// Ayah notes and collections («ملاحظاتي ومجموعاتي»): from the details panel of any ayah the visitor can file it
// in a collection (reflection, memorisation, review, Quranic supplications, or their own) and write a private
// note. A dialog lists them in Mushaf order, with filtering, search, opening in the Mushaf and a text export.
// Ayahs that have a note are marked in the reading view. Data: core/notes.js (key "ayahNotes", this device only).

import { h, localDateKey } from '../core/dom.js';
import { onLanguageChange, t } from '../core/i18n.js';
import { onDialogOpen } from '../core/modal.js';
import {
  BUILTIN_COLLECTIONS, MAX_NOTE, addCollection, collectionCounts, listNotes, loadNotes, noteFor, onNotesChange, removeNote, saveNote,
} from '../core/notes.js';
import { surahName } from '../core/quran.js';
import { toast } from '../core/toast.js';

let actions = { readSurah: () => {} };
const el = {};
let current = null; // { surah, ayah } of the ayah whose details are open
let renderedSurah = 0; // surah shown in the reading view

export const collectionLabel = (id) => (BUILTIN_COLLECTIONS.includes(id) ? t(`notes_col_${id}`) : String(id).replace(/^c:/, ''));

function collectionOptions(selected) {
  const data = loadNotes();
  return [...BUILTIN_COLLECTIONS, ...data.custom.map((c) => `c:${c}`)]
    .map((id) => h('option', { value: id, text: collectionLabel(id), selected: id === selected }));
}

// ------------------------------------------------------------------------- editor in the details panel
function renderEditor() {
  if (!el.form || !current) return;
  const existing = noteFor(current.surah, current.ayah);
  el.btn.textContent = existing ? t('notes_btn_edit', { col: collectionLabel(existing.collection) }) : t('notes_btn_add');
  el.btn.setAttribute('aria-expanded', String(!el.form.hidden));
  el.collection.replaceChildren(...collectionOptions(existing?.collection || 'reflect'));
  el.text.value = existing?.note || '';
  el.remove.hidden = !existing;
  renderCount();
}
function renderCount() { el.count.textContent = `${el.text.value.length}/${MAX_NOTE}`; }

function markAyahs(surah) {
  const data = loadNotes();
  for (const span of document.querySelectorAll('#readingText .ayah-span')) {
    const ayah = Number(span.dataset.index) + 1;
    const note = noteFor(surah, ayah, data);
    span.classList.toggle('has-note', !!note);
    if (note) span.dataset.collection = collectionLabel(note.collection);
    else delete span.dataset.collection;
  }
}

// -------------------------------------------------------------------------------------- dialog
function renderList() {
  if (!el.list) return;
  const data = loadNotes();
  const counts = collectionCounts(data);
  const selected = el.filter.value || 'all';
  el.filter.replaceChildren(
    h('option', { value: 'all', text: t('notes_all', { n: data.items.length }) }),
    ...[...BUILTIN_COLLECTIONS, ...data.custom.map((c) => `c:${c}`)].map((id) => h('option', { value: id, text: `${collectionLabel(id)} (${counts[id] || 0})` })),
  );
  el.filter.value = [...el.filter.options].some((o) => o.value === selected) ? selected : 'all';
  const items = listNotes({ collection: el.filter.value, query: el.search.value }, data);
  el.exportBtn.disabled = !data.items.length;
  if (!items.length) {
    el.list.replaceChildren(h('p', { class: 'muted center', text: t(data.items.length ? 'notes_no_match' : 'notes_empty') }));
    return;
  }
  el.list.replaceChildren(...items.map((item) => h('li', { class: 'note-item' },
    h('div', { class: 'note-head' },
      h('strong', { text: `${surahName(item.surah)} ﴿${item.ayah}﴾` }),
      h('span', { class: 'badge note-badge', text: collectionLabel(item.collection) })),
    item.note ? h('p', { class: 'note-text', text: item.note }) : null,
    h('div', { class: 'note-actions' },
      h('span', { class: 'small muted', text: item.updated }),
      h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('notes_open'), on: { click: () => { el.dialog.close(); actions.readSurah(item.surah, item.ayah - 1); } } }),
      h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('notes_delete'), attrs: { 'aria-label': t('notes_delete_label', { ref: `${surahName(item.surah)} ${item.ayah}` }) }, on: { click: () => { if (window.confirm(t('notes_delete_confirm'))) removeNote(item.surah, item.ayah); } } })))));
}

/** Plain-text export of the notes (Mushaf order, grouped by collection) for printing or sharing. */
export function notesAsText(data = loadNotes()) {
  const lines = [t('notes_title').replace(/^\S+\s/, ''), ''];
  const ids = [...BUILTIN_COLLECTIONS, ...data.custom.map((c) => `c:${c}`)];
  for (const id of ids) {
    const items = listNotes({ collection: id }, data);
    if (!items.length) continue;
    lines.push(`## ${collectionLabel(id)}`);
    for (const i of items) lines.push(`- ${surahName(i.surah)} (${i.surah}:${i.ayah})${i.note ? ` — ${i.note.replace(/\s+/g, ' ')}` : ''}`);
    lines.push('');
  }
  return lines.join('\n');
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h('a', { href: url, download: name, hidden: true });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export { download as downloadFile };

export function initNotes(handlers) {
  actions = { ...actions, ...handlers };
  Object.assign(el, {
    btn: document.getElementById('ayahNoteBtn'),
    form: document.getElementById('ayahNoteForm'),
    collection: document.getElementById('ayahNoteCollection'),
    text: document.getElementById('ayahNoteText'),
    count: document.getElementById('ayahNoteCount'),
    remove: document.getElementById('ayahNoteRemove'),
    newCol: document.getElementById('ayahNoteNewCol'),
    dialog: document.getElementById('notesModal'),
    list: document.getElementById('notesList'),
    filter: document.getElementById('notesFilter'),
    search: document.getElementById('notesSearch'),
    exportBtn: document.getElementById('notesExport'),
    colForm: document.getElementById('notesNewCollection'),
    colName: document.getElementById('notesNewCollectionName'),
  });
  el.text.maxLength = MAX_NOTE;

  document.addEventListener('ayahselect', (e) => {
    current = e.detail;
    el.form.hidden = true;
    renderEditor();
  });
  document.addEventListener('surahrendered', (e) => { renderedSurah = e.detail.surah; markAyahs(renderedSurah); });
  el.btn.addEventListener('click', () => {
    el.form.hidden = !el.form.hidden;
    renderEditor();
    if (!el.form.hidden) el.text.focus();
  });
  el.text.addEventListener('input', renderCount);
  el.newCol.addEventListener('click', () => {
    const name = window.prompt(t('notes_new_collection_prompt'));
    const id = name ? addCollection(name) : null;
    if (id) { el.collection.replaceChildren(...collectionOptions(id)); el.collection.value = id; }
  });
  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!current) return;
    if (saveNote(current.surah, current.ayah, { collection: el.collection.value, note: el.text.value.trim() }, localDateKey())) {
      toast(t('notes_saved', { col: collectionLabel(el.collection.value) }));
      el.form.hidden = true;
    } else toast(t('notes_save_failed'));
    renderEditor();
  });
  el.remove.addEventListener('click', () => {
    if (!current) return;
    removeNote(current.surah, current.ayah);
    el.form.hidden = true;
    toast(t('notes_removed'));
    renderEditor();
  });

  el.filter.addEventListener('change', renderList);
  el.search.addEventListener('input', renderList);
  el.exportBtn.addEventListener('click', () => download(`quran-notes-${localDateKey()}.txt`, notesAsText(), 'text/plain;charset=utf-8'));
  el.colForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = addCollection(el.colName.value);
    if (id) { el.colName.value = ''; toast(t('notes_collection_added', { col: collectionLabel(id) })); }
    renderList();
  });
  onDialogOpen('notesModal', renderList);
  onNotesChange(() => {
    renderList();
    if (renderedSurah) markAyahs(renderedSurah);
  });
  onLanguageChange(() => { renderEditor(); renderList(); });
}
