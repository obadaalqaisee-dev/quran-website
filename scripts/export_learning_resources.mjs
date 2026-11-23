#!/usr/bin/env node
// Export assets/js/data/scholar-resources.js to backend/app/data/learning_resources.json (the backend
// serves it at /api/v1/learning/resources with provenance). Run after editing the frontend file, then
// update backend/app/data/checksums.json (the script prints the new hash).
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { SCHOLARS, VERIFY_TOOLS } from '../assets/js/data/scholar-resources.js';

const resources = SCHOLARS.flatMap((s, si) => s.resources.map((r, ri) => ({
  id: r.id, scholar: s.id, scholar_name_ar: s.name.ar, scholar_name_en: s.name.en, kind: r.kind, status: r.status,
  checked: r.checked, url: r.url, title_ar: r.title.ar, title_en: r.title.en, topic: r.topic, position: si * 100 + ri,
}))).concat(VERIFY_TOOLS.map((v, i) => ({
  id: v.id, scholar: null, scholar_name_ar: null, scholar_name_en: null, kind: 'tool', status: v.status,
  checked: false, url: v.url, title_ar: v.title.ar, title_en: v.title.en, topic: 'all', position: 900 + i,
})));
const body = `${JSON.stringify({ source: 'assets/js/data/scholar-resources.js', resources }, null, 1)}\n`;
const out = new URL('../backend/app/data/learning_resources.json', import.meta.url);
writeFileSync(out, body);
console.log(`learning_resources.json: ${resources.length} resources, sha256 ${createHash('sha256').update(body).digest('hex')}`);
