// «تعلم الصلاة الصحيحة» (prayer curriculum with a visual step-by-step tutorial, scholars and sources)
// and the Quran Learning Academy (courses). Progress is stored on this device under a new key.
//
// Quran citations are rendered from the verified Quran text (core/api.js getSurah), never typed in.
// Remote text is inserted with textContent only (h()).

import { getSurah } from '../core/api.js';
import { stripBasmala } from '../core/arabic.js';
import { $, delegateActions, h, localDateKey } from '../core/dom.js';
import { getLang, isArabic, onLanguageChange, t } from '../core/i18n.js';
import { closeDialog, onDialogOpen, openDialog } from '../core/modal.js';
import { surahName } from '../core/quran.js';
import { KEYS, getJSON, setJSON } from '../core/storage.js';
import { toast } from '../core/toast.js';
import { ACADEMY_LESSONS, COURSES, findLesson } from '../data/academy.js';
import { LESSONS, LESSON_SOURCE_NOTE, POSTURES, allQuestions, dorarSearch } from '../data/prayer-lessons.js';
import { SCHOLARS, VERIFY_TOOLS } from '../data/scholar-resources.js';

// ----------------------------------------------------------------------------- progress store
export function loadLearning() {
  const raw = getJSON(KEYS.learning, null);
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  return { lessons: obj(raw?.lessons), quizzes: obj(raw?.quizzes), resources: obj(raw?.resources), step: Number(raw?.step) || 0 };
}
const saveLearning = (data) => setJSON(KEYS.learning, data);

const listeners = new Set();
export const onLearningChange = (fn) => listeners.add(fn);
function changed() { for (const fn of listeners) fn(); renderAll(); }

export function learningStats() {
  const data = loadLearning();
  const prayerDone = LESSONS.filter((l) => data.lessons[l.id]).length;
  const allIds = [...new Set(COURSES.flatMap((c) => c.lessons))];
  const totalDone = allIds.filter((id) => data.lessons[id]).length;
  const coursesDone = COURSES.filter((c) => c.lessons.every((id) => data.lessons[id])).length;
  return { prayerDone, prayerTotal: LESSONS.length, totalDone, total: allIds.length, coursesDone, courses: COURSES.length };
}

// ----------------------------------------------------------------------------- helpers
const loc = (obj) => (obj ? obj[getLang()] ?? obj.en ?? obj.ar : '');
let actions = { readSurah: () => {}, openLab: () => {}, openPlan: () => {}, openSettings: () => {} };

function quranBlock(block) {
  const [s, a] = block.ref.split(':').map(Number);
  const text = h('p', { class: 'cite-text', lang: 'ar', dir: 'rtl', text: '…' });
  const ref = h('button', {
    class: 'cite-ref', type: 'button', text: `${surahName(s)} ﴿${a}﴾`,
    on: { click: () => { closeDialog('lessonModal'); actions.readSurah(s, a - 1); } },
    attrs: { 'aria-label': `${t('learn_open_in_mushaf')}: ${surahName(s)} ${a}` },
  });
  getSurah(s).then((data) => {
    const ayah = data.ayahs.find((x) => x.numberInSurah === a);
    text.textContent = ayah ? `﴿${stripBasmala(ayah.text, s, a)}﴾` : t('learn_quran_unavailable');
  }).catch(() => { text.textContent = t('learn_quran_unavailable'); });
  return h('figure', { class: 'cite cite--quran' }, text, h('figcaption', {}, ref, block.note ? h('span', { class: 'muted small', text: ` — ${block.note}` }) : null));
}

function hadithBlock(block) {
  return h('figure', { class: 'cite cite--hadith' },
    h('p', { class: 'cite-text', lang: 'ar', dir: 'rtl', text: block.text }),
    h('figcaption', {},
      h('strong', { text: block.source }),
      block.note ? h('span', { class: 'muted small', text: ` — ${block.note}` }) : null,
      ' ',
      h('a', {
        href: dorarSearch(block.search), target: '_blank', rel: 'noopener noreferrer', class: 'cite-link',
        text: t('learn_verify_hadith'),
      })));
}

