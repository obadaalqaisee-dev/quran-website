// «تعلم الصلاة الصحيحة» — curriculum data.
//
// Content policy (see docs/evolution_audit.md §4):
//   * Quran: only references ({ type: 'quran', ref: 'surah:ayah' }). The text is loaded at run time from
//     the same verified source as the Mushaf, so it can never be misquoted. `expect` is a word that the
//     ayah must contain; tests/unit/learning.test.mjs checks every reference against the dataset.
//   * Hadith: well-known narrations, cited by collection only ("رواه البخاري"). No hadith number is
//     asserted, because none could be verified online while this was written. Each hadith has a SEARCH
//     link (dorar.net) so the reader can check the narration and its grading.
//   * Rulings follow the Hanbali classification as explained by Sheikh Muhammad ibn Salih al-Uthaymeen
//     in «الشرح الممتع على زاد المستقنع»; every module states where other schools differ.
//   * Lesson bodies are in Arabic; titles and summaries are translated (the interface says so).

export const LESSON_SOURCE_NOTE = 'التقسيم إلى شروط وأركان وواجبات وسنن هنا على المذهب الحنبلي، وهو ما شرحه الشيخ محمد بن صالح العثيمين رحمه الله في «الشرح الممتع على زاد المستقنع». وللمذاهب الأخرى تقسيمات مختلفة في بعض المسائل، ونذكر أهمها في موضعه.';

// ----------------------------------------------------------------------------- visual tutorial (10 steps)
export const POSTURES = [
  {
    id: 'qiyam', img: 'assets/img/prayer/qiyam.svg',
    title: { ar: 'القيام', en: 'Standing (Qiyam)', es: 'De pie (Qiyam)', fr: 'Station debout (Qiyam)' },
    ar: 'يقف المصلي مستقبلاً القبلة، معتدل القامة، وينظر إلى موضع سجوده. القيام ركن في الفريضة للقادر عليه، ومن عجز صلى قاعدًا ثم على جنب.',
    en: 'Stand upright facing the qibla, looking at the place of prostration. Standing is a pillar of obligatory prayers for whoever is able; whoever cannot stand prays sitting, then lying on the side.',
  },
  {
    id: 'takbir', img: 'assets/img/prayer/takbir.svg',
    title: { ar: 'تكبيرة الإحرام', en: 'Opening takbir', es: 'Takbir de apertura', fr: 'Takbir d’ouverture' },
    ar: 'يقول: «الله أكبر» رافعًا يديه ممدودتي الأصابع إلى حذو منكبيه أو إلى حيال أذنيه، وباطن الكفين إلى القبلة. لا تنعقد الصلاة إلا بها.',
    en: 'Say “Allahu akbar”, raising the hands with fingers together up to the shoulders or the ears, palms facing the qibla. The prayer only begins with this takbir.',
  },
  {
    id: 'qabd', img: 'assets/img/prayer/qabd.svg',
    title: { ar: 'وضع اليدين', en: 'Placing the hands', es: 'Posición de las manos', fr: 'Position des mains' },
    ar: 'يضع اليد اليمنى على اليسرى (على الكف أو الرسغ أو الساعد). واختار الشيخ ابن عثيمين وغيره وضعهما على الصدر، وقال آخرون تحت السرة أو فوقها؛ والأمر فيه سعة، وهو سنة لا تبطل الصلاة بتركها.',
    en: 'Place the right hand over the left (on the hand, wrist or forearm). Sheikh Ibn Uthaymeen and others chose placing them on the chest; other scholars said below or above the navel. It is a sunnah; leaving it does not invalidate the prayer.',
  },
  {
    id: 'ruku', img: 'assets/img/prayer/ruku.svg',
    title: { ar: 'الركوع', en: 'Bowing (Ruku‘)', es: 'Inclinación (Ruku‘)', fr: 'Inclinaison (Ruku‘)' },
    ar: 'يكبّر ويركع واضعًا يديه على ركبتيه مفرّجتي الأصابع، مستوي الظهر، ورأسه حيال ظهره، ويطمئن ويقول: «سبحان ربي العظيم».',
    en: 'Say takbir and bow, hands on the knees with fingers spread, back level and head in line with it; be still and say “Subhana rabbiyal-‘azim”.',
  },
  {
    id: 'itidal', img: 'assets/img/prayer/itidal.svg',
    title: { ar: 'الرفع من الركوع', en: 'Standing after bowing', es: 'Levantarse tras la inclinación', fr: 'Se relever de l’inclinaison' },
    ar: 'يرفع رأسه قائلاً: «سمع الله لمن حمده» (للإمام والمنفرد)، فإذا اعتدل قائمًا قال: «ربنا ولك الحمد» ويطمئن. وفي موضع اليدين بعد الرفع خلاف: فمن العلماء من يرى وضع اليمنى على اليسرى كما قبل الركوع (وهو اختيار الشيخ ابن عثيمين)، ومنهم من يرى إرسالهما.',
    en: 'Rise saying “Sami‘a Allahu liman hamidah” (imam and individual), and once fully upright say “Rabbana wa lakal-hamd”, being still. Scholars differ about the hands: some (including Sheikh Ibn Uthaymeen) place the right on the left as before bowing; others let them hang.',
  },
  {
    id: 'sujud', img: 'assets/img/prayer/sujud.svg',
    title: { ar: 'السجود', en: 'Prostration (Sujud)', es: 'Postración (Suyud)', fr: 'Prosternation (Sujud)' },
    ar: 'يكبّر ويسجد على الأعضاء السبعة: الجبهة مع الأنف، والكفين، والركبتين، وأطراف القدمين، مجافيًا عضديه عن جنبيه وبطنه عن فخذيه، ويطمئن ويقول: «سبحان ربي الأعلى». والنقاط الذهبية في الرسم تبيّن مواضع الأعضاء السبعة.',
    en: 'Say takbir and prostrate on the seven parts: forehead with nose, both palms, both knees and the toes, keeping the arms away from the sides and the belly away from the thighs; be still and say “Subhana rabbiyal-a‘la”. The gold dots show the seven parts.',
  },
  {
    id: 'jalsa', img: 'assets/img/prayer/jalsa.svg',
    title: { ar: 'الجلوس بين السجدتين', en: 'Sitting between the prostrations', es: 'Sentarse entre las postraciones', fr: 'Assise entre les prosternations' },
    ar: 'يرفع رأسه مكبّرًا ويجلس مفترشًا: يفرش رجله اليسرى ويجلس عليها، وينصب اليمنى، ويضع يديه على فخذيه، ويطمئن ويقول: «رب اغفر لي». ثم يسجد السجدة الثانية كالأولى.',
    en: 'Rise saying takbir and sit on the left foot with the right foot upright (iftirash), hands on the thighs; be still and say “Rabbighfir li”. Then make the second prostration like the first.',
  },
  {
    id: 'tashahhud', img: 'assets/img/prayer/tashahhud.svg',
    title: { ar: 'التشهد', en: 'Tashahhud', es: 'Tashahhud', fr: 'Tashahhud' },
    ar: 'يجلس للتشهد ويضع يده اليسرى على فخذه اليسرى، ويقبض أصابع اليمنى أو بعضها ويشير بالسبابة، ويقرأ التشهد. وفي تحريك الإصبع عند الدعاء خلاف بين العلماء.',
    en: 'Sit for the tashahhud, left hand on the left thigh, the right hand closed (fully or partly) pointing with the index finger, and recite the tashahhud. Scholars differ on moving the finger while supplicating.',
  },
  {
    id: 'tawarruk', img: 'assets/img/prayer/tawarruk.svg',
    title: { ar: 'جلسة التشهد الأخير', en: 'Final sitting', es: 'Sentada final', fr: 'Assise finale' },
    ar: 'في التشهد الأخير من الصلاة التي فيها تشهدان (الظهر والعصر والمغرب والعشاء) يجلس متورّكًا: يُخرج رجله اليسرى من تحت ساقه اليمنى ويجلس بمقعدته على الأرض، وينصب اليمنى. ويقرأ التشهد ثم الصلاة الإبراهيمية ثم يدعو.',
    en: 'In the final tashahhud of prayers with two tashahhuds (Dhuhr, Asr, Maghrib, Isha), sit in tawarruk: the left foot comes out under the right shin and one sits on the floor, right foot upright. Recite the tashahhud, then the Ibrahimi salawat, then supplicate.',
  },
  {
    id: 'tasleem', img: 'assets/img/prayer/tasleem.svg',
    title: { ar: 'التسليم', en: 'Tasleem', es: 'Taslim', fr: 'Taslim' },
    ar: 'يلتفت عن يمينه قائلاً: «السلام عليكم ورحمة الله»، ثم عن يساره كذلك (الرقم 1 ثم 2 في الرسم؛ يمين المصلي هو يسار الناظر إليه). وبالتسليم يخرج من الصلاة.',
    en: 'Turn the head to the right saying “As-salamu ‘alaykum wa rahmatullah”, then to the left likewise (1 then 2 in the drawing; the worshipper’s right is the viewer’s left). The tasleem ends the prayer.',
  },
];

