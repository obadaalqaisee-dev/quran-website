// «رحلتي مع القرآن» — Quran Journey learning paths.
//
// Each path connects tools the site already has (the reader, tafsir, reciters, the memorisation lab, the prayer
// curriculum, the academy, Hisn al-Muslim…) into ordered steps. A step has:
//   id                       stable identifier (stored in the visitor's progress; never rename)
//   title / body             { ar, en } (other interface languages fall back to English)
//   list                     optional { ar: [], en: [] } bullet points
//   widget                   optional built-in content: 'letters' (the Arabic alphabet), 'harakat', 'shahada'
//   quiz                     optional [{ q: {ar,en}, options: {ar:[],en:[]}, answer }] (checked in the page)
//   actions                  buttons: [{ label: {ar,en}, do: { route | surah+ayah | listen | lab | lesson | dialog | tasbih | ask } }]
//   auto                     optional: the step completes itself from existing data
//                            ('lesson:<id>', 'memo:any', 'memo:surah:<n>', 'notes:any', 'read:any', 'listen:any')
//
// Content rules (as for the rest of the site): Quran text is never typed here, only references that the reader
// opens from the verified dataset; hadith are cited by collection and number; nothing here is a fatwa.

const s = (ar, en) => ({ ar, en });

export const JOURNEY_PATHS = [
  // ------------------------------------------------------------------------------------------ 1. reading
  {
    id: 'read', icon: '🔤',
    title: { ar: 'تعلّم قراءة القرآن', en: 'Learn to read the Quran', es: 'Aprender a leer el Corán', fr: 'Apprendre à lire le Coran' },
    desc: s('من الحروف العربية والحركات إلى قراءة قصار السور مع الاستماع إلى قارئ متقن.', 'From the Arabic letters and vowel marks to reading the short surahs while listening to a skilled reciter.'),
    steps: [
      {
        id: 'letters', widget: 'letters',
        title: s('الحروف العربية', 'The Arabic letters'),
        body: s('يُكتب القرآن بالحروف العربية الثمانية والعشرين، من اليمين إلى اليسار. تتغير صورة الحرف قليلًا حسب موضعه في الكلمة (أولها أو وسطها أو آخرها). تأمل الحروف وأسماءها، وردّدها بصوتك.',
          'The Quran is written with the 28 Arabic letters, from right to left. A letter’s shape changes slightly with its position in the word (beginning, middle or end). Look at the letters and their names, and say them aloud.'),
      },
      {
        id: 'harakat', widget: 'harakat',
        title: s('الحركات والسكون والشدة', 'Vowel marks, sukun and shadda'),
        body: s('الحركات علامات صغيرة فوق الحرف أو تحته تبيّن كيف يُنطق: الفتحة والكسرة والضمة أصوات قصيرة، والسكون يعني أن الحرف بلا حركة، والشدة تعني أن الحرف مكرر (حرفان أولهما ساكن). وحروف المد الألف والواو والياء تطيل الصوت.',
          'Vowel marks are small signs above or below a letter that show how it is pronounced: fatha, kasra and damma are short vowels; sukun means the letter has no vowel; shadda means the letter is doubled. The letters alif, waw and ya can lengthen the sound (madd).'),
      },
      {
        id: 'letters-quiz',
        title: s('اختبار قصير: الحروف والحركات', 'Short quiz: letters and vowel marks'),
        body: s('أجب عن الأسئلة لتتأكد من فهمك. يمكنك إعادة المحاولة متى شئت.', 'Answer the questions to check your understanding. You can try again at any time.'),
        quiz: [
          { q: s('ما اسم الحرف «ب»؟', 'What is the name of the letter «ب»?'), options: { ar: ['تاء', 'باء', 'نون'], en: ['Ta', 'Ba', 'Nun'] }, answer: 1 },
          { q: s('الفتحة تُنطق صوتًا قصيرًا مثل…', 'A fatha is pronounced as a short…'), options: { ar: ['«ـَ» a', '«ـِ» i', '«ـُ» u'], en: ['“a”', '“i”', '“u”'] }, answer: 0 },
          { q: s('ماذا يعني السكون فوق الحرف؟', 'What does a sukun above a letter mean?'), options: { ar: ['الحرف مكرر', 'الحرف بلا حركة', 'الحرف يُمد'], en: ['The letter is doubled', 'The letter has no vowel', 'The letter is lengthened'] }, answer: 1 },
          { q: s('ماذا تعني الشدة فوق الحرف؟', 'What does a shadda above a letter mean?'), options: { ar: ['الحرف مكرر', 'الحرف لا يُنطق', 'الحرف بلا حركة'], en: ['The letter is doubled', 'The letter is silent', 'The letter has no vowel'] }, answer: 0 },
          { q: s('كم عدد الحروف العربية؟', 'How many Arabic letters are there?'), options: { ar: ['24', '28', '30'], en: ['24', '28', '30'] }, answer: 1 },
        ],
      },
      {
        id: 'listen-fatiha', auto: 'read:any',
        title: s('استمع واتبع: سورة الفاتحة', 'Listen and follow: Surah al-Fatiha'),
        body: s('افتح سورة الفاتحة، واضغط على كل آية لتسمعها بصوت الشيخ مشاري العفاسي، وتابع الكلمات بعينك ثم أعد قراءتها بصوتك. فعّل «تكرار الآية» لتسمع الآية مرات عدة.',
          'Open Surah al-Fatiha and tap each ayah to hear it recited by Sheikh Mishary Alafasy. Follow the words with your eyes, then read the ayah aloud yourself. Turn on “repeat ayah” to hear it several times.'),
        actions: [{ label: s('افتح الفاتحة', 'Open al-Fatiha'), do: { surah: 1, ayah: 1 } }],
      },
      {
        id: 'tajweed-intro', auto: 'lesson:tajweed-intro',
        title: s('النطق الصحيح: مدخل إلى التجويد', 'Correct pronunciation: introduction to tajweed'),
        body: s('التجويد هو إعطاء كل حرف حقه من المخرج والصفة. ابدأ بدرس المدخل في الأكاديمية.', 'Tajweed is giving every letter its right point of articulation and qualities. Start with the introductory lesson of the academy.'),
        actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'tajweed-intro' } }],
      },
      {
        id: 'short-surahs',
        title: s('تدرّب على قصار السور', 'Practise the short surahs'),
        body: s('اقرأ سور الإخلاص والفلق والناس: استمع إلى الآية أولًا، ثم اقرأها وحدك، ثم استمع مرة أخرى لتقارن. تدرّج ولا تستعجل.', 'Read Surahs al-Ikhlas, al-Falaq and an-Nas: listen to an ayah first, read it alone, then listen again to compare. Go step by step without hurrying.'),
        actions: [
          { label: s('الإخلاص', 'Al-Ikhlas'), do: { surah: 112, ayah: 1 } },
          { label: s('الفلق', 'Al-Falaq'), do: { surah: 113, ayah: 1 } },
          { label: s('الناس', 'An-Nas'), do: { surah: 114, ayah: 1 } },
        ],
      },
      {
        id: 'assessment', auto: 'memo:any',
        title: s('تقييم: اقرأ الفاتحة في مختبر التسميع', 'Assessment: read al-Fatiha in the recitation lab'),
        body: s('في مختبر التسميع اختر سورة الفاتحة واقرأ بصوتك؛ يقارن الموقع الكلمات التي سمعها بالنص ويبيّن الكلمات الناقصة أو المختلفة. هذا التقييم للكلمات فقط، ولا يحكم على أحكام التجويد، ويحتاج متصفحًا يدعم التعرف على الكلام (مثل Chrome).',
          'In the recitation lab choose al-Fatiha and read aloud; the site compares the words it heard with the text and shows missing or different words. It checks words only, not tajweed rules, and needs a browser with speech recognition (such as Chrome).'),
        actions: [{ label: s('افتح مختبر التسميع', 'Open the recitation lab'), do: { lab: 'recite' } }],
      },
    ],
  },

  // ------------------------------------------------------------------------------------------ 2. memorisation
  {
    id: 'memorize', icon: '🧠',
    title: { ar: 'احفظ القرآن', en: 'Memorise the Quran', es: 'Memorizar el Corán', fr: 'Mémoriser le Coran' },
    desc: s('حدد هدفك اليومي، واستمع، وكرر، وسمّع بصوتك، وراجع بانتظام بجدول مراجعة متباعد.', 'Set a daily target, listen, repeat, recite aloud and revise regularly with a spaced revision schedule.'),
    steps: [
      {
        id: 'method', auto: 'lesson:memo-method',
        title: s('طريقة عملية للحفظ', 'A practical memorisation method'),
        body: s('اقرأ درس طريقة الحفظ في الأكاديمية قبل أن تبدأ: مقدار قليل ثابت كل يوم خير من كثير منقطع.', 'Read the academy lesson on memorisation before you start: a small, steady amount every day is better than a lot now and then.'),
        actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'memo-method' } }],
      },
      {
        id: 'goal',
        title: s('حدد هدف الحفظ', 'Set your memorisation goal'),
        body: s('في «خطتي وتقدمي» داخل مختبر التسميع اختر عدد الآيات التي تحفظها يوميًا والسور التي تعمل عليها. ابدأ بجزء عمّ إن كنت مبتدئًا.', 'In “My plan & progress” inside the recitation lab, choose how many ayahs to memorise each day and the surahs you are working on. Start with Juz ʿAmma if you are a beginner.'),
        actions: [{ label: s('افتح خطتي', 'Open my plan'), do: { lab: 'plan' } }],
      },
      {
        id: 'listen', auto: 'listen:any',
        title: s('استمع إلى المقطع مرات عدة', 'Listen to the passage several times'),
        body: s('اختر قارئًا متقنًا واستمع إلى السورة التي تحفظها، وفعّل «تكرار السورة». الاستماع المتكرر يثبّت النطق والترتيب.', 'Choose a skilled reciter, listen to the surah you are memorising and turn on “repeat surah”. Repeated listening fixes the pronunciation and the order in your mind.'),
        actions: [{ label: s('افتح التلاوات', 'Open recitations'), do: { route: 'audio' } }],
      },
      {
        id: 'read-repeat',
        title: s('اقرأ وكرر الآيات', 'Read and repeat the ayahs'),
        body: s('في المصحف استعمل «تكرار مقطع من الآيات» لتعيد مجموعة آيات عددًا من المرات، وأنت تقرأ معها من المصحف.', 'In the reader use “repeat a range of ayahs” to replay a group of ayahs several times while you read along.'),
        actions: [{ label: s('افتح المصحف', 'Open the reader'), do: { route: 'quran' } }],
      },
      {
        id: 'recite', auto: 'memo:any',
        title: s('سمّع بصوتك', 'Recite from memory'),
        body: s('سمّع ما حفظته في مختبر التسميع. جرّب وضع «إخفاء الآية» ثم «الاختبار». يبيّن المختبر الكلمات الناقصة أو المختلفة كلمةً كلمة.', 'Recite what you memorised in the lab. Try the “hide the ayah” mode, then “test”. The lab shows missing or different words, word by word.'),
        actions: [{ label: s('افتح مختبر التسميع', 'Open the recitation lab'), do: { lab: 'recite' } }],
      },
      {
        id: 'mistakes',
        title: s('تعرّف على أخطائك', 'Find your mistakes'),
        body: s('في صفحة «تقدمي» يعرض قسم «بصيرة» الآيات والكلمات التي تحتاج إلى تثبيت، مأخوذة من سجل أخطائك في التسميع.', 'On the “My progress” page, the insights section lists the ayahs and words that need strengthening, taken from your recitation mistakes.'),
        actions: [{ label: s('افتح تقدمي', 'Open my progress'), do: { route: 'progress' } }],
      },
      {
        id: 'revision', auto: 'lesson:memo-revision',
        title: s('راجع ما حفظته', 'Revise what you memorised'),
        body: s('يجدول الموقع مراجعة كل سورة أتممتها على فترات متباعدة (يوم، ثلاثة، أسبوع، أسبوعان، شهر، شهران). اقرأ درس المراجعة، وراجع ما يحين موعده.', 'The site schedules each completed surah for revision at growing intervals (1, 3, 7, 14, 30 and 60 days). Read the revision lesson and revise whatever is due.'),
        actions: [
          { label: s('درس المراجعة', 'Revision lesson'), do: { lesson: 'memo-revision' } },
          { label: s('مراجعاتي', 'My revisions'), do: { lab: 'plan' } },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------------------------------ 3. recitation
  {
    id: 'recite', icon: '🎧',
    title: { ar: 'حسّن تلاوتك', en: 'Improve your recitation', es: 'Mejorar tu recitación', fr: 'Améliorer ta récitation' },
    desc: s('استمع إلى كبار القراء، وتعلّم أساسيات التجويد، وتدرّب بالتكرار والتسميع.', 'Listen to great reciters, learn the basics of tajweed and practise with repetition and recitation.'),
    steps: [
      {
        id: 'reciters', auto: 'listen:any',
        title: s('استمع إلى القراء', 'Listen to the reciters'),
        body: s('في صفحة التلاوات ستة عشر قارئًا. استمع إلى السورة نفسها بأكثر من صوت، وخفّض سرعة التلاوة لتلاحظ المدود والغنن.', 'The recitations page has sixteen reciters. Listen to the same surah in more than one voice, and slow the playback down to notice the prolongations and nasal sounds.'),
        actions: [{ label: s('افتح التلاوات', 'Open recitations'), do: { route: 'audio' } }],
      },
      { id: 'tajweed-intro', auto: 'lesson:tajweed-intro', title: s('مدخل إلى التجويد', 'Introduction to tajweed'), body: s('تعرّف على معنى التجويد وحكمه ومراتب القراءة.', 'Learn what tajweed is and the levels of recitation.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'tajweed-intro' } }] },
      { id: 'tajweed-noon', auto: 'lesson:tajweed-noon', title: s('أحكام النون الساكنة والتنوين', 'Noon sakinah and tanween'), body: s('الإظهار والإدغام والإقلاب والإخفاء، مع أمثلة من المصحف.', 'Clear pronunciation, merging, conversion and concealment, with examples from the Mushaf.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'tajweed-noon' } }] },
      { id: 'tajweed-meem', auto: 'lesson:tajweed-meem', title: s('أحكام الميم الساكنة', 'Meem sakinah'), body: s('الإخفاء الشفوي والإدغام الشفوي والإظهار الشفوي.', 'Labial concealment, labial merging and labial clarity.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'tajweed-meem' } }] },
      { id: 'tajweed-madd', auto: 'lesson:tajweed-madd', title: s('المدود', 'Prolongation (madd)'), body: s('المد الطبيعي والمد الفرعي ومقاديرها.', 'Natural and secondary prolongation and their lengths.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'tajweed-madd' } }] },
      {
        id: 'ayah-repeat',
        title: s('تمرين: كرر الآية بعد القارئ', 'Exercise: repeat each ayah after the reciter'),
        body: s('افتح سورة قصيرة، وفعّل «تكرار الآية»، واستمع ثم اقرأ بعد القارئ مقلدًا المدود والغنن. انتقل إلى الآية التالية عندما تطمئن.', 'Open a short surah, turn on “repeat ayah”, listen and then read after the reciter, imitating the prolongations and nasal sounds. Move on when you feel confident.'),
        actions: [{ label: s('سورة الكوثر', 'Surah al-Kawthar'), do: { surah: 108, ayah: 1 } }],
      },
      {
        id: 'voice', auto: 'memo:any',
        title: s('تمرين صوتي في المختبر', 'Voice exercise in the lab'),
        body: s('استعمل وضع «التكرار» في مختبر التسميع: يتأكد الموقع من الكلمات التي قرأتها. تنبيه: المختبر لا يقيّم أحكام التجويد؛ لذلك يُستحسن أن تقرأ على معلم متقن.', 'Use the “repeat” mode of the recitation lab: the site checks the words you read. Note: the lab does not assess tajweed rules, so reading to a qualified teacher is recommended.'),
        actions: [{ label: s('افتح مختبر التسميع', 'Open the recitation lab'), do: { lab: 'recite' } }],
      },
      {
        id: 'track',
        title: s('تابع تحسّنك', 'Track your improvement'),
        body: s('يعرض قسم «بصيرة» في صفحة «تقدمي» دقة التسميع في آخر الجلسات، فترى تحسنك مع الوقت.', 'The insights section on “My progress” shows your recitation accuracy over recent sessions, so you can see your improvement over time.'),
        actions: [{ label: s('افتح تقدمي', 'Open my progress'), do: { route: 'progress' } }],
      },
    ],
  },

  // ------------------------------------------------------------------------------------------ 4. understanding
  {
    id: 'understand', icon: '📚',
    title: { ar: 'افهم القرآن', en: 'Understand the Quran', es: 'Comprender el Corán', fr: 'Comprendre le Coran' },
    desc: s('اقرأ الآيات مع التفسير الميسر والترجمة، ودوّن تأملاتك، وابحث في التفسير.', 'Read the ayahs with Tafsir al-Muyassar and translations, write down your reflections and search the tafsir.'),
    steps: [
      {
        id: 'fatiha-tafsir',
        title: s('الفاتحة مع التفسير', 'Al-Fatiha with its tafsir'),
        body: s('افتح الفاتحة واضغط على كل آية: يظهر التفسير الميسر وترجمة المعاني تحت الآية. الفاتحة أعظم سورة في القرآن، وتُقرأ في كل ركعة.', 'Open al-Fatiha and tap each ayah: Tafsir al-Muyassar and a translation of the meanings appear under it. Al-Fatiha is the greatest surah of the Quran and is recited in every unit of prayer.'),
        actions: [{ label: s('افتح الفاتحة', 'Open al-Fatiha'), do: { surah: 1, ayah: 1 } }],
      },
      {
        id: 'translations',
        title: s('اختر الترجمة التي تناسبك', 'Choose the translation that suits you'),
        body: s('من الإعدادات يمكنك إظهار التفسير في كل لغات الواجهة، واختيار ترجمة المعاني (الإنجليزية أو الإسبانية أو الفرنسية) في الواجهة العربية.', 'In the settings you can show the tafsir in every interface language and, in the Arabic interface, choose the translation of the meanings (English, Spanish or French).'),
        actions: [{ label: s('صفحة التفسير والترجمات', 'Tafsir & translations page'), do: { route: 'tafsir' } }],
      },
      {
        id: 'kursi',
        title: s('آية الكرسي', 'Ayat al-Kursi'),
        body: s('اقرأ آية الكرسي (البقرة: 255) مع تفسيرها، وتأمل ما فيها من أسماء الله وصفاته.', 'Read Ayat al-Kursi (al-Baqarah 2:255) with its tafsir and reflect on the names and attributes of Allah it mentions.'),
        actions: [{ label: s('افتح آية الكرسي', 'Open Ayat al-Kursi'), do: { surah: 2, ayah: 255 } }],
      },
      {
        id: 'asr',
        title: s('وحدة قصيرة: سورة العصر', 'Short unit: Surah al-ʿAsr'),
        body: s('سورة العصر ثلاث آيات تجمع أسباب النجاة: الإيمان، والعمل الصالح، والتواصي بالحق، والتواصي بالصبر. اقرأها مع التفسير.', 'Surah al-ʿAsr is three ayahs that gather the means of success: faith, righteous deeds, urging one another to the truth and to patience. Read it with its tafsir.'),
        actions: [{ label: s('افتح سورة العصر', 'Open Surah al-ʿAsr'), do: { surah: 103, ayah: 1 } }],
      },
      {
        id: 'reflect', auto: 'notes:any',
        title: s('دوّن تأملك', 'Write down a reflection'),
        body: s('في لوحة تفاصيل الآية يمكنك كتابة ملاحظة وتصنيفها (تدبر، حفظ، مراجعة، أدعية). اكتب ما فهمته من آية قرأتها اليوم.', 'In the ayah details panel you can write a note and file it (reflection, memorisation, review, supplications). Write what you understood from an ayah you read today.'),
        actions: [{ label: s('ملاحظاتي', 'My notes'), do: { route: 'notes' } }],
      },
      {
        id: 'search',
        title: s('ابحث عن موضوع في التفسير', 'Search a topic in the tafsir'),
        body: s('استعمل «البحث الإسلامي» للبحث عن كلمة مثل «الصبر» في الآيات والتفسير والأذكار ومحتوى الموقع.', 'Use “Islamic search” to look for a word such as “patience” (الصبر) across the ayahs, the tafsir, the adhkar and the site’s lessons.'),
        actions: [{ label: s('افتح البحث', 'Open search'), do: { dialog: 'islamicSearchModal' } }],
      },
    ],
  },

  // ------------------------------------------------------------------------------------------ 5. prayer & wudu
  {
    id: 'prayer', icon: '🕌',
    title: { ar: 'تعلّم الوضوء والصلاة', en: 'Learn wudu and prayer', es: 'Aprender el wudu y la oración', fr: 'Apprendre les ablutions et la prière' },
    desc: s('خطوة بخطوة: الوضوء، ثم شروط الصلاة وأركانها، ثم صفتها بالرسوم، ثم الأذكار التي تقال فيها.', 'Step by step: wudu, then the conditions and pillars of prayer, then how to pray with illustrations, then what is recited in it.'),
    steps: [
      { id: 'wudu', auto: 'lesson:wudu', title: s('الوضوء خطوة بخطوة', 'Wudu step by step'), body: s('تعلّم صفة الوضوء وفرائضه ونواقضه.', 'Learn how to perform wudu, its obligatory parts and what breaks it.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'wudu' } }] },
      { id: 'conditions', auto: 'lesson:conditions', title: s('شروط الصلاة', 'Conditions of prayer'), body: s('ما يجب قبل الصلاة: الطهارة، ودخول الوقت، وستر العورة، واستقبال القبلة، والنية.', 'What is required before prayer: purity, the time having begun, covering, facing the qiblah and intention.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'conditions' } }] },
      { id: 'prophet-prayer', auto: 'lesson:prophet-prayer', title: s('صفة صلاة النبي ﷺ', 'How the Prophet ﷺ prayed'), body: s('الدرس الجامع لصفة الصلاة من التكبير إلى التسليم، بأربع لغات.', 'The complete lesson on how to pray, from the opening takbir to the tasleem, in four languages.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'prophet-prayer' } }] },
      { id: 'steps', auto: 'lesson:steps', title: s('الصلاة بالرسوم', 'The prayer, illustrated'), body: s('تابع الرسوم التوضيحية لكل وضعية من وضعيات الصلاة.', 'Follow the illustrations of every posture of the prayer.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'steps' } }, { label: s('صفحة تعلم الصلاة', 'Prayer lessons page'), do: { route: 'learn-prayer' } }] },
      { id: 'pillars', auto: 'lesson:pillars', title: s('أركان الصلاة', 'Pillars of prayer'), body: s('ما لا تصح الصلاة بدونه.', 'What the prayer is not valid without.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'pillars' } }] },
      {
        id: 'fatiha', auto: 'memo:surah:1',
        title: s('احفظ الفاتحة', 'Memorise al-Fatiha'),
        body: s('قراءة الفاتحة ركن في كل ركعة. استمع إليها، ثم سمّعها في مختبر التسميع حتى تتقنها.', 'Reciting al-Fatiha is a pillar of every unit of prayer. Listen to it, then recite it in the lab until you know it well.'),
        actions: [{ label: s('افتح الفاتحة', 'Open al-Fatiha'), do: { surah: 1, ayah: 1 } }, { label: s('سمّع الفاتحة', 'Recite al-Fatiha'), do: { lab: 'recite' } }],
      },
      { id: 'tashahhud', auto: 'lesson:tashahhud', title: s('التشهد', 'The tashahhud'), body: s('تعلّم التشهد والصلاة على النبي ﷺ.', 'Learn the tashahhud and the prayer upon the Prophet ﷺ.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'tashahhud' } }] },
      { id: 'mistakes', auto: 'lesson:mistakes', title: s('أخطاء شائعة', 'Common mistakes'), body: s('أخطاء يقع فيها كثير من المصلين وكيف تتجنبها.', 'Mistakes many people make in prayer, and how to avoid them.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'mistakes' } }] },
      { id: 'review', auto: 'lesson:review', title: s('اختبار المراجعة', 'Review quiz'), body: s('اختبر فهمك لما تعلمته في المنهج.', 'Test your understanding of the curriculum.'), actions: [{ label: s('افتح الاختبار', 'Open the quiz'), do: { lesson: 'review' } }] },
    ],
  },

  // ------------------------------------------------------------------------------------------ 6. basics of Islam
  {
    id: 'basics', icon: '🌱', welcoming: true,
    title: { ar: 'تعرّف على أساسيات الإسلام', en: 'Learn the basics of Islam', es: 'Conocer los fundamentos del islam', fr: 'Découvrir les bases de l’islam' },
    desc: s('مسار هادئ لمن يتعرف على الإسلام أو أسلم حديثًا: المعنى، والشهادتان، والأركان، والطهارة، والصلاة، والقرآن. تعلّم بالتدريج ولا تستعجل.', 'A gentle path for people exploring Islam or who have just embraced it: its meaning, the testimony of faith, the pillars, purification, prayer and the Quran. Learn gradually, without pressure.'),
    steps: [
      {
        id: 'meaning',
        title: s('ما الإسلام؟', 'What is Islam?'),
        body: s('الإسلام هو الاستسلام لله وحده بالتوحيد، والانقياد له بالطاعة. وهو دين جميع الأنبياء، وخاتمهم محمد ﷺ. وقد أخبر الله تعالى في سورة آل عمران (الآية 19) أن الدين المقبول عنده هو الإسلام؛ اقرأ الآية من المصحف بالزر أدناه.',
          'Islam means submitting to Allah alone in worship and following His guidance. It is the religion of all the prophets, the last of whom is Muhammad ﷺ. Allah tells us in Surah Al ʿImran (3:19) that the religion accepted by Him is Islam; read the ayah in the Mushaf with the button below.'),
        actions: [{ label: s('رسالة الإسلام', 'The message of Islam'), do: { dialog: 'islamModal' } }, { label: s('اقرأ الآية', 'Read the ayah'), do: { surah: 3, ayah: 19 } }],
      },
      {
        id: 'shahada', widget: 'shahada',
        title: s('الشهادتان', 'The testimony of faith (Shahada)'),
        body: s('يدخل الإنسان في الإسلام بأن ينطق الشهادتين صادقًا مؤمنًا بمعناهما. لا يُشترط مكان معيّن ولا احتفال ولا حضور شخص بعينه، ولا يُشترط أن يكون الإنسان كاملًا قبل أن يُسلم.',
          'A person enters Islam by sincerely saying the two testimonies while believing in their meaning. No particular place, ceremony or witness is required, and no one has to become perfect before embracing Islam.'),
        actions: [{ label: s('اسأل المساعد: كيف أصبح مسلمًا؟', 'Ask the assistant: how do I become Muslim?'), do: { ask: { ar: 'كيف أصبح مسلما؟', en: 'How can I become a Muslim?' } } }],
      },
      { id: 'pillars-islam', auto: 'lesson:basics-islam', title: s('أركان الإسلام الخمسة', 'The five pillars of Islam'), body: s('الشهادتان، والصلاة، والزكاة، وصوم رمضان، وحج البيت لمن استطاع (البخاري 8، ومسلم 16).', 'The testimony of faith, prayer, zakat, fasting Ramadan and pilgrimage for those able (al-Bukhari 8, Muslim 16).'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'basics-islam' } }] },
      { id: 'pillars-iman', auto: 'lesson:basics-iman', title: s('أركان الإيمان الستة', 'The six pillars of faith'), body: s('الإيمان بالله، وملائكته، وكتبه، ورسله، واليوم الآخر، والقدر خيره وشره (مسلم 8).', 'Belief in Allah, His angels, His books, His messengers, the Last Day and divine decree, its good and its bad (Muslim 8).'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'basics-iman' } }] },
      { id: 'purification', auto: 'lesson:wudu', title: s('الطهارة والوضوء', 'Purification and wudu'), body: s('الطهارة شرط للصلاة. تعلّم الوضوء بخطوات واضحة.', 'Purity is a condition of prayer. Learn wudu in clear steps.'), actions: [{ label: s('درس الوضوء', 'Wudu lesson'), do: { lesson: 'wudu' } }] },
      { id: 'first-prayer', auto: 'lesson:prophet-prayer', title: s('صلاتك الأولى', 'Your first prayer'), body: s('تعلّم صفة الصلاة بالتدريج. لا بأس أن تبدأ بما تستطيع وتتعلم الباقي شيئًا فشيئًا، وأن تستعين بمسلم تثق به.', 'Learn how to pray gradually. It is fine to begin with what you can and learn the rest step by step, with help from a Muslim you trust.'), actions: [{ label: s('صفة صلاة النبي ﷺ', 'How the Prophet ﷺ prayed'), do: { lesson: 'prophet-prayer' } }] },
      {
        id: 'quran-intro', auto: 'read:any',
        title: s('تعرّف على القرآن', 'Get to know the Quran'),
        body: s('القرآن كلام الله، أنزله على محمد ﷺ بالعربية، في 114 سورة. ابدأ بسورة الفاتحة واقرأ ترجمة معانيها بلغتك.', 'The Quran is the word of Allah, revealed to Muhammad ﷺ in Arabic, in 114 surahs. Start with al-Fatiha and read the translation of its meanings in your language.'),
        actions: [{ label: s('افتح الفاتحة', 'Open al-Fatiha'), do: { surah: 1, ayah: 1 } }],
      },
      { id: 'daily', auto: 'lesson:daily-adhkar', title: s('عادات يومية', 'Daily practices'), body: s('أذكار الصباح والمساء، والصلوات الخمس في أوقاتها، وورد يسير من القرآن. يعينك الموقع على تذكرها.', 'Morning and evening remembrance, the five prayers on time, and a small daily portion of the Quran. The site helps you remember them.'), actions: [{ label: s('افتح الدرس', 'Open the lesson'), do: { lesson: 'daily-adhkar' } }, { label: s('الأذكار', 'Adhkar'), do: { route: 'adhkar' } }] },
    ],
  },
];

/** The 28 letters with their Arabic names and English transliteration (for the 'letters' widget). */
export const ARABIC_LETTERS = [
  ['ا', 'ألف', 'Alif'], ['ب', 'باء', 'Bāʾ'], ['ت', 'تاء', 'Tāʾ'], ['ث', 'ثاء', 'Thāʾ'], ['ج', 'جيم', 'Jīm'], ['ح', 'حاء', 'Ḥāʾ'], ['خ', 'خاء', 'Khāʾ'],
  ['د', 'دال', 'Dāl'], ['ذ', 'ذال', 'Dhāl'], ['ر', 'راء', 'Rāʾ'], ['ز', 'زاي', 'Zāy'], ['س', 'سين', 'Sīn'], ['ش', 'شين', 'Shīn'], ['ص', 'صاد', 'Ṣād'],
  ['ض', 'ضاد', 'Ḍād'], ['ط', 'طاء', 'Ṭāʾ'], ['ظ', 'ظاء', 'Ẓāʾ'], ['ع', 'عين', 'ʿAyn'], ['غ', 'غين', 'Ghayn'], ['ف', 'فاء', 'Fāʾ'], ['ق', 'قاف', 'Qāf'],
  ['ك', 'كاف', 'Kāf'], ['ل', 'لام', 'Lām'], ['م', 'ميم', 'Mīm'], ['ن', 'نون', 'Nūn'], ['ه', 'هاء', 'Hāʾ'], ['و', 'واو', 'Wāw'], ['ي', 'ياء', 'Yāʾ'],
];

/** Vowel marks shown on the letter ب (for the 'harakat' widget). */
export const HARAKAT = [
  ['بَ', s('فتحة', 'Fatha'), 'ba'], ['بِ', s('كسرة', 'Kasra'), 'bi'], ['بُ', s('ضمة', 'Damma'), 'bu'], ['بْ', s('سكون', 'Sukun'), 'b'],
  ['بّ', s('شدة', 'Shadda'), 'bb'], ['بً', s('تنوين فتح', 'Tanween (fath)'), 'ban'], ['بٍ', s('تنوين كسر', 'Tanween (kasr)'), 'bin'], ['بٌ', s('تنوين ضم', 'Tanween (damm)'), 'bun'],
  ['بَا', s('مد بالألف', 'Madd with alif'), 'bā'], ['بِي', s('مد بالياء', 'Madd with ya'), 'bī'], ['بُو', s('مد بالواو', 'Madd with waw'), 'bū'],
];

/** The Shahada (not a Quranic text: the testimony as it is said). */
export const SHAHADA = {
  ar: 'أشهد أن لا إله إلا الله، وأشهد أن محمدًا رسول الله',
  translit: 'Ash-hadu an lā ilāha illā Allāh, wa ash-hadu anna Muḥammadan rasūlu Allāh',
  meaning: {
    ar: 'أُقِرّ وأعترف بقلبي ولساني أنه لا معبود بحق إلا الله، وأن محمدًا ﷺ عبده ورسوله.',
    en: 'I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.',
    es: 'Atestiguo que no hay divinidad digna de adoración excepto Allah, y atestiguo que Muhammad es el Mensajero de Allah.',
    fr: 'J’atteste qu’il n’y a de divinité digne d’adoration qu’Allah, et j’atteste que Muhammad est le Messager d’Allah.',
  },
};

export const findPath = (id) => JOURNEY_PATHS.find((p) => p.id === id) || null;