function stepper(from = 0, to = POSTURES.length - 1, { remember = false } = {}) {
  const steps = POSTURES.slice(from, to + 1);
  let i = remember ? Math.min(loadLearning().step, steps.length - 1) : 0;
  const img = h('img', { width: 240, height: 200, decoding: 'async', loading: 'lazy' });
  const title = h('h4', { class: 'stepper-title' });
  const desc = h('p', { class: 'stepper-desc' });
  const counter = h('span', { class: 'stepper-count small muted' });
  const dots = h('div', { class: 'stepper-dots', attrs: { role: 'group', 'aria-label': t('learn_steps_label') } });
  const prev = h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('learn_prev') });
  const next = h('button', { class: 'btn btn-primary btn-small', type: 'button', text: t('learn_next') });
  const live = h('div', { class: 'stepper-text', attrs: { 'aria-live': 'polite' } }, counter, title, desc);
  function show(k) {
    i = Math.max(0, Math.min(steps.length - 1, k));
    const step = steps[i];
    img.src = step.img;
    img.alt = loc(step.title);
    title.textContent = `${i + 1}. ${loc(step.title)}`;
    desc.textContent = isArabic() ? step.ar : (step[getLang()] || step.en);
    desc.lang = isArabic() ? 'ar' : (step[getLang()] ? getLang() : 'en');
    counter.textContent = t('learn_step_of', { n: i + 1, total: steps.length });
    prev.disabled = i === 0;
    next.disabled = i === steps.length - 1;
    for (const [k2, d] of [...dots.children].entries()) d.setAttribute('aria-current', String(k2 === i));
    if (remember) { const data = loadLearning(); data.step = i; saveLearning(data); }
  }
  dots.replaceChildren(...steps.map((s, k) => h('button', {
    type: 'button', class: 'stepper-dot', attrs: { 'aria-label': `${k + 1}. ${loc(s.title)}` },
    on: { click: () => show(k) },
  })));
  prev.addEventListener('click', () => show(i - 1));
  next.addEventListener('click', () => show(i + 1));
  const root = h('div', { class: 'stepper', attrs: { role: 'region', 'aria-roledescription': 'carousel', 'aria-label': t('learn_tutorial_title') } },
    h('figure', { class: 'stepper-figure' }, img),
    h('div', { class: 'stepper-body' }, live, h('div', { class: 'stepper-nav' }, prev, next), dots));
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const forward = (e.key === 'ArrowLeft') === (document.documentElement.dir === 'rtl');
    show(i + (forward ? 1 : -1));
  });
  show(i);
  return root;
}

function renderBlock(block) {
  switch (block.type) {
    case 'p': return h('p', { text: block.text });
    case 'ul': return h('ul', { class: 'lesson-list' }, ...block.items.map((x) => h('li', { text: x })));
    case 'ol': return h('ol', { class: 'lesson-list lesson-list--ordered' }, ...block.items.map((x) => h('li', { text: x })));
    case 'note': return h('p', { class: 'note', text: block.text });
    case 'diff': return h('aside', { class: 'diff-box' }, h('strong', { text: t('learn_diff_title') }), h('p', { text: block.text }));
    case 'quran': return quranBlock(block);
    case 'hadith': return hadithBlock(block);
    case 'tutorial': return stepper(block.from, block.to);
    case 'facts': return h('dl', { class: 'facts' }, ...block.items.flatMap(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })]));
    case 'action': return h('p', {}, h('button', {
      class: 'btn btn-soft btn-small', type: 'button', text: block.label,
      on: { click: () => { closeDialog('lessonModal'); ({ lab: actions.openLab, plan: actions.openPlan, adhkar: () => openDialog('adhkarModal'), settings: actions.openSettings })[block.target]?.(); } },
    }));
    default: return null;
  }
}

// ----------------------------------------------------------------------------- quiz
function quizView(lessonId, questions) {
  const box = h('section', { class: 'quiz', attrs: { 'aria-labelledby': `quiz-${lessonId}` } },
    h('h3', { id: `quiz-${lessonId}`, text: t('learn_quiz_title') }));
  let answered = 0;
  let correct = 0;
  const result = h('p', { class: 'quiz-result', attrs: { role: 'status' } });
  questions.forEach((item, qi) => {
    const fb = h('p', { class: 'quiz-feedback small', attrs: { 'aria-live': 'polite' } });
    const buttons = item.options.map((opt, oi) => h('button', {
      type: 'button', class: 'quiz-option', text: opt, dataset: { q: qi, o: oi },
      on: {
        click: (e) => {
          const group = e.currentTarget.parentElement;
          if (group.dataset.done) return;
          group.dataset.done = '1';
          const ok = oi === item.answer;
          answered += 1;
          if (ok) correct += 1;
          for (const b of group.children) {
            b.disabled = true;
            if (Number(b.dataset.o) === item.answer) b.classList.add('is-correct');
          }
          if (!ok) e.currentTarget.classList.add('is-wrong');
          fb.textContent = `${ok ? t('learn_quiz_right') : t('learn_quiz_wrong')} ${item.explain}`;
          fb.className = `quiz-feedback small ${ok ? 'ok' : 'bad'}`;
          if (answered === questions.length) {
            const data = loadLearning();
            data.quizzes[lessonId] = { score: correct, total: questions.length, date: localDateKey() };
            saveLearning(data);
            result.textContent = t('learn_quiz_score', { score: correct, total: questions.length });
            changed();
          }
        },
      },
    }));
    box.append(h('fieldset', { class: 'quiz-q' },
      h('legend', { text: `${qi + 1}. ${item.q}` }),
      h('div', { class: 'quiz-options' }, ...buttons), fb));
  });
  const prev = loadLearning().quizzes[lessonId];
  if (prev) result.textContent = t('learn_quiz_previous', { score: prev.score, total: prev.total });
  box.append(result);
  return box;
}