// ----------------------------------------------------------------------------- helpers for the data below
const q = (ref, expect, note) => ({ type: 'quran', ref, expect, note });
const hadith = (text, source, search, note) => ({ type: 'hadith', text, source, search, note });
const list = (items, ordered = false) => ({ type: ordered ? 'ol' : 'ul', items });
const p = (text) => ({ type: 'p', text });
const diff = (text) => ({ type: 'diff', text });
const tip = (text) => ({ type: 'note', text });
const tutorial = (from, to) => ({ type: 'tutorial', from, to });

const HADITH_PRAY_AS = hadith('«صلّوا كما رأيتموني أصلي»', 'رواه البخاري', 'صلوا كما رأيتموني أصلي');
const HADITH_KEY = hadith('«مفتاح الصلاة الطهور، وتحريمها التكبير، وتحليلها التسليم»', 'رواه أبو داود والترمذي وابن ماجه', 'مفتاح الصلاة الطهور وتحريمها التكبير');

// ----------------------------------------------------------------------------- modules
export const LESSONS = [
  {
    id: 'conditions', icon: '📋', category: 'rulings',
    title: { ar: 'شروط الصلاة', en: 'Conditions of prayer', es: 'Condiciones de la oración', fr: 'Conditions de la prière' },
    summary: { ar: 'ما يجب توفره قبل الدخول في الصلاة ويستمر معها.', en: 'What must be in place before and throughout the prayer.', es: 'Lo que debe cumplirse antes y durante la oración.', fr: 'Ce qui doit être réuni avant et pendant la prière.' },
    blocks: [
      p('الشرط: ما يتوقف عليه صحة الصلاة، ويكون قبلها ويستمر معها. وشروط الصلاة تسعة:'),
      list(['الإسلام.', 'العقل.', 'التمييز (وهو في الغالب عند سبع سنين).', 'رفع الحدث (الطهارة بالوضوء أو الغسل أو التيمم عند العجز).', 'إزالة النجاسة من البدن والثوب والبقعة.', 'ستر العورة.', 'دخول الوقت.', 'استقبال القبلة.', 'النية، ومحلها القلب.'], true),
      q('4:103', 'موقوتا', 'دليل اشتراط الوقت.'),
      q('2:144', 'شطر', 'دليل استقبال القبلة.'),
      q('7:31', 'زينتكم', 'استدل به العلماء على أخذ الزينة وستر العورة عند الصلاة.'),
      hadith('«لا تُقبل صلاةٌ بغير طُهور»', 'رواه مسلم', 'لا تقبل صلاة بغير طهور'),
      diff('يذكر بعض العلماء الشروط بعدد آخر (فيُدخل بعضهم الطهارة من الحدث والخبث في شرط واحد مثلاً)، والمعنى متقارب. وتسقط بعض الشروط عند العجز، كمن لم يعرف جهة القبلة فاجتهد.'),
    ],
    quiz: [
      { q: 'كم عدد شروط الصلاة في هذا التقسيم؟', options: ['خمسة', 'سبعة', 'تسعة', 'أربعة عشر'], answer: 2, explain: 'شروط الصلاة تسعة: الإسلام، العقل، التمييز، رفع الحدث، إزالة النجاسة، ستر العورة، دخول الوقت، استقبال القبلة، النية.' },
      { q: 'أين محل النية؟', options: ['اللسان', 'القلب', 'كلاهما واجب'], answer: 1, explain: 'محل النية القلب، ولم يثبت عن النبي ﷺ التلفظ بها في الصلاة.' },
    ],
  },
  {
    id: 'pillars', icon: '🏛️', category: 'rulings',
    title: { ar: 'أركان الصلاة', en: 'Pillars of prayer', es: 'Pilares de la oración', fr: 'Piliers de la prière' },
    summary: { ar: 'أجزاء الصلاة التي لا تصح بدونها ولا تسقط سهوًا.', en: 'Parts without which the prayer is invalid, even if forgotten.', es: 'Partes sin las cuales la oración no es válida.', fr: 'Parties sans lesquelles la prière est invalide.' },
    blocks: [
      p('الركن: جزء من الصلاة لا تصح إلا به، ولا يسقط عمدًا ولا سهوًا ولا جهلًا؛ فمن تركه سهوًا وجب عليه أن يأتي به ويسجد للسهو. والأركان أربعة عشر:'),
      list(['القيام في الفريضة مع القدرة.', 'تكبيرة الإحرام.', 'قراءة الفاتحة في كل ركعة (على تفصيل في حق المأموم).', 'الركوع.', 'الرفع من الركوع.', 'الاعتدال قائمًا.', 'السجود على الأعضاء السبعة.', 'الرفع من السجود.', 'الجلوس بين السجدتين.', 'الطمأنينة في جميع الأركان.', 'التشهد الأخير.', 'الجلوس للتشهد الأخير.', 'الصلاة على النبي ﷺ في التشهد الأخير.', 'التسليم.'], true),
      tip('ويضيف كثير من العلماء «الترتيب بين الأركان» ركنًا.'),
      q('2:238', 'قانتين', 'دليل القيام.'),
      q('22:77', 'اركعوا', 'دليل الركوع والسجود.'),
      hadith('«لا صلاة لمن لم يقرأ بفاتحة الكتاب»', 'متفق عليه', 'لا صلاة لمن لم يقرأ بفاتحة الكتاب'),
      hadith('حديث «المسيء صلاته»: «… ثم اركع حتى تطمئن راكعًا، ثم ارفع حتى تعتدل قائمًا، ثم اسجد حتى تطمئن ساجدًا …» (مختصرًا)', 'متفق عليه', 'ارجع فصل فإنك لم تصل', 'وهو أصل في وجوب الطمأنينة.'),
      diff('يختلف العلماء في بعض هذه الأركان: فالحنفية يجعلون قراءة الفاتحة واجبًا لا ركنًا، والمالكية والشافعية يرون أن الركن التسليمة الأولى فقط، بينما يرى الحنابلة التسليمتين ركنًا في الفريضة.'),
    ],
    quiz: [
      { q: 'من ترك ركنًا سهوًا، ماذا يفعل؟', options: ['يسجد للسهو فقط', 'يأتي به ويسجد للسهو', 'لا شيء عليه'], answer: 1, explain: 'الركن لا يسقط بالسهو؛ فيأتي به ويسجد للسهو.' },
      { q: 'أي مما يلي ركن من أركان الصلاة؟', options: ['دعاء الاستفتاح', 'الطمأنينة', 'رفع اليدين عند الركوع'], answer: 1, explain: 'الطمأنينة ركن في كل الأركان الفعلية؛ دعاء الاستفتاح ورفع اليدين من السنن.' },
    ],
  },
  {
    id: 'obligations', icon: '✅', category: 'rulings',
    title: { ar: 'واجبات الصلاة', en: 'Obligatory acts', es: 'Actos obligatorios', fr: 'Actes obligatoires' },
    summary: { ar: 'ما تبطل الصلاة بتركه عمدًا، ويُجبر بسجود السهو إن تُرك سهوًا.', en: 'Invalidates the prayer if omitted deliberately; compensated by prostration of forgetfulness.', es: 'Invalida la oración si se omite a propósito; se compensa con la postración del olvido.', fr: 'Invalide la prière si omis volontairement ; compensé par la prosternation de l’oubli.' },
    blocks: [
      p('الواجب: تبطل الصلاة بتركه عمدًا، ويسقط بالسهو والجهل، ويُجبر بسجود السهو. وواجبات الصلاة ثمانية:'),
      list(['جميع التكبيرات غير تكبيرة الإحرام (تكبيرات الانتقال).', 'قول «سمع الله لمن حمده» للإمام والمنفرد.', 'قول «ربنا ولك الحمد».', 'قول «سبحان ربي العظيم» مرة في الركوع.', 'قول «سبحان ربي الأعلى» مرة في السجود.', 'قول «رب اغفر لي» بين السجدتين.', 'التشهد الأول.', 'الجلوس للتشهد الأول.'], true),
      hadith('كان النبي ﷺ يقول في ركوعه: «سبحان ربي العظيم»، وفي سجوده: «سبحان ربي الأعلى»', 'رواه مسلم', 'سبحان ربي العظيم وفي سجوده سبحان ربي الأعلى'),
      diff('هذا التقسيم خاص بالمذهب الحنبلي؛ أما جمهور العلماء (المالكية والشافعية) فيعدّون أكثر هذه الأمور سننًا لا تبطل الصلاة بتركها. ويرى الحنفية أن الواجب قسم مستقل لكن بقائمة مختلفة.'),
    ],
    quiz: [
      { q: 'من نسي التشهد الأول حتى استتم قائمًا، فما الحكم عند الحنابلة؟', options: ['تبطل صلاته', 'يستمر ويسجد للسهو', 'يعيد الصلاة من أولها'], answer: 1, explain: 'التشهد الأول واجب يسقط بالسهو ويُجبر بسجود السهو.' },
    ],
  },
  {
    id: 'sunan', icon: '🌿', category: 'rulings',
    title: { ar: 'سنن الصلاة', en: 'Sunnahs of prayer', es: 'Sunnas de la oración', fr: 'Sunnas de la prière' },
    summary: { ar: 'أقوال وأفعال تكمل الصلاة ولا تبطل بتركها.', en: 'Words and acts that perfect the prayer; omitting them does not invalidate it.', es: 'Palabras y actos que perfeccionan la oración.', fr: 'Paroles et gestes qui parfont la prière.' },
    blocks: [
      p('السنة: ما يُثاب فاعله ولا تبطل الصلاة بتركه، ولا يجب له سجود السهو (ويجوز). ومن سنن الصلاة:'),
      list(['دعاء الاستفتاح، ومنه: «سبحانك اللهم وبحمدك، وتبارك اسمك، وتعالى جدك، ولا إله غيرك».', 'الاستعاذة والبسملة سرًا.', 'التأمين بعد الفاتحة.', 'قراءة سورة أو آيات بعد الفاتحة في الركعتين الأوليين.', 'رفع اليدين عند تكبيرة الإحرام والركوع والرفع منه والقيام من التشهد الأول.', 'وضع اليمنى على اليسرى في القيام.', 'النظر إلى موضع السجود.', 'الزيادة على تسبيحة واحدة في الركوع والسجود.', 'الافتراش في التشهد الأول والتورك في الأخير.', 'الدعاء قبل السلام.']),
      hadith('كان رسول الله ﷺ يرفع يديه حذو منكبيه إذا افتتح الصلاة، وإذا كبّر للركوع، وإذا رفع رأسه من الركوع', 'متفق عليه (من حديث ابن عمر رضي الله عنهما)', 'كان يرفع يديه حذو منكبيه إذا افتتح الصلاة'),
      diff('من السنن ما اختلف فيه العلماء، مثل «جلسة الاستراحة» قبل القيام إلى الركعة الثانية والرابعة: يستحبها بعضهم مطلقًا، ويراها آخرون لمن احتاج إليها لكبر أو ثقل، وهو اختيار الشيخ ابن عثيمين.'),
    ],
    quiz: [
      { q: 'ما حكم صلاة من ترك دعاء الاستفتاح؟', options: ['باطلة', 'صحيحة', 'يجب عليه سجود السهو'], answer: 1, explain: 'دعاء الاستفتاح سنة؛ لا تبطل الصلاة بتركه.' },
    ],
  },
  {
    id: 'wudu', icon: '💧', category: 'purification',
    title: { ar: 'صفة الوضوء', en: 'How to perform wudu', es: 'Cómo hacer el wudu', fr: 'Comment faire les ablutions' },
    summary: { ar: 'خطوات الوضوء وفروضه ونواقضه.', en: 'Steps, obligations and nullifiers of wudu.', es: 'Pasos, obligaciones y anulaciones del wudu.', fr: 'Étapes, obligations et annulations des ablutions.' },
    blocks: [
      q('5:6', 'فاغسلوا', 'آية الوضوء.'),
      p('صفة الوضوء الكامل:'),
      list(['النية في القلب، ثم التسمية.', 'غسل الكفين ثلاثًا.', 'المضمضة والاستنشاق والاستنثار ثلاثًا.', 'غسل الوجه ثلاثًا (من منابت شعر الرأس إلى الذقن طولًا، ومن الأذن إلى الأذن عرضًا).', 'غسل اليدين إلى المرفقين ثلاثًا، اليمنى ثم اليسرى.', 'مسح الرأس مرة واحدة: من مقدمه إلى قفاه ثم يردهما، ومسح الأذنين.', 'غسل الرجلين إلى الكعبين ثلاثًا، اليمنى ثم اليسرى.', 'الذكر بعده: «أشهد أن لا إله إلا الله وحده لا شريك له، وأشهد أن محمدًا عبده ورسوله».'], true),
      p('فروض الوضوء ستة: غسل الوجه (ومنه المضمضة والاستنشاق)، وغسل اليدين مع المرفقين، ومسح الرأس كله (ومنه الأذنان)، وغسل الرجلين مع الكعبين، والترتيب، والموالاة.'),
      p('من نواقض الوضوء: الخارج من السبيلين، والنوم المستغرق، وزوال العقل.'),
      hadith('«من توضأ نحو وضوئي هذا ثم صلى ركعتين لا يحدّث فيهما نفسه غُفر له ما تقدم من ذنبه»', 'متفق عليه (من حديث عثمان رضي الله عنه)', 'من توضأ نحو وضوئي هذا'),
      hadith('ذكر ما بعد الوضوء: «أشهد أن لا إله إلا الله وحده لا شريك له، وأشهد أن محمدًا عبده ورسوله»', 'رواه مسلم', 'أشهد أن لا إله إلا الله وحده لا شريك له وأشهد أن محمدا عبده ورسوله'),
      diff('اختلف العلماء في بعض النواقض: كأكل لحم الإبل (ينقض عند الحنابلة، واختاره الشيخ ابن عثيمين، والجمهور على عدم النقض)، ومسّ الذكر، ومسّ المرأة. وفي مسح الرأس: يوجب الحنابلة والمالكية مسحه كله، ويكفي بعضه عند الحنفية والشافعية.'),
    ],
    quiz: [
      { q: 'إلى أين تُغسل اليدان في الوضوء؟', options: ['إلى الرسغين', 'إلى المرفقين', 'إلى الكتفين'], answer: 1, explain: 'قال تعالى: ﴿وَأَيْدِيَكُمْ إِلَى الْمَرَافِقِ﴾، والمرفقان داخلان في الغسل.' },
      { q: 'كم مرة يُمسح الرأس؟', options: ['مرة واحدة', 'ثلاث مرات', 'مرتين'], answer: 0, explain: 'المشهور في صفة وضوء النبي ﷺ مسح الرأس مرة واحدة.' },
    ],
  },
  {
    id: 'steps', icon: '🧎', category: 'practice',
    title: { ar: 'صفة الصلاة خطوة بخطوة', en: 'The prayer step by step', es: 'La oración paso a paso', fr: 'La prière pas à pas' },
    summary: { ar: 'من تكبيرة الإحرام إلى التسليم، مع الرسوم التوضيحية.', en: 'From the opening takbir to the tasleem, illustrated.', es: 'Del takbir inicial al taslim, ilustrado.', fr: 'Du takbir d’ouverture au taslim, illustré.' },
    blocks: [
      HADITH_PRAY_AS,
      tutorial(0, 9),
      p('ترتيب الركعة الواحدة: تكبير، (استفتاح في الأولى)، استعاذة وبسملة، الفاتحة، قراءة ما تيسر (في الأوليين)، ركوع، رفع واعتدال، سجدة، جلسة، سجدة ثانية، ثم القيام للركعة التالية أو الجلوس للتشهد.'),
      HADITH_KEY,
    ],
    quiz: [
      { q: 'ما الذي يقوله المصلي في الرفع من الركوع إذا كان إمامًا أو منفردًا؟', options: ['الله أكبر', 'سمع الله لمن حمده', 'سبحان ربي العظيم'], answer: 1, explain: 'يقول «سمع الله لمن حمده» عند الرفع، ثم «ربنا ولك الحمد» إذا اعتدل.' },
      { q: 'على كم عضو يكون السجود؟', options: ['خمسة', 'سبعة', 'ثلاثة'], answer: 1, explain: 'على سبعة أعظم: الجبهة مع الأنف، واليدين، والركبتين، وأطراف القدمين.' },
    ],
  },
  ...[
    ['fajr', '🌅', { ar: 'صلاة الفجر', en: 'Fajr prayer', es: 'Oración del Fayr', fr: 'Prière du Fajr' }, 2, 'جهرية في الركعتين', 'من طلوع الفجر الصادق إلى طلوع الشمس.', 'ركعتان قبلها (سنة الفجر)، وهي آكد الرواتب.', 'لا تشهد أول فيها: تشهد واحد بعد الركعة الثانية ثم التسليم.'],
    ['dhuhr', '☀️', { ar: 'صلاة الظهر', en: 'Dhuhr prayer', es: 'Oración del Duhr', fr: 'Prière du Dhuhr' }, 4, 'سرية', 'من زوال الشمس إلى أن يصير ظل كل شيء مثله (بعد ظل الزوال).', 'أربع ركعات قبلها (بتسليمتين) وركعتان بعدها.', 'تشهد أول بعد الركعة الثانية، ثم يقوم للثالثة والرابعة ويقرأ فيهما الفاتحة فقط، ثم التشهد الأخير متوركًا.'],
    ['asr', '🌤️', { ar: 'صلاة العصر', en: 'Asr prayer', es: 'Oración del Asr', fr: 'Prière du Asr' }, 4, 'سرية', 'من خروج وقت الظهر إلى اصفرار الشمس (وقت الاختيار)، ووقت الضرورة إلى غروبها.', 'ليس لها سنة راتبة.', 'مثل الظهر في صفتها: تشهدان، والقراءة في الأخيرتين بالفاتحة.'],
    ['maghrib', '🌇', { ar: 'صلاة المغرب', en: 'Maghrib prayer', es: 'Oración del Magrib', fr: 'Prière du Maghrib' }, 3, 'جهرية في الأوليين، سرية في الثالثة', 'من غروب الشمس إلى مغيب الشفق الأحمر.', 'ركعتان بعدها.', 'تشهد أول بعد الثانية، ثم ركعة ثالثة بالفاتحة، ثم التشهد الأخير متوركًا.'],
    ['isha', '🌙', { ar: 'صلاة العشاء', en: 'Isha prayer', es: 'Oración del Isha', fr: 'Prière du Isha' }, 4, 'جهرية في الأوليين، سرية في الأخيرتين', 'من مغيب الشفق الأحمر إلى منتصف الليل (وقت الاختيار).', 'ركعتان بعدها، ثم صلاة الوتر وهي سنة مؤكدة.', 'مثل الظهر في عدد الركعات، مع الجهر في الأوليين.'],
  ].map(([id, icon, title, rakat, jahr, time, rawatib, shape]) => ({
    id, icon, category: 'five', rakat,
    title,
    summary: { ar: `${rakat} ركعات · ${jahr}`.replace('2 ركعات', 'ركعتان').replace('3 ركعات', 'ثلاث ركعات').replace('4 ركعات', 'أربع ركعات'), en: `${rakat} rak‘ahs`, es: `${rakat} rak‘as`, fr: `${rakat} rak‘as` },
    blocks: [
      { type: 'facts', items: [['عدد الركعات', String(rakat)], ['القراءة', jahr], ['الوقت', time], ['السنة الراتبة', rawatib]] },
      p(shape),
      tutorial(0, 9),
      hadith('«ما من عبد مسلم يصلي لله كل يوم ثنتي عشرة ركعة تطوعًا غير فريضة إلا بنى الله له بيتًا في الجنة»', 'رواه مسلم (من حديث أم حبيبة رضي الله عنها)', 'ثنتي عشرة ركعة تطوعا غير فريضة', 'وهي السنن الرواتب.'),
      q('17:78', 'الفجر', 'من أدلة أوقات الصلوات.'),
      diff('أوقات الصلاة المذكورة هنا على قول الجمهور. ويحسب الموقع المواقيت آليًا عبر خدمة Aladhan بطريقة الحساب رقم 8 (منطقة الخليج)، وقد تختلف بدقائق عن تقويم بلدك؛ فاعتمد التقويم الرسمي في بلدك عند الاختلاف.'),
    ],
    quiz: [
      { q: `كم عدد ركعات ${title.ar}؟`, options: ['2', '3', '4'], answer: ['2', '3', '4'].indexOf(String(rakat)), explain: `${title.ar}: ${rakat} ركعات.` },
    ],
  })),
  {
    id: 'tashahhud', icon: '☝️', category: 'practice',
    title: { ar: 'التشهد', en: 'The tashahhud', es: 'El tashahhud', fr: 'Le tashahhud' },
    summary: { ar: 'نص التشهد والصلاة الإبراهيمية وكيفية الجلوس.', en: 'Text of the tashahhud, the Ibrahimi salawat and how to sit.', es: 'Texto del tashahhud y la salawat ibrahimí.', fr: 'Texte du tashahhud et de la salawat ibrahimie.' },
    blocks: [
      tutorial(7, 8),
      hadith('«التحيات لله والصلوات والطيبات، السلام عليك أيها النبي ورحمة الله وبركاته، السلام علينا وعلى عباد الله الصالحين، أشهد أن لا إله إلا الله، وأشهد أن محمدًا عبده ورسوله»', 'متفق عليه (تشهد ابن مسعود رضي الله عنه)', 'التحيات لله والصلوات والطيبات السلام عليك أيها النبي'),
      hadith('«اللهم صلّ على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد، اللهم بارك على محمد وعلى آل محمد كما باركت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد»', 'رواه البخاري', 'كما صليت على إبراهيم وعلى آل إبراهيم إنك حميد مجيد'),
      hadith('ومن الدعاء قبل السلام: «اللهم إني أعوذ بك من عذاب جهنم، ومن عذاب القبر، ومن فتنة المحيا والممات، ومن شر فتنة المسيح الدجال»', 'رواه مسلم', 'اللهم إني أعوذ بك من عذاب جهنم ومن عذاب القبر'),
      p('التشهد الأول: يقرأ فيه إلى «عبده ورسوله» ثم يقوم. التشهد الأخير: يزيد الصلاة الإبراهيمية ثم يدعو بما شاء.'),
      diff('وردت صيغ صحيحة أخرى للتشهد (كتشهد ابن عباس)، وأيّها قال المصلي أجزأه. واختلف العلماء في تحريك السبابة عند الدعاء وفي حكم الصلاة على النبي ﷺ في التشهد الأخير (ركن عند الحنابلة والشافعية، وسنة عند غيرهم).'),
    ],
    quiz: [
      { q: 'ما الذي يُزاد في التشهد الأخير عن الأول؟', options: ['الصلاة الإبراهيمية والدعاء', 'دعاء الاستفتاح', 'تكبيرة الإحرام'], answer: 0, explain: 'يزيد في الأخير الصلاة على النبي ﷺ (الصلاة الإبراهيمية) ثم الدعاء.' },
    ],
  },
  {
    id: 'tasleem', icon: '🤝', category: 'practice',
    title: { ar: 'التسليم', en: 'The tasleem', es: 'El taslim', fr: 'Le taslim' },
    summary: { ar: 'كيفية الخروج من الصلاة وحكمه.', en: 'How the prayer is ended, and its ruling.', es: 'Cómo se termina la oración.', fr: 'Comment la prière se termine.' },
    blocks: [
      tutorial(9, 9),
      p('يقول عن يمينه: «السلام عليكم ورحمة الله»، ثم عن يساره كذلك، ملتفتًا بوجهه.'),
      HADITH_KEY,
      diff('يرى الحنابلة التسليمتين ركنًا في الفريضة، ويرى المالكية والشافعية أن الركن تسليمة واحدة والثانية سنة، ويرى الحنفية الخروج من الصلاة بلفظ السلام واجبًا.'),
    ],
    quiz: [
      { q: 'بأي جهة يبدأ التسليم؟', options: ['اليسار', 'اليمين', 'لا فرق'], answer: 1, explain: 'السنة البدء باليمين ثم اليسار.' },
    ],
  },
  {
    id: 'mistakes', icon: '⚠️', category: 'practice',
    title: { ar: 'أخطاء شائعة في الصلاة', en: 'Common mistakes', es: 'Errores comunes', fr: 'Erreurs courantes' },
    summary: { ar: 'أخطاء يقع فيها كثير من المصلين وكيف تتجنبها.', en: 'Frequent mistakes and how to avoid them.', es: 'Errores frecuentes y cómo evitarlos.', fr: 'Erreurs fréquentes et comment les éviter.' },
    blocks: [
      list([
        'ترك الطمأنينة والإسراع في الركوع والسجود (وهي ركن).',
        'مسابقة الإمام أو موافقته في الحركات؛ والمشروع متابعته بعدها مباشرة.',
        'التلفظ بالنية (لم يثبت ذلك عن النبي ﷺ في الصلاة، ومحلها القلب).',
        'رفع البصر إلى السماء أثناء الصلاة.',
        'عدم تمكين الجبهة والأنف من الأرض في السجود، أو رفع القدمين.',
        'افتراش الذراعين على الأرض في السجود كالسَّبُع.',
        'كثرة الحركة والعبث بالثياب أو الهاتف لغير حاجة.',
        'المرور بين يدي المصلي.',
        'قراءة الفاتحة بسرعة تُخل بحروفها، أو تحريك الشفتين دون إخراج الحروف في الصلاة السرية.',
      ]),
      hadith('«ما بال أقوام يرفعون أبصارهم إلى السماء في صلاتهم!» فاشتد قوله في ذلك حتى قال: «لينتهُنّ عن ذلك أو لتُخطفنّ أبصارهم»', 'رواه البخاري', 'ما بال أقوام يرفعون أبصارهم إلى السماء في صلاتهم'),
      hadith('حديث «المسيء صلاته» حين قال له النبي ﷺ: «ارجع فصلّ فإنك لم تصلّ»، ثم علّمه الطمأنينة', 'متفق عليه', 'ارجع فصل فإنك لم تصل'),
      q('23:2', 'خاشعون', 'الخشوع روح الصلاة.'),
    ],
    quiz: [
      { q: 'ما حكم الطمأنينة في الركوع والسجود؟', options: ['سنة', 'ركن', 'مكروهة'], answer: 1, explain: 'الطمأنينة ركن، والدليل حديث المسيء صلاته.' },
    ],
  },
  {
    id: 'sahw', icon: '🔁', category: 'rulings',
    title: { ar: 'أحكام سجود السهو', en: 'Prostration of forgetfulness', es: 'Postración del olvido', fr: 'Prosternation de l’oubli' },
    summary: { ar: 'متى يُشرع، وهل هو قبل السلام أو بعده.', en: 'When it is due, and before or after the tasleem.', es: 'Cuándo se hace, antes o después del taslim.', fr: 'Quand la faire, avant ou après le taslim.' },
    blocks: [
      p('سجود السهو سجدتان يسجدهما المصلي لجبر خلل وقع في صلاته سهوًا. وأسبابه ثلاثة: الزيادة، والنقص، والشك.'),
      list([
        'النقص: كمن ترك التشهد الأول سهوًا ← يسجد قبل السلام.',
        'الزيادة: كمن زاد ركعة أو ركوعًا سهوًا، أو سلّم قبل تمام الصلاة ثم أتمّها ← يسجد بعد السلام.',
        'الشك مع ترجيح أحد الأمرين: يعمل بما ترجح عنده ← ويسجد بعد السلام.',
        'الشك بلا ترجيح: يبني على الأقل (اليقين) ← ويسجد قبل السلام.',
      ]),
      tip('هذا التفصيل هو ما قرره الشيخ ابن عثيمين في رسالته في سجود السهو، جمعًا بين الأحاديث الواردة.'),
      hadith('«إذا شكّ أحدكم في صلاته فلم يدرِ كم صلى ثلاثًا أم أربعًا، فليطرح الشك وليبنِ على ما استيقن، ثم يسجد سجدتين قبل أن يسلم»', 'رواه مسلم', 'فليطرح الشك وليبن على ما استيقن'),
      diff('للمذاهب أقوال أخرى في موضع سجود السهو: فالحنفية يجعلونه بعد السلام مطلقًا، والشافعية قبله مطلقًا، والمالكية قبله للنقص وبعده للزيادة. والأمر في الموضع واسع عند كثير من العلماء، والمهم ألا يُترك ما وجب منه.'),
    ],
    quiz: [
      { q: 'شخص صلى الظهر خمسًا سهوًا ثم تذكر بعد التشهد. متى يسجد للسهو على التفصيل المذكور؟', options: ['قبل السلام', 'بعد السلام', 'لا يسجد'], answer: 1, explain: 'السبب زيادة، فيسجد بعد السلام.' },
      { q: 'شك: هل صلى ثلاثًا أم أربعًا ولم يترجح عنده شيء. ماذا يفعل؟', options: ['يبني على الأكثر', 'يبني على الأقل ويسجد قبل السلام', 'يعيد الصلاة'], answer: 1, explain: 'يبني على اليقين (الأقل) ويسجد قبل أن يسلم، كما في حديث أبي سعيد عند مسلم.' },
    ],
  },
  {
    id: 'travel', icon: '🧳', category: 'rulings',
    title: { ar: 'صلاة المسافر', en: 'Prayer while travelling', es: 'La oración del viajero', fr: 'La prière du voyageur' },
    summary: { ar: 'القصر والجمع ومتى يُشرعان.', en: 'Shortening and combining prayers.', es: 'Acortar y combinar las oraciones.', fr: 'Raccourcir et combiner les prières.' },
    blocks: [
      q('4:101', 'تقصروا', 'دليل القصر.'),
      hadith('«فُرضت الصلاة ركعتين ركعتين، فأُقرّت صلاة السفر وأُتمّت صلاة الحضر»', 'متفق عليه (من حديث عائشة رضي الله عنها)', 'فأقرت صلاة السفر وأتمت صلاة الحضر'),
      list([
        'القصر: تُصلّى الظهر والعصر والعشاء ركعتين ركعتين. أما الفجر والمغرب فلا تُقصران.',
        'الجمع: يجوز للمسافر جمع الظهر مع العصر، والمغرب مع العشاء، تقديمًا أو تأخيرًا، ولا سيما إذا كان سائرًا.',
        'إذا صلى المسافر خلف إمام مقيم أتمّ معه.',
        'رواتب الصلوات تُترك في السفر إلا سنة الفجر والوتر.',
      ]),
      diff('اختلف العلماء في مسافة السفر: فالجمهور يحددونها بنحو ثمانين كيلومترًا، ويرى آخرون (منهم شيخ الإسلام ابن تيمية والشيخ ابن عثيمين) أن المرجع إلى ما يعدّه الناس سفرًا. واختلفوا في مدة الإقامة التي ينقطع بها حكم السفر (أربعة أيام عند الجمهور، وأقوال أخرى). واختلفوا كذلك هل القصر واجب أو سنة.'),
    ],
    quiz: [
      { q: 'أي الصلوات لا تُقصر في السفر؟', options: ['الظهر والعصر', 'الفجر والمغرب', 'العشاء'], answer: 1, explain: 'الفجر ركعتان أصلاً، والمغرب ثلاث لا تُقصر.' },
    ],
  },
  {
    id: 'jamaah', icon: '👥', category: 'rulings',
    title: { ar: 'صلاة الجماعة', en: 'Congregational prayer', es: 'La oración en congregación', fr: 'La prière en assemblée' },
    summary: { ar: 'فضلها وحكمها وأحكام المأموم.', en: 'Its virtue, ruling and rules for followers.', es: 'Su virtud, su norma y las reglas del que sigue al imam.', fr: 'Sa vertu, son statut et les règles du suiveur.' },
    blocks: [
      q('2:43', 'الراكعين', 'من أدلة صلاة الجماعة.'),
      hadith('«صلاة الجماعة أفضل من صلاة الفذّ بسبع وعشرين درجة»', 'متفق عليه', 'صلاة الجماعة أفضل من صلاة الفذ بسبع وعشرين درجة'),
      list([
        'إذا كان المأموم واحدًا وقف عن يمين الإمام.',
        'تسوية الصفوف وسد الفرج من تمام الصلاة.',
        'يتابع المأموم إمامه بعد انتقاله مباشرة، ولا يسابقه.',
        'المسبوق: يدخل مع الإمام على الحال التي هو عليها، ويُدرك الركعة بإدراك الركوع مع الإمام، ثم يقضي ما فاته بعد سلام الإمام.',
      ]),
      diff('حكم صلاة الجماعة للرجال: واجبة عند الحنابلة (وهو اختيار الشيخ ابن باز والشيخ ابن عثيمين)، وسنة مؤكدة أو فرض كفاية عند غيرهم. وفي قراءة المأموم للفاتحة خلاف مشهور أيضًا.'),
    ],
    quiz: [
      { q: 'بمَ تُدرك الركعة مع الإمام عند جمهور العلماء؟', options: ['بإدراك الركوع', 'بإدراك السجود', 'بإدراك التشهد'], answer: 0, explain: 'من أدرك الركوع مع الإمام فقد أدرك الركعة عند الجمهور.' },
    ],
  },
  {
    id: 'review', icon: '🎓', category: 'quiz',
    title: { ar: 'أسئلة واختبارات لتقييم الفهم', en: 'Review quiz', es: 'Prueba de repaso', fr: 'Quiz de révision' },
    summary: { ar: 'اختبار شامل يجمع أسئلة كل الدروس.', en: 'A comprehensive quiz across all lessons.', es: 'Un cuestionario completo de todas las lecciones.', fr: 'Un quiz complet de toutes les leçons.' },
    blocks: [
      p('يجمع هذا الاختبار أسئلة الدروس السابقة. بعد كل إجابة يظهر الصواب مع شرح مختصر، وتُحفظ نتيجتك على هذا الجهاز.'),
      tip('الاختبار للمراجعة الذاتية فقط، ولا يمنح إجازة أو شهادة شرعية.'),
    ],
    quiz: 'all',
  },
];

/** Every quiz question of the modules, for the review quiz. */
export function allQuestions() {
  return LESSONS.filter((l) => Array.isArray(l.quiz)).flatMap((l) => l.quiz.map((item) => ({ ...item, from: l.id })));
}

export const dorarSearch = (text) => `https://dorar.net/hadith/search?q=${encodeURIComponent(text)}`;
