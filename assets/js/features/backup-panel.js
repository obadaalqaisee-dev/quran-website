// «نسخة احتياطية» in the profile dialog: save everything this site keeps on the device to a file, and restore
// it on another browser or after clearing site data. The file never leaves the device unless the visitor moves
// it. Validation (core/backup.js) only accepts the site's own keys; restoring merges and then reloads the page
// so every feature reads the restored data.

import { localDateKey } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { MAX_FILE_BYTES, applyBackup, backupFileName, buildBackup, parseBackup } from '../core/backup.js';
import { downloadFile } from './notes.js';

export function initBackupPanel() {
  const exportBtn = document.getElementById('backupExport');
  const input = document.getElementById('backupImport');
  const status = document.getElementById('backupStatus');
  if (!exportBtn || !input) return;

  exportBtn.addEventListener('click', () => {
    let storage;
    try { storage = window.localStorage; } catch { status.textContent = t('backup_unavailable'); return; }
    const backup = buildBackup(storage);
    const n = Object.keys(backup.data).length;
    if (!n) { status.textContent = t('backup_nothing'); return; }
    downloadFile(backupFileName(), JSON.stringify(backup, null, 1), 'application/json');
    status.textContent = t('backup_exported', { n, date: localDateKey() });
  });

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { status.textContent = t('backup_error_size'); return; }
    let text = '';
    try { text = await file.text(); } catch { status.textContent = t('backup_error_json'); return; }
    const result = parseBackup(text);
    if (!result.ok) { status.textContent = t(`backup_error_${result.error}`); return; }
    if (!window.confirm(t('backup_confirm', { n: result.entries.length }))) return;
    let storage;
    try { storage = window.localStorage; } catch { status.textContent = t('backup_unavailable'); return; }
    const written = applyBackup(storage, result.entries);
    status.textContent = t('backup_restored', { n: written });
    setTimeout(() => window.location.reload(), 900);
  });
}