// ----------------------------------------------------------------------------- lesson dialog
let current = null;

export function openLesson(id) {
  const lesson = findLesson(id);
  if (!lesson) return;
  current = id;
  const body = $('#lessonBody');
  $('#lessonTitle').textContent = `${lesson.icon} ${loc(lesson.title)}`;
  const parts = [];
  if (!isArabic()) parts.push(h('p', { class: 'note', text: t('learn_arabic_only') }));
  const content = h('div', { class: 'lesson-content prose', lang: 'ar', dir: 'rtl' }, ...lesson.blocks.map(renderBlock).filter(Boolean));
  parts.push(content);
  if (LESSONS.includes(lesson) && lesson.category !== 'quiz') parts.push(h('p', { class: 'small muted', lang: 'ar', dir: 'rtl', text: LESSON_SOURCE_NOTE }));
  const questions = lesson.quiz === 'all' ? allQuestions() : lesson.quiz;
  if (questions?.length) parts.push(quizView(id, questions));
  const related = SCHOLARS.flatMap((s) => s.resources.filter((r) => r.topic === id).map((r) => ({ r, s })));
  if (related.length) {
    parts.push(h('section', { class: 'related' }, h('h3', { text: t('learn_related_resources') }),
      h('ul', { class: 'resource-list' }, ...related.map(({ r, s }) => resourceItem(r, s)))));
  }
  body.replaceChildren(...parts);
  renderLessonButton();
  openDialog('lessonModal');
  body.scrollTop = 0;
}

function renderLessonButton() {
  const done = !!loadLearning().lessons[current];
  const btn = $('#lessonDone');
  btn.textContent = done ? t('learn_done_state') : t('learn_mark_done');
  btn.setAttribute('aria-pressed', String(done));
}

// ----------------------------------------------------------------------------- course dialog
function openCourse(id) {
  const course = COURSES.find((c) => c.id === id);
  if (!course) return;
  const data = loadLearning();
  const done = course.lessons.filter((l) => data.lessons[l]).length;
  $('#courseTitle').textContent = `${course.icon} ${loc(course.title)}`;
  const fill = h('span');
  fill.style.width = `${Math.round((done / course.lessons.length) * 100)}%`;
  $('#courseBody').replaceChildren(
    h('h3', { class: 'small', text: t('academy_objectives') }),
    h('p', { text: loc(course.objectives) }),
    h('div', { class: 'progress', attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(course.lessons.length), 'aria-valuenow': String(done), 'aria-label': t('academy_progress') } }, fill),
    h('p', { class: 'small muted', text: t('academy_progress_text', { done, total: course.lessons.length }) }),
    done === course.lessons.length ? h('p', { class: 'badge badge--ok', text: t('academy_completed') }) : null,
    h('ol', { class: 'course-lessons' }, ...course.lessons.map((lid) => {
      const lesson = findLesson(lid);
      const quiz = data.quizzes[lid];
      return h('li', {},
        h('button', { type: 'button', class: 'course-lesson', dataset: { action: 'lesson', id: lid } },
          h('span', { attrs: { 'aria-hidden': 'true' }, text: lesson.icon }),
          h('span', { class: 'course-lesson-title', text: loc(lesson.title) }),
          h('span', { class: `status-pill${data.lessons[lid] ? ' is-done' : ''}`, text: data.lessons[lid] ? t('learn_status_done') : t('learn_status_todo') }),
          quiz ? h('span', { class: 'small muted', text: ` ${quiz.score}/${quiz.total}` }) : null));
    })),
    h('p', { class: 'note', text: t('academy_disclaimer') }),
  );
  openDialog('courseModal');
}

// ----------------------------------------------------------------------------- page rendering
function resourceItem(r, scholar) {
  const status = t(`learn_status_${r.status}`);
  const visited = loadLearning().resources[r.id];
  return h('li', { class: 'resource' },
    h('span', { class: 'resource-kind', attrs: { 'aria-hidden': 'true' }, text: { video: '🎬', site: '🌐', book: '📚' }[r.kind] || '🔗' }),
    h('div', {},
      h('a', {
        href: r.url, target: '_blank', rel: 'noopener noreferrer', text: loc(r.title),
        dataset: { resource: r.id },
      }),
      h('p', { class: 'small muted' },
        scholar ? `${loc(scholar.name)} · ` : '',
        h('span', { class: `status-pill status-pill--${r.status}`, text: status }),
        visited ? h('span', { class: 'status-pill is-done', text: t('learn_visited') }) : null)));
}

