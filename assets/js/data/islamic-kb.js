// Introductory Islamic knowledge for the assistant, including a section for people who want to embrace Islam.
//
// Content policy (stricter than the rest of the assistant):
//  * Quranic text is never typed here: Quran references ("2:183") are shown as buttons that open the verified
//    text in the reader.
//  * Hadith are cited by collection and number only (al-Bukhari, Muslim, Abu Dawud) for well-known narrations.
//  * `level`: 'agreed' (established by the Quran/Sunnah and agreed upon), 'difference' (a known difference of
//    scholarly opinion is explained), 'guidance' (practical, non-legal advice).
//  * Nothing here is a fatwa; answers that touch on rulings send the visitor to qualified scholars.
//
// Entry: { id, cat, subject, k, q: {ar,en,…}, a: {ar,en,…}, refs: [{ quran: 's:a' } | { hadith: {ar,en} }], level, go? }

const q = (ref) => ({ quran: ref });
const hd = (ar, en) => ({ hadith: { ar, en } });

export const ISLAMIC_KB = [
  // ------------------------------------------------------------------------------------------ foundations
  {
    id: 'is-islam', cat: 'foundations', subject: 'islam', level: 'agreed',
    k: ['ما الاسلام', 'معني الاسلام', 'تعريف الاسلام', 'what is islam', 'meaning of islam', 'que es el islam', "qu'est-ce que l'islam"],
    q: { ar: 'ما الإسلام؟', en: 'What is Islam?' },
    a: {
      ar: 'الإسلام هو الاستسلام لله وحده بالتوحيد، والانقياد له بالطاعة، والبراءة من الشرك. وهو دين الأنبياء جميعًا، وخاتمهم محمد ﷺ، وأخبر الله أن الدين المقبول عنده هو الإسلام.',
      en: 'Islam means submitting to Allah alone by worshipping Him only, following His guidance, and rejecting the worship of anything else. It is the religion of all the prophets, the last of whom is Muhammad ﷺ, and Allah tells us that the religion accepted by Him is Islam.',
      es: 'El islam es someterse solo a Allah, adorándole únicamente a Él y siguiendo Su guía. Es la religión de todos los profetas, el último de los cuales es Muhammad ﷺ.',
      fr: 'L’islam est la soumission à Allah seul : L’adorer Lui seul et suivre Sa guidance. C’est la religion de tous les prophètes, dont le dernier est Muhammad ﷺ.',
    },
    refs: [q('3:19'), q('3:85')], go: { route: 'islam' },
  },
  {
    id: 'is-pillars-islam', cat: 'foundations', subject: 'islam', level: 'agreed',
    k: ['اركان الاسلام', 'اركان الاسلام الخمسه', 'بني الاسلام', 'pillars of islam', 'five pillars', 'pilares del islam', 'piliers de l islam'],
    q: { ar: 'ما أركان الإسلام؟', en: 'What are the pillars of Islam?' },
    a: {
      ar: 'أركان الإسلام خمسة: شهادة أن لا إله إلا الله وأن محمدًا رسول الله، وإقام الصلاة، وإيتاء الزكاة، وصوم رمضان، وحج البيت لمن استطاع إليه سبيلًا.',
      en: 'The pillars of Islam are five: testifying that there is no deity worthy of worship except Allah and that Muhammad is His Messenger, establishing the prayer, giving zakat, fasting Ramadan, and pilgrimage to the House for whoever is able.',
      es: 'Los pilares del islam son cinco: el testimonio de fe, la oración, el zakat, el ayuno de Ramadán y la peregrinación para quien pueda.',
      fr: 'Les piliers de l’islam sont cinq : l’attestation de foi, la prière, la zakat, le jeûne du Ramadan et le pèlerinage pour qui le peut.',
    },
    refs: [hd('صحيح البخاري 8، وصحيح مسلم 16 (حديث ابن عمر)', 'Sahih al-Bukhari 8 and Sahih Muslim 16 (narrated by Ibn ʿUmar)')], go: { lesson: 'basics-islam' },
  },
  {
    id: 'is-pillars-iman', cat: 'foundations', subject: 'islam', level: 'agreed',
    k: ['اركان الايمان', 'الايمان', 'ما الايمان', 'pillars of faith', 'pillars of iman', 'articles of faith', 'what is iman'],
    q: { ar: 'ما أركان الإيمان؟', en: 'What are the pillars of faith (iman)?' },
    a: {
      ar: 'أركان الإيمان ستة: الإيمان بالله، وملائكته، وكتبه، ورسله، واليوم الآخر، والقدر خيره وشره. ذكرها النبي ﷺ في حديث جبريل المشهور.',
      en: 'The pillars of faith are six: belief in Allah, His angels, His books, His messengers, the Last Day, and divine decree, its good and its bad. The Prophet ﷺ listed them in the well-known hadith of Jibril.',
    },
    refs: [hd('صحيح مسلم 8 (حديث جبريل، عن عمر بن الخطاب)', 'Sahih Muslim 8 (the hadith of Jibril, narrated by ʿUmar ibn al-Khattab)'), q('2:285')], go: { lesson: 'basics-iman' },
  },
  {
    id: 'is-ihsan', cat: 'foundations', subject: 'islam', level: 'agreed',
    k: ['الاحسان', 'ما الاحسان', 'مراتب الدين', 'ihsan', 'excellence in worship', 'levels of the religion'],
    q: { ar: 'ما الإحسان؟', en: 'What is ihsan?' },
    a: {
      ar: 'الإحسان أعلى مراتب الدين (الإسلام ثم الإيمان ثم الإحسان)، وفسّره النبي ﷺ بأن تعبد الله كأنك تراه، فإن لم تكن تراه فإنه يراك.',
      en: 'Ihsan is the highest level of the religion (Islam, then iman, then ihsan). The Prophet ﷺ explained it as worshipping Allah as though you see Him, for although you do not see Him, He sees you.',
    },
    refs: [hd('صحيح مسلم 8، وصحيح البخاري 50', 'Sahih Muslim 8 and Sahih al-Bukhari 50')],
  },
  {
    id: 'is-tawheed', cat: 'foundations', subject: 'islam', level: 'agreed',
    k: ['التوحيد', 'توحيد', 'ما التوحيد', 'وحدانيه الله', 'tawheed', 'tawhid', 'oneness of god', 'monotheism'],
    q: { ar: 'ما التوحيد؟', en: 'What is tawheed?' },
    a: {
      ar: 'التوحيد إفراد الله بالعبادة، والإيمان بأنه وحده الخالق المالك المدبر، وأن له الأسماء الحسنى والصفات العلى بلا تشبيه. وهو أساس الإسلام ومعنى «لا إله إلا الله». وتقسيمه إلى توحيد الربوبية والألوهية والأسماء والصفات تقسيم تعليمي ذكره العلماء.',
      en: 'Tawheed is singling out Allah alone for worship, believing that He alone creates, owns and governs everything, and that the most beautiful names and highest attributes are His, without likening Him to creation. It is the foundation of Islam and the meaning of “la ilaha illa Allah”. Its division into lordship, worship, and names and attributes is a teaching classification used by scholars.',
    },
    refs: [q('112:1'), q('2:163'), q('42:11')],
  },
  {
    id: 'is-allah', cat: 'foundations', subject: 'islam', level: 'agreed',
    k: ['من هو الله', 'من الله', 'صفات الله', 'who is allah', 'who is god', 'about allah'],
    q: { ar: 'من هو الله؟', en: 'Who is Allah?' },
    a: {
      ar: '«الله» اسم الإله الحق الواحد، خالق كل شيء، الحي القيوم، الذي لم يلد ولم يولد، وليس كمثله شيء. وسورة الإخلاص وآية الكرسي من أجمع ما في القرآن في التعريف به سبحانه.',
      en: '“Allah” is the name of the one true God, the Creator of everything, the Ever-Living, the Sustainer of all, who neither begets nor was begotten, and nothing is like Him. Surah al-Ikhlas and Ayat al-Kursi are among the most comprehensive passages of the Quran describing Him.',
    },
    refs: [q('112:1'), q('2:255'), q('59:22')],
  },
  {
    id: 'is-purpose', cat: 'foundations', subject: 'islam', level: 'agreed',
    k: ['لماذا خلقنا', 'الغايه من الخلق', 'هدف الحياه', 'why were we created', 'purpose of life', 'meaning of life'],
    q: { ar: 'لماذا خلقنا الله؟', en: 'Why did Allah create us?' },
    a: {
      ar: 'أخبر الله في القرآن أنه خلق الجن والإنس لعبادته. والعبادة في الإسلام واسعة: تشمل الصلاة والذكر، وكل عمل نافع يُقصد به وجه الله، كبر الوالدين والصدق والإحسان إلى الناس.',
      en: 'Allah tells us in the Quran that He created jinn and humankind to worship Him. Worship in Islam is broad: it includes prayer and remembrance, and every beneficial deed done for Allah’s sake, such as kindness to parents, honesty and doing good to people.',
    },
    refs: [q('51:56'), q('67:2')],
  },
  {
    id: 'is-angels-books', cat: 'foundations', subject: 'islam', level: 'agreed',
    k: ['الملائكه', 'الكتب السماويه', 'الرسل', 'الانبياء', 'angels', 'revealed books', 'prophets', 'messengers'],
    q: { ar: 'ما الإيمان بالملائكة والكتب والرسل؟', en: 'What does belief in the angels, books and messengers mean?' },
    a: {
      ar: 'يؤمن المسلم بأن الملائكة خلق من خلق الله يطيعونه، ومنهم جبريل رسول الوحي. ويؤمن بالكتب التي أنزلها الله: صحف إبراهيم والتوراة والزبور والإنجيل والقرآن الذي حفظه الله. ويؤمن بجميع الرسل دون تفريق، كنوح وإبراهيم وموسى وعيسى ومحمد عليهم الصلاة والسلام.',
      en: 'A Muslim believes that the angels are created beings who obey Allah, among them Jibril who brought revelation; in the books Allah revealed: the scrolls of Ibrahim, the Torah, the Psalms, the Gospel and the Quran, which Allah preserved; and in all the messengers without distinction, such as Nuh, Ibrahim, Musa, ʿIsa and Muhammad, peace be upon them.',
    },
    refs: [q('2:285'), q('4:136')],
  },
  {
    id: 'is-last-day', cat: 'foundations', subject: 'islam', level: 'agreed',
    k: ['اليوم الاخر', 'يوم القيامه', 'الحساب', 'الجنه', 'النار', 'last day', 'day of judgement', 'hereafter', 'paradise'],
    q: { ar: 'ما الإيمان باليوم الآخر؟', en: 'What is belief in the Last Day?' },
    a: {
      ar: 'هو الإيمان بأن الله يبعث الناس بعد موتهم، ويحاسبهم على أعمالهم بعدله ورحمته، فيُجزى كل إنسان بما عمل، وبالجنة والنار. وهذا الإيمان يدفع المسلم إلى العمل الصالح ومراقبة الله.',
      en: 'It is the belief that Allah will resurrect people after death and judge their deeds with justice and mercy, rewarding each person for what they did, and belief in Paradise and Hell. This belief moves a Muslim to do good and to be mindful of Allah.',
    },
    refs: [q('99:7'), q('3:185')],
  },

  // ------------------------------------------------------------------------------------------ the Quran
  {
    id: 'is-quran', cat: 'quran', subject: 'quran', level: 'agreed',
    k: ['ما القران', 'القران الكريم', 'تعريف القران', 'كلام الله', 'what is the quran', 'about the quran', 'que es el coran'],
    q: { ar: 'ما القرآن الكريم؟', en: 'What is the Holy Quran?' },
    a: {
      ar: 'القرآن كلام الله، أنزله بواسطة جبريل على محمد ﷺ باللسان العربي، منجّمًا في نحو ثلاث وعشرين سنة، وهو 114 سورة. تكفّل الله بحفظه، وجُمع في مصحف واحد في عهد أبي بكر الصديق، ثم نُسخت منه المصاحف في عهد عثمان بن عفان رضي الله عنهما.',
      en: 'The Quran is the word of Allah, revealed through the angel Jibril to Muhammad ﷺ in Arabic, gradually over about twenty-three years, in 114 surahs. Allah promised to preserve it; it was gathered into one volume under Abu Bakr and copies were made from it under ʿUthman, may Allah be pleased with them.',
    },
    refs: [q('15:9'), q('12:2'), q('2:2')], go: { route: 'quran' },
  },
  {
    id: 'is-first-revelation', cat: 'quran', subject: 'quran', level: 'agreed',
    k: ['اول ما نزل', 'اول وحي', 'غار حراء', 'اقرا باسم ربك', 'first revelation', 'cave of hira'],
    q: { ar: 'ما أول ما نزل من القرآن؟', en: 'What was the first revelation of the Quran?' },
    a: {
      ar: 'أول ما نزل من القرآن الآيات الأولى من سورة العلق، نزلت على النبي ﷺ وهو يتعبّد في غار حراء قرب مكة، وكان عمره أربعين سنة.',
      en: 'The first revelation was the opening ayahs of Surah al-ʿAlaq, revealed to the Prophet ﷺ while he was worshipping in the cave of Hira near Makkah, at the age of forty.',
    },
    refs: [q('96:1'), hd('صحيح البخاري 3، وصحيح مسلم 160 (حديث عائشة في بدء الوحي)', 'Sahih al-Bukhari 3 and Sahih Muslim 160 (ʿAʾishah’s account of the beginning of revelation)')],
  },
  {
    id: 'is-fatiha', cat: 'quran', subject: 'quran', level: 'agreed',
    k: ['الفاتحه', 'سوره الفاتحه', 'ام الكتاب', 'al-fatiha', 'fatiha', 'opening chapter'],
    q: { ar: 'ما فضل سورة الفاتحة؟', en: 'Why is Surah al-Fatiha important?' },
    a: {
      ar: 'الفاتحة أعظم سورة في القرآن، وهي السبع المثاني، وقراءتها ركن في كل ركعة من الصلاة؛ لذلك يبدأ بها المتعلم حفظه.',
      en: 'Al-Fatiha is the greatest surah of the Quran, “the seven oft-repeated verses”, and reciting it is a pillar of every unit of prayer, which is why learners memorise it first.',
    },
    refs: [q('15:87'), hd('صحيح البخاري 4474 (أعظم سورة في القرآن)، وصحيح البخاري 756 ومسلم 394 (لا صلاة لمن لم يقرأ بفاتحة الكتاب)', 'Sahih al-Bukhari 4474 (the greatest surah), al-Bukhari 756 and Muslim 394 (no prayer without al-Fatiha)')], go: { route: 'quran/1' },
  },
  {
    id: 'is-quran-arabic', cat: 'quran', subject: 'quran', level: 'guidance',
    k: ['لا اعرف العربيه', 'هل يجب تعلم العربيه', 'القران بغير العربيه', 'i do not speak arabic', 'do i need arabic', 'learn arabic'],
    q: { ar: 'لا أعرف العربية، فكيف أتعامل مع القرآن؟', en: 'I don’t know Arabic. How can I approach the Quran?' },
    a: {
      ar: 'معرفة العربية ليست شرطًا للدخول في الإسلام. اقرأ ترجمة المعاني بلغتك لتفهم، واستمع إلى التلاوة، وتعلّم تدريجيًا قراءة الحروف العربية وحفظ الفاتحة لأنك تحتاج إليها في الصلاة. مسار «تعلّم قراءة القرآن» يساعدك خطوة بخطوة.',
      en: 'Knowing Arabic is not a condition for entering Islam. Read a translation of the meanings in your language to understand, listen to the recitation, and gradually learn to read the Arabic letters and memorise al-Fatiha, which you need for prayer. The “Learn to read the Quran” path helps you step by step.',
    },
    refs: [], go: { route: 'journey/read' },
  },

  // ------------------------------------------------------------------------------------------ the Prophet ﷺ
  {
    id: 'is-prophet', cat: 'seerah', subject: 'seerah', level: 'agreed',
    k: ['من هو محمد', 'النبي محمد', 'سيره النبي', 'الرسول', 'محمد صلي الله عليه وسلم', 'prophet muhammad', 'who is muhammad', 'biography of the prophet', 'seerah'],
    q: { ar: 'من هو النبي محمد ﷺ؟', en: 'Who is the Prophet Muhammad ﷺ?' },
    a: {
      ar: 'محمد بن عبد الله ﷺ، خاتم الأنبياء والمرسلين. وُلد في مكة عام الفيل (نحو 570م)، ونشأ يتيمًا، فكفله جده عبد المطلب ثم عمه أبو طالب، وعُرف بالصادق الأمين. نزل عليه الوحي في الأربعين، فدعا في مكة ثلاث عشرة سنة، ثم هاجر إلى المدينة سنة 622م، وتوفي فيها سنة 11هـ (632م) وعمره ثلاث وستون سنة.',
      en: 'Muhammad son of ʿAbdullah ﷺ, the last of the prophets and messengers. He was born in Makkah in the Year of the Elephant (around 570 CE) and grew up an orphan, cared for by his grandfather ʿAbd al-Muttalib and then his uncle Abu Talib, and was known as truthful and trustworthy. Revelation came to him at forty; he called people to Islam in Makkah for thirteen years, migrated to Madinah in 622 CE, and died there in 11 AH (632 CE) at the age of sixty-three.',
    },
    refs: [q('33:40'), q('21:107'), q('68:4')],
  },
  {
    id: 'is-prophet-character', cat: 'seerah', subject: 'seerah', level: 'agreed',
    k: ['اخلاق النبي', 'صفات النبي', 'رحمه النبي', 'character of the prophet', 'manners of the prophet'],
    q: { ar: 'كيف كانت أخلاق النبي ﷺ؟', en: 'What was the Prophet’s ﷺ character like?' },
    a: {
      ar: 'وصفه الله بأنه على خلق عظيم، وأنه رحمة للعالمين. كان صادقًا أمينًا، رحيمًا بالضعفاء والصغار، متواضعًا، يعفو عمّن أساء إليه، ويعين أهله في البيت. وقالت عائشة رضي الله عنها: كان خلقه القرآن.',
      en: 'Allah describes him as having a tremendous character and as a mercy to the worlds. He was truthful and trustworthy, merciful to the weak and to children, humble, forgiving towards those who wronged him, and helped his family at home. ʿAʾishah said: his character was the Quran.',
    },
    refs: [q('68:4'), q('21:107'), hd('صحيح مسلم 746 (كان خلقه القرآن)', 'Sahih Muslim 746 (“his character was the Quran”)')],
  },
  {
    id: 'is-hijra', cat: 'seerah', subject: 'seerah', level: 'agreed',
    k: ['الهجره', 'الهجره النبويه', 'التقويم الهجري', 'hijra', 'migration to madinah', 'hijri calendar'],
    q: { ar: 'ما الهجرة النبوية؟', en: 'What was the Hijra?' },
    a: {
      ar: 'الهجرة انتقال النبي ﷺ وأصحابه من مكة إلى المدينة سنة 622م بعد اشتداد الأذى، وفيها قامت أول دولة للمسلمين. وجعلها عمر بن الخطاب رضي الله عنه بداية التقويم الهجري.',
      en: 'The Hijra was the migration of the Prophet ﷺ and his companions from Makkah to Madinah in 622 CE after persecution grew severe; the first Muslim community-state was established there. ʿUmar ibn al-Khattab made it the starting point of the Hijri calendar.',
    },
    refs: [q('9:40')],
  },

  // ------------------------------------------------------------------------------------------ worship
  {
    id: 'is-prayer', cat: 'worship', subject: 'prayer', level: 'agreed',
    k: ['الصلاه', 'الصلوات الخمس', 'عدد الصلوات', 'فرض الصلاه', 'كم ركعه', 'prayer in islam', 'five prayers', 'salah', 'how many prayers', 'rakah'],
    q: { ar: 'ما الصلاة في الإسلام؟ وكم عدد الصلوات؟', en: 'What is prayer in Islam, and how many prayers are there?' },
    a: {
      ar: 'الصلاة الركن الثاني من أركان الإسلام، وهي خمس صلوات في اليوم والليلة في أوقاتها: الفجر ركعتان، والظهر أربع، والعصر أربع، والمغرب ثلاث، والعشاء أربع. ويُتعلَّم أداؤها من صفة صلاة النبي ﷺ.',
      en: 'Prayer is the second pillar of Islam: five prayers each day and night at their times. Fajr has 2 units (rakʿahs), Dhuhr 4, ʿAsr 4, Maghrib 3 and ʿIsha 4. It is learned from the way the Prophet ﷺ prayed.',
    },
    refs: [q('4:103'), q('2:43'), hd('صحيح البخاري 1395 وصحيح مسلم 19 (خمس صلوات في كل يوم وليلة)، وصحيح البخاري 631 (صلوا كما رأيتموني أصلي)', 'Sahih al-Bukhari 1395 and Muslim 19 (five prayers every day and night); al-Bukhari 631 (“pray as you have seen me pray”)')],
    go: { route: 'learn-prayer' },
  },
  {
    id: 'is-fasting', cat: 'worship', subject: 'fasting', level: 'agreed',
    k: ['الصيام', 'صوم رمضان', 'رمضان', 'الصوم', 'fasting', 'ramadan', 'sawm', 'ayuno', 'jeune'],
    q: { ar: 'ما صيام رمضان؟', en: 'What is fasting in Ramadan?' },
    a: {
      ar: 'صوم رمضان الركن الرابع من أركان الإسلام: الإمساك عن الطعام والشراب والجماع من طلوع الفجر إلى غروب الشمس، بنية التقرب إلى الله، طوال شهر رمضان. ورخّص الله للمريض والمسافر في الفطر مع القضاء، ولمن يشق عليه الصوم دائمًا لكبر أو مرض مزمن الفدية بإطعام مسكين عن كل يوم. وتفاصيل الأحكام تُسأل لأهل العلم.',
      en: 'Fasting Ramadan is the fourth pillar of Islam: abstaining from food, drink and marital relations from dawn until sunset, with the intention of drawing close to Allah, throughout the month of Ramadan. Allah allows the sick and travellers to break the fast and make it up later, and those permanently unable (old age, chronic illness) to feed a poor person for each day. Detailed rulings should be asked of scholars.',
    },
    refs: [q('2:183'), q('2:184'), q('2:185')],
  },
  {
    id: 'is-zakat', cat: 'worship', subject: 'zakat', level: 'difference',
    k: ['الزكاه', 'زكاه المال', 'نصاب', 'zakat', 'zakah', 'charity', 'alms'],
    q: { ar: 'ما الزكاة؟', en: 'What is zakat?' },
    a: {
      ar: 'الزكاة الركن الثالث من أركان الإسلام: حق واجب في المال إذا بلغ النصاب ومضى عليه حول قمري، ومقدارها في النقود ربع العشر (2.5%)، وتُصرف للأصناف الثمانية المذكورة في القرآن. ولزكاة الزروع والأنعام وعروض التجارة والحُلي تفاصيل اختلف فيها العلماء، فاسأل أهل العلم عن حالتك.',
      en: 'Zakat is the third pillar of Islam: an obligatory due on wealth that reaches the minimum threshold (nisab) and is held for a lunar year; on money it is one-fortieth (2.5%), given to the eight categories named in the Quran. Crops, livestock, trade goods and jewellery have detailed rules on which scholars differ, so ask a scholar about your own case.',
    },
    refs: [q('2:43'), q('9:60'), q('9:103')],
  },
  {
    id: 'is-hajj', cat: 'worship', subject: 'hajj', level: 'agreed',
    k: ['الحج', 'العمره', 'مكه', 'الكعبه', 'hajj', 'pilgrimage', 'umrah', 'makkah', 'kaaba'],
    q: { ar: 'ما الحج؟', en: 'What is Hajj?' },
    a: {
      ar: 'الحج الركن الخامس من أركان الإسلام: قصد بيت الله الحرام في مكة لأداء مناسك مخصوصة في شهر ذي الحجة، وهو واجب مرة في العمر على المسلم البالغ القادر بدنيًا وماليًا. والعمرة زيارة البيت في أي وقت من السنة.',
      en: 'Hajj is the fifth pillar of Islam: travelling to the Sacred House in Makkah to perform specific rites in the month of Dhul-Hijjah. It is obligatory once in a lifetime on every adult Muslim who is physically and financially able. ʿUmrah is a visit to the House that can be made at any time of year.',
    },
    refs: [q('3:97'), q('2:196')],
  },
  {
    id: 'is-wudu', cat: 'worship', subject: 'purification', level: 'agreed',
    k: ['الوضوء', 'فرائض الوضوء', 'كيفيه الوضوء', 'الطهاره', 'wudu', 'ablution', 'purification', 'taharah'],
    q: { ar: 'ما الوضوء وكيف أتوضأ؟', en: 'What is wudu and how is it done?' },
    a: {
      ar: 'الوضوء طهارة بالماء شرط لصحة الصلاة. فرائضه المذكورة في القرآن: غسل الوجه، وغسل اليدين إلى المرفقين، ومسح الرأس، وغسل الرجلين إلى الكعبين. ويبدأ بالنية والتسمية وغسل الكفين والمضمضة والاستنشاق كما في السنة. تفاصيله في درس الوضوء.',
      en: 'Wudu is purification with water and a condition for valid prayer. Its obligatory parts named in the Quran are washing the face, washing the arms up to the elbows, wiping the head and washing the feet up to the ankles. As in the Sunnah, one begins with the intention, saying bismillah, washing the hands, rinsing the mouth and the nose. The details are in the wudu lesson.',
    },
    refs: [q('5:6'), hd('صحيح مسلم 223 (الطهور شطر الإيمان)', 'Sahih Muslim 223 (“purification is half of faith”)')], go: { lesson: 'wudu' },
  },
  {
    id: 'is-ghusl', cat: 'worship', subject: 'purification', level: 'agreed',
    k: ['الغسل', 'غسل الجنابه', 'متي يجب الغسل', 'ghusl', 'full bath', 'major ablution'],
    q: { ar: 'ما الغسل ومتى يجب؟', en: 'What is ghusl and when is it required?' },
    a: {
      ar: 'الغسل تعميم البدن بالماء بنية الطهارة. ويجب بأسباب منها الجنابة، وانتهاء الحيض والنفاس. وأقله تعميم الجسد بالماء مع المضمضة والاستنشاق عند كثير من العلماء، وأكمله على صفة غسل النبي ﷺ.',
      en: 'Ghusl is washing the whole body with water with the intention of purification. It is required for reasons including sexual impurity (janabah) and the end of menstruation and post-natal bleeding. At minimum the whole body is washed (many scholars add rinsing the mouth and nose); the complete form follows the Prophet’s ﷺ ghusl.',
    },
    refs: [q('5:6'), q('4:43')],
  },
  {
    id: 'is-tayammum', cat: 'worship', subject: 'purification', level: 'agreed',
    k: ['التيمم', 'لا يوجد ماء', 'tayammum', 'no water', 'dry ablution'],
    q: { ar: 'ما التيمم؟', en: 'What is tayammum?' },
    a: {
      ar: 'التيمم طهارة بالصعيد الطاهر بدل الماء عند فقده أو العجز عن استعماله لمرض ونحوه: يضرب بيديه الصعيد ويمسح وجهه وكفيه. وهو من تيسير الله على عباده.',
      en: 'Tayammum is purification with clean earth in place of water when water is unavailable or cannot be used (for example because of illness): one strikes the earth with the hands and wipes the face and hands. It is one of Allah’s ways of making things easy.',
    },
    refs: [q('5:6'), q('4:43')],
  },
  {
    id: 'is-jumuah', cat: 'worship', subject: 'prayer', level: 'agreed',
    k: ['صلاه الجمعه', 'الجمعه', 'friday prayer', 'jumuah', 'jumu ah'],
    q: { ar: 'ما صلاة الجمعة؟', en: 'What is the Friday prayer?' },
    a: {
      ar: 'صلاة الجمعة ركعتان تُصلّى جماعة في المسجد وقت الظهر يوم الجمعة، تسبقهما خطبة، وتجب على الرجال المقيمين القادرين. والمرأة والمسافر إذا لم يصليا الجمعة صليا الظهر.',
      en: 'The Friday prayer is two units prayed in congregation at the mosque at Dhuhr time on Friday, preceded by a sermon. It is obligatory on resident, able men; women and travellers who do not attend pray Dhuhr instead.',
    },
    refs: [q('62:9')],
  },
  {
    id: 'is-dua', cat: 'worship', subject: 'worship', level: 'agreed',
    k: ['الدعاء', 'كيف ادعو', 'ادعيه', 'dua', 'supplication', 'how to make dua'],
    q: { ar: 'كيف أدعو الله؟', en: 'How do I make dua (supplication)?' },
    a: {
      ar: 'الدعاء عبادة، والله قريب يجيب الدعاء. ادعُ بأي لغة وفي أي وقت، وابدأ بحمد الله والصلاة على النبي ﷺ، وأكثر من الدعاء في السجود وفي آخر الليل. وفي صفحة الأذكار أدعية مأثورة.',
      en: 'Supplication is worship, and Allah is near and answers it. Call upon Him in any language and at any time; begin by praising Allah and sending blessings on the Prophet ﷺ, and supplicate often in prostration and in the last part of the night. The adhkar page has supplications from the Sunnah.',
    },
    refs: [q('2:186'), q('40:60')], go: { route: 'adhkar' },
  },
  {
    id: 'is-dhikr', cat: 'worship', subject: 'worship', level: 'agreed',
    k: ['ذكر الله', 'فضل الذكر', 'التسبيح', 'remembrance of allah', 'dhikr virtue'],
    q: { ar: 'ما فضل ذكر الله؟', en: 'What is the virtue of remembering Allah?' },
    a: {
      ar: 'ذكر الله من أيسر العبادات وأعظمها، وبه تطمئن القلوب. ومنه التسبيح والتحميد والتكبير والتهليل والاستغفار، وأذكار الصباح والمساء.',
      en: 'Remembering Allah is among the easiest and greatest acts of worship, and through it hearts find rest. It includes glorifying, praising and magnifying Him, declaring His oneness, seeking forgiveness, and the morning and evening adhkar.',
    },
    refs: [q('13:28'), q('33:41'), q('2:152')], go: { route: 'adhkar' },
  },

  // ------------------------------------------------------------------------------------------ manners and daily life
  {
    id: 'is-manners', cat: 'ethics', subject: 'ethics', level: 'agreed',
    k: ['الاخلاق', 'الاخلاق في الاسلام', 'الاداب', 'manners', 'ethics', 'good character', 'morals'],
    q: { ar: 'ما مكانة الأخلاق في الإسلام؟', en: 'What place do good manners have in Islam?' },
    a: {
      ar: 'الأخلاق من صميم الدين: الصدق، والأمانة، والوفاء بالعهد، وبر الوالدين، وصلة الرحم، والإحسان إلى الجار، والرحمة بالناس والحيوان، وحفظ اللسان. ونهى القرآن عن السخرية وسوء الظن والتجسس والغيبة.',
      en: 'Good character is at the heart of the religion: truthfulness, trustworthiness, keeping promises, kindness to parents and relatives, good treatment of neighbours, mercy to people and animals, and guarding one’s tongue. The Quran forbids mockery, suspicion, spying and backbiting.',
    },
    refs: [q('49:11'), q('49:12'), q('17:23'), hd('صحيح البخاري 6018 وصحيح مسلم 47 (فليقل خيرًا أو ليصمت)', 'Sahih al-Bukhari 6018 and Muslim 47 (“let him speak good or remain silent”)')],
  },
  {
    id: 'is-parents', cat: 'ethics', subject: 'ethics', level: 'agreed',
    k: ['بر الوالدين', 'الوالدين', 'الام', 'الاب', 'parents', 'kindness to parents', 'mother', 'father'],
    q: { ar: 'ما مكانة بر الوالدين؟', en: 'How important is kindness to parents?' },
    a: {
      ar: 'قرن الله الإحسان إلى الوالدين بعبادته، وأمر بالتواضع لهما والدعاء لهما، حتى لو كانا غير مسلمين: فيُصاحَبان بالمعروف في الدنيا، ولا يُطاعان في معصية الله.',
      en: 'Allah joins kindness to parents with worshipping Him, and commands humility towards them and praying for them, even if they are not Muslim: one keeps good company with them in this world, while not obeying them in disobeying Allah.',
    },
    refs: [q('17:23'), q('17:24'), q('31:15')],
  },
  {
    id: 'is-salam', cat: 'ethics', subject: 'ethics', level: 'agreed',
    k: ['السلام عليكم معناها', 'افشاء السلام', 'التحيه في الاسلام', 'islamic greeting', 'meaning of salam'],
    q: { ar: 'ما تحية الإسلام؟', en: 'What is the Islamic greeting?' },
    a: {
      ar: 'تحية الإسلام: «السلام عليكم ورحمة الله وبركاته»، والرد: «وعليكم السلام ورحمة الله وبركاته». وأمر الله بأن نرد التحية بأحسن منها أو بمثلها.',
      en: 'The Islamic greeting is “as-salamu ʿalaykum wa rahmatullahi wa barakatuh” (peace be upon you, and Allah’s mercy and blessings), and the reply is “wa ʿalaykum as-salam wa rahmatullahi wa barakatuh”. Allah commands us to return a greeting with a better one or its like.',
    },
    refs: [q('4:86')],
  },
  {
    id: 'is-daily', cat: 'ethics', subject: 'ethics', level: 'guidance',
    k: ['عادات المسلم اليوميه', 'يوم المسلم', 'سنن يوميه', 'daily practices', 'daily routine', 'muslim day'],
    q: { ar: 'ما العادات اليومية للمسلم؟', en: 'What are a Muslim’s daily practices?' },
    a: {
      ar: 'الصلوات الخمس في أوقاتها، وأذكار الصباح والمساء، وقراءة ورد من القرآن ولو قليلًا، والتسمية قبل الطعام والأكل باليمين، والدعاء، وحسن المعاملة. والقليل الدائم أحب إلى الله من الكثير المنقطع.',
      en: 'The five prayers on time, the morning and evening adhkar, a portion of the Quran even if small, saying bismillah before eating and eating with the right hand, supplication, and treating people well. A little done consistently is more beloved to Allah than a lot done occasionally.',
    },
    refs: [hd('صحيح البخاري 5376 وصحيح مسلم 2022 (سمِّ الله وكل بيمينك)، وصحيح البخاري 6464 وصحيح مسلم 783 (أحب الأعمال إلى الله أدومها وإن قل)', 'Sahih al-Bukhari 5376 and Muslim 2022 (“say bismillah and eat with your right hand”); al-Bukhari 6464 and Muslim 783 (the most beloved deeds are the most consistent, even if small)')],
    go: { route: 'journey/basics' },
  },
  {
    id: 'is-repentance', cat: 'ethics', subject: 'ethics', level: 'agreed',
    k: ['التوبه', 'اذنبت', 'هل يغفر الله', 'الاستغفار', 'repentance', 'forgiveness', 'tawbah', 'i sinned'],
    q: { ar: 'أذنبت ذنبًا، فهل يغفر الله لي؟', en: 'I have sinned. Will Allah forgive me?' },
    a: {
      ar: 'باب التوبة مفتوح، والله يغفر الذنوب جميعًا لمن تاب، فلا تيأس من رحمته. التوبة الصادقة: ترك الذنب، والندم عليه، والعزم على عدم العودة، ورد الحقوق إلى أهلها إن كان فيه حق لأحد.',
      en: 'The door of repentance is open, and Allah forgives all sins for whoever repents, so never despair of His mercy. Sincere repentance means leaving the sin, regretting it, resolving not to return to it, and returning any rights owed to others.',
    },
    refs: [q('39:53'), q('66:8'), q('25:70')],
  },
  {
    id: 'is-food', cat: 'ethics', subject: 'ethics', level: 'agreed',
    k: ['الطعام الحلال', 'ما المحرم من الطعام', 'الخنزير', 'الخمر', 'halal food', 'pork', 'alcohol', 'what can muslims eat'],
    q: { ar: 'ما الطعام والشراب المحرم على المسلم؟', en: 'What food and drink are forbidden for Muslims?' },
    a: {
      ar: 'الأصل في الطعام الحل. وحرّم القرآن الميتة والدم ولحم الخنزير وما ذُبح لغير الله، وحرّم الخمر وكل مسكر. ولبعض المسائل (كذبائح أهل الكتاب وبعض الأطعمة) تفاصيل يُسأل عنها أهل العلم.',
      en: 'The basic rule is that food is permitted. The Quran forbids carrion, blood, pork and what is slaughtered in the name of other than Allah, and forbids wine and every intoxicant. Some questions (such as meat of the People of the Book and certain foods) have details best asked of scholars.',
    },
    refs: [q('2:168'), q('5:3'), q('5:90')],
  },

  // ------------------------------------------------------------------------------------------ common questions
  {
    id: 'is-jesus', cat: 'common', subject: 'islam', level: 'agreed',
    k: ['عيسي', 'المسيح', 'عيسي في الاسلام', 'مريم', 'jesus', 'jesus in islam', 'mary', 'isa'],
    q: { ar: 'ما مكانة عيسى عليه السلام في الإسلام؟', en: 'Who is Jesus in Islam?' },
    a: {
      ar: 'عيسى ابن مريم عليه السلام من أولي العزم من الرسل، وُلد من أم عذراء بمعجزة من الله، وأيّده الله بالمعجزات، ويؤمن به المسلمون ويحبونه. ويعتقدون أنه عبد الله ورسوله وليس إلهًا ولا ابنًا لله. وسُمّيت سورة كاملة باسم أمه مريم.',
      en: 'Jesus son of Mary, peace be upon him, is one of the greatest messengers. He was born to a virgin mother by a miracle of Allah and supported with miracles, and Muslims believe in him and love him. They believe he is the servant and messenger of Allah, not God nor the son of God. A whole surah is named after his mother Mary.',
    },
    refs: [q('19:16'), q('3:45'), q('5:75')],
  },
  {
    id: 'is-worship-muhammad', cat: 'common', subject: 'islam', level: 'agreed',
    k: ['هل يعبد المسلمون محمد', 'المحمديه', 'do muslims worship muhammad', 'mohammedans'],
    q: { ar: 'هل يعبد المسلمون محمدًا ﷺ؟', en: 'Do Muslims worship Muhammad ﷺ?' },
    a: {
      ar: 'لا. المسلمون يعبدون الله وحده. ومحمد ﷺ بشر وعبد لله ورسوله، يحبه المسلمون ويتبعونه ويصلّون عليه، لكنهم لا يعبدونه.',
      en: 'No. Muslims worship Allah alone. Muhammad ﷺ is a human being, a servant of Allah and His messenger; Muslims love him, follow him and send blessings upon him, but do not worship him.',
    },
    refs: [q('18:110'), q('3:144')],
  },
  {
    id: 'is-compulsion', cat: 'common', subject: 'islam', level: 'agreed',
    k: ['forced', 'forced to become muslim', 'يجبر', 'لا اكراه في الدين', 'الاكراه', 'هل يجبر', 'forced to convert', 'compulsion in religion', 'freedom of belief'],
    q: { ar: 'هل يُجبر أحد على الدخول في الإسلام؟', en: 'Is anyone forced to become Muslim?' },
    a: {
      ar: 'لا. قال الله تعالى إنه لا إكراه في الدين، والإيمان لا يكون إلا عن قناعة وصدق في القلب. ودور المسلم البيان بالحكمة والموعظة الحسنة.',
      en: 'No. Allah states that there is no compulsion in religion, and faith can only come from conviction and sincerity in the heart. A Muslim’s role is to explain with wisdom and good advice.',
    },
    refs: [q('2:256'), q('16:125')],
  },
  {
    id: 'is-women', cat: 'common', subject: 'islam', level: 'agreed',
    k: ['المراه في الاسلام', 'حقوق المراه', 'women in islam', 'women rights'],
    q: { ar: 'ما مكانة المرأة في الإسلام؟', en: 'What is the status of women in Islam?' },
    a: {
      ar: 'خلق الله الرجل والمرأة من نفس واحدة، وهما متساويان في الكرامة الإنسانية وفي ثواب العمل الصالح، وأوصى الإسلام بالأم والبنت والزوجة. ولبعض الأحكام تفاصيل تختلف بين الرجل والمرأة، تُعرف من مصادرها الموثوقة وأهل العلم.',
      en: 'Allah created men and women from a single soul; they are equal in human dignity and in the reward of good deeds, and Islam commands special care for mothers, daughters and wives. Some rulings differ in detail between men and women; these are learned from reliable sources and scholars.',
    },
    refs: [q('4:1'), q('16:97'), q('33:35')],
  },
  {
    id: 'is-differences', cat: 'common', subject: 'islam', level: 'difference',
    k: ['المذاهب', 'لماذا يختلف العلماء', 'الخلاف الفقهي', 'madhhab', 'schools of thought', 'why do scholars differ'],
    q: { ar: 'لماذا يختلف العلماء في بعض المسائل؟', en: 'Why do scholars differ on some questions?' },
    a: {
      ar: 'أصول الدين وأركانه متفق عليها. أما بعض المسائل الفرعية فيختلف فيها العلماء لأسباب منها: فهم النص، وثبوت الحديث، واختلاف الأحوال. والمذاهب الفقهية المشهورة (الحنفي والمالكي والشافعي والحنبلي) مدارس علمية معتبرة، ويسع المسلمَ أن يتبع عالمًا موثوقًا.',
      en: 'The foundations and pillars of the religion are agreed upon. On some secondary questions scholars differ for reasons such as how a text is understood, whether a hadith is established, and differing circumstances. The well-known schools of law (Hanafi, Maliki, Shafiʿi and Hanbali) are respected scholarly traditions, and a Muslim may follow a trustworthy scholar.',
    },
    refs: [q('4:59'), q('16:43')],
  },

  // ------------------------------------------------------------------------------------------ embracing Islam
  {
    id: 'nm-become', cat: 'new_muslim', subject: 'new_muslim', level: 'agreed',
    k: ['كيف اصبح مسلما', 'كيف اسلم', 'اريد ان اسلم', 'الدخول في الاسلام', 'اعتناق الاسلام', 'اريد الاسلام', 'become muslim', 'become a muslim', 'convert to islam', 'embrace islam', 'how to become muslim', 'revert', 'hacerme musulman', 'convertirme al islam', 'devenir musulman', 'me convertir a l islam'],
    q: { ar: 'كيف أصبح مسلمًا؟', en: 'How can I become a Muslim?', es: '¿Cómo puedo hacerme musulmán?', fr: 'Comment devenir musulman ?' },
    a: {
      ar: 'مرحبًا بك، وسؤالك هذا خير عظيم. يدخل الإنسان في الإسلام بأن ينطق الشهادتين صادقًا مؤمنًا بمعناهما:\n«أشهد أن لا إله إلا الله، وأشهد أن محمدًا رسول الله».\nومعناها: أقرّ بقلبي ولساني أنه لا معبود بحق إلا الله وحده، وأن محمدًا ﷺ عبده ورسوله.\nلا يُشترط مسجد ولا احتفال ولا شهود ولا إذن من أحد، ولا يُشترط أن تكون كاملًا قبل أن تُسلم؛ يكفي الصدق. ويغفر الله بالإسلام ما كان قبله.\nبعد ذلك تعلّم بالتدريج: الطهارة والصلاة أولًا، ثم القرآن بدءًا بالفاتحة، واستعن بمسلم أو مركز إسلامي موثوق قريب منك. وإن أحببت فمسار «أساسيات الإسلام» في هذا الموقع يرافقك خطوة بخطوة.',
      en: 'You are very welcome, and this is a wonderful question. A person enters Islam by sincerely saying the two testimonies of faith (the Shahada) while believing in their meaning:\n“Ash-hadu an lā ilāha illā Allāh, wa ash-hadu anna Muḥammadan rasūlu Allāh.”\nMeaning: “I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.”\nNo mosque, ceremony, witnesses or anyone’s permission is required, and you do not need to become perfect first; sincerity is enough. Allah forgives what came before through Islam.\nAfterwards, learn gradually: purification and prayer first, then the Quran starting with al-Fatiha, and seek help from a trustworthy Muslim or Islamic centre near you. If you like, the “Basics of Islam” path on this site will guide you step by step.',
      es: 'Bienvenido; es una pregunta maravillosa. Una persona entra en el islam pronunciando sinceramente el testimonio de fe (la Shahada) y creyendo en su significado:\n«Ash-hadu an lā ilāha illā Allāh, wa ash-hadu anna Muḥammadan rasūlu Allāh».\nSignifica: «Atestiguo que no hay divinidad digna de adoración excepto Allah, y atestiguo que Muhammad es el Mensajero de Allah».\nNo se necesita mezquita, ceremonia, testigos ni permiso de nadie, y no hace falta ser perfecto antes; basta la sinceridad. Con el islam, Allah perdona lo anterior.\nDespués, aprende poco a poco: la purificación y la oración primero, luego el Corán empezando por al-Fatiha, y busca la ayuda de un musulmán o un centro islámico de confianza cerca de ti.',
      fr: 'Sois le bienvenu ; c’est une très belle question. On entre dans l’islam en prononçant sincèrement les deux attestations de foi (la Shahada) et en croyant à leur sens :\n« Ash-hadu an lā ilāha illā Allāh, wa ash-hadu anna Muḥammadan rasūlu Allāh ».\nSens : « J’atteste qu’il n’y a de divinité digne d’adoration qu’Allah, et j’atteste que Muhammad est le Messager d’Allah ».\nAucune mosquée, cérémonie, témoin ou autorisation n’est exigé, et il n’est pas nécessaire d’être parfait avant ; la sincérité suffit. Par l’islam, Allah pardonne ce qui précède.\nEnsuite, apprends progressivement : la purification et la prière d’abord, puis le Coran en commençant par al-Fatiha, et cherche l’aide d’un musulman ou d’un centre islamique de confiance près de chez toi.',
    },
    refs: [q('3:19'), q('8:38'), hd('صحيح مسلم 121 (الإسلام يهدم ما كان قبله)', 'Sahih Muslim 121 (“Islam wipes out what came before it”)')],
    go: { route: 'journey/basics' }, widget: 'shahada',
  },
  {
    id: 'nm-shahada', cat: 'new_muslim', subject: 'new_muslim', level: 'agreed',
    k: ['الشهاده', 'الشهادتين', 'معني الشهادتين', 'معني لا اله الا الله', 'shahada', 'testimony of faith', 'meaning of shahada', 'la ilaha illa allah'],
    q: { ar: 'ما معنى الشهادتين؟', en: 'What does the Shahada mean?', es: '¿Qué significa la Shahada?', fr: 'Que signifie la Shahada ?' },
    a: {
      ar: '«أشهد أن لا إله إلا الله»: أقرّ وأعترف أنه لا يستحق العبادة إلا الله وحده، فلا أعبد غيره ولا أدعو سواه.\n«وأشهد أن محمدًا رسول الله»: أصدّقه فيما أخبر، وأطيعه فيما أمر، وأجتنب ما نهى عنه، وأعبد الله بما شرعه.\nهاتان الشهادتان مفتاح الإسلام وأول أركانه.',
      en: '“I bear witness that there is no deity worthy of worship except Allah”: I acknowledge that only Allah deserves worship, so I worship and call upon no one else.\n“And I bear witness that Muhammad is the Messenger of Allah”: I believe what he conveyed, follow what he commanded, avoid what he forbade, and worship Allah in the way he taught.\nThese two testimonies are the key to Islam and its first pillar.',
      es: '«Atestiguo que no hay divinidad digna de adoración excepto Allah»: reconozco que solo Allah merece ser adorado.\n«Y atestiguo que Muhammad es el Mensajero de Allah»: creo en lo que transmitió, sigo lo que ordenó y adoro a Allah como él enseñó.\nEstos dos testimonios son la llave del islam y su primer pilar.',
      fr: '« J’atteste qu’il n’y a de divinité digne d’adoration qu’Allah » : je reconnais que seul Allah mérite d’être adoré.\n« Et j’atteste que Muhammad est le Messager d’Allah » : je crois ce qu’il a transmis, je suis ce qu’il a ordonné et j’adore Allah comme il l’a enseigné.\nCes deux attestations sont la clé de l’islam et son premier pilier.',
    },
    refs: [q('47:19'), q('48:29')], widget: 'shahada',
  },
  {
    id: 'nm-after', cat: 'new_muslim', subject: 'new_muslim', level: 'guidance',
    k: ['ماذا افعل بعد الاسلام', 'اسلمت حديثا', 'مسلم جديد', 'بعد النطق بالشهاده', 'what after shahada', 'new muslim', 'just converted', 'i became muslim', 'nuevo musulman', 'nouveau musulman'],
    q: { ar: 'أسلمت حديثًا، فماذا أفعل الآن؟', en: 'I have just become Muslim. What should I do now?', es: 'Acabo de hacerme musulmán. ¿Qué hago ahora?', fr: 'Je viens de devenir musulman. Que faire maintenant ?' },
    a: {
      ar: 'مبارك عليك، وفقك الله وثبتك. خذ الأمور بهدوء وتدرّج:\n1. تعلّم الطهارة (الوضوء والغسل).\n2. تعلّم الصلاة وابدأ بأدائها بما تستطيع، واحفظ الفاتحة شيئًا فشيئًا.\n3. اقرأ ترجمة معاني القرآن بلغتك واستمع إليه.\n4. تعرّف على أركان الإسلام والإيمان.\n5. ابحث عن مسلم أو مركز إسلامي موثوق يساعدك ويجيب أسئلتك.\nولا تحمّل نفسك ما لا تطيق؛ فالله يحب منك الصدق والاستمرار ولو كان العمل قليلًا.',
      en: 'Congratulations, and may Allah make you firm. Take things calmly and gradually:\n1. Learn purification (wudu and ghusl).\n2. Learn the prayer and start praying as best you can, memorising al-Fatiha bit by bit.\n3. Read a translation of the Quran’s meanings in your language and listen to it.\n4. Learn the pillars of Islam and of faith.\n5. Find a trustworthy Muslim or Islamic centre to help you and answer your questions.\nDo not burden yourself beyond your ability: Allah loves sincerity and consistency, even in small deeds.',
      es: 'Enhorabuena, que Allah te dé firmeza. Ve con calma y poco a poco:\n1. Aprende la purificación (wudu y ghusl).\n2. Aprende la oración y empieza a rezar como puedas, memorizando al-Fatiha poco a poco.\n3. Lee una traducción del significado del Corán y escúchalo.\n4. Aprende los pilares del islam y de la fe.\n5. Busca un musulmán o un centro islámico de confianza que te ayude.\nNo te exijas más de lo que puedes: Allah ama la sinceridad y la constancia.',
      fr: 'Félicitations, qu’Allah t’affermisse. Avance calmement et progressivement :\n1. Apprends la purification (wudu et ghusl).\n2. Apprends la prière et commence à prier comme tu peux, en mémorisant al-Fatiha petit à petit.\n3. Lis une traduction du sens du Coran et écoute-le.\n4. Apprends les piliers de l’islam et de la foi.\n5. Trouve un musulman ou un centre islamique de confiance pour t’aider.\nNe te charge pas au-delà de tes capacités : Allah aime la sincérité et la constance.',
    },
    refs: [q('2:286'), hd('صحيح البخاري 6464 وصحيح مسلم 783 (أحب الأعمال أدومها وإن قل)', 'Sahih al-Bukhari 6464 and Muslim 783 (the most beloved deeds are the most consistent)')],
    go: { route: 'journey/basics' },
  },
  {
    id: 'nm-perfect', cat: 'new_muslim', subject: 'new_muslim', level: 'guidance',
    k: ['لست مستعدا', 'لا استطيع ان اكون كاملا', 'اخاف ان لا التزم', 'ذنوبي كثيره', 'not ready', 'i am not perfect', 'too many sins', 'afraid i cannot practise'],
    q: { ar: 'أريد الإسلام لكنني لست كاملًا ولا أعرف كل شيء، فهل أنتظر؟', en: 'I want to embrace Islam but I am not perfect and don’t know everything. Should I wait?' },
    a: {
      ar: 'لا يُشترط أن تكون كاملًا أو عالمًا بكل الأحكام قبل الإسلام. الإسلام يمحو ما قبله، ثم تتعلم وتعمل بالتدريج كما فعل الصحابة رضي الله عنهم. والقرار لك وحدك، فخذ وقتك في التفكير والسؤال بلا ضغط من أحد.',
      en: 'You do not need to be perfect, or to know every ruling, before embracing Islam. Islam wipes out what came before, and then you learn and practise gradually, as the Companions did. The decision is yours alone: take your time to reflect and ask, without pressure from anyone.',
      es: 'No necesitas ser perfecto ni conocer todas las normas antes de abrazar el islam. El islam borra lo anterior y luego se aprende poco a poco. La decisión es solo tuya: tómate tu tiempo, sin presión de nadie.',
      fr: 'Tu n’as pas besoin d’être parfait ni de connaître toutes les règles avant d’embrasser l’islam. L’islam efface ce qui précède, puis on apprend progressivement. La décision t’appartient : prends ton temps, sans pression de personne.',
    },
    refs: [q('39:53'), q('8:38'), q('2:256'), hd('صحيح مسلم 121', 'Sahih Muslim 121')],
  },
  {
    id: 'nm-ghusl', cat: 'new_muslim', subject: 'new_muslim', level: 'difference',
    k: ['الغسل عند الاسلام', 'هل يجب الاغتسال بعد الاسلام', 'ghusl after converting', 'shower after shahada', 'bath when becoming muslim'],
    q: { ar: 'هل يجب أن أغتسل عندما أُسلم؟', en: 'Do I need to take a bath (ghusl) when I become Muslim?' },
    a: {
      ar: 'ورد أن النبي ﷺ أمر بعض من أسلم أن يغتسل. واختلف العلماء: فمنهم من قال إنه واجب، ومنهم من قال إنه مستحب إلا إذا وُجد سبب للغسل كالجنابة. والأحوط أن تغتسل، وليس الغسل شرطًا لصحة الإسلام؛ فالإسلام يحصل بالنطق بالشهادتين.',
      en: 'It is reported that the Prophet ﷺ told some people who embraced Islam to take a ghusl. Scholars differ: some say it is obligatory, others that it is recommended unless there is another reason for ghusl (such as janabah). It is better to take it, but ghusl is not a condition for your Islam to be valid; you become Muslim by saying the Shahada.',
    },
    refs: [hd('سنن أبي داود 355 (أمر قيس بن عاصم بالاغتسال لما أسلم)', 'Sunan Abi Dawud 355 (Qays ibn ʿAsim told to bathe when he embraced Islam)')],
  },
  {
    id: 'nm-name', cat: 'new_muslim', subject: 'new_muslim', level: 'guidance',
    k: ['تغيير الاسم', 'هل اغير اسمي', 'اسم اسلامي', 'change my name', 'muslim name', 'islamic name'],
    q: { ar: 'هل يجب أن أغيّر اسمي إذا أسلمت؟', en: 'Do I have to change my name when I become Muslim?' },
    a: {
      ar: 'لا يجب تغيير الاسم. يُغيَّر فقط إذا كان معناه مخالفًا للإسلام، كالتعبيد لغير الله. ولك أن تختار اسمًا إسلاميًا إن أحببت، لكنه ليس شرطًا.',
      en: 'You do not have to change your name. It is changed only if its meaning contradicts Islam, such as a name declaring servitude to other than Allah. You may choose an Islamic name if you wish, but it is not a requirement.',
    },
    refs: [],
  },
  {
    id: 'nm-family', cat: 'new_muslim', subject: 'new_muslim', level: 'guidance',
    k: ['عائلتي غير مسلمه', 'اهلي ليسوا مسلمين', 'اخبار عائلتي', 'family not muslim', 'tell my family', 'my parents are not muslim'],
    q: { ar: 'عائلتي ليست مسلمة، فكيف أتعامل معها؟', en: 'My family is not Muslim. How should I treat them?' },
    a: {
      ar: 'يأمر الإسلام ببر الوالدين وحسن صحبتهما ولو لم يكونا مسلمين، وبالإحسان إلى الأقارب. كن رفيقًا صبورًا، واختر الوقت والأسلوب المناسبين لإخبارهم، وأظهر لهم أخلاق الإسلام في معاملتك.',
      en: 'Islam commands kindness and good company towards parents even if they are not Muslim, and good treatment of relatives. Be gentle and patient, choose a suitable time and way to tell them, and let them see the character of Islam in how you treat them.',
    },
    refs: [q('31:15'), q('60:8')],
  },
  {
    id: 'nm-learn-prayer', cat: 'new_muslim', subject: 'new_muslim', level: 'guidance',
    k: ['لا اعرف كيف اصلي', 'اصلي وانا لا احفظ', 'مسلم جديد والصلاه', 'new muslim prayer', 'i do not know how to pray', 'pray without arabic'],
    q: { ar: 'أسلمت ولا أعرف الصلاة بعد ولا أحفظ الفاتحة، فماذا أفعل؟', en: 'I became Muslim but don’t know how to pray or know al-Fatiha yet. What do I do?' },
    a: {
      ar: 'ابدأ بتعلم الوضوء وحركات الصلاة، واحفظ الفاتحة تدريجيًا مستعينًا بالاستماع والتكرار. وإلى أن تحفظها ذكر العلماء أن يأتي المسلم بما يستطيع من الذكر، مثل التسبيح والتحميد والتهليل والتكبير، والأفضل أن تسأل إمامًا أو عالمًا قريبًا منك ليعلّمك. والله لا يكلف نفسًا إلا وسعها.',
      en: 'Start by learning wudu and the movements of the prayer, and memorise al-Fatiha gradually by listening and repeating. Until you know it, scholars mention that a Muslim says what he can of remembrance (such as subhan Allah, al-hamdu lillah, la ilaha illa Allah, Allahu akbar); best of all, ask an imam or scholar near you to teach you. Allah does not burden a soul beyond its capacity.',
    },
    refs: [q('2:286'), q('64:16')], go: { route: 'journey/prayer' },
  },
  {
    id: 'nm-community', cat: 'new_muslim', subject: 'new_muslim', level: 'guidance',
    k: ['مركز اسلامي', 'مسجد قريب', 'من يعلمني', 'اين اجد مسلمين', 'islamic centre', 'mosque near me', 'find a teacher', 'muslim community'],
    q: { ar: 'كيف أجد من يعلّمني الإسلام؟', en: 'How do I find someone to teach me Islam?' },
    a: {
      ar: 'ابحث عن مسجد أو مركز إسلامي قريب منك، فكثير منها يقدّم دروسًا للمسلمين الجدد بلغات مختلفة. اختر من عُرف بالعلم والاعتدال، واحرص على أخذ العلم من مصادر موثوقة.',
      en: 'Look for a mosque or Islamic centre near you; many offer classes for new Muslims in various languages. Choose people known for knowledge and balance, and take knowledge from reliable sources.',
    },
    refs: [q('16:43')],
  },
];

/** Interface-language text of an entry field, falling back to English then Arabic. */
export const pickLang = (obj, lang) => (obj ? obj[lang] ?? obj.en ?? obj.ar : '');
