// Scholars and learning resources shown in «تعلم الصلاة الصحيحة».
//
// Honesty rules (docs/evolution_audit.md §4):
//   status 'existing' — the link was already published on this site before this change; kept unchanged.
//   status 'official' — the scholar's foundation / official website (home page only, no deep link).
//   status 'search'   — a SEARCH on a public platform, built from the lesson title. It is labelled as a
//                       search, because no specific video/page could be verified while writing this.
// No statement is quoted from a scholar here, and nothing implies that a scholar endorses this site.
// A link that has not been checked from a live browser is marked `checked: false`; the link checker
// (backend/scripts/check_links.py) re-verifies them wherever the network allows it.

const yt = (query) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

export const SCHOLARS = [
  {
    id: 'uthaymeen',
    name: { ar: 'الشيخ محمد بن صالح العثيمين', en: 'Sheikh Muhammad ibn Salih al-Uthaymeen', es: 'Sheij Muhammad ibn Salih al-Uthaymin', fr: 'Cheikh Muhammad ibn Salih al-Uthaymin' },
    years: '1347–1421 هـ',
    bio: {
      ar: 'من كبار علماء المملكة العربية السعودية، وعضو هيئة كبار العلماء. درّس في عنيزة وفي جامعة الإمام محمد بن سعود الإسلامية. من أشهر مؤلفاته في الفقه «الشرح الممتع على زاد المستقنع»، الذي يعتمد عليه هذا المنهج في تقسيم أحكام الصلاة.',
      en: 'A leading Saudi scholar and member of the Council of Senior Scholars, who taught in Unaizah and at Imam Muhammad ibn Saud Islamic University. His best-known fiqh work, “al-Sharh al-Mumti‘ ‘ala Zad al-Mustaqni‘”, is the basis of this course’s classification of the rulings of prayer.',
    },
    resources: [
      { id: 'uth-site', kind: 'site', status: 'official', checked: false, url: 'https://binothaimeen.net/', title: { ar: 'الموقع الرسمي لمؤسسة الشيخ محمد بن صالح العثيمين الخيرية', en: 'Official website of the Sheikh Muhammad ibn Salih al-Uthaymeen Charitable Foundation' }, topic: 'all' },
      { id: 'uth-sifah', kind: 'video', status: 'search', checked: false, url: yt('ابن عثيمين صفة الصلاة'), title: { ar: 'دروس «صفة الصلاة» للشيخ — بحث في يوتيوب', en: '“Description of the prayer” lessons — YouTube search' }, topic: 'steps' },
      { id: 'uth-sahw', kind: 'video', status: 'search', checked: false, url: yt('ابن عثيمين سجود السهو'), title: { ar: 'شرح أحكام سجود السهو — بحث في يوتيوب', en: 'Prostration of forgetfulness — YouTube search' }, topic: 'sahw' },
      { id: 'uth-mumti', kind: 'book', status: 'search', checked: false, url: yt('الشرح الممتع كتاب الصلاة ابن عثيمين'), title: { ar: '«الشرح الممتع» — كتاب الصلاة (دروس صوتية) — بحث', en: '“al-Sharh al-Mumti‘”, Book of Prayer (audio lessons) — search' }, topic: 'pillars' },
    ],
  },
  {
    id: 'khamees',
    name: { ar: 'الشيخ عثمان الخميس', en: 'Sheikh Othman Al-Khamees', es: 'Sheij Uthman al-Jamis', fr: 'Cheikh Othman al-Khamees' },
    years: '',
    bio: {
      ar: 'داعية وعالم كويتي معاصر، له دروس كثيرة منشورة في العقيدة والفقه والحديث. الفيديو أدناه كان منشورًا في هذا الموقع من قبل، وأُبقي كما هو.',
      en: 'A contemporary Kuwaiti scholar and preacher with many published lessons in creed, fiqh and hadith. The video below was already published on this site and is kept as it was.',
    },
    resources: [
      { id: 'kham-video', kind: 'video', status: 'existing', checked: false, url: 'https://www.youtube.com/watch?v=W-jX2kY0vR8', title: { ar: 'شرح مرئي عملي لصفة صلاة النبي ﷺ', en: 'Practical video on the Prophet’s ﷺ prayer' }, topic: 'steps' },
      { id: 'kham-search', kind: 'video', status: 'search', checked: false, url: yt('عثمان الخميس صفة صلاة النبي'), title: { ar: 'دروس الشيخ في صفة الصلاة — بحث في يوتيوب', en: 'The sheikh’s lessons on the prayer — YouTube search' }, topic: 'steps' },
    ],
  },
  {
    id: 'binbaz',
    name: { ar: 'الشيخ عبد العزيز بن باز', en: 'Sheikh Abdulaziz ibn Baz', es: 'Sheij Abdulaziz ibn Baz', fr: 'Cheikh Abdelaziz ibn Baz' },
    years: '1330–1420 هـ',
    bio: {
      ar: 'مفتي عام المملكة العربية السعودية سابقًا ورئيس هيئة كبار العلماء. له رسالة مشهورة في «كيفية صلاة النبي ﷺ».',
      en: 'Former Grand Mufti of Saudi Arabia and head of the Council of Senior Scholars, author of a well-known treatise on “How the Prophet ﷺ prayed”.',
    },
    resources: [
      { id: 'baz-site', kind: 'site', status: 'official', checked: false, url: 'https://binbaz.org.sa/', title: { ar: 'الموقع الرسمي لسماحة الشيخ ابن باز', en: 'Official website of Sheikh Ibn Baz' }, topic: 'all' },
      { id: 'baz-kayfiyya', kind: 'book', status: 'search', checked: false, url: yt('ابن باز كيفية صلاة النبي'), title: { ar: 'رسالة «كيفية صلاة النبي ﷺ» — بحث', en: '“How the Prophet ﷺ prayed” — search' }, topic: 'steps' },
    ],
  },
];

/** Tools to verify a hadith and its grading (search pages of established hadith encyclopaedias). */
export const VERIFY_TOOLS = [
  { id: 'dorar', status: 'search', url: 'https://dorar.net/hadith', title: { ar: 'الموسوعة الحديثية — الدرر السنية', en: 'Hadith encyclopaedia — Dorar.net' } },
  { id: 'sunnah', status: 'search', url: 'https://sunnah.com/', title: { ar: 'Sunnah.com (بالعربية والإنجليزية)', en: 'Sunnah.com (Arabic and English)' } },
];
