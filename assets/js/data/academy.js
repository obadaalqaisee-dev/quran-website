// Quran Learning Academy — structured courses built from the site's own content.
// Same content policy as prayer-lessons.js. Completing a course is personal progress only: it is not a
// licence (ijazah) and does not qualify anyone to teach; the interface says so.

import { LESSONS } from './prayer-lessons.js';

const q = (ref, expect, note) => ({ type: 'quran', ref, expect, note });
const hadith = (text, source, search, note) => ({ type: 'hadith', text, source, search, note });
const p = (text) => ({ type: 'p', text });
const ul = (items) => ({ type: 'ul', items });
const tip = (text) => ({ type: 'note', text });
const action = (label, target) => ({ type: 'action', label, target });

const TAJWEED_NOTE = 'التجويد علم يؤخذ بالتلقي والمشافهة من قارئ متقن؛ هذه الدروس تعريف بالقواعد الأساسية على رواية حفص عن عاصم، ولا تغني عن القراءة على معلم.';

/** Lessons written for the academy (prayer lessons are reused by id). */
export const ACADEMY_LESSONS = [
  // ---------------------------------------------------------------- memorisation
  {
    id: 'memo-method', icon: '🧠',
    title: { ar: 'منهج عملي للحفظ', en: 'A practical memorisation method', es: 'Un método práctico de memorización', fr: 'Une méthode pratique de mémorisation' },
    blocks: [
      ul([
        'حدد وِردًا يوميًا ثابتًا ولو قليلًا (خمس آيات مثلاً)، فالقليل الدائم خير من الكثير المنقطع.',
        'اقرأ الآيات من مصحف واحد، واستمع إليها من قارئ متقن قبل حفظها.',
        'كرر الآية حتى تحفظها، ثم اربطها بما قبلها قبل الانتقال إلى ما بعدها.',
        'سمّع ما حفظت في مختبر التسميع أو على شخص آخر.',
        'راجع القديم قبل حفظ الجديد؛ فالمراجعة هي التي تثبّت الحفظ.',
      ]),
      hadith('«أحبّ الأعمال إلى الله أدومها وإن قلّ»', 'متفق عليه', 'أحب الأعمال إلى الله أدومها وإن قل'),
      q('54:17', 'يسرنا', 'تيسير القرآن للذكر.'),
      action('افتح مختبر الحفظ', 'lab'),
    ],
    quiz: [{ q: 'أيهما أولى في المنهج المذكور؟', options: ['حفظ كثير في يوم ثم انقطاع', 'ورد يومي ثابت ولو قليل'], answer: 1, explain: 'المداومة على القليل خير من الكثير المنقطع.' }],
  },
  {
    id: 'memo-revision', icon: '🔄',
    title: { ar: 'المراجعة وتثبيت الحفظ', en: 'Revision', es: 'El repaso', fr: 'La révision' },
    blocks: [
      p('في تبويب «خطتي وتقدمي» داخل مختبر الحفظ، تُجدوَل كل سورة أتممت تسميعها لمراجعتها بعد 1 ثم 3 ثم 7 ثم 14 ثم 30 ثم 60 يومًا. إذا راجعتها دون أخطاء انتقلت إلى المدة التالية، وإن أخطأت عادت خطوة.'),
      hadith('«تعاهدوا هذا القرآن، فوالذي نفس محمد بيده لهو أشدّ تفلّتًا من الإبل في عُقُلها»', 'متفق عليه', 'تعاهدوا هذا القرآن فوالذي نفس محمد بيده لهو أشد تفلتا'),
      action('افتح خطتي وتقدمي', 'plan'),
    ],
    quiz: [{ q: 'ماذا يحدث لموعد مراجعة سورة راجعتها بلا أخطاء؟', options: ['يعود إلى يوم واحد', 'ينتقل إلى المدة التالية الأطول', 'يُلغى'], answer: 1, explain: 'المراجعة الناجحة تنقل السورة إلى المدة التالية.' }],
  },
  // ---------------------------------------------------------------- recitation & tajweed
  {
    id: 'tajweed-intro', icon: '📘',
    title: { ar: 'مدخل إلى التجويد', en: 'Introduction to tajweed', es: 'Introducción al tajwid', fr: 'Introduction au tajwid' },
    blocks: [
      tip(TAJWEED_NOTE),
      p('التجويد لغةً: التحسين. واصطلاحًا: إخراج كل حرف من مخرجه وإعطاؤه حقه ومستحقه من الصفات.'),
      q('73:4', 'ترتيلا', 'الأمر بترتيل القرآن.'),
      p('ومن أهم أبوابه: مخارج الحروف وصفاتها، وأحكام النون الساكنة والتنوين، وأحكام الميم الساكنة، والمدود، والوقف والابتداء.'),
    ],
    quiz: [{ q: 'ما معنى التجويد لغةً؟', options: ['الإسراع', 'التحسين', 'الحفظ'], answer: 1, explain: 'التجويد لغةً التحسين.' }],
  },
  {
    id: 'tajweed-noon', icon: '🔤',
    title: { ar: 'أحكام النون الساكنة والتنوين', en: 'Rules of noon sakinah and tanween', es: 'Reglas de nun sakina y tanwin', fr: 'Règles du noun sakina et du tanwin' },
    blocks: [
      tip(TAJWEED_NOTE),
      ul([
        'الإظهار الحلقي: إذا جاء بعدها أحد حروف الحلق الستة (ء هـ ع ح غ خ)، مثل: ﴿مَنْ آمَنَ﴾.',
        'الإدغام: إذا جاء بعدها أحد حروف «يرملون»؛ بغنة مع (ي ن م و) وبغير غنة مع (ل ر)، مثل: ﴿مِن لَّدُنْهُ﴾. ويُستثنى ما كان في كلمة واحدة مثل «الدنيا».',
        'الإقلاب: إذا جاء بعدها حرف الباء، تُقلب ميمًا مخفاة بغنة، مثل: ﴿مِن بَعْدِ﴾.',
        'الإخفاء الحقيقي: مع بقية الحروف الخمسة عشر، مثل: ﴿مِن قَبْلِ﴾.',
      ]),
    ],
    quiz: [
      { q: 'ما حكم النون الساكنة إذا جاء بعدها حرف الباء؟', options: ['إظهار', 'إقلاب', 'إدغام'], answer: 1, explain: 'تُقلب النون الساكنة أو التنوين ميمًا عند الباء.' },
      { q: 'كم عدد حروف الإظهار الحلقي؟', options: ['أربعة', 'ستة', 'خمسة عشر'], answer: 1, explain: 'ستة: الهمزة والهاء والعين والحاء والغين والخاء.' },
    ],
  },
  {
    id: 'tajweed-meem', icon: '🔡',
    title: { ar: 'أحكام الميم الساكنة', en: 'Rules of meem sakinah', es: 'Reglas de mim sakina', fr: 'Règles du mim sakina' },
    blocks: [
      tip(TAJWEED_NOTE),
      ul([
        'الإخفاء الشفوي: إذا جاء بعدها الباء، مثل: ﴿تَرْمِيهِم بِحِجَارَةٍ﴾.',
        'إدغام المثلين الصغير: إذا جاء بعدها ميم، مثل: ﴿لَهُم مَّا﴾.',
        'الإظهار الشفوي: مع بقية الحروف، وهو أشدّ إذا جاء بعدها الواو أو الفاء.',
      ]),
    ],
    quiz: [{ q: 'ما حكم الميم الساكنة إذا جاء بعدها ميم؟', options: ['إظهار شفوي', 'إدغام مثلين صغير', 'إخفاء شفوي'], answer: 1, explain: 'تُدغم الميم في الميم مع الغنة.' }],
  },
  {
    id: 'tajweed-madd', icon: '〰️',
    title: { ar: 'المدود', en: 'Prolongation (madd)', es: 'La prolongación (madd)', fr: 'La prolongation (madd)' },
    blocks: [
      tip(TAJWEED_NOTE),
      ul([
        'المد الطبيعي: حرف مد لا يأتي بعده همز ولا سكون، ويُمد حركتين.',
        'المد المتصل: حرف مد بعده همز في كلمة واحدة، مثل ﴿جَاءَ﴾، ويُمد أربع أو خمس حركات (لحفص من طريق الشاطبية).',
        'المد المنفصل: حرف مد في آخر كلمة وهمز في أول التي بعدها، مثل ﴿بِمَا أُنزِلَ﴾، ويُمد أربع أو خمس حركات (لحفص من طريق الشاطبية).',
        'المد اللازم: حرف مد بعده سكون أصلي، مثل ﴿الضَّالِّينَ﴾، ويُمد ست حركات.',
      ]),
    ],
    quiz: [{ q: 'كم حركة يُمد المد اللازم؟', options: ['حركتان', 'أربع', 'ست'], answer: 2, explain: 'المد اللازم يُمد ست حركات.' }],
  },
  // ---------------------------------------------------------------- basics
  {
    id: 'basics-islam', icon: '🕋',
    title: { ar: 'أركان الإسلام', en: 'The pillars of Islam', es: 'Los pilares del islam', fr: 'Les piliers de l’islam' },
    blocks: [
      hadith('«بُني الإسلام على خمس: شهادة أن لا إله إلا الله وأن محمدًا رسول الله، وإقام الصلاة، وإيتاء الزكاة، والحج، وصوم رمضان»', 'متفق عليه (من حديث ابن عمر رضي الله عنهما)', 'بني الإسلام على خمس'),
      ul(['الشهادتان.', 'إقام الصلاة.', 'إيتاء الزكاة.', 'صوم رمضان.', 'حج البيت لمن استطاع إليه سبيلًا.']),
      q('3:97', 'استطاع', 'دليل الحج لمن استطاع.'),
    ],
    quiz: [{ q: 'كم عدد أركان الإسلام؟', options: ['ثلاثة', 'خمسة', 'ستة'], answer: 1, explain: 'أركان الإسلام خمسة.' }],
  },
  {
    id: 'basics-iman', icon: '💚',
    title: { ar: 'أركان الإيمان', en: 'The pillars of faith', es: 'Los pilares de la fe', fr: 'Les piliers de la foi' },
    blocks: [
      hadith('في حديث جبريل عليه السلام: «أن تؤمن بالله، وملائكته، وكتبه، ورسله، واليوم الآخر، وتؤمن بالقدر خيره وشره»', 'رواه مسلم', 'أن تؤمن بالله وملائكته وكتبه ورسله واليوم الآخر'),
      q('2:285', 'ورسله', 'من أدلة أركان الإيمان.'),
    ],
    quiz: [{ q: 'كم عدد أركان الإيمان في حديث جبريل؟', options: ['خمسة', 'ستة', 'سبعة'], answer: 1, explain: 'ستة: الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر.' }],
  },
  // ---------------------------------------------------------------- daily practice
  {
    id: 'daily-adhkar', icon: '📿',
    title: { ar: 'أذكار الصباح والمساء', en: 'Morning and evening adhkar', es: 'Adhkar de la mañana y la tarde', fr: 'Adhkar du matin et du soir' },
    blocks: [
      q('33:41', 'اذكروا', 'الأمر بكثرة الذكر.'),
      p('تجد أذكار الصباح والمساء والنوم وبعد الصلاة في «حصن المسلم» داخل الموقع، مع عدّاد لكل ذكر. وعند إتمام أذكار الصباح أو المساء تُعلَّم تلقائيًا في وردك اليومي.'),
      action('افتح حصن المسلم', 'adhkar'),
    ],
    quiz: [{ q: 'أين تجد عدّاد أذكار الصباح في الموقع؟', options: ['في حصن المسلم', 'في مواقيت الصلاة'], answer: 0, explain: 'حصن المسلم يحتوي الأذكار مع عدّاد لكل ذكر.' }],
  },
  {
    id: 'daily-wird', icon: '📖',
    title: { ar: 'الورد اليومي من القرآن', en: 'A daily portion of the Quran', es: 'Una porción diaria del Corán', fr: 'Une portion quotidienne du Coran' },
    blocks: [
      p('حدد هدفًا يوميًا لعدد الآيات من «الإعدادات»، وتابع تقدمك في لوحة «رحلتي اليومية». تُحسب الآية مقروءة عندما تظهر على شاشتك في وضع القراءة.'),
      q('73:20', 'تيسر', 'فاقرءوا ما تيسر من القرآن.'),
      action('افتح الإعدادات', 'settings'),
    ],
    quiz: [{ q: 'متى تُحسب الآية مقروءة في الموقع؟', options: ['عند ظهورها على الشاشة في وضع القراءة', 'عند فتح الموقع فقط'], answer: 0, explain: 'تُحسب الآية عند ظهورها في وضع القراءة.' }],
  },
];