function renderLessons() {
  const data = loadLearning();
  $('#lessonGrid').replaceChildren(...LESSONS.map((l, i) => h('button', {
    type: 'button', class: `lesson-card${data.lessons[l.id] ? ' is-done' : ''}`, dataset: { action: 'lesson', id: l.id },
  },
  h('span', { class: 'lesson-num', text: String(i + 1) }),
  h('span', { class: 'lesson-icon', attrs: { 'aria-hidden': 'true' }, text: l.icon }),
  h('strong', { text: loc(l.title) }),
  h('small', { text: loc(l.summary) }),
  h('span', { class: `status-pill${data.lessons[l.id] ? ' is-done' : ''}`, text: data.lessons[l.id] ? t('learn_status_done') : t('learn_status_todo') }))));
  const { prayerDone, prayerTotal } = learningStats();
  $('#learnProgressText').textContent = t('learn_progress', { done: prayerDone, total: prayerTotal });
  $('#learnProgressBar').style.width = `${Math.round((prayerDone / prayerTotal) * 100)}%`;
  $('#learnProgress').setAttribute('aria-valuenow', String(Math.round((prayerDone / prayerTotal) * 100)));
}

function renderScholars() {
  $('#scholarGrid').replaceChildren(...SCHOLARS.map((s) => h('article', { class: 'scholar-card' },
    h('h3', { text: loc(s.name) }),
    s.years ? h('p', { class: 'small muted', text: s.years }) : null,
    h('p', { class: 'scholar-bio', text: isArabic() ? s.bio.ar : s.bio.en }),
    h('ul', { class: 'resource-list' }, ...s.resources.map((r) => resourceItem(r, null))))));
  $('#verifyTools').replaceChildren(...VERIFY_TOOLS.map((v) => h('li', {}, h('a', { href: v.url, target: '_blank', rel: 'noopener noreferrer', text: loc(v.title) }))));
}

function renderCourses() {
  const data = loadLearning();
  $('#courseGrid').replaceChildren(...COURSES.map((c) => {
    const done = c.lessons.filter((l) => data.lessons[l]).length;
    const fill = h('span');
    fill.style.width = `${Math.round((done / c.lessons.length) * 100)}%`;
    return h('button', { type: 'button', class: 'course-card', dataset: { action: 'course', id: c.id } },
      h('span', { class: 'tool-icon', attrs: { 'aria-hidden': 'true' }, text: c.icon }),
      h('strong', { text: loc(c.title) }),
      h('small', { text: t('academy_lessons_count', { n: c.lessons.length }) }),
      h('span', { class: 'progress progress--thin', attrs: { 'aria-hidden': 'true' } }, fill),
      h('small', { class: 'muted', text: done === c.lessons.length ? t('academy_completed') : t('academy_progress_text', { done, total: c.lessons.length }) }));
  }));
}

function renderAll() {
  renderLessons();
  renderCourses();
  renderScholars();
}

export function initLearn(handlers) {
  actions = { ...actions, ...handlers };
  $('#postureTutorial').replaceChildren(stepper(0, POSTURES.length - 1, { remember: true }));
  const section = $('#learnSection');
  delegateActions(section, { lesson: (el) => openLesson(el.dataset.id) });
  delegateActions($('#academySection'), { course: (el) => openCourse(el.dataset.id) });
  delegateActions($('#courseModal'), { lesson: (el) => openLesson(el.dataset.id) });
  // Remember which external resources were opened (learning progress for the sources panel).
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-resource]');
    if (!a) return;
    const data = loadLearning();
    data.resources[a.dataset.resource] = localDateKey();
    saveLearning(data);
  });
  $('#lessonDone').addEventListener('click', () => {
    if (!current) return;
    const data = loadLearning();
    if (data.lessons[current]) delete data.lessons[current];
    else { data.lessons[current] = localDateKey(); toast(t('learn_marked_done')); }
    saveLearning(data);
    renderLessonButton();
    changed();
  });
  onDialogOpen('courseModal', () => {});
  onLanguageChange(() => {
    $('#postureTutorial').replaceChildren(stepper(0, POSTURES.length - 1, { remember: true }));
    renderAll();
    if (current && $('#lessonModal').open) openLesson(current);
  });
  renderAll();
}

/** Searchable index of lessons (used by the Islamic search). */
export function lessonIndex() {
  return [...LESSONS, ...ACADEMY_LESSONS].map((l) => ({
    id: l.id, icon: l.icon, title: l.title,
    text: [l.title.ar, l.title.en, ...(l.blocks || []).flatMap((b) => [b.text, ...(b.items || []), b.note].filter(Boolean)),
      ...(l.blocks || []).filter((b) => b.type === 'facts').flatMap((b) => b.items.flat())].join(' '),
  }));
}