const prayerIds = LESSONS.map((l) => l.id);

export const COURSES = [
  {
    id: 'prayer', icon: '🕌',
    title: { ar: 'تعليم الصلاة', en: 'Prayer education', es: 'Educación de la oración', fr: 'Apprendre la prière' },
    objectives: { ar: 'أن تعرف شروط الصلاة وأركانها وواجباتها وسننها، وتؤدي الصلوات الخمس على الصفة الصحيحة، وتعرف أحكام السهو والسفر والجماعة.', en: 'Know the conditions, pillars, obligations and sunnahs of prayer; perform the five prayers correctly; know the rulings of forgetfulness, travel and congregation.' },
    lessons: prayerIds,
  },
  {
    id: 'memorization', icon: '🧠',
    title: { ar: 'حفظ القرآن', en: 'Quran memorisation', es: 'Memorización del Corán', fr: 'Mémorisation du Coran' },
    objectives: { ar: 'أن تبني عادة حفظ يومية ثابتة، وتستعمل مختبر التسميع وجدول المراجعة لتثبيت ما تحفظ.', en: 'Build a steady daily memorisation habit and use the recitation lab and revision schedule to retain it.' },
    lessons: ['memo-method', 'memo-revision'],
  },
  {
    id: 'tajweed', icon: '📘',
    title: { ar: 'أساسيات التجويد', en: 'Tajweed fundamentals', es: 'Fundamentos del tajwid', fr: 'Fondamentaux du tajwid' },
    objectives: { ar: 'أن تتعرف على القواعد الأساسية للتجويد: أحكام النون الساكنة والتنوين، والميم الساكنة، والمدود.', en: 'Learn the basic rules of tajweed: noon sakinah and tanween, meem sakinah, and madd.' },
    lessons: ['tajweed-intro', 'tajweed-noon', 'tajweed-meem', 'tajweed-madd'],
  },
  {
    id: 'basics', icon: '🕋',
    title: { ar: 'أساسيات المعرفة الإسلامية', en: 'Basic Islamic knowledge', es: 'Conocimientos islámicos básicos', fr: 'Connaissances islamiques de base' },
    objectives: { ar: 'أن تعرف أركان الإسلام وأركان الإيمان وأدلتها.', en: 'Know the pillars of Islam and of faith, with their evidence.' },
    lessons: ['basics-islam', 'basics-iman'],
  },
  {
    id: 'daily', icon: '🌱',
    title: { ar: 'العبادات اليومية', en: 'Daily Islamic practice', es: 'Práctica islámica diaria', fr: 'Pratique islamique quotidienne' },
    objectives: { ar: 'أن تحافظ على الأذكار والورد اليومي مستعينًا بأدوات الموقع.', en: 'Keep up the daily adhkar and Quran portion with the site’s tools.' },
    lessons: ['daily-adhkar', 'daily-wird'],
  },
];

/** Find a lesson by id, prayer curriculum or academy. */
export function findLesson(id) {
  return LESSONS.find((l) => l.id === id) || ACADEMY_LESSONS.find((l) => l.id === id) || null;
}
