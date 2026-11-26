// Website knowledge base of «💬 مساعد الموقع»: how to use every part of the site, in four languages.
//
// Rules for every record (checked by tests/unit/assistant.test.mjs):
//   * the answer describes the interface as it is (labels in «…» are the real button and section names);
//     nothing is promised that the site does not do (e.g. there is no "share ayah" button, and the answer says so);
//   * `action` points to a dialog, a section or a command that exists (index.html / features/assistant.js);
//   * `lesson` is the id of a real lesson (data/prayer-lessons.js or data/academy.js);
//   * `legacy: '<id>'` reuses the reviewed help_<id>_q / help_<id> strings of translations-assistant.js,
//     so the 26 original topics are not duplicated here;
//   * `keys` are extra ways people ask (dialects, synonyms); the questions in four languages are indexed too.
// Answers use one line per paragraph; lines starting with «•» or «1.» are shown as a list.

export const FAQ_CATEGORIES = {
  navigation: { icon: '🧭', title: { ar: 'التنقل في الموقع', en: 'Getting around', es: 'Navegar por el sitio', fr: 'Navigation' } },
  reading: { icon: '📖', title: { ar: 'قراءة القرآن', en: 'Reading the Quran', es: 'Leer el Corán', fr: 'Lire le Coran' } },
  audio: { icon: '🎧', title: { ar: 'الاستماع والتلاوة', en: 'Audio and recitation', es: 'Audio y recitación', fr: 'Audio et récitation' } },
  memorization: { icon: '🎙️', title: { ar: 'الحفظ والمراجعة', en: 'Memorisation and revision', es: 'Memorización y repaso', fr: 'Mémorisation et révision' } },
  prayer_learning: { icon: '🕋', title: { ar: 'تعلّم الصلاة', en: 'Learning the prayer', es: 'Aprender la oración', fr: 'Apprendre la prière' } },
  academy: { icon: '🎓', title: { ar: 'الأكاديمية والتعلّم', en: 'Academy and learning', es: 'Academia y aprendizaje', fr: 'Académie et apprentissage' } },
  adhkar: { icon: '📿', title: { ar: 'الأذكار وحصن المسلم', en: 'Adhkar and Hisn al-Muslim', es: 'Adhkar y Hisn al-Muslim', fr: 'Adhkar et Citadelle du musulman' } },
  personal: { icon: '👤', title: { ar: 'بياناتي وأدواتي', en: 'Your data and tools', es: 'Tus datos y herramientas', fr: 'Vos données et outils' } },
  prayer_times: { icon: '🕌', title: { ar: 'مواقيت الصلاة والتنبيهات', en: 'Prayer times and notifications', es: 'Horarios y avisos', fr: 'Horaires et notifications' } },
  support: { icon: '🛠️', title: { ar: 'الدعم الفني', en: 'Technical support', es: 'Soporte técnico', fr: 'Assistance technique' } },
};

/** A new record. `t` = { ar: [question, answer], en: [...], es: [...], fr: [...] }. */
const F = (id, cat, entity, action, keys, t, extra = {}) => ({
  id, cat, entity, action,
  keys,
  q: { ar: t.ar[0], en: t.en[0], es: t.es[0], fr: t.fr[0] },
  a: { ar: t.ar[1], en: t.en[1], es: t.es[1], fr: t.fr[1] },
  ...extra,
});
/** A record whose texts are the original help_<legacy> strings. */
const L = (id, legacy, cat, entity, action, keys, extra = {}) => ({ id, legacy, cat, entity, action, keys, ...extra });

export const SITE_FAQ = [
  // ======================================================================= A. navigation
  F('site_what', 'navigation', null, { anchor: '#home' }, ['ما هو الموقع', 'ما هذا الموقع', 'عن ماذا الموقع', 'شو هالموقع', 'what is this site', 'what is this website', 'que es este sitio', 'qu est ce que ce site'], {
    ar: ['ما هو هذا الموقع؟', 'موقع «القرآن الكريم» موقع تعليمي مجاني لخدمة كتاب الله: مصحف كامل (114 سورة) مع التفسير الميسر والترجمة، وتلاوات لعدة قرّاء، ومختبر للحفظ والتسميع، وتعليم الصلاة خطوة بخطوة، وأكاديمية بدورات قصيرة، وحصن المسلم، ومواقيت الصلاة.\nلا يحتاج إلى حساب: تقدمك يُحفظ على جهازك فقط.'],
    en: ['What is this website?', '“The Holy Quran” is a free educational site serving the Book of Allah: the full Mushaf (114 surahs) with Tafsir al-Muyassar and translation, recitations by several reciters, a memorisation and recitation lab, step-by-step prayer lessons, an academy of short courses, Hisn al-Muslim and prayer times.\nNo account is needed: your progress is saved on your device only.'],
    es: ['¿Qué es este sitio web?', '«El Sagrado Corán» es un sitio educativo gratuito al servicio del Libro de Allah: el Mushaf completo (114 suras) con el Tafsir al-Muyassar y traducción, recitaciones de varios recitadores, un laboratorio de memorización, lecciones de oración paso a paso, una academia de cursos breves, Hisn al-Muslim y horarios de oración.\nNo hace falta cuenta: tu progreso se guarda solo en tu dispositivo.'],
    fr: ['Qu’est-ce que ce site ?', '« Le Saint Coran » est un site éducatif gratuit au service du Livre d’Allah : le Mushaf complet (114 sourates) avec le Tafsir al-Muyassar et une traduction, des récitations de plusieurs récitateurs, un laboratoire de mémorisation, des leçons de prière pas à pas, une académie de cours courts, la Citadelle du musulman et les horaires de prière.\nAucun compte n’est nécessaire : votre progression reste sur votre appareil.'],
  }, { icon: '🕌', related: ['site_features', 'site_navigate', 'privacy_data'] }),

  F('site_features', 'navigation', null, null, ['ماذا استطيع ان افعل', 'شو فيه بالموقع', 'ميزات الموقع', 'خدمات الموقع', 'كيف استخدم الموقع', 'what can i do here', 'features', 'how do i use the site', 'que puedo hacer', 'funciones', 'que puis je faire', 'fonctionnalites'], {
    ar: ['ماذا يمكنني أن أفعل في الموقع؟', 'أهم ما يمكنك فعله:\n• 📖 قراءة أي سورة مع التفسير والترجمة (قسم «السور»).\n• 🎧 الاستماع إلى التلاوة بقارئ تختاره (قسم الاستماع).\n• 🎙️ تسميع ما تحفظ ومتابعة خطة الحفظ والمراجعة («التسميع»).\n• 🕋 تعلّم الوضوء والصلاة بالرسوم («تعلم الصلاة الصحيحة»).\n• 🎓 دورات قصيرة مع اختبارات («الأكاديمية»).\n• 📿 الأذكار والمسبحة («حصن المسلم»).\n• 🕌 مواقيت الصلاة والتنبيهات، والورد اليومي، وتحليل تقدمك في «بصيرة».\nابدأ من لوحة التحكم أعلى الصفحة، أو اسألني عن أي ميزة.'],
    en: ['What can I do on this website?', 'The main things you can do:\n• 📖 Read any surah with tafsir and translation (“Surahs” section).\n• 🎧 Listen to a recitation by the reciter you choose (listening section).\n• 🎙️ Recite from memory and follow a memorisation and revision plan (“Voice Test”).\n• 🕋 Learn wudu and the prayer with diagrams (“Learn the prayer”).\n• 🎓 Short courses with quizzes (“Academy”).\n• 📿 Adhkar and the tasbih counter (“Hisn al-Muslim”).\n• 🕌 Prayer times and alerts, the daily wird and your progress in “Insights”.\nStart from the dashboard at the top of the page, or ask me about any feature.'],
    es: ['¿Qué puedo hacer en este sitio?', 'Lo principal:\n• 📖 Leer cualquier sura con tafsir y traducción (sección «Suras»).\n• 🎧 Escuchar la recitación con el recitador que elijas.\n• 🎙️ Recitar de memoria y seguir un plan de memorización y repaso («Prueba de Recitación»).\n• 🕋 Aprender el wudu y la oración con dibujos («Aprender la oración»).\n• 🎓 Cursos breves con cuestionarios («Academia»).\n• 📿 Adhkar y contador de tasbih («Hisn al-Muslim»).\n• 🕌 Horarios de oración y avisos, el wird diario y tu progreso en «Perspectiva».\nEmpieza por el panel superior o pregúntame por cualquier función.'],
    fr: ['Que puis-je faire sur ce site ?', 'L’essentiel :\n• 📖 Lire n’importe quelle sourate avec tafsir et traduction (section « Sourates »).\n• 🎧 Écouter la récitation avec le récitateur de votre choix.\n• 🎙️ Réciter de mémoire et suivre un plan de mémorisation et de révision (« Test de Récitation »).\n• 🕋 Apprendre les ablutions et la prière avec des illustrations (« Apprendre la prière »).\n• 🎓 Des cours courts avec quiz (« Académie »).\n• 📿 Les adhkar et le compteur de tasbih (« Citadelle »).\n• 🕌 Les horaires de prière et alertes, le wird quotidien et votre progression dans « Perspective ».\nCommencez par le tableau de bord en haut de la page, ou demandez-moi.'],
  }, { icon: '✨', related: ['site_navigate', 'read_how', 'learn_prayer'] }),

  F('site_navigate', 'navigation', null, null, ['كيف اتنقل', 'التنقل', 'القائمه', 'القائمه الجانبيه', 'navigate', 'menu', 'navegar', 'naviguer'], {
    ar: ['كيف أتنقل في الموقع؟', 'في أعلى الصفحة شريط روابط: السور، مواقيت الصلاة، حصن المسلم، الإسلام، بحث آيات، التسميع، تعلم الصلاة الصحيحة، الأكاديمية، من أنا. على الهاتف اسحب هذا الشريط يمينًا ويسارًا لترى بقية الروابط.\nزر ☰ يفتح «القائمة» الجانبية: المفضلة، حسابي، الإعدادات، ملاحظاتي، المساعد، تواصل معنا.\nوزر 💬 العائم في الزاوية يفتحني من أي مكان.'],
    en: ['How do I navigate the website?', 'At the top of the page there is a bar of links: Surahs, Prayer Times, Hisn al-Muslim, Islam, Search Ayah, Voice Test, Learn the prayer, Academy, About us. On a phone, swipe that bar sideways to see the other links.\nThe ☰ button opens the side “Menu”: Favorites, My Profile, Settings, My notes, Assistant, Contact Us.\nThe floating 💬 button in the corner opens me from anywhere.'],
    es: ['¿Cómo navego por el sitio?', 'Arriba hay una barra de enlaces: Suras, Horarios de Oración, Hisn al-Muslim, Islam, Buscar Aleya, Prueba de Recitación, Aprender la oración, Academia, Quiénes somos. En el móvil desliza esa barra hacia los lados para ver el resto.\nEl botón ☰ abre el «Menú» lateral: Favoritos, Mi Perfil, Ajustes, Mis notas, Asistente, Contáctenos.\nEl botón flotante 💬 me abre desde cualquier lugar.'],
    fr: ['Comment naviguer sur le site ?', 'En haut de la page, une barre de liens : Sourates, Horaires de Prière, Citadelle, Islam, Chercher une Ayah, Test de Récitation, Apprendre la prière, Académie, Qui sommes-nous. Sur téléphone, faites glisser cette barre pour voir les autres liens.\nLe bouton ☰ ouvre le « Menu » latéral : Favoris, Mon Profil, Paramètres, Mes notes, Assistant, Contactez-nous.\nLe bouton flottant 💬 m’ouvre depuis n’importe où.'],
  }, { icon: '🧭', related: ['site_home', 'site_where_quran', 'site_mobile'] }),

  F('site_home', 'navigation', null, { anchor: '#home' }, ['الصفحه الرئيسيه', 'ارجع للبدايه', 'اعلي الصفحه', 'ارجع فوق', 'homepage', 'home page', 'go back to top', 'pagina principal', 'inicio', 'page d accueil', 'accueil'], {
    ar: ['كيف أعود إلى الصفحة الرئيسية؟', 'اضغط شعار «القرآن الكريم» في أعلى الصفحة، فيعيدك إلى البداية. وعند النزول في الصفحة يظهر زر ↑ في الأسفل للعودة إلى الأعلى مباشرة. ومن صفحة «من أنا» يوجد رابط للعودة إلى الصفحة الرئيسية.'],
    en: ['How do I return to the homepage?', 'Press the “The Holy Quran” logo at the top of the page to go back to the start. When you scroll down, a ↑ button appears at the bottom to jump back to the top. The “About us” page has a link back to the homepage.'],
    es: ['¿Cómo vuelvo a la página principal?', 'Pulsa el logotipo «El Sagrado Corán» arriba para volver al inicio. Al bajar aparece un botón ↑ abajo para volver arriba. La página «Quiénes somos» tiene un enlace de regreso.'],
    fr: ['Comment revenir à l’accueil ?', 'Appuyez sur le logo « Le Saint Coran » en haut de la page. En descendant, un bouton ↑ apparaît en bas pour remonter. La page « Qui sommes-nous » contient un lien de retour.'],
  }, { icon: '🏠', related: ['site_navigate'] }),

  F('site_where_quran', 'navigation', 'quran', { anchor: '#surahs' }, ['اين القران', 'وين المصحف', 'اين اجد القران', 'افتح المصحف', 'where is the quran', 'find the quran', 'donde esta el coran', 'ou est le coran'], {
    ar: ['أين أجد القرآن الكريم في الموقع؟', 'في قسم «سور القرآن الكريم» (رابط «السور» في الأعلى، أو زر «تصفح السور» في أول الصفحة). تظهر السور الـ114 في بطاقات: 📖 للقراءة، و🎧 للاستماع، و☆ للمفضلة.'],
    en: ['Where can I find the Quran?', 'In the “Quran Surahs” section (the “Surahs” link at the top, or the “Browse Surahs” button at the start of the page). All 114 surahs are shown as cards: 📖 to read, 🎧 to listen, ☆ to add to favourites.'],
    es: ['¿Dónde encuentro el Corán?', 'En la sección «Suras del Corán» (enlace «Suras» arriba, o el botón «Explorar Suras» al principio). Las 114 suras aparecen como tarjetas: 📖 para leer, 🎧 para escuchar, ☆ para favoritos.'],
    fr: ['Où trouver le Coran ?', 'Dans la section « Sourates du Coran » (lien « Sourates » en haut, ou bouton « Sourates » au début de la page). Les 114 sourates sont des cartes : 📖 pour lire, 🎧 pour écouter, ☆ pour les favoris.'],
  }, { icon: '📖', related: ['read_how', 'listen_how'] }),

  F('search_features', 'navigation', 'search', { dialog: 'islamicSearchModal' }, ['كيف استخدم البحث', 'ميزه البحث', 'خيارات البحث', 'ابحث في الموقع', 'use the search', 'search feature', 'search the site', 'buscar en el sitio', 'rechercher sur le site'], {
    ar: ['كيف أستخدم البحث في الموقع؟', 'في الموقع ثلاث طرق للبحث:\n• مربع «ابحث عن سورة...» فوق قائمة السور: اكتب اسم السورة أو رقمها.\n• «🔍 بحث آيات» في الأعلى: اكتب كلمة أو جزءًا من آية (بدون تشكيل) لتجد الآيات التي فيها.\n• «🔎 البحث الإسلامي» في لوحة التحكم: يبحث في السور والأذكار ودروس الموقع والتفسير.\nوتستطيع أيضًا أن تسألني مباشرة.'],
    en: ['How do I use the search feature?', 'There are three ways to search:\n• The “Search for a Surah...” box above the surah list: type the surah’s name or number.\n• “🔍 Search Ayah” at the top: type a word or part of an ayah (without vowel marks) to find the ayahs containing it.\n• “🔎 Islamic Search” on the dashboard: searches surahs, adhkar, the site’s lessons and the tafsir.\nYou can also simply ask me.'],
    es: ['¿Cómo uso la búsqueda?', 'Hay tres formas:\n• El cuadro «Buscar una Sura...» sobre la lista: escribe el nombre o número de la sura.\n• «🔍 Buscar Aleya» arriba: escribe una palabra o parte de una aleya (sin vocales) para encontrarla.\n• «🔎 Búsqueda Islámica» en el panel: busca en suras, adhkar, lecciones y tafsir.\nTambién puedes preguntarme.'],
    fr: ['Comment utiliser la recherche ?', 'Trois façons :\n• La case « Rechercher une Sourate... » au-dessus de la liste : tapez le nom ou le numéro.\n• « 🔍 Chercher une Ayah » en haut : tapez un mot ou une partie d’ayah (sans voyelles).\n• « 🔎 Recherche Islamique » dans le tableau de bord : sourates, adhkar, leçons et tafsir.\nVous pouvez aussi me demander.'],
  }, { icon: '🔍', related: ['find_ayah', 'find_dua'] }),

  L('language', 'language', 'navigation', null, { run: 'language' }, ['غير اللغه', 'تغيير اللغه', 'بالانجليزي', 'change language', 'switch language', 'cambiar idioma', 'changer de langue'], { related: ['site_mobile'] }),
  L('theme', 'theme', 'navigation', null, { run: 'theme' }, ['الوضع الليلي', 'الوضع الداكن', 'الوضع الفاتح', 'dark mode', 'light mode', 'modo oscuro', 'mode sombre'], { related: ['reading_display'] }),

  F('site_mobile', 'navigation', 'app', null, ['علي الجوال', 'علي الهاتف', 'علي الموبايل', 'من التلفون', 'on my phone', 'mobile', 'smartphone', 'en el movil', 'sur mon telephone', 'portable'], {
    ar: ['كيف أستخدم الموقع على الهاتف؟', 'الموقع مصمم ليعمل على الهاتف كما على الحاسوب:\n• اسحب شريط الروابط العلوي جانبيًا لترى كل الأقسام، وزر ☰ للقائمة.\n• اضغط على الآية في وضع القراءة لترى تفسيرها وأزرارها.\n• عند الاستماع والتنقل في الصفحة يظهر مشغّل صغير في الأسفل.\n• يمكنك تثبيته على الشاشة الرئيسية ليفتح كتطبيق (اسألني: كيف أثبّت الموقع؟).'],
    en: ['How do I use the website on my phone?', 'The site is designed to work on a phone as well as on a computer:\n• Swipe the top bar of links sideways to see every section; ☰ opens the menu.\n• Tap an ayah in the reading view to see its tafsir and buttons.\n• While listening, a small player appears at the bottom when you scroll elsewhere.\n• You can add it to your home screen so it opens like an app (ask me: how do I install the site?).'],
    es: ['¿Cómo uso el sitio en el móvil?', 'El sitio funciona igual en móvil y ordenador:\n• Desliza la barra superior para ver todas las secciones; ☰ abre el menú.\n• Toca una aleya en la vista de lectura para ver su tafsir y botones.\n• Al escuchar, aparece un mini reproductor abajo cuando te desplazas.\n• Puedes añadirlo a la pantalla de inicio como una app.'],
    fr: ['Comment utiliser le site sur mon téléphone ?', 'Le site fonctionne sur téléphone comme sur ordinateur :\n• Faites glisser la barre du haut pour voir toutes les sections ; ☰ ouvre le menu.\n• Touchez une ayah en lecture pour voir son tafsir et ses boutons.\n• Pendant l’écoute, un mini-lecteur apparaît en bas quand vous faites défiler.\n• Vous pouvez l’ajouter à l’écran d’accueil comme une application.'],
  }, { icon: '📱', related: ['install', 'phone_differs'] }),

  F('offline_use', 'navigation', 'app', null, ['بدون انترنت', 'بدون نت', 'اوفلاين', 'بلا انترنت', 'offline', 'without internet', 'sin internet', 'sans internet', 'hors ligne'], {
    ar: ['هل يعمل الموقع بدون إنترنت؟', 'جزئيًا، بعد زيارة أولى وأنت متصل:\n• تعمل الواجهة، وحصن المسلم، والمسبحة، ودروس الصلاة والأكاديمية، وملاحظاتك وتقدمك.\n• تعمل السور التي فتحتها من قبل (يحتفظ الموقع بنسخة منها).\n• لا تعمل بدون إنترنت: التلاوات الصوتية، ومواقيت الصلاة، والسور التي لم تفتحها، وبحث الآيات.'],
    en: ['Can I use the website offline?', 'Partly, after a first visit while online:\n• The interface, Hisn al-Muslim, the tasbih, the prayer and academy lessons, your notes and progress work.\n• Surahs you opened before work (the site keeps a copy).\n• Not available offline: audio recitations, prayer times, surahs you never opened, and ayah search.'],
    es: ['¿Puedo usar el sitio sin internet?', 'En parte, tras una primera visita con conexión:\n• Funcionan la interfaz, Hisn al-Muslim, el tasbih, las lecciones, tus notas y progreso.\n• Funcionan las suras que ya abriste.\n• Sin internet no funcionan: el audio, los horarios de oración, las suras no abiertas y la búsqueda de aleyas.'],
    fr: ['Puis-je utiliser le site hors ligne ?', 'En partie, après une première visite connectée :\n• L’interface, la Citadelle, le tasbih, les leçons, vos notes et progrès fonctionnent.\n• Les sourates déjà ouvertes fonctionnent.\n• Hors ligne, ne fonctionnent pas : l’audio, les horaires de prière, les sourates jamais ouvertes et la recherche d’ayahs.'],
  }, { icon: '📴', related: ['install', 'offline_unavailable', 'lost_internet'] }),

  L('install', 'install', 'navigation', 'app', null, ['ثبت التطبيق', 'نزل التطبيق', 'حمل التطبيق', 'pwa', 'install the app', 'download app', 'add to home screen', 'instalar la app', 'installer l application'], { related: ['offline_use', 'update_app'] }),
  L('about', 'about', 'navigation', null, { href: 'about.html' }, ['من المطور', 'من صمم الموقع', 'من صاحب الموقع', 'من انا', 'who made', 'developers', 'quien hizo', 'qui a fait'], { related: ['contact'] }),

  F('contact', 'navigation', null, { dialog: 'contactModal' }, ['تواصل معكم', 'اتصل بكم', 'ايميل', 'بريد', 'ابلغ عن مشكله', 'اقتراح', 'contact', 'email', 'report a problem', 'feedback', 'contacto', 'correo', 'contacter', 'signaler'], {
    ar: ['كيف أتواصل مع فريق الموقع؟', 'افتح القائمة ☰ ← «✉️ تواصل معنا»: فيها البريد الإلكتروني للفريق وحساباته. يسعدهم استقبال ملاحظاتك واقتراحاتك والإبلاغ عن أي خطأ.'],
    en: ['How do I contact the site team?', 'Open the ☰ menu → “✉️ Contact Us”: it shows the team’s email address and accounts. Feedback, suggestions and error reports are welcome.'],
    es: ['¿Cómo contacto con el equipo?', 'Abre el menú ☰ → «✉️ Contáctenos»: muestra el correo y las cuentas del equipo. Se agradecen comentarios, sugerencias y avisos de errores.'],
    fr: ['Comment contacter l’équipe ?', 'Ouvrez le menu ☰ → « ✉️ Contactez-nous » : l’adresse e-mail et les comptes de l’équipe y figurent. Remarques, suggestions et signalements d’erreurs sont les bienvenus.'],
  }, { icon: '✉️', related: ['about', 'feature_broken'] }),

  F('donate', 'navigation', null, { dialog: 'donateModal' }, ['تبرع', 'التبرع', 'ادعم الموقع', 'donate', 'donation', 'support the site', 'donar', 'faire un don'], {
    ar: ['هل يمكنني التبرع للموقع؟', 'التبرع غير متاح حاليًا، كما تذكر نافذة «💖 تبرع» في القائمة ☰. جزاك الله خيرًا على نيتك الطيبة؛ ويمكنك دعم الموقع بنشره والدعاء لأصحابه وإرسال ملاحظاتك.'],
    en: ['Can I donate to the site?', 'Donations are currently unavailable, as the “💖 Donate” window in the ☰ menu says. May Allah reward your good intention; you can support the site by sharing it, making du’a for its team and sending feedback.'],
    es: ['¿Puedo donar al sitio?', 'Las donaciones no están disponibles por ahora (ventana «💖 Donar» del menú ☰). Que Allah recompense tu intención; puedes apoyar compartiendo el sitio y enviando comentarios.'],
    fr: ['Puis-je faire un don ?', 'Les dons sont actuellement indisponibles (fenêtre « 💖 Faire un don » du menu ☰). Qu’Allah récompense votre intention ; vous pouvez soutenir le site en le partageant et en envoyant vos remarques.'],
  }, { icon: '💖', related: ['contact'] }),

  F('login', 'navigation', null, { dialog: 'profileModal' }, ['تسجيل دخول', 'انشاء حساب', 'حساب جديد', 'كلمه السر', 'sign in', 'login', 'create account', 'register', 'iniciar sesion', 'crear cuenta', 'connexion', 'creer un compte'], {
    ar: ['هل أحتاج إلى حساب أو تسجيل دخول؟', 'لا. لا يوجد في الموقع تسجيل دخول بكلمة مرور ولا خادم يحفظ بياناتك. «👤 حسابي» ملف محلي على جهازك: اسمك وهدفك وتقدمك. ولنقل بياناتك إلى جهاز آخر استخدم «💾 نسخة احتياطية لبياناتك».'],
    en: ['Do I need an account or to log in?', 'No. There is no password login and no server storing your data. “👤 My Profile” is a local profile on your device: your name, goal and progress. To move your data to another device, use “💾 Back up your data”.'],
    es: ['¿Necesito una cuenta?', 'No. No hay inicio de sesión ni servidor con tus datos. «👤 Mi Perfil» es un perfil local en tu dispositivo. Para pasar tus datos a otro dispositivo usa «💾 Copia de seguridad de tus datos».'],
    fr: ['Ai-je besoin d’un compte ?', 'Non. Il n’y a ni connexion par mot de passe ni serveur qui garde vos données. « 👤 Mon Profil » est un profil local sur votre appareil. Pour transférer vos données, utilisez « 💾 Sauvegarder vos données ».'],
  }, { icon: '👤', related: ['backup', 'privacy_data'] }),

  F('islam_message', 'navigation', 'islam', { dialog: 'islamModal' }, ['رساله الاسلام', 'قسم الاسلام', 'زر الاسلام', 'message of islam', 'mensaje del islam', 'message de l islam'], {
    ar: ['ما هو قسم «🕌 الإسلام» في الموقع؟', 'رابط «🕌 الإسلام» في الأعلى يفتح «رسالة الإسلام»: تعريف موجز بالتوحيد والدين الصافي، وبيان براءة الإسلام من الإرهاب، ودعوة لقراءة القرآن بعقل منفتح. ولأسئلة أوسع عن الإسلام اسألني مباشرة.'],
    en: ['What is the “🕌 Islam” section?', 'The “🕌 Islam” link at the top opens “The Message of Islam”: a short introduction to Tawheed and the pure religion, a statement that Islam is innocent of terrorism, and an invitation to read the Quran with an open mind. For wider questions about Islam, just ask me.'],
    es: ['¿Qué es la sección «🕌 Islam»?', 'Abre «El Mensaje del Islam»: una breve introducción al tawhid, la inocencia del islam frente al terrorismo y una invitación a leer el Corán con mente abierta. Para otras preguntas, pregúntame.'],
    fr: ['Qu’est-ce que la section « 🕌 Islam » ?', 'Elle ouvre « Le Message de l’Islam » : une courte présentation du tawhid, l’innocence de l’islam face au terrorisme et une invitation à lire le Coran l’esprit ouvert. Pour d’autres questions, demandez-moi.'],
  }, { icon: '🕌', related: ['islam_what', 'become_muslim'] }),

  // ======================================================================= B. reading
  L('read_how', 'read', 'reading', 'quran', { anchor: '#surahs' }, ['اقرا سوره', 'كيف اقرا القران', 'قراءه القران', 'read quran', 'read a surah', 'leer el coran', 'lire le coran'], { related: ['open_surah', 'reading_display', 'listen_how'] }),

  F('open_surah', 'reading', 'quran', { anchor: '#surahs' }, ['افتح سوره معينه', 'سوره محدده', 'رقم السوره', 'سوره الكهف', 'open a specific surah', 'surah number', 'abrir una sura concreta', 'ouvrir une sourate precise'], {
    ar: ['كيف أفتح سورة معيّنة؟', 'في قسم «السور» اكتب اسم السورة (مثل: الكهف) أو رقمها (مثل: 18) في مربع «ابحث عن سورة...»، فتظهر بطاقتها وحدها، ثم اضغط 📖.\nوإن كنت داخل وضع القراءة، استخدم «🧭 أدوات القراءة والتنقل» للانتقال بالجزء أو برقم الصفحة.'],
    en: ['How do I open a specific surah?', 'In the “Surahs” section, type the surah’s name (e.g. Al-Kahf) or number (e.g. 18) in the “Search for a Surah...” box: only its card remains; press 📖.\nInside the reading view, “🧭 Reading and navigation tools” also lets you jump by juz or page number.'],
    es: ['¿Cómo abro una sura concreta?', 'En «Suras», escribe el nombre (p. ej. Al-Kahf) o el número (18) en «Buscar una Sura...» y pulsa 📖 en su tarjeta.\nEn la vista de lectura, «🧭 Herramientas de lectura y navegación» permite saltar por yuz o página.'],
    fr: ['Comment ouvrir une sourate précise ?', 'Dans « Sourates », tapez le nom (ex. Al-Kahf) ou le numéro (18) dans « Rechercher une Sourate... » puis appuyez sur 📖.\nEn lecture, « 🧭 Outils de lecture et de navigation » permet d’aller à un juz ou une page.'],
  }, { icon: '📖', related: ['navigate_ayahs', 'find_verse'] }),

  L('find_ayah', 'search', 'reading', 'quran', { dialog: 'ayahSearchModal' }, ['ابحث عن ايه', 'اجد ايه', 'كلمه في القران', 'find an ayah', 'search a verse', 'buscar aleya', 'trouver une ayah'], { related: ['find_verse', 'search_features'] }),

  F('navigate_ayahs', 'reading', 'quran', { anchor: '#readingSection' }, ['انتقل بين الايات', 'الايه التاليه', 'الجزء', 'رقم الصفحه', 'صفحه المصحف', 'next ayah', 'juz', 'go to page', 'siguiente aleya', 'ir a la pagina', 'ayah suivante', 'aller a la page'], {
    ar: ['كيف أتنقل بين الآيات والأجزاء والصفحات؟', 'في وضع القراءة افتح «🧭 أدوات القراءة والتنقل»:\n• «الجزء»: اختر الجزء (1–30) فيُفتح من أوله.\n• «الصفحة (1–604)»: اكتب رقم صفحة المصحف ثم «انتقال».\n• «متابعة التلاوة إلى الآية التالية ⏭»: عند تشغيل آية تنتقل التلاوة تلقائيًا إلى ما بعدها.\nويظهر موضعك الحالي (الجزء والصفحة) تحت الأدوات.'],
    en: ['How do I move between ayahs, juz and pages?', 'In the reading view, open “🧭 Reading and navigation tools”:\n• “Juz”: choose a juz (1–30) to open it from its start.\n• “Page (1–604)”: type a Mushaf page number, then “Go”.\n• “Continue to the next ayah ⏭”: when you play an ayah, the recitation moves on to the next one automatically.\nYour current position (juz and page) is shown under the tools.'],
    es: ['¿Cómo me muevo entre aleyas, yuz y páginas?', 'En la vista de lectura abre «🧭 Herramientas de lectura y navegación»:\n• «Yuz»: elige un yuz (1–30).\n• «Página (1–604)»: escribe el número y pulsa «Ir».\n• «Continuar con la siguiente aleya ⏭»: la recitación sigue sola a la siguiente aleya.\nTu posición actual se muestra debajo.'],
    fr: ['Comment passer d’une ayah, d’un juz ou d’une page à l’autre ?', 'En lecture, ouvrez « 🧭 Outils de lecture et de navigation » :\n• « Juz » : choisissez un juz (1–30).\n• « Page (1–604) » : tapez le numéro puis « Aller ».\n• « Continuer à l’ayah suivante ⏭ » : la récitation passe seule à l’ayah suivante.\nVotre position actuelle s’affiche dessous.'],
  }, { icon: '🧭', related: ['open_surah', 'ayah_repeat'] }),

  F('reading_display', 'reading', 'quran', { dialog: 'settingsModal' }, ['شكل المصحف', 'عرض المصحف', 'حجم الخط', 'كبر الخط', 'مظهر القراءه', 'ورقي', 'بني', 'change the display', 'font size', 'reading theme', 'sepia', 'tamano de letra', 'apariencia', 'taille de police', 'apparence'], {
    ar: ['كيف أغيّر طريقة عرض المصحف؟', '• حجم الخط: زرّا A− وA+ في وضع القراءة، أو «حجم خط المصحف» في «⚙️ الإعدادات».\n• الألوان: «مظهر القراءة» (افتراضي، ورقي، بني دافئ، ليلي) في «🧭 أدوات القراءة والتنقل» أو في الإعدادات؛ وهو يغيّر صفحة المصحف فقط.\n• للموقع كله: زر 🌙 للوضع الليلي.'],
    en: ['How do I change the Quran display?', '• Font size: the A− and A+ buttons in the reading view, or “Mushaf font size” in “⚙️ Settings”.\n• Colours: “Reading appearance” (Default, Paper, Sepia, Night) in “🧭 Reading and navigation tools” or in Settings; it changes the Mushaf page only.\n• For the whole site: the 🌙 button for dark mode.'],
    es: ['¿Cómo cambio la presentación del Mushaf?', '• Tamaño: botones A− y A+ en la lectura, o «Tamaño de letra del Mushaf» en «⚙️ Ajustes».\n• Colores: «Apariencia de lectura» (Predeterminada, Papel, Sepia, Noche), solo para la página del Mushaf.\n• Todo el sitio: botón 🌙.'],
    fr: ['Comment changer l’affichage du Mushaf ?', '• Taille : boutons A− et A+ en lecture, ou « Taille de police du Mushaf » dans « ⚙️ Paramètres ».\n• Couleurs : « Apparence de lecture » (Par défaut, Papier, Sépia, Nuit), pour la page du Mushaf seulement.\n• Tout le site : le bouton 🌙.'],
  }, { icon: '🔠', related: ['uthmani', 'theme'] }),

  F('uthmani', 'reading', 'quran', { anchor: '#surahs' }, ['الرسم العثماني', 'الخط العثماني', 'رسم المصحف', 'مصحف المدينه', 'uthmani', 'uthmani script', 'escritura uthmani', 'ecriture uthmani'], {
    ar: ['هل أستطيع القراءة بالرسم العثماني؟', 'نعم. نص المصحف في الموقع بالرسم العثماني من مصدر موثّق (نص «quran-uthmani»)، ويُعرض بخط «أميري» المناسب للقراءة. ترقيم الصفحات والأجزاء على مصحف المدينة (604 صفحات). لا يُعدَّل نص الآيات أبدًا.'],
    en: ['Can I read the Quran in Uthmani script?', 'Yes. The Mushaf text on the site is the Uthmani script from a verified source (the “quran-uthmani” text), shown in the Amiri typeface. Pages and juz follow the Madani Mushaf (604 pages). The ayah text is never altered.'],
    es: ['¿Puedo leer en escritura uthmani?', 'Sí. El texto es la escritura uthmani de una fuente verificada, con la tipografía Amiri. Páginas y yuz siguen el Mushaf de Medina (604 páginas). El texto nunca se modifica.'],
    fr: ['Puis-je lire en écriture uthmani ?', 'Oui. Le texte est l’écriture uthmani d’une source vérifiée, en police Amiri. Pages et juz suivent le Mushaf de Médine (604 pages). Le texte n’est jamais modifié.'],
  }, { icon: '🖋️', related: ['reading_display'] }),

  F('translation', 'reading', 'quran', { dialog: 'settingsModal' }, ['ترجمه معاني', 'القران مترجم', 'القران بالانجليزي', 'ترجمه انجليزيه', 'with translation', 'translation', 'english translation', 'traduccion', 'traduction'], {
    ar: ['هل أستطيع قراءة القرآن مع الترجمة؟', 'نعم. في وضع القراءة اضغط على أي آية، فتظهر تحتها ترجمة معانيها مع التفسير.\n• في الواجهة العربية: اختر الترجمة من «⚙️ الإعدادات» ← «الترجمة المعروضة مع الواجهة العربية» (الإنجليزية: صحيح إنترناشونال، الإسبانية: كورتيس، الفرنسية: حميد الله).\n• في الواجهات الأخرى تُعرض ترجمة لغة الواجهة تلقائيًا.\nالترجمة بيان للمعنى وليست هي القرآن نفسه.'],
    en: ['Can I read the Quran with translation?', 'Yes. In the reading view, tap any ayah: a translation of its meanings appears under it with the tafsir.\n• With the English, Spanish or French interface, the translation in that language is shown (Sahih International, Cortés, Hamidullah).\n• With the Arabic interface, choose it in “⚙️ Settings” → “Translation shown with the Arabic interface”.\nA translation conveys the meaning; it is not the Quran itself.'],
    es: ['¿Puedo leer el Corán con traducción?', 'Sí. En la lectura toca una aleya: aparece la traducción de su significado con el tafsir.\n• Con la interfaz en español se muestra la traducción de Cortés (en inglés: Sahih International; en francés: Hamidullah).\n• Con la interfaz árabe se elige en «⚙️ Ajustes».\nUna traducción transmite el sentido; no es el Corán en sí.'],
    fr: ['Puis-je lire le Coran avec traduction ?', 'Oui. En lecture, touchez une ayah : la traduction du sens apparaît avec le tafsir.\n• Avec l’interface française, c’est la traduction de Hamidullah (anglais : Sahih International ; espagnol : Cortés).\n• Avec l’interface arabe, choisissez-la dans « ⚙️ Paramètres ».\nUne traduction rend le sens ; ce n’est pas le Coran lui-même.'],
  }, { icon: '🌐', related: ['tafsir_access', 'ayah_meaning'] }),

  F('ayah_meaning', 'reading', 'tafsir', { anchor: '#surahs' }, ['افهم معني الايه', 'معني ايه', 'فهم القران', 'تدبر', 'understand the meaning', 'meaning of an ayah', 'entender el significado', 'comprendre le sens'], {
    ar: ['كيف أفهم معنى آية؟', '• افتح السورة واضغط على الآية: يظهر «التفسير الميسر» (تفسير مختصر معتمد بالعربية) وترجمة المعنى.\n• أو اسألني مباشرة، مثل: «تفسير آية الكرسي» أو «ما معنى سورة الفاتحة؟» أو «تفسير 2:255»، فأعرض لك نص الآية والتفسير الميسر من المصدر نفسه.\nللتعمق ارجع إلى كتب التفسير المعتمدة وأهل العلم.'],
    en: ['How do I understand the meaning of an ayah?', '• Open the surah and tap the ayah: “Tafsir al-Muyassar” (a concise, recognised Arabic tafsir) and a translation of the meaning appear.\n• Or ask me directly, e.g. “tafsir of Ayat al-Kursi”, “meaning of Surah Al-Fatiha” or “tafsir 2:255”: I show the ayah and the same tafsir from the verified source.\nFor deeper study, refer to recognised tafsir works and scholars.'],
    es: ['¿Cómo entiendo el significado de una aleya?', '• Abre la sura y toca la aleya: aparece el «Tafsir al-Muyassar» (tafsir árabe breve y reconocido) y la traducción.\n• O pregúntame: «tafsir 2:255» o «significado de la sura Al-Fatiha».\nPara profundizar, consulta obras de tafsir reconocidas y a sabios.'],
    fr: ['Comment comprendre le sens d’une ayah ?', '• Ouvrez la sourate et touchez l’ayah : le « Tafsir al-Muyassar » (tafsir arabe concis et reconnu) et la traduction apparaissent.\n• Ou demandez-moi : « tafsir 2:255 » ou « sens de la sourate Al-Fatiha ».\nPour approfondir, référez-vous aux tafsirs reconnus et aux savants.'],
  }, { icon: '💡', related: ['tafsir_access', 'translation'] }),

  L('tafsir_access', 'tafsir', 'reading', 'tafsir', { anchor: '#surahs' }, ['اين التفسير', 'التفسير الميسر', 'tafsir', 'tafseer', 'acceder al tafsir', 'acceder au tafsir'], { related: ['ayah_meaning', 'translation'] }),

  F('find_verse', 'reading', 'quran', { dialog: 'ayahSearchModal' }, ['ايه معينه', 'ايه محدده', 'رقم الايه', 'ايه رقم', 'specific verse', 'verse number', 'aleya concreta', 'verset precis'], {
    ar: ['كيف أجد آية محددة؟', '• إن كنت تعرف كلمة منها: «🔍 بحث آيات» واكتب الكلمة.\n• إن كنت تعرف السورة ورقم الآية: افتح السورة من قسم «السور» ثم انزل إلى الآية (أرقام الآيات ظاهرة بعد كل آية).\n• أو اكتب لي المرجع مثل «2:255» أو «سورة الكهف آية 10» فأعرضها لك مع زر لفتحها في المصحف.'],
    en: ['How do I find a specific verse?', '• If you know a word from it: “🔍 Search Ayah” and type the word.\n• If you know the surah and ayah number: open the surah from “Surahs” and scroll to it (numbers follow each ayah).\n• Or type the reference to me, like “2:255” or “Surah Al-Kahf ayah 10”, and I show it with a button to open it in the Mushaf.'],
    es: ['¿Cómo encuentro un versículo concreto?', '• Si sabes una palabra: «🔍 Buscar Aleya».\n• Si sabes la sura y el número: abre la sura y baja hasta la aleya.\n• O escríbeme la referencia, p. ej. «2:255», y te la muestro con un botón para abrirla.'],
    fr: ['Comment trouver un verset précis ?', '• Si vous connaissez un mot : « 🔍 Chercher une Ayah ».\n• Si vous connaissez la sourate et le numéro : ouvrez la sourate et descendez jusqu’à l’ayah.\n• Ou écrivez-moi la référence, ex. « 2:255 », et je l’affiche avec un bouton pour l’ouvrir.'],
  }, { icon: '🎯', related: ['find_ayah', 'open_surah'] }),

  L('bookmark', 'bookmark', 'reading', 'bookmark', { anchor: '#surahs' }, ['علامه مرجعيه', 'احفظ مكاني', 'حفظ كاخر قراءه', 'bookmark an ayah', 'bookmark', 'marcador', 'signet'], { related: ['continue_reading', 'save_ayah'] }),

  F('save_ayah', 'reading', 'notes', { dialog: 'notesModal' }, ['احفظ ايه', 'حفظ ايات', 'ايات محفوظه', 'احتفظ بايه', 'save an ayah', 'save verses', 'guardar una aleya', 'enregistrer une ayah'], {
    ar: ['كيف أحفظ آية لأرجع إليها؟', 'لحفظ آيات كثيرة استخدم المجموعات: اضغط على الآية في وضع القراءة ← «📝 ملاحظة وتصنيف» ← اختر مجموعة (أو «＋ مجموعة جديدة») ← «حفظ». تجد كل آياتك في «📝 ملاحظاتي».\nأما «🔖 حفظ كآخر قراءة» فيحفظ موضعًا واحدًا فقط لتكمل منه.'],
    en: ['How do I save an ayah to come back to it?', 'To keep many ayahs, use collections: tap the ayah in the reading view → “📝 Note & collection” → choose a collection (or “＋ New collection”) → “Save”. All your ayahs are in “📝 My notes”.\n“🔖 Save as Bookmark” keeps a single place to continue from.'],
    es: ['¿Cómo guardo una aleya?', 'Usa las colecciones: toca la aleya → «📝 Nota y colección» → elige una colección (o «＋ Nueva colección») → «Guardar». Están en «📝 Mis notas».\n«🔖 Guardar Marcador» guarda un único punto para continuar.'],
    fr: ['Comment enregistrer une ayah ?', 'Utilisez les collections : touchez l’ayah → « 📝 Note et collection » → choisissez une collection (ou « ＋ Nouvelle collection ») → « Enregistrer ». Elles sont dans « 📝 Mes notes ».\n« 🔖 Enregistrer le Signet » garde un seul endroit où reprendre.'],
  }, { icon: '📌', related: ['favorite_ayahs', 'notes', 'bookmark'] }),

  F('share_ayah', 'reading', 'quran', null, ['شارك ايه', 'مشاركه ايه', 'ارسل ايه', 'انشر ايه', 'share an ayah', 'share a verse', 'compartir una aleya', 'partager une ayah'], {
    ar: ['كيف أشارك آية؟', 'لا يوجد في الموقع حاليًا زر خاص لمشاركة آية. يمكنك:\n• نسخ نص الآية يدويًا (انظر: كيف أنسخ آية؟) ثم لصقه في التطبيق الذي تريد مع ذكر اسم السورة ورقم الآية.\n• أو مشاركة رابط الموقع نفسه من قائمة المتصفح.\nاحرص عند النسخ على نقل الآية كاملة دون تغيير.'],
    en: ['How do I share an ayah?', 'The site has no dedicated “share ayah” button at the moment. You can:\n• copy the ayah text by hand (see: how do I copy an ayah?) and paste it where you want, with the surah name and ayah number;\n• or share the site’s link from your browser’s menu.\nWhen copying, keep the whole ayah unchanged.'],
    es: ['¿Cómo comparto una aleya?', 'Por ahora el sitio no tiene un botón para compartir aleyas. Puedes copiar el texto a mano y pegarlo indicando la sura y el número, o compartir el enlace del sitio desde el navegador. Copia la aleya completa sin cambios.'],
    fr: ['Comment partager une ayah ?', 'Le site n’a pas encore de bouton de partage d’ayah. Vous pouvez copier le texte à la main et le coller en indiquant la sourate et le numéro, ou partager le lien du site depuis le navigateur. Copiez l’ayah entière sans la modifier.'],
  }, { icon: '📤', related: ['copy_ayah', 'save_ayah'] }),

  F('copy_ayah', 'reading', 'quran', null, ['انسخ ايه', 'نسخ ايه', 'نسخ نص', 'copy an ayah', 'copy text', 'copiar una aleya', 'copier une ayah'], {
    ar: ['كيف أنسخ آية؟', 'لا يوجد زر نسخ خاص. حدّد نص الآية بنفسك: على الحاسوب اسحب الفأرة فوقه ثم Ctrl+C، وعلى الهاتف اضغط مطولًا على النص واسحب مؤشري التحديد ثم «نسخ».\nملاحظة: الضغطة القصيرة على الآية تفتح تفسيرها وتشغّل تلاوتها، فاستخدم الضغط المطوّل للتحديد.'],
    en: ['How do I copy an ayah?', 'There is no dedicated copy button. Select the ayah text yourself: on a computer drag the mouse over it and press Ctrl+C; on a phone long-press the text, drag the selection handles, then “Copy”.\nNote: a short tap on an ayah opens its tafsir and plays it, so use a long press to select.'],
    es: ['¿Cómo copio una aleya?', 'No hay botón de copiar. Selecciona el texto: en ordenador arrastra el ratón y pulsa Ctrl+C; en el móvil mantén pulsado y elige «Copiar». Un toque corto abre el tafsir y reproduce la aleya.'],
    fr: ['Comment copier une ayah ?', 'Il n’y a pas de bouton copier. Sélectionnez le texte : sur ordinateur glissez la souris puis Ctrl+C ; sur téléphone appui long puis « Copier ». Un toucher court ouvre le tafsir et lance la récitation.'],
  }, { icon: '📋', related: ['share_ayah'] }),

  F('continue_reading', 'reading', 'bookmark', { anchor: '#surahs' }, ['اكمل القراءه', 'من حيث توقفت', 'وين وقفت', 'اخر مكان', 'استئناف', 'continue reading', 'where i stopped', 'resume', 'continuar leyendo', 'reprendre la lecture'], {
    ar: ['كيف أكمل القراءة من حيث توقفت؟', 'إذا حفظت موضعك بـ«🔖 حفظ كآخر قراءة» يظهر زر «🔖 إكمال القراءة» فوق قائمة السور، وفي بطاقة «🔖» داخل «🌿 رحلتي اليومية» في لوحة التحكم؛ اضغطه فتُفتح السورة عند تلك الآية.\nكما يحسب الموقع الآيات التي ظهرت على شاشتك لهدفك اليومي ونسبة الختمة.'],
    en: ['How do I continue reading from where I stopped?', 'If you saved your place with “🔖 Save as Bookmark”, a “🔖 Resume” button appears above the surah list and on the 🔖 card of “🌿 My daily journey” on the dashboard; press it to open the surah at that ayah.\nThe site also counts the ayahs shown on your screen for your daily goal and khatma progress.'],
    es: ['¿Cómo sigo leyendo donde lo dejé?', 'Si guardaste tu lugar con «🔖 Guardar Marcador», aparece un botón «🔖» para continuar sobre la lista de suras y en «🌿 Mi recorrido diario». Púlsalo para abrir la sura en esa aleya.'],
    fr: ['Comment reprendre là où je me suis arrêté ?', 'Si vous avez enregistré votre place avec « 🔖 Enregistrer le Signet », un bouton « 🔖 » pour reprendre apparaît au-dessus de la liste et dans « 🌿 Mon parcours du jour ». Il ouvre la sourate à cette ayah.'],
  }, { icon: '🔖', related: ['bookmark', 'daily_progress'] }),

  // ======================================================================= C. audio
  L('listen_how', 'listen', 'audio', 'audio', { anchor: '#audio' }, ['استمع للقران', 'سماع القران', 'تلاوه القران', 'كيف استمع', 'listen to the quran', 'listen to quran recitation', 'escuchar el coran', 'ecouter le coran'], { related: ['choose_reciter', 'play_surah', 'audio_trouble'] }),

  F('choose_reciter', 'audio', 'audio', { anchor: '#audio' }, ['اختار القارئ', 'اختيار القارئ', 'غير القارئ', 'تغيير القارئ', 'شيخ معين', 'select a reciter', 'change the reciter', 'choose reciter', 'elegir recitador', 'cambiar recitador', 'choisir le recitateur', 'changer de recitateur'], {
    ar: ['كيف أختار القارئ أو أغيّره؟', '• للتلاوة الحالية: في قسم الاستماع افتح قائمة «القارئ» واختر الشيخ؛ تُعاد السورة بصوته.\n• ليكون هو القارئ الدائم: «⚙️ الإعدادات» ← «🎧 الاستماع» ← «القارئ المفضل».\nملاحظة: تلاوة الآية المفردة (عند الضغط على آية في وضع القراءة) بصوت الشيخ مشاري العفاسي.'],
    en: ['How do I select or change the reciter?', '• For the current recitation: in the listening section open the “Reciter” list and choose; the surah restarts in that voice.\n• To keep that reciter by default: “⚙️ Settings” → “🎧 Listening” → “Preferred reciter”.\nNote: single-ayah audio (when you tap an ayah in the reading view) is by Sheikh Mishary Alafasy.'],
    es: ['¿Cómo elijo o cambio el recitador?', '• Para la recitación actual: en la sección de audio abre la lista «Recitador».\n• Por defecto: «⚙️ Ajustes» → «🎧 Escucha» → «Recitador preferido».\nEl audio de una sola aleya (al tocarla) es de Mishary Alafasy.'],
    fr: ['Comment choisir ou changer le récitateur ?', '• Pour la récitation en cours : dans la section audio, ouvrez la liste « Récitant ».\n• Par défaut : « ⚙️ Paramètres » → « 🎧 Écoute » → « Récitateur préféré ».\nL’audio d’une seule ayah (en la touchant) est récité par Mishary Alafasy.'],
  }, { icon: '🎙️', related: ['reciters_count', 'play_surah'] }),

  F('reciters_count', 'audio', 'audio', { anchor: '#audio' }, ['كم قارئ', 'عدد القراء', 'القراء المتاحين', 'من القراء', 'how many reciters', 'which reciters', 'cuantos recitadores', 'combien de recitateurs'], {
    ar: ['كم عدد القرّاء المتاحين؟', 'في الموقع 16 قارئًا للسور كاملة، منهم: عبد الباسط عبد الصمد، سعود الشريم، مشاري العفاسي، ماهر المعيقلي وغيرهم. افتح قائمة «القارئ» في قسم الاستماع لترى الأسماء كلها.'],
    en: ['How many reciters are available?', 'There are 16 reciters for full surahs, including Abdul Basit Abdul Samad, Saud Al-Shuraim, Mishary Alafasy, Maher Al-Muaiqly and others. Open the “Reciter” list in the listening section to see them all.'],
    es: ['¿Cuántos recitadores hay?', 'Hay 16 recitadores para suras completas, entre ellos Abdul Basit, Saud Al-Shuraim, Mishary Alafasy y Maher Al-Muaiqly. Abre la lista «Recitador» para verlos.'],
    fr: ['Combien de récitateurs sont disponibles ?', 'Il y a 16 récitateurs pour les sourates complètes, dont Abdul Basit, Saud Al-Shuraim, Mishary Alafasy et Maher Al-Muaiqly. Ouvrez la liste « Récitant » pour tous les voir.'],
  }, { icon: '🔢', related: ['choose_reciter'] }),

  F('play_surah', 'audio', 'audio', { anchor: '#surahs' }, ['شغل سوره كامله', 'تشغيل السوره', 'السوره كامله', 'play a whole surah', 'play entire surah', 'reproducir una sura completa', 'lire une sourate entiere'], {
    ar: ['كيف أشغّل سورة كاملة؟', 'اضغط 🎧 على بطاقة السورة في قسم «السور»، فتبدأ التلاوة كاملة في مشغّل قسم الاستماع. عند انتهائها تُشغَّل السورة التالية تلقائيًا، إلا إذا أضفت سورًا إلى «📃 قائمة التشغيل التالية» أو فعّلت «تكرار السورة».'],
    en: ['How do I play an entire surah?', 'Press 🎧 on the surah’s card in “Surahs”: the whole recitation starts in the player of the listening section. When it ends, the next surah plays automatically, unless you added surahs to “📃 Up next (queue)” or turned on “Surah Loop”.'],
    es: ['¿Cómo reproduzco una sura completa?', 'Pulsa 🎧 en la tarjeta de la sura: empieza en el reproductor. Al terminar suena la siguiente, salvo que añadas suras a «📃 A continuación (cola)» o actives «Repetir Sura».'],
    fr: ['Comment lire une sourate entière ?', 'Appuyez sur 🎧 sur la carte de la sourate : la récitation complète démarre. À la fin, la suivante est jouée, sauf si vous avez ajouté des sourates à « 📃 À suivre » ou activé « Répéter Sourate ».'],
  }, { icon: '▶️', related: ['pause_resume', 'playback_controls', 'sleep_queue'] }),

  F('pause_resume', 'audio', 'audio', { anchor: '#audio' }, ['ايقاف مؤقت', 'اوقف التلاوه', 'استئناف التلاوه', 'كمل التلاوه', 'pause', 'resume', 'stop the recitation', 'pausar', 'reanudar', 'mettre en pause', 'reprendre'], {
    ar: ['كيف أوقف التلاوة مؤقتًا ثم أكملها؟', 'استخدم زر التشغيل/الإيقاف في مشغّل قسم الاستماع. وإذا كنت في مكان آخر من الصفحة يظهر مشغّل صغير في الأسفل فيه ⏮ و▶/⏸ و⏭. وعلى الهاتف تظهر أزرار التحكم أيضًا في شاشة القفل أو الإشعارات في كثير من المتصفحات.'],
    en: ['How do I pause and resume the recitation?', 'Use the play/pause button of the player in the listening section. If you are elsewhere on the page, a small player at the bottom has ⏮, ▶/⏸ and ⏭. On phones, many browsers also show the controls on the lock screen or in notifications.'],
    es: ['¿Cómo pauso y reanudo?', 'Con el botón de reproducir/pausar del reproductor. Si estás en otra parte de la página, el mini reproductor de abajo tiene ⏮, ▶/⏸ y ⏭. En móviles los controles suelen aparecer en la pantalla de bloqueo.'],
    fr: ['Comment mettre en pause et reprendre ?', 'Avec le bouton lecture/pause du lecteur. Ailleurs sur la page, le mini-lecteur en bas a ⏮, ▶/⏸ et ⏭. Sur téléphone, les commandes apparaissent souvent sur l’écran de verrouillage.'],
  }, { icon: '⏯️', related: ['background_listening', 'playback_controls'] }),

  L('ayah_repeat', 'ayah_audio', 'audio', 'audio', { anchor: '#surahs' }, ['كرر ايه', 'تكرار ايه', 'اعاده ايه', 'repeat an ayah', 'loop a verse', 'repetir una aleya', 'repeter une ayah'], { related: ['memorize_surah', 'playback_controls'] }),

  F('playback_controls', 'audio', 'audio', { anchor: '#audio' }, ['التحكم بالتشغيل', 'سرعه التلاوه', 'تسريع', 'ابطاء', 'تكرار السوره', 'السابق والتالي', 'playback speed', 'control playback', 'loop surah', 'velocidad', 'vitesse de lecture'], {
    ar: ['كيف أتحكم في التشغيل؟', 'في قسم الاستماع:\n• «سرعة التلاوة» من 0.5× إلى 2×.\n• «تكرار السورة» لإعادتها بلا توقف.\n• «السابق» و«التالي» للتنقل بين السور.\n• «مؤقت الإيقاف ⏲️» لإيقافها بعد مدة.\n• شريط المشغّل للتقديم والتأخير ورفع الصوت.'],
    en: ['How do I control playback?', 'In the listening section:\n• “Playback speed” from 0.5× to 2×.\n• “Surah Loop” to repeat it continuously.\n• “Previous” and “Next” to move between surahs.\n• “Sleep timer ⏲️” to stop after a while.\n• The player bar to seek and change the volume.'],
    es: ['¿Cómo controlo la reproducción?', 'En la sección de audio: «Velocidad» de 0,5× a 2×, «Repetir Sura», «Anterior» y «Siguiente», «Temporizador ⏲️» y la barra para avanzar y el volumen.'],
    fr: ['Comment contrôler la lecture ?', 'Dans la section audio : « Vitesse de lecture » de 0,5× à 2×, « Répéter Sourate », « Précédent » et « Suivant », « Minuterie ⏲️ » et la barre pour avancer et régler le volume.'],
  }, { icon: '🎛️', related: ['sleep_queue', 'pause_resume'] }),

  L('sleep_queue', 'sleep', 'audio', 'audio', { anchor: '#audio' }, ['مؤقت النوم', 'قائمه التشغيل', 'sleep timer', 'queue', 'temporizador', 'minuterie'], { related: ['playback_controls'] }),

  F('background_listening', 'audio', 'audio', { anchor: '#audio' }, ['استمع وانا اتصفح', 'الاستماع في الخلفيه', 'المشغل الصغير', 'اتنقل والتلاوه شغاله', 'listen while browsing', 'background', 'mini player', 'escuchar mientras navego', 'ecouter en naviguant'], {
    ar: ['هل أستطيع الاستماع أثناء استخدام أقسام أخرى؟', 'نعم. بعد تشغيل سورة يمكنك التنقل في الموقع وفتح الأذكار أو الدروس، والتلاوة مستمرة؛ ويظهر مشغّل صغير في أسفل الشاشة للتحكم بها. ولكن إغلاق صفحة الموقع أو إعادة تحميلها يوقف التلاوة.'],
    en: ['Can I listen while using other sections?', 'Yes. After starting a surah you can move around the site and open the adhkar or lessons while it keeps playing; a small player at the bottom of the screen controls it. Closing or reloading the page stops the recitation.'],
    es: ['¿Puedo escuchar mientras uso otras secciones?', 'Sí. Tras iniciar una sura puedes moverte por el sitio y la recitación sigue; un mini reproductor abajo la controla. Cerrar o recargar la página la detiene.'],
    fr: ['Puis-je écouter en utilisant d’autres sections ?', 'Oui. Après avoir lancé une sourate, vous pouvez naviguer sur le site, la récitation continue ; un mini-lecteur en bas la contrôle. Fermer ou recharger la page l’arrête.'],
  }, { icon: '🎧', related: ['pause_resume'] }),

  F('ayah_listen', 'audio', 'audio', { anchor: '#surahs' }, ['استمع لايه وحده', 'تلاوه ايه', 'صوت الايه', 'listen to one ayah', 'single ayah audio', 'escuchar una aleya', 'ecouter une ayah'], {
    ar: ['كيف أستمع إلى آية واحدة؟', 'افتح السورة في وضع القراءة واضغط على الآية: تُتلى وحدها ويظهر تفسيرها. فعّل «متابعة التلاوة إلى الآية التالية ⏭» لتستمر التلاوة آية بعد آية، أو «تفعيل تكرار الآية» لإعادتها.'],
    en: ['How do I listen to a single ayah?', 'Open the surah in the reading view and tap the ayah: it is recited on its own and its tafsir appears. Turn on “Continue to the next ayah ⏭” to keep going ayah by ayah, or “Enable Ayah Loop” to repeat it.'],
    es: ['¿Cómo escucho una sola aleya?', 'Abre la sura y toca la aleya: se recita sola y aparece su tafsir. Activa «Continuar con la siguiente aleya ⏭» o «Activar repetición de Aleya».'],
    fr: ['Comment écouter une seule ayah ?', 'Ouvrez la sourate et touchez l’ayah : elle est récitée seule et son tafsir apparaît. Activez « Continuer à l’ayah suivante ⏭ » ou « Activer la répétition de l’Ayah ».'],
  }, { icon: '🔊', related: ['ayah_repeat'] }),

  F('audio_trouble', 'audio', 'audio', { anchor: '#audio' }, ['الصوت لا يعمل', 'التلاوه لا تعمل', 'ما في صوت', 'الصوت ما بشتغل', 'التلاوه ما بتشتغل', 'لا يوجد صوت', 'audio not working', 'no sound', 'audio does not play', 'no suena', 'el audio no funciona', 'pas de son', 'l audio ne marche pas'], {
    ar: ['التلاوة لا تعمل، ماذا أفعل؟', 'جرّب بالترتيب:\n1. تأكد من اتصالك بالإنترنت؛ التلاوات تُحمَّل مباشرة من خوادم التلاوة.\n2. تأكد أن صوت الجهاز غير مكتوم وأن الهاتف ليس في الوضع الصامت.\n3. اضغط «🔄 إعادة المحاولة» في المشغّل، أو اختر قارئًا آخر.\n4. استخدم «⬇️ فتح / تنزيل التلاوة» لفتح الملف مباشرة.\n5. بعض المتصفحات تمنع التشغيل التلقائي: اضغط زر التشغيل بنفسك.\nسورة الفاتحة لها نسخة محفوظة داخل الموقع تعمل عند تعذّر الخوادم.'],
    en: ['The recitation does not play. What should I do?', 'Try, in order:\n1. Check your internet connection; recitations stream directly from the recitation servers.\n2. Make sure the device is not muted or in silent mode.\n3. Press “🔄 Try again” in the player, or choose another reciter.\n4. Use “⬇️ Open / download recitation” to open the file directly.\n5. Some browsers block autoplay: press play yourself.\nAl-Fatihah has a copy stored on the site itself for when the servers fail.'],
    es: ['El audio no suena, ¿qué hago?', 'Prueba:\n1. Comprueba la conexión a internet.\n2. Que el dispositivo no esté silenciado.\n3. Pulsa «🔄 Reintentar» o elige otro recitador.\n4. Usa «⬇️ Abrir / descargar recitación».\n5. Algunos navegadores bloquean la reproducción automática: pulsa reproducir.\nAl-Fatiha tiene una copia en el propio sitio.'],
    fr: ['La récitation ne se lance pas, que faire ?', 'Essayez :\n1. Vérifiez la connexion internet.\n2. Que l’appareil ne soit pas en silencieux.\n3. Appuyez sur « 🔄 Réessayer » ou choisissez un autre récitateur.\n4. Utilisez « ⬇️ Ouvrir / télécharger la récitation ».\n5. Certains navigateurs bloquent la lecture automatique : appuyez sur lecture.\nAl-Fatiha a une copie sur le site lui-même.'],
  }, { icon: '🔇', related: ['not_loading', 'browser_compat'] }),

  // ======================================================================= D. memorization
  L('recite_lab', 'memorize', 'memorization', 'memorization', { dialog: 'voiceTestModal' }, ['اسمع حفظي', 'تسميع', 'سمع لي', 'مختبر التسميع', 'use the recitation feature', 'recite from memory', 'voice test', 'recitar de memoria', 'reciter de memoire'], { related: ['lab_modes', 'voice_recognition', 'mistakes_detection'] }),

  F('memorize_surah', 'memorization', 'memorization', { dialog: 'voiceTestModal' }, ['كيف احفظ سوره', 'كيف احفظ القران', 'ابدا بحفظ القران', 'طريقه الحفظ', 'احفظ القران', 'استخدم الموقع لحفظ القران', 'how to memorize a surah', 'memorize the quran', 'start memorizing', 'como memorizar', 'comment memoriser'], {
    ar: ['كيف أحفظ سورة باستخدام الموقع؟', 'طريقة عملية:\n1. اقرأ درس «🧠 منهج عملي للحفظ» في «🎓 الأكاديمية» (دورة حفظ القرآن).\n2. افتح السورة واستمع إليها مرات، وفعّل «تكرار الآية» أو «🔁 تكرار مقطع من الآيات» لتكرار ما تحفظه.\n3. افتح «🎙️ التسميع»، اختر السورة وطريقة «استمع أولاً ثم سمّع» أو «آية بآية»، واضغط الميكروفون واتلُ من حفظك.\n4. بعد إتمامها تُجدول مراجعتها تلقائيًا في «📈 خطتي وتقدمي».\nالقليل الدائم خير من الكثير المنقطع.'],
    en: ['How do I memorise a surah with the site?', 'A practical way:\n1. Read the lesson “🧠 A practical memorisation method” in the “🎓 Academy” (Quran memorisation course).\n2. Open the surah and listen several times; use “Enable Ayah Loop” or “🔁 Repeat a range of ayahs” for the part you are learning.\n3. Open “🎙️ Voice Test”, choose the surah and the mode “Listen first, then recite” or “Ayah by ayah”, press the microphone and recite from memory.\n4. When you complete it, its revision is scheduled automatically in “📈 My plan & progress”.\nA little done regularly is better than a lot done rarely.'],
    es: ['¿Cómo memorizo una sura con el sitio?', '1. Lee la lección «🧠 Un método práctico de memorización» en la «🎓 Academia».\n2. Escucha la sura varias veces y repite el tramo que aprendes («🔁 Repetir un tramo de aleyas»).\n3. Abre «🎙️ Prueba de Recitación», elige la sura y el modo «Escuchar primero» o «Aleya por aleya», y recita.\n4. Al completarla, su repaso se programa en «📈 Mi plan y progreso».'],
    fr: ['Comment mémoriser une sourate avec le site ?', '1. Lisez la leçon « 🧠 Une méthode pratique de mémorisation » dans l’« 🎓 Académie ».\n2. Écoutez la sourate plusieurs fois et répétez le passage (« 🔁 Répéter une série d’ayahs »).\n3. Ouvrez « 🎙️ Test de Récitation », choisissez la sourate et le mode « Écouter puis réciter » ou « Ayah par ayah », et récitez.\n4. Une fois terminée, sa révision est programmée dans « 📈 Mon plan et mes progrès ».'],
  }, { icon: '🧠', lesson: 'memo-method', related: ['memo_plan', 'lab_modes', 'revision_schedule'] }),

  F('memo_plan', 'memorization', 'memorization', { run: 'plan' }, ['خطه حفظ', 'ابدا خطه', 'هدف الحفظ اليومي', 'اضيف سوره للخطه', 'memorization plan', 'start a plan', 'plan de memorizacion', 'plan de memorisation'], {
    ar: ['كيف أبدأ خطة حفظ؟', 'افتح «🎙️ التسميع» ← تبويب «📈 خطتي وتقدمي» ← «🎯 خطة الحفظ»:\n1. اكتب «الهدف اليومي (عدد الآيات)» ثم «حفظ».\n2. اختر سورة من «أضف سورة إلى خطتك...» ثم «إضافة» (وكرر لكل سورة تريدها).\n3. سمّع كل يوم من التبويب «🎙️ التسميع»؛ يظهر تقدمك في الخطة وفي «🌿 رحلتي اليومية».'],
    en: ['How do I start a memorisation plan?', 'Open “🎙️ Voice Test” → the “📈 My plan & progress” tab → “🎯 Memorisation plan”:\n1. Enter the “Daily target (ayahs)” and press “Save”.\n2. Pick a surah in “Add a surah to your plan...” and press “Add” (repeat for each surah).\n3. Recite every day from the “🎙️ Recite” tab; your progress shows in the plan and in “🌿 My daily journey”.'],
    es: ['¿Cómo empiezo un plan de memorización?', 'Abre «🎙️ Prueba de Recitación» → «📈 Mi plan y progreso» → «🎯 Plan de memorización»:\n1. Escribe la «Meta diaria (aleyas)» y «Guardar».\n2. Elige una sura en «Añade una sura a tu plan...» y «Añadir».\n3. Recita cada día desde «🎙️ Recitar».'],
    fr: ['Comment commencer un plan de mémorisation ?', 'Ouvrez « 🎙️ Test de Récitation » → « 📈 Mon plan et mes progrès » → « 🎯 Plan de mémorisation » :\n1. Indiquez l’« Objectif quotidien (ayahs) » puis « Enregistrer ».\n2. Choisissez une sourate dans « Ajouter une sourate au plan... » puis « Ajouter ».\n3. Récitez chaque jour depuis « 🎙️ Réciter ».'],
  }, { icon: '🎯', related: ['revision_schedule', 'memo_goals', 'memo_progress'] }),

  L('revision_schedule', 'revision', 'memorization', 'memorization', { run: 'plan' }, ['جدول المراجعه', 'جدول مراجعه', 'مواعيد المراجعه', 'revision schedule', 'review schedule', 'calendario de repaso', 'calendrier de revision'], { related: ['revision_intervals', 'memo_plan'] }),

  F('revision_intervals', 'memorization', 'memorization', { run: 'plan' }, ['متي اراجع', 'كل كم يوم اراجع', 'المراجعه المتباعده', 'مراجعه مستحقه', 'when should i review', 'spaced repetition', 'revisions due', 'cuando repasar', 'quand reviser'], {
    ar: ['كيف تعمل مواعيد المراجعة؟', 'كل سورة أتممت تسميعها (أو حددتها «كمحفوظة») تُجدول لمراجعتها بعد 1 ثم 3 ثم 7 ثم 14 ثم 30 ثم 60 يومًا. إذا سمّعتها بلا أخطاء تتباعد المراجعة، وإذا كثرت الأخطاء تقترب. ترى «المراجعات القادمة» والمستحقة اليوم في «🔄 جدول المراجعة»، ويقترح قسم «بصيرة» ترتيبها.'],
    en: ['How do the revision dates work?', 'Every surah you complete (or mark “as memorised”) is scheduled for revision after 1, 3, 7, 14, 30, then 60 days. A clean recitation spaces the next revision further out; many mistakes bring it closer. “Upcoming revisions” and those due today are in “🔄 Revision schedule”, and “Insights” suggests their order.'],
    es: ['¿Cómo funcionan las fechas de repaso?', 'Cada sura completada (o marcada como memorizada) se repasa tras 1, 3, 7, 14, 30 y 60 días. Sin errores, el siguiente repaso se aleja; con muchos errores, se acerca. Las verás en «🔄 Calendario de repaso».'],
    fr: ['Comment fonctionnent les dates de révision ?', 'Chaque sourate terminée (ou marquée mémorisée) est révisée après 1, 3, 7, 14, 30 puis 60 jours. Sans erreur, la révision suivante s’éloigne ; avec beaucoup d’erreurs, elle se rapproche. Voir « 🔄 Calendrier de révision ».'],
  }, { icon: '🔄', related: ['revision_schedule', 'review_mistakes'] }),

  F('lab_modes', 'memorization', 'memorization', { dialog: 'voiceTestModal' }, ['طرق التسميع', 'طريقه التسميع', 'اخفاء واظهار', 'اختبار ذاتي', 'ايه بايه', 'recitation modes', 'hide and reveal', 'self test', 'modos de recitacion', 'modes de recitation'], {
    ar: ['ما هي طرق التسميع في المختبر؟', 'في «🎙️ التسميع» اختر «طريقة التسميع»:\n• تسميع متتابع (الافتراضي): تتلو والآيات تظهر بعد قراءتها.\n• آية بآية: ترى الآية ثم تسمّعها.\n• إخفاء وإظهار: الكلمات مخفية وتظهر كلما قرأتها.\n• استمع أولاً ثم سمّع: تُتلى الآية ثم تعيدها.\n• تكرار الآية: تكرر الآية عددًا تختاره.\n• اختبار ذاتي: بلا مساعدة، مع نتيجة في النهاية.\nوتستطيع تحديد «من الآية» و«إلى الآية»، وتستخدم 💡 الكلمة التالية، 👁️ إظهار الآية، 🔊 استمع، ⏭ تخطَّ.'],
    en: ['What recitation modes does the lab have?', 'In “🎙️ Voice Test”, choose the “Mode”:\n• Sequential (default): you recite and the ayahs appear after you read them.\n• Ayah by ayah: you see the ayah, then recite it.\n• Hide & reveal: words are hidden and appear as you say them.\n• Listen first, then recite: the ayah is played, then you repeat it.\n• Repeat the ayah: repeat it a chosen number of times.\n• Self-test: no help, with a result at the end.\nYou can set “From ayah” and “To ayah”, and use 💡 Next word, 👁️ Show ayah, 🔊 Listen, ⏭ Skip.'],
    es: ['¿Qué modos tiene el laboratorio?', 'En «🎙️ Prueba de Recitación», «Modo»: secuencial, aleya por aleya, ocultar y mostrar, escuchar primero, repetir la aleya y autoevaluación. Puedes elegir «Desde la aleya» y «Hasta la aleya» y usar 💡, 👁️, 🔊 y ⏭.'],
    fr: ['Quels modes propose le laboratoire ?', 'Dans « 🎙️ Test de Récitation », « Mode » : séquentiel, ayah par ayah, masquer et révéler, écouter puis réciter, répéter l’ayah et auto-évaluation. Vous pouvez choisir « De l’ayah » et « À l’ayah » et utiliser 💡, 👁️, 🔊 et ⏭.'],
  }, { icon: '🎚️', related: ['voice_recognition', 'mistakes_detection'] }),

  F('voice_recognition', 'memorization', 'memorization', { dialog: 'voiceTestModal' }, ['التعرف علي الصوت', 'كيف يسمعني', 'كيف يفهم صوتي', 'التعرف علي الكلام', 'هل يسجل صوتي', 'voice recognition', 'speech recognition', 'how does it hear', 'reconocimiento de voz', 'reconnaissance vocale'], {
    ar: ['كيف يعمل التعرف على الصوت في التسميع؟', 'يستخدم المختبر خاصية «التعرف على الكلام» الموجودة في متصفحك (مثل Chrome وEdge): تحوّل تلاوتك إلى كلمات مكتوبة، ثم يقارن الموقع هذه الكلمات بنص الآية من المصدر الموثّق.\n• لا يحفظ الموقع تسجيلًا لصوتك. لكن بعض المتصفحات تعالج الصوت على خوادم الشركة المطوّرة للمتصفح.\n• لا يحكم على التجويد أو مخارج الحروف أو الحركات؛ فلا يغني عن القراءة على معلّم متقن.'],
    en: ['How does voice recognition work in the lab?', 'The lab uses your browser’s built-in “speech recognition” (e.g. Chrome and Edge): it turns your recitation into written words, and the site compares those words with the ayah text from the verified source.\n• The site keeps no recording of your voice; some browsers, however, process the audio on their vendor’s servers.\n• It cannot judge tajweed, articulation or vowelling, so it does not replace reciting to a qualified teacher.'],
    es: ['¿Cómo funciona el reconocimiento de voz?', 'El laboratorio usa el «reconocimiento de voz» del navegador (Chrome, Edge): convierte tu recitación en palabras y el sitio las compara con el texto verificado.\n• El sitio no guarda tu voz, aunque algunos navegadores procesan el audio en servidores de su fabricante.\n• No evalúa el tajwid ni la pronunciación; no sustituye a un maestro.'],
    fr: ['Comment fonctionne la reconnaissance vocale ?', 'Le laboratoire utilise la « reconnaissance vocale » du navigateur (Chrome, Edge) : votre récitation devient des mots que le site compare au texte vérifié.\n• Le site ne garde aucun enregistrement, mais certains navigateurs traitent l’audio sur les serveurs de leur éditeur.\n• Il ne juge ni le tajwid ni la prononciation ; il ne remplace pas un enseignant.'],
  }, { icon: '🗣️', related: ['mic_trouble', 'mistakes_detection'] }),

  F('mistakes_detection', 'memorization', 'memorization', { dialog: 'voiceTestModal' }, ['كيف يعرف الخطا', 'كيف يكتشف الاخطاء', 'كلمه ناقصه', 'كلمه مختلفه', 'how does it detect mistakes', 'identify mistakes', 'como detecta errores', 'comment detecte les erreurs'], {
    ar: ['كيف يكتشف الموقع أخطاء التسميع؟', 'يقارن الكلمات التي تعرّف عليها المتصفح بكلمات الآية بعد توحيد طريقة الكتابة (الهمزات والتشكيل)، فيعلّم كل كلمة: صحيحة، أو ناقصة (لم تُقرأ)، أو مختلفة (قُرئت بغيرها). تُسجَّل الأخطاء في «📝 سجل الأخطاء».\nقد يخطئ التعرّف على الكلام أحيانًا خاصة مع الضجيج، فأعد المحاولة بصوت واضح، ولا يكشف أخطاء التجويد أو الحركات.'],
    en: ['How does the system identify mistakes?', 'It compares the words recognised by the browser with the words of the ayah, after unifying spelling (hamzas and vowel marks), and marks each word: correct, missing (not said) or different (said otherwise). Mistakes are recorded in “📝 Mistake history”.\nSpeech recognition can itself be wrong, especially with noise, so retry in a clear voice; it does not detect tajweed or vowel mistakes.'],
    es: ['¿Cómo detecta los errores?', 'Compara las palabras reconocidas con las de la aleya y marca cada una: correcta, faltante o diferente. Se guardan en «📝 Historial de errores». El reconocimiento puede fallar con ruido; no detecta errores de tajwid ni de vocales.'],
    fr: ['Comment le site détecte-t-il les erreurs ?', 'Il compare les mots reconnus à ceux de l’ayah et marque chaque mot : correct, manquant ou différent. Elles sont gardées dans « 📝 Historique des erreurs ». La reconnaissance peut se tromper avec du bruit ; elle ne détecte ni le tajwid ni les voyelles.'],
  }, { icon: '🔍', related: ['review_mistakes', 'voice_recognition'] }),

  F('review_mistakes', 'memorization', 'memorization', { run: 'plan' }, ['راجع اخطائي', 'اخطائي', 'سجل الاخطاء', 'الكلمات التي اخطئ فيها', 'review my mistakes', 'mistake history', 'revisar mis errores', 'revoir mes erreurs'], {
    ar: ['كيف أراجع أخطائي؟', '• «🎙️ التسميع» ← «📈 خطتي وتقدمي» ← «📝 سجل الأخطاء»: الآيات التي أخطأت فيها والكلمات.\n• في لوحة التحكم قسم «📊 بصيرة» ← «تحليل الحفظ»: الآيات التي تحتاج تثبيتًا، والكلمات الأكثر نسيانًا، وترتيب المراجعات المقترح.\nافتح الآية من هناك وكررها ثم سمّعها من جديد.'],
    en: ['How do I review my mistakes?', '• “🎙️ Voice Test” → “📈 My plan & progress” → “📝 Mistake history”: the ayahs and words you got wrong.\n• On the dashboard, “📊 Insights” → memorisation analysis: ayahs that need attention, words most often missed and the suggested revision order.\nOpen the ayah from there, repeat it and recite it again.'],
    es: ['¿Cómo reviso mis errores?', '• «📈 Mi plan y progreso» → «📝 Historial de errores».\n• «📊 Perspectiva» → análisis de memorización: aleyas débiles, palabras más olvidadas y orden de repaso sugerido.'],
    fr: ['Comment revoir mes erreurs ?', '• « 📈 Mon plan et mes progrès » → « 📝 Historique des erreurs ».\n• « 📊 Perspective » → analyse de mémorisation : ayahs à consolider, mots les plus oubliés et ordre de révision suggéré.'],
  }, { icon: '📝', related: ['mistakes_detection', 'memo_progress'] }),

  F('memo_progress', 'memorization', 'memorization', { run: 'plan' }, ['تقدم الحفظ', 'كم حفظت', 'متابعه الحفظ', 'احصائيات الحفظ', 'track memorization progress', 'memorization progress', 'progreso de memorizacion', 'progression de memorisation'], {
    ar: ['كيف أتابع تقدمي في الحفظ؟', '• «📈 خطتي وتقدمي» في مختبر التسميع: أرقام خطتك وما سمّعته اليوم.\n• بطاقة «🧠» في «🌿 رحلتي اليومية»: آيات اليوم من هدفك، ومجموع الآيات والسور، والمراجعات المستحقة.\n• «📊 بصيرة»: خريطة النشاط، والأيام المتتالية، ومنحنى الدقة.'],
    en: ['How do I track my memorisation progress?', '• “📈 My plan & progress” in the lab: your plan figures and what you recited today.\n• The 🧠 card of “🌿 My daily journey”: today’s ayahs against your goal, total ayahs and surahs, revisions due.\n• “📊 Insights”: activity map, streaks and accuracy trend.'],
    es: ['¿Cómo sigo mi progreso de memorización?', '• «📈 Mi plan y progreso» en el laboratorio.\n• La tarjeta 🧠 de «🌿 Mi recorrido diario».\n• «📊 Perspectiva»: actividad, rachas y precisión.'],
    fr: ['Comment suivre ma mémorisation ?', '• « 📈 Mon plan et mes progrès » dans le laboratoire.\n• La carte 🧠 de « 🌿 Mon parcours du jour ».\n• « 📊 Perspective » : activité, séries et précision.'],
  }, { icon: '📈', related: ['memo_goals', 'insights'] }),

  F('memo_goals', 'memorization', 'memorization', { dialog: 'settingsModal' }, ['اهداف الحفظ', 'هدفي في الحفظ', 'نظم اهدافي', 'هدف يومي للحفظ', 'memorization goals', 'organize my goals', 'metas de memorizacion', 'objectifs de memorisation'], {
    ar: ['كيف أنظّم أهدافي في الحفظ؟', '• الهدف اليومي بالآيات: «⚙️ الإعدادات» ← «🎯 الأهداف» ← «هدف الحفظ اليومي»، أو من «🎯 خطة الحفظ» في المختبر.\n• السور التي تريد حفظها: أضفها إلى خطتك بالترتيب الذي تريده.\n• ما تحفظه من قبل: «📚 سور حفظتها من قبل» ← «تحديد كمحفوظة» لتدخل جدول المراجعة.\n• هدفك العام (مثل: حفظ جزء عم) تكتبه في «👤 حسابي».'],
    en: ['How do I organise my memorisation goals?', '• Daily target in ayahs: “⚙️ Settings” → “🎯 Goals” → “Daily memorisation goal”, or in the lab’s “🎯 Memorisation plan”.\n• Surahs you want to memorise: add them to your plan in the order you want.\n• What you already know: “📚 Surahs I already know” → “Mark as memorised” so they enter the revision schedule.\n• Your overall goal (e.g. memorise Juz Amma) goes in “👤 My Profile”.'],
    es: ['¿Cómo organizo mis metas?', '• Meta diaria: «⚙️ Ajustes» → «🎯 Metas», o en el plan del laboratorio.\n• Suras a memorizar: añádelas al plan.\n• Lo que ya sabes: «📚 Suras que ya sé» → «Marcar como memorizada».\n• Tu meta general, en «👤 Mi Perfil».'],
    fr: ['Comment organiser mes objectifs ?', '• Objectif quotidien : « ⚙️ Paramètres » → « 🎯 Objectifs », ou dans le plan du laboratoire.\n• Sourates à mémoriser : ajoutez-les au plan.\n• Ce que vous savez déjà : « 📚 Sourates déjà mémorisées » → « Marquer comme mémorisée ».\n• Votre objectif général, dans « 👤 Mon Profil ».'],
  }, { icon: '🗂️', related: ['memo_plan', 'memo_consistency'] }),

  F('memo_consistency', 'memorization', 'memorization', { anchor: '#dashboardSection' }, ['الاستمرار', 'المداومه', 'لا اثبت', 'اتوقف عن الحفظ', 'انقطع', 'الالتزام', 'stay consistent', 'consistency', 'keep going', 'constancia', 'regularite'], {
    ar: ['كيف أحافظ على الاستمرار في الحفظ والقراءة؟', '• ضع هدفًا يوميًا صغيرًا تقدر عليه (ولو 3 آيات).\n• تابع «🌿 رحلتي اليومية» و«📖 وردك اليومي» كل يوم.\n• انظر «الأيام المتتالية» في «📊 بصيرة»، و«خطوتك التالية» التي تقترح ما تبدأ به.\n• لا تترك المراجعات المستحقة تتراكم.\nوفي الحديث: «أحب الأعمال إلى الله أدومها وإن قلّ» (متفق عليه).'],
    en: ['How do I stay consistent?', '• Set a small daily goal you can keep (even 3 ayahs).\n• Check “🌿 My daily journey” and the “📖 Daily Wird” every day.\n• Look at your streak in “📊 Insights” and at “Your next step”, which suggests what to do.\n• Do not let due revisions pile up.\nIn the hadith: “The most beloved deeds to Allah are the most constant, even if small” (Bukhari and Muslim).'],
    es: ['¿Cómo mantengo la constancia?', '• Una meta diaria pequeña.\n• Revisa «🌿 Mi recorrido diario» y el «📖 Wird Diario».\n• Mira tu racha en «📊 Perspectiva» y «tu siguiente paso».\n• No acumules repasos.\nHadiz: «Las obras más amadas por Allah son las más constantes, aunque sean pocas» (Bujari y Muslim).'],
    fr: ['Comment rester régulier ?', '• Un petit objectif quotidien.\n• Consultez « 🌿 Mon parcours du jour » et le « 📖 Wird Quotidien ».\n• Regardez votre série dans « 📊 Perspective » et « votre prochaine étape ».\n• Ne laissez pas les révisions s’accumuler.\nHadith : « Les œuvres les plus aimées d’Allah sont les plus constantes, même peu nombreuses » (Bukhari et Muslim).'],
  }, { icon: '🌱', related: ['wird', 'memo_goals'] }),

  F('saved_for_revision', 'memorization', 'notes', { dialog: 'notesModal' }, ['الايات المحفوظه للمراجعه', 'مجموعه مراجعه', 'ايات صعبه', 'use saved ayahs for revision', 'saved ayahs', 'aleyas guardadas para repasar', 'ayahs enregistrees pour reviser'], {
    ar: ['كيف أستخدم الآيات المحفوظة في المراجعة؟', 'أنشئ مجموعة باسم مثل «للمراجعة» أو «آيات صعبة»: اضغط على الآية ← «📝 ملاحظة وتصنيف» ← «＋ مجموعة جديدة». ثم من «📝 ملاحظاتي» اختر المجموعة من قائمة «المجموعة» لتعرض آياتها فقط، وافتح كل آية لتسمعها وتكررها، ثم سمّعها في المختبر.'],
    en: ['How do I use saved ayahs for revision?', 'Create a collection such as “To revise” or “Difficult ayahs”: tap the ayah → “📝 Note & collection” → “＋ New collection”. Then in “📝 My notes”, choose that collection in the “Collection” filter to list only its ayahs, open each one to listen and repeat it, then recite it in the lab.'],
    es: ['¿Cómo uso las aleyas guardadas para repasar?', 'Crea una colección «Para repasar»: toca la aleya → «📝 Nota y colección» → «＋ Nueva colección». Luego en «📝 Mis notas» filtra por esa colección y abre cada aleya.'],
    fr: ['Comment utiliser les ayahs enregistrées pour réviser ?', 'Créez une collection « À réviser » : touchez l’ayah → « 📝 Note et collection » → « ＋ Nouvelle collection ». Puis dans « 📝 Mes notes », filtrez par cette collection et ouvrez chaque ayah.'],
  }, { icon: '📚', related: ['collections', 'organize_notes'] }),

  L('mic_trouble', 'mic', 'memorization', 'memorization', { dialog: 'voiceTestModal' }, ['المايك لا يعمل', 'الميكروفون لا يعمل', 'المايك ما بشتغل', 'لا يسمعني', 'microphone not working', 'mic', 'microfono no funciona', 'le micro ne marche pas'], { related: ['voice_recognition', 'browser_compat'] }),

  // ======================================================================= E. prayer education
  L('learn_prayer', 'learn_prayer', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['كيف اتعلم الصلاه', 'تعلم الصلاه', 'علمني الصلاه', 'كيف اصلي', 'how to pray', 'learn how to pray', 'aprender a rezar', 'apprendre a prier'], { related: ['prayer_step_by_step', 'learn_wudu', 'daily_prayers'] }),

  F('daily_prayers_site', 'prayer_learning', 'prayer', { anchor: '#prayerSection' }, ['كم صلاه في اليوم', 'عدد الصلوات', 'الصلوات الخمس', 'كم مره في اليوم', 'how many daily prayers', 'how many prayers', 'cuantas oraciones', 'combien de prieres'], {
    ar: ['كم عدد الصلوات اليومية؟', 'الصلوات المفروضة في اليوم والليلة خمس: الفجر، والظهر، والعصر، والمغرب، والعشاء. ترى أوقاتها لمدينتك في قسم «مواقيت الصلاة»، وتتعلم أداءها في «🕋 تعلم الصلاة الصحيحة».'],
    en: ['How many daily prayers are there?', 'There are five obligatory prayers in a day and night: Fajr, Dhuhr, Asr, Maghrib and Isha. Their times for your city are in “Prayer Times”, and you learn how to perform them in “🕋 Learn the prayer”.'],
    es: ['¿Cuántas oraciones diarias hay?', 'Cinco oraciones obligatorias: Fajr, Dhuhr, Asr, Magrib e Isha. Sus horarios están en «Horarios de Oración» y su forma en «🕋 Aprender la oración».'],
    fr: ['Combien y a-t-il de prières par jour ?', 'Cinq prières obligatoires : Fajr, Dhuhr, Asr, Maghrib et Isha. Leurs horaires sont dans « Horaires de Prière » et leur accomplissement dans « 🕋 Apprendre la prière ».'],
  }, { icon: '🕌', related: ['daily_prayers', 'learn_prayer', 'prayer_times'] }),

  F('learn_wudu', 'prayer_learning', 'wudu', { anchor: '#learnSection' }, ['كيف اتوضا', 'تعلم الوضوء', 'صفه الوضوء', 'خطوات الوضوء', 'how to make wudu', 'learn wudu', 'como hacer el wudu', 'comment faire les ablutions'], {
    ar: ['كيف أتعلم الوضوء؟', 'افتح درس «💧 صفة الوضوء» في «🕋 تعلم الصلاة الصحيحة». باختصار:\n1. النية في القلب، ثم التسمية.\n2. غسل الكفين ثلاثًا.\n3. المضمضة والاستنشاق ثلاثًا.\n4. غسل الوجه ثلاثًا.\n5. غسل اليدين إلى المرفقين ثلاثًا، اليمنى ثم اليسرى.\n6. مسح الرأس مرة ومعه الأذنان.\n7. غسل الرجلين إلى الكعبين ثلاثًا.\nوفي الدرس فروض الوضوء ونواقضه ودليله (المائدة: 6) ومواضع الخلاف.'],
    en: ['How do I learn wudu?', 'Open the lesson “💧 How to perform wudu” in “🕋 Learn the prayer”. In short:\n1. Intention in the heart, then say Bismillah.\n2. Wash the hands three times.\n3. Rinse the mouth and nose three times.\n4. Wash the face three times.\n5. Wash the arms up to the elbows three times, right then left.\n6. Wipe the head once, with the ears.\n7. Wash the feet up to the ankles three times.\nThe lesson (in Arabic) also gives the obligations, what breaks wudu, the evidence (Al-Ma’idah 5:6) and differences between schools.'],
    es: ['¿Cómo aprendo el wudu?', 'Abre la lección «💧 Cómo hacer el wudu» en «🕋 Aprender la oración». En resumen: intención, Bismillah, lavar las manos, enjuagar boca y nariz, lavar la cara, los brazos hasta los codos, pasar las manos mojadas por la cabeza y las orejas, y lavar los pies hasta los tobillos (Corán 5:6).'],
    fr: ['Comment apprendre les ablutions ?', 'Ouvrez la leçon « 💧 Comment faire les ablutions » dans « 🕋 Apprendre la prière ». En bref : intention, Bismillah, laver les mains, rincer bouche et nez, laver le visage, les bras jusqu’aux coudes, passer les mains mouillées sur la tête et les oreilles, laver les pieds jusqu’aux chevilles (Coran 5:6).'],
  }, { icon: '💧', lesson: 'wudu', related: ['prayer_conditions', 'learn_prayer'] }),

  F('prayer_conditions', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['شروط الصلاه', 'شروط صحه الصلاه', 'conditions of prayer', 'prayer conditions', 'condiciones de la oracion', 'conditions de la priere'], {
    ar: ['ما هي شروط الصلاة؟', 'شروط الصلاة تسعة في هذا التقسيم: الإسلام، والعقل، والتمييز، ورفع الحدث (الطهارة)، وإزالة النجاسة، وستر العورة، ودخول الوقت، واستقبال القبلة، والنية. ستجد شرحها وأدلتها ومواضع الخلاف في درس «📋 شروط الصلاة».'],
    en: ['What are the conditions of prayer?', 'In this classification there are nine: Islam, sanity, discernment, purification from ritual impurity, removing filth, covering the awrah, the prayer time having begun, facing the qiblah, and intention. The lesson “📋 Conditions of prayer” explains them with evidence and differences of opinion.'],
    es: ['¿Cuáles son las condiciones de la oración?', 'Nueve en esta clasificación: islam, juicio, discernimiento, pureza ritual, eliminar la impureza, cubrir el awrah, que haya entrado la hora, orientarse a la qibla e intención. La lección «📋 Condiciones de la oración» las explica.'],
    fr: ['Quelles sont les conditions de la prière ?', 'Neuf dans cette classification : l’islam, la raison, le discernement, la pureté rituelle, l’absence d’impureté, couvrir la awra, l’entrée de l’heure, l’orientation vers la qibla et l’intention. La leçon « 📋 Conditions de la prière » les explique.'],
  }, { icon: '📋', lesson: 'conditions', related: ['learn_wudu', 'prayer_movements'] }),

  F('prayer_movements', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['حركات الصلاه', 'هيئات الصلاه', 'الركوع والسجود', 'صفه الصلاه بالرسم', 'movements of prayer', 'prayer positions', 'ruku sujud', 'movimientos de la oracion', 'mouvements de la priere'], {
    ar: ['كيف أتعلم حركات الصلاة؟', 'في «🕋 تعلم الصلاة الصحيحة» قسم «صفة الصلاة بالرسم خطوة بخطوة»: عشر خطوات مصوّرة (القيام، تكبيرة الإحرام، القبض، الركوع، الرفع منه، السجود، الجلوس بين السجدتين، التشهد، التورك، التسليم)، مع ما يُقال في كل خطوة. وتفصيلها في درس «🧎 صفة الصلاة خطوة بخطوة».'],
    en: ['How do I learn the movements of prayer?', 'In “🕋 Learn the prayer” there is “The prayer, illustrated step by step”: ten illustrated steps (standing, the opening takbir, placing the hands, bowing, rising, prostration, sitting between the prostrations, tashahhud, tawarruk, salam), with what is said in each. Details are in the lesson “🧎 The prayer step by step”.'],
    es: ['¿Cómo aprendo los movimientos de la oración?', 'En «🕋 Aprender la oración», «La oración ilustrada paso a paso»: diez pasos ilustrados con lo que se dice en cada uno. Detalles en la lección «🧎 La oración paso a paso».'],
    fr: ['Comment apprendre les mouvements de la prière ?', 'Dans « 🕋 Apprendre la prière », « La prière illustrée étape par étape » : dix étapes illustrées avec ce qui est dit à chacune. Détails dans la leçon « 🧎 La prière pas à pas ».'],
  }, { icon: '🧎', lesson: 'steps', related: ['opening_takbir', 'learn_tashahhud'] }),

  F('opening_takbir', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['تكبيره الاحرام', 'التكبير', 'الله اكبر في الصلاه', 'opening takbir', 'takbir', 'takbirat al ihram', 'takbir inicial', 'takbir d ouverture'], {
    ar: ['كيف أتعلم تكبيرة الإحرام؟', 'تكبيرة الإحرام هي قول «الله أكبر» لبدء الصلاة، مع رفع اليدين حذو المنكبين أو الأذنين، وهي ركن لا تصح الصلاة بدونه. شاهد خطوة «تكبيرة الإحرام» المصوّرة في «صفة الصلاة بالرسم»، واقرأ درس «🏛️ أركان الصلاة».'],
    en: ['How do I learn the opening takbir?', 'The opening takbir is saying “Allahu akbar” to begin the prayer, raising the hands to the shoulders or ears; it is a pillar without which the prayer is not valid. See the illustrated “opening takbir” step in “The prayer, illustrated step by step”, and the lesson “🏛️ Pillars of prayer”.'],
    es: ['¿Cómo aprendo el takbir inicial?', 'Es decir «Allahu akbar» para empezar la oración, alzando las manos; es un pilar. Mira el paso ilustrado del takbir y la lección «🏛️ Pilares de la oración».'],
    fr: ['Comment apprendre le takbir d’ouverture ?', 'C’est dire « Allahu akbar » pour commencer la prière, en levant les mains ; c’est un pilier. Voyez l’étape illustrée du takbir et la leçon « 🏛️ Piliers de la prière ».'],
  }, { icon: '🙌', lesson: 'pillars', related: ['prayer_movements', 'learn_fatiha'] }),

  F('learn_fatiha', 'prayer_learning', 'quran', { anchor: '#surahs' }, ['اتعلم الفاتحه', 'احفظ الفاتحه', 'قراءه الفاتحه', 'learn al fatiha', 'learn fatiha', 'memorize fatiha', 'aprender al fatiha', 'apprendre al fatiha'], {
    ar: ['كيف أتعلم سورة الفاتحة؟', 'قراءة الفاتحة ركن في كل ركعة، فابدأ بها:\n1. افتح «سورة الفاتحة» من قسم «السور» (أول سورة).\n2. اضغط على كل آية لتسمعها، وفعّل «تكرار الآية» لتعيدها حتى تحفظها.\n3. سمّعها في «🎙️ التسميع» بطريقة «استمع أولاً ثم سمّع».\n4. اطلب من مسلم يحسن القراءة أن يسمعها منك ليصحح نطقك.\nوتستطيع سؤالي «ما معنى سورة الفاتحة؟» لترى تفسيرها.'],
    en: ['How do I learn Al-Fatihah?', 'Reciting Al-Fatihah is a pillar of every rak’ah, so start with it:\n1. Open “Al-Faatiha” in “Surahs” (the first surah).\n2. Tap each ayah to hear it, and turn on “Enable Ayah Loop” to repeat it until you know it.\n3. Recite it in “🎙️ Voice Test” with “Listen first, then recite”.\n4. Ask a Muslim who recites well to listen and correct your pronunciation.\nYou can also ask me “what is the meaning of Al-Fatiha?”.'],
    es: ['¿Cómo aprendo Al-Fatiha?', 'Recitarla es un pilar de cada rak’a:\n1. Abre «Al-Faatiha» en «Suras».\n2. Toca cada aleya y activa la repetición.\n3. Recítala en «🎙️ Prueba de Recitación».\n4. Pide a un musulmán que lea bien que te corrija.'],
    fr: ['Comment apprendre Al-Fatiha ?', 'La réciter est un pilier de chaque rak’a :\n1. Ouvrez « Al-Faatiha » dans « Sourates ».\n2. Touchez chaque ayah et activez la répétition.\n3. Récitez-la dans « 🎙️ Test de Récitation ».\n4. Demandez à un musulman qui récite bien de vous corriger.'],
  }, { icon: '📗', related: ['fatiha_meaning', 'recite_lab'] }),

  F('learn_tashahhud', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['التشهد', 'كيف اتشهد', 'التحيات', 'دعاء التشهد', 'tashahhud', 'at tahiyyat', 'tashahud', 'tachahoud'], {
    ar: ['كيف أتعلم التشهد؟', 'افتح درس «☝️ التشهد» في «🕋 تعلم الصلاة الصحيحة»: فيه نص التشهد («التحيات لله…») والصلاة الإبراهيمية، ومتى يُقال التشهد الأول والأخير، مع خطوة «التشهد» المصوّرة. احفظه جملة جملة وكرره في صلاتك.'],
    en: ['How do I learn the tashahhud?', 'Open the lesson “☝️ Tashahhud” in “🕋 Learn the prayer”: it has the text (“At-tahiyyatu lillah…”), the Ibrahimi salawat, when the first and last tashahhud are said, and the illustrated “tashahhud” step. Learn it phrase by phrase and repeat it in your prayers.'],
    es: ['¿Cómo aprendo el tashahhud?', 'Abre la lección «☝️ Tashahhud»: el texto, la salawat ibrahimí y cuándo se dice, con el paso ilustrado.'],
    fr: ['Comment apprendre le tachahhoud ?', 'Ouvrez la leçon « ☝️ Tashahhud » : le texte, la salawat ibrahimiyya et quand le dire, avec l’étape illustrée.'],
  }, { icon: '☝️', lesson: 'tashahhud', related: ['prayer_movements'] }),

  F('where_prayer_lessons', 'prayer_learning', 'lessons', { anchor: '#learnSection' }, ['اين دروس الصلاه', 'دروس الصلاه', 'منهج الصلاه', 'where are the prayer lessons', 'prayer lessons', 'lecciones de oracion', 'lecons de priere'], {
    ar: ['أين أجد دروس الصلاة؟', 'في قسم «🕋 تعلم الصلاة الصحيحة» (رابط في الأعلى): «🕌 ابدأ هنا: صفة صلاة النبي ﷺ (بأربع لغات)»، ثم الرسوم خطوة بخطوة، ثم «دروس المنهج»: شروط الصلاة، الأركان، الواجبات، السنن، الوضوء، صفة الصلاة، التشهد، التسليم، الأخطاء الشائعة، سجود السهو، صلاة المسافر، صلاة الجماعة، وأسئلة واختبارات لتقييم الفهم. نصوص الدروس بالعربية وعناوينها مترجمة.'],
    en: ['Where can I find the prayer lessons?', 'In “🕋 Learn the prayer” (link at the top): “🕌 Start here: the Prophet’s ﷺ prayer (in four languages)”, then the illustrated steps, then “Lessons”: conditions, pillars, obligations, sunnahs, wudu, the prayer step by step, tashahhud, salam, common mistakes, prostration of forgetfulness, the traveller’s prayer, congregational prayer and a review quiz. The lesson texts are in Arabic; titles are translated.'],
    es: ['¿Dónde están las lecciones de oración?', 'En «🕋 Aprender la oración»: «🕌 Empieza aquí: la oración del Profeta ﷺ (en cuatro idiomas)», los pasos ilustrados y las «Lecciones» (condiciones, pilares, wudu, paso a paso, tashahhud, errores comunes, etc.). Los textos están en árabe.'],
    fr: ['Où trouver les leçons de prière ?', 'Dans « 🕋 Apprendre la prière » : « 🕌 Commencez ici : la prière du Prophète ﷺ (en quatre langues) », les étapes illustrées et les « Leçons » (conditions, piliers, ablutions, pas à pas, tashahhud, erreurs courantes, etc.). Les textes sont en arabe.'],
  }, { icon: '🗂️', related: ['prayer_step_by_step', 'learn_prayer'] }),

  F('prayer_step_by_step', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['ادرس الصلاه خطوه خطوه', 'خطوه بخطوه', 'بالترتيب', 'من وين ابدا بالصلاه', 'study prayer step by step', 'step by step', 'paso a paso', 'pas a pas'], {
    ar: ['كيف أدرس الصلاة خطوة بخطوة؟', 'ترتيب مقترح:\n1. «🕌 ابدأ هنا: صفة صلاة النبي ﷺ» — صورة كاملة مختصرة.\n2. درس «💧 صفة الوضوء».\n3. «📋 شروط الصلاة» ثم «🏛️ أركان الصلاة» ثم الواجبات والسنن.\n4. «🧎 صفة الصلاة خطوة بخطوة» مع الرسوم، ثم التشهد والتسليم.\n5. «⚠️ أخطاء شائعة في الصلاة» و«🔁 أحكام سجود السهو».\nفي آخر كل درس اختبار قصير، واضغط «✓ أتممت هذا الدرس» ليُحفظ تقدمك ويظهر الدرس التالي في «بصيرة».'],
    en: ['How do I study the prayer step by step?', 'A suggested order:\n1. “🕌 Start here: the Prophet’s ﷺ prayer” — the complete picture in short.\n2. “💧 How to perform wudu”.\n3. “📋 Conditions of prayer”, then “🏛️ Pillars of prayer”, then obligations and sunnahs.\n4. “🧎 The prayer step by step” with the diagrams, then tashahhud and salam.\n5. “⚠️ Common mistakes” and “🔁 Prostration of forgetfulness”.\nEach lesson ends with a short quiz; press “✓ I completed this lesson” to save your progress, and “Insights” suggests the next lesson.'],
    es: ['¿Cómo estudio la oración paso a paso?', 'Orden sugerido: 1. «🕌 Empieza aquí». 2. Wudu. 3. Condiciones y pilares. 4. «🧎 La oración paso a paso». 5. Errores comunes y postración del olvido. Cada lección tiene un cuestionario; pulsa «✓ He completado esta lección».'],
    fr: ['Comment étudier la prière pas à pas ?', 'Ordre suggéré : 1. « 🕌 Commencez ici ». 2. Ablutions. 3. Conditions et piliers. 4. « 🧎 La prière pas à pas ». 5. Erreurs courantes et prosternation de l’oubli. Chaque leçon a un quiz ; appuyez sur « ✓ J’ai terminé cette leçon ».'],
  }, { icon: '🪜', lesson: 'prophet-prayer', related: ['learn_wudu', 'quizzes', 'new_muslim_start_site'] }),

  F('prayer_pillars', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['اركان الصلاه', 'واجبات الصلاه', 'سنن الصلاه', 'pillars of prayer', 'obligatory acts of prayer', 'sunnahs of prayer', 'pilares de la oracion', 'piliers de la priere'], {
    ar: ['أين أتعلم أركان الصلاة وواجباتها وسننها؟', 'في «🕋 تعلم الصلاة الصحيحة» ثلاثة دروس متتالية:\n• «🏛️ أركان الصلاة»: ما لا تصح الصلاة بدونه، كتكبيرة الإحرام وقراءة الفاتحة والركوع والسجود.\n• «✅ واجبات الصلاة»: ما يُجبر تركه سهوًا بسجود السهو.\n• «🌿 سنن الصلاة»: ما يُكمل الصلاة ويزيد أجرها.\nالتقسيم فيها على المذهب الحنبلي كما شرحه الشيخ ابن عثيمين، مع بيان أهم مواضع الخلاف بين المذاهب.'],
    en: ['Where do I learn the pillars, obligatory acts and sunnahs of prayer?', '“🕋 Learn the prayer” has three consecutive lessons:\n• “🏛️ Pillars of prayer”: what the prayer is not valid without, such as the opening takbir, reciting Al-Fatihah, bowing and prostration.\n• “✅ Obligatory acts”: what, if forgotten, is made up by the prostration of forgetfulness.\n• “🌿 Sunnahs of prayer”: what completes the prayer and increases its reward.\nThe classification follows the Hanbali school as explained by Sheikh Ibn Uthaymeen, noting the main differences between schools.'],
    es: ['¿Dónde aprendo los pilares, obligaciones y sunnas de la oración?', 'En «🕋 Aprender la oración» hay tres lecciones: «🏛️ Pilares de la oración», «✅ Actos obligatorios» y «🌿 Sunnas de la oración». La clasificación sigue la escuela hanbalí (explicación del jeque Ibn Uzaymín) e indica las diferencias entre escuelas.'],
    fr: ['Où apprendre les piliers, obligations et sunnas de la prière ?', 'Dans « 🕋 Apprendre la prière », trois leçons : « 🏛️ Piliers de la prière », « ✅ Actes obligatoires » et « 🌿 Sunnas de la prière ». La classification suit l’école hanbalite (explication du cheikh Ibn Uthaymin) et signale les divergences entre écoles.'],
  }, { icon: '🏛️', lesson: 'pillars', related: ['prayer_conditions', 'sahw_lesson'] }),

  F('sahw_lesson', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['سجود السهو', 'نسيت في الصلاه', 'سهوت في الصلاه', 'شككت في الصلاه', 'prostration of forgetfulness', 'forgot in prayer', 'sujud sahw', 'postracion del olvido', 'prosternation de l oubli'], {
    ar: ['ماذا أفعل إذا سهوت في الصلاة؟', 'افتح درس «🔁 أحكام سجود السهو» في «🕋 تعلم الصلاة الصحيحة»: متى يُشرع (الزيادة، والنقص، والشك)، وكيف يُؤدّى (سجدتان)، وهل يكون قبل السلام أم بعده، مع الأدلة وبيان اختلاف العلماء. ولحالة بعينها تكررت معك اسأل عالمًا.'],
    en: ['What do I do if I make a mistake in prayer out of forgetfulness?', 'Open the lesson “🔁 Prostration of forgetfulness” in “🕋 Learn the prayer”: when it applies (adding, omitting, doubt), how it is done (two prostrations), and whether before or after the salam, with the evidence and the scholars’ differences. For a specific recurring case, ask a scholar.'],
    es: ['¿Qué hago si me equivoco en la oración por olvido?', 'Abre la lección «🔁 Postración del olvido»: cuándo se hace, cómo y si va antes o después del salam, con las diferencias entre sabios.'],
    fr: ['Que faire en cas d’oubli dans la prière ?', 'Ouvrez la leçon « 🔁 Prosternation de l’oubli » : quand la faire, comment, et avant ou après le salam, avec les divergences des savants.'],
  }, { icon: '🔁', lesson: 'sahw', related: ['prayer_pillars', 'common_mistakes'] }),

  F('travel_prayer', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['صلاه المسافر', 'القصر والجمع', 'الجمع بين الصلاتين', 'قصر الصلاه', 'جمع الصلاه', 'اصلي في السفر', 'prayer while travelling', 'shortening prayer', 'combining prayers', 'oracion del viajero', 'priere du voyageur'], {
    ar: ['كيف أصلي في السفر (القصر والجمع)؟', 'في درس «🧳 صلاة المسافر» شرح القصر (صلاة الرباعية ركعتين) والجمع بين الصلاتين، ومتى يُشرعان، مع الأدلة ومواضع اختلاف العلماء في مسافة السفر ومدته. اقرأه للتعلّم العام، ولحالتك الخاصة اسأل عالمًا موثوقًا.'],
    en: ['How do I pray while travelling (shortening and combining)?', 'The lesson “🧳 Prayer while travelling” explains shortening (praying four-unit prayers as two) and combining two prayers, when they apply, with the evidence and the scholars’ differences on distance and duration. Read it for general learning, and ask a trustworthy scholar about your own case.'],
    es: ['¿Cómo rezo de viaje?', 'La lección «🧳 La oración del viajero» explica acortar y combinar oraciones, cuándo se aplican y las diferencias entre sabios. Para tu caso, consulta a un sabio.'],
    fr: ['Comment prier en voyage ?', 'La leçon « 🧳 La prière du voyageur » explique le raccourcissement et le regroupement, quand ils s’appliquent et les divergences des savants. Pour votre cas, consultez un savant.'],
  }, { icon: '🧳', lesson: 'travel', related: ['jamaah_lesson', 'consult_scholar'] }),

  F('jamaah_lesson', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['صلاه الجماعه', 'الصلاه في المسجد', 'الامام والمامومين', 'congregational prayer', 'praying in the mosque', 'oracion en congregacion', 'priere en assemblee'], {
    ar: ['أين أتعلم صلاة الجماعة؟', 'في درس «👥 صلاة الجماعة» في «🕋 تعلم الصلاة الصحيحة»: فضلها، وموقف الإمام والمأمومين، ومتابعة الإمام، وما يفعله من فاتته ركعة (المسبوق)، مع الأدلة.'],
    en: ['Where do I learn about congregational prayer?', 'In the lesson “👥 Congregational prayer” in “🕋 Learn the prayer”: its virtue, where the imam and followers stand, following the imam, and what a latecomer does, with the evidence.'],
    es: ['¿Dónde aprendo la oración en congregación?', 'En la lección «👥 La oración en congregación»: su mérito, la posición del imam, seguirle y qué hace quien llega tarde.'],
    fr: ['Où apprendre la prière en assemblée ?', 'Dans la leçon « 👥 La prière en assemblée » : son mérite, la place de l’imam, le suivre et que faire en arrivant en retard.'],
  }, { icon: '👥', lesson: 'jamaah', related: ['travel_prayer'] }),

  F('common_mistakes', 'prayer_learning', 'prayer', { anchor: '#learnSection' }, ['اخطاء في الصلاه', 'اخطاء شائعه', 'ما الاخطاء في الصلاه', 'common mistakes in prayer', 'prayer mistakes', 'errores en la oracion', 'erreurs dans la priere'], {
    ar: ['ما الأخطاء الشائعة في الصلاة؟', 'افتح درس «⚠️ أخطاء شائعة في الصلاة»: أخطاء يقع فيها كثير من المصلين (كالعجلة وترك الطمأنينة، ومسابقة الإمام…) مع بيان الصواب ودليله. ويمكنك اختبار فهمك في آخر الدرس.'],
    en: ['What are common mistakes in prayer?', 'Open the lesson “⚠️ Common mistakes”: mistakes many people make (such as rushing without stillness, or getting ahead of the imam…), with the correct way and its evidence. You can test yourself at the end of the lesson.'],
    es: ['¿Qué errores son comunes en la oración?', 'Abre la lección «⚠️ Errores comunes»: errores frecuentes (como la prisa o adelantarse al imam) con la forma correcta.'],
    fr: ['Quelles sont les erreurs courantes dans la prière ?', 'Ouvrez la leçon « ⚠️ Erreurs courantes » : des erreurs fréquentes (précipitation, devancer l’imam…) avec la bonne manière.'],
  }, { icon: '⚠️', lesson: 'mistakes', related: ['sahw_lesson', 'prayer_movements'] }),

  // ======================================================================= F. academy
  L('academy', 'academy', 'academy', 'academy', { anchor: '#academySection' }, ['ما هي الاكاديميه', 'الاكاديميه الاسلاميه', 'what is the academy', 'islamic academy', 'que es la academia', 'qu est ce que l academie'], { related: ['courses', 'start_learning'] }),

  F('start_learning', 'academy', 'academy', { anchor: '#academySection' }, ['ابدا التعلم', 'من اين ابدا', 'كيف ابدا اتعلم', 'اريد ان اتعلم', 'start learning', 'where to start', 'begin learning', 'empezar a aprender', 'commencer a apprendre'], {
    ar: ['كيف أبدأ التعلّم في الموقع؟', 'ابدأ من «🎓 الأكاديمية التعليمية الإسلامية»: اختر دورة واضغط عليها فتظهر أهدافها ودروسها بالترتيب. إن كنت مبتدئًا فابدأ بدورة «أساسيات المعرفة الإسلامية» (أركان الإسلام وأركان الإيمان)، ثم «تعليم الصلاة». وقسم «📊 بصيرة» يقترح عليك الدرس التالي.'],
    en: ['How do I start learning?', 'Start from the “🎓 Islamic Learning Academy”: choose a course and press it to see its objectives and ordered lessons. If you are a beginner, start with “Basic Islamic knowledge” (pillars of Islam and of faith), then “Prayer education”. “📊 Insights” suggests your next lesson.'],
    es: ['¿Cómo empiezo a aprender?', 'Desde la «🎓 Academia»: elige un curso para ver sus objetivos y lecciones. Si eres principiante, empieza por «Conocimientos islámicos básicos» y luego «Educación de la oración».'],
    fr: ['Comment commencer à apprendre ?', 'Depuis l’« 🎓 Académie » : choisissez un cours pour voir ses objectifs et leçons. Débutant ? Commencez par « Connaissances islamiques de base », puis « Apprendre la prière ».'],
  }, { icon: '🚀', related: ['courses', 'beginners'] }),

  F('courses', 'academy', 'academy', { anchor: '#academySection' }, ['ما الدورات', 'الدورات المتاحه', 'قائمه الدورات', 'what courses', 'available courses', 'que cursos hay', 'quels cours'], {
    ar: ['ما هي الدورات المتاحة؟', 'في الأكاديمية خمس دورات قصيرة:\n• 🕌 تعليم الصلاة (دروس منهج الصلاة كاملة).\n• 🧠 حفظ القرآن (منهج عملي للحفظ، والمراجعة وتثبيت الحفظ).\n• 📘 أساسيات التجويد (مدخل، أحكام النون الساكنة والتنوين، الميم الساكنة، المدود).\n• 🕋 أساسيات المعرفة الإسلامية (أركان الإسلام، أركان الإيمان).\n• 🌱 العبادات اليومية (أذكار الصباح والمساء، الورد اليومي).'],
    en: ['What courses are available?', 'The academy has five short courses:\n• 🕌 Prayer education (the full prayer curriculum).\n• 🧠 Quran memorisation (a practical method, revision).\n• 📘 Tajweed fundamentals (introduction, noon sakinah and tanween, meem sakinah, madd).\n• 🕋 Basic Islamic knowledge (pillars of Islam, pillars of faith).\n• 🌱 Daily Islamic practice (morning and evening adhkar, a daily portion of the Quran).'],
    es: ['¿Qué cursos hay?', 'Cinco cursos: 🕌 Educación de la oración, 🧠 Memorización del Corán, 📘 Fundamentos del tajwid, 🕋 Conocimientos islámicos básicos y 🌱 Práctica islámica diaria.'],
    fr: ['Quels cours sont disponibles ?', 'Cinq cours : 🕌 Apprendre la prière, 🧠 Mémorisation du Coran, 📘 Fondamentaux du tajwid, 🕋 Connaissances islamiques de base et 🌱 Pratique islamique quotidienne.'],
  }, { icon: '📚', related: ['access_lessons', 'tajweed'] }),

  F('access_lessons', 'academy', 'lessons', { anchor: '#academySection' }, ['افتح درس', 'الوصول للدروس', 'اين الدروس', 'access lessons', 'open a lesson', 'abrir una leccion', 'ouvrir une lecon'], {
    ar: ['كيف أصل إلى الدروس؟', 'اضغط على بطاقة الدورة في «🎓 الأكاديمية» فتفتح نافذة بدروسها؛ اضغط على أي درس لفتحه. ودروس الصلاة تظهر أيضًا مباشرة في «🕋 تعلم الصلاة الصحيحة» ← «دروس المنهج». كل الدروس تعمل بدون إنترنت بعد الزيارة الأولى (عدا نص الآيات إن لم يُحمَّل من قبل).'],
    en: ['How do I access the lessons?', 'Press a course card in the “🎓 Academy” to open a window with its lessons; press any lesson to open it. Prayer lessons are also listed directly in “🕋 Learn the prayer” → “Lessons”. All lessons work offline after the first visit (except ayah texts not loaded before).'],
    es: ['¿Cómo accedo a las lecciones?', 'Pulsa la tarjeta de un curso en la «🎓 Academia» y luego la lección. Las de oración están también en «🕋 Aprender la oración» → «Lecciones».'],
    fr: ['Comment accéder aux leçons ?', 'Appuyez sur la carte d’un cours dans l’« 🎓 Académie », puis sur la leçon. Celles de la prière sont aussi dans « 🕋 Apprendre la prière » → « Leçons ».'],
  }, { icon: '🗝️', related: ['complete_lesson'] }),

  F('complete_lesson', 'academy', 'lessons', { anchor: '#academySection' }, ['اكمل درس', 'انهي الدرس', 'اتممت الدرس', 'complete a lesson', 'mark as done', 'completar una leccion', 'terminer une lecon'], {
    ar: ['كيف أُتمّ درسًا؟', 'اقرأ الدرس، وأجب عن الاختبار القصير في آخره إن وُجد، ثم اضغط «✓ أتممت هذا الدرس» أسفل النافذة. يُحفظ ذلك على جهازك، ويظهر في شريط التقدم وفي بطاقة «🎓» بلوحة التحكم.'],
    en: ['How do I complete a lesson?', 'Read the lesson, answer its short quiz if there is one, then press “✓ I completed this lesson” at the bottom of the window. It is saved on your device and shown in the progress bar and on the 🎓 card of the dashboard.'],
    es: ['¿Cómo completo una lección?', 'Léela, responde el cuestionario y pulsa «✓ He completado esta lección». Se guarda en tu dispositivo.'],
    fr: ['Comment terminer une leçon ?', 'Lisez-la, répondez au quiz puis appuyez sur « ✓ J’ai terminé cette leçon ». C’est enregistré sur votre appareil.'],
  }, { icon: '✅', related: ['learning_progress', 'quizzes'] }),

  F('quizzes', 'academy', 'lessons', { anchor: '#learnSection' }, ['هل يوجد اختبارات', 'اختبار', 'اسئله الاختبار', 'سؤال اليوم', 'are there quizzes', 'quiz', 'daily question', 'cuestionarios', 'quiz du jour'], {
    ar: ['هل توجد اختبارات؟', 'نعم: في آخر أكثر الدروس اختبار قصير من أسئلة متعددة الخيارات مع شرح الإجابة، ودرس «🎓 أسئلة واختبارات لتقييم الفهم» يجمع أسئلة الصلاة. وفي قسم «📊 بصيرة» «سؤال اليوم»: سؤال واحد كل يوم من اختبارات الدروس.'],
    en: ['Are there quizzes?', 'Yes: most lessons end with a short multiple-choice quiz with an explanation of the answer, and the “🎓 Review quiz” lesson gathers prayer questions. “📊 Insights” also has the “question of the day”, taken from the lesson quizzes.'],
    es: ['¿Hay cuestionarios?', 'Sí: la mayoría de las lecciones terminan con un cuestionario explicado, hay una «Prueba de repaso» y en «📊 Perspectiva» la «pregunta del día».'],
    fr: ['Y a-t-il des quiz ?', 'Oui : la plupart des leçons finissent par un quiz expliqué, il y a un « Quiz de révision » et, dans « 📊 Perspective », la « question du jour ».'],
  }, { icon: '❓', related: ['take_quiz'] }),

  F('take_quiz', 'academy', 'lessons', { anchor: '#learnSection' }, ['كيف احل الاختبار', 'اجيب علي الاختبار', 'take a quiz', 'answer the quiz', 'hacer un cuestionario', 'faire un quiz'], {
    ar: ['كيف أجيب عن الاختبار؟', 'افتح الدرس وانزل إلى «الاختبار»، واضغط على الإجابة التي تراها صحيحة: يظهر فورًا إن كانت صحيحة أم لا مع الشرح. بعد الإجابة عن كل الأسئلة تظهر نتيجتك. تستطيع إعادة الاختبار متى شئت.'],
    en: ['How do I take a quiz?', 'Open the lesson and scroll to the quiz; press the answer you think is right: you see at once whether it is correct, with the explanation. After all the questions your result is shown. You can retake it any time.'],
    es: ['¿Cómo hago un cuestionario?', 'Abre la lección, baja al cuestionario y pulsa la respuesta: verás si es correcta y la explicación. Al final aparece tu resultado.'],
    fr: ['Comment faire un quiz ?', 'Ouvrez la leçon, descendez au quiz et appuyez sur une réponse : vous voyez si elle est juste, avec l’explication. Votre résultat s’affiche à la fin.'],
  }, { icon: '📝', related: ['learning_progress'] }),

  F('learning_progress', 'academy', 'lessons', { anchor: '#dashboardSection' }, ['تقدمي في التعلم', 'كم درس انهيت', 'تقدم الدروس', 'learning progress', 'lessons completed', 'progreso de aprendizaje', 'progression d apprentissage'], {
    ar: ['كيف أعرف تقدمي في التعلّم؟', '• شريط التقدم في أعلى «🕋 تعلم الصلاة الصحيحة» (كم درسًا من 18).\n• بطاقة «🎓» في «🌿 رحلتي اليومية»: الدروس المكتملة من كل الدورات.\n• كل بطاقة دورة في الأكاديمية تبيّن ما أتممته منها.'],
    en: ['How do I check my learning progress?', '• The progress bar at the top of “🕋 Learn the prayer” (lessons done out of 18).\n• The 🎓 card of “🌿 My daily journey”: completed lessons across all courses.\n• Each course card in the academy shows what you completed.'],
    es: ['¿Cómo veo mi progreso?', 'La barra de «🕋 Aprender la oración», la tarjeta 🎓 de «🌿 Mi recorrido diario» y cada tarjeta de curso.'],
    fr: ['Comment voir ma progression ?', 'La barre d’« 🕋 Apprendre la prière », la carte 🎓 de « 🌿 Mon parcours du jour » et chaque carte de cours.'],
  }, { icon: '📊', related: ['complete_lesson', 'insights'] }),

  F('beginners', 'academy', 'academy', { anchor: '#academySection' }, ['للمبتدئين', 'انا مبتدئ', 'لا اعرف شيئا', 'مستوي مبتدئ', 'beginner', 'beginners', 'principiante', 'debutant'], {
    ar: ['هل تناسب الأكاديمية المبتدئين؟', 'نعم، الدروس مختصرة ومرتبة من الأساس، ولا تحتاج معرفة سابقة. ابدأ بـ«أساسيات المعرفة الإسلامية» و«🕌 ابدأ هنا: صفة صلاة النبي ﷺ» (بأربع لغات). نصوص أكثر الدروس بالعربية، وإن احتجت شرحًا بلغتك فاسألني.\nتنبيه: إتمام الدورات تقدّم شخصي للمراجعة، وليس إجازة أو شهادة شرعية.'],
    en: ['Can beginners use the academy?', 'Yes: the lessons are short and ordered from the basics, with no prior knowledge needed. Start with “Basic Islamic knowledge” and “🕌 Start here: the Prophet’s ﷺ prayer” (in four languages). Most lesson texts are in Arabic; ask me if you need an explanation in your language.\nNote: completing a course is personal progress, not an ijazah or a certificate.'],
    es: ['¿Sirve la academia para principiantes?', 'Sí: lecciones breves desde lo básico. Empieza por «Conocimientos islámicos básicos» y «🕌 Empieza aquí» (en cuatro idiomas). Completar un curso no es una iyaza ni un certificado.'],
    fr: ['L’académie convient-elle aux débutants ?', 'Oui : des leçons courtes depuis les bases. Commencez par « Connaissances islamiques de base » et « 🕌 Commencez ici » (en quatre langues). Terminer un cours n’est ni une ijaza ni un certificat.'],
  }, { icon: '🌱', related: ['new_muslim_start_site', 'start_learning'] }),

  F('new_muslim_start_site', 'academy', 'new_muslim', { anchor: '#learnSection' }, ['مسلم جديد ماذا اتعلم', 'ماذا يتعلم المسلم الجديد', 'دروس للمسلم الجديد', 'what should a new muslim learn', 'new muslim lessons', 'nuevo musulman que aprender', 'nouveau musulman quoi apprendre'], {
    ar: ['ماذا يتعلّم المسلم الجديد أولًا في الموقع؟', 'مسار مقترح داخل الموقع، خطوة كل يوم أو يومين:\n1. أركان الإسلام وأركان الإيمان (الأكاديمية ← أساسيات المعرفة الإسلامية).\n2. درس «💧 صفة الوضوء».\n3. «🕌 ابدأ هنا: صفة صلاة النبي ﷺ» ثم الرسوم خطوة بخطوة.\n4. تعلّم سورة الفاتحة بالاستماع والتكرار.\n5. أذكار الصباح والمساء من «حصن المسلم».\nولا تستعجل: تعلّم بالتدريج، واسألني عن أي شيء، واستعن بمسلمين ثقات أو بمسجد قريب.'],
    en: ['What should a new Muslim learn first on the site?', 'A suggested path on the site, one step every day or two:\n1. The pillars of Islam and of faith (Academy → Basic Islamic knowledge).\n2. The lesson “💧 How to perform wudu”.\n3. “🕌 Start here: the Prophet’s ﷺ prayer”, then the illustrated steps.\n4. Learn Al-Fatihah by listening and repeating.\n5. The morning and evening adhkar in “Hisn al-Muslim”.\nTake your time: learn gradually, ask me anything, and find support from trustworthy Muslims or a nearby mosque.'],
    es: ['¿Qué aprende primero un nuevo musulmán en el sitio?', 'Un camino sugerido: 1. Pilares del islam y de la fe. 2. Wudu. 3. «🕌 Empieza aquí» y los pasos ilustrados. 4. Al-Fatiha. 5. Adhkar de mañana y tarde. Sin prisa, poco a poco, con el apoyo de musulmanes de confianza o una mezquita.'],
    fr: ['Que doit apprendre d’abord un nouveau musulman sur le site ?', 'Un parcours suggéré : 1. Piliers de l’islam et de la foi. 2. Ablutions. 3. « 🕌 Commencez ici » et les étapes illustrées. 4. Al-Fatiha. 5. Adhkar du matin et du soir. Sans précipitation, avec le soutien de musulmans de confiance ou d’une mosquée.'],
  }, { icon: '🤍', lesson: 'basics-islam', related: ['new_muslim_first', 'new_muslim_pray', 'become_muslim'] }),

  F('tajweed', 'academy', 'academy', { anchor: '#academySection' }, ['تجويد', 'احكام التجويد', 'تعلم التجويد', 'النون الساكنه', 'المدود', 'tajweed', 'tajwid', 'learn tajweed'], {
    ar: ['كيف أتعلم التجويد؟', 'في «🎓 الأكاديمية» دورة «📘 أساسيات التجويد»: مدخل إلى التجويد، أحكام النون الساكنة والتنوين، أحكام الميم الساكنة، والمدود، مع أمثلة من الآيات واختبارات. والتجويد يُتقن بالتلقي، فاقرأ على معلّم متقن واستمع كثيرًا إلى القرّاء.'],
    en: ['How do I learn tajweed?', 'The “🎓 Academy” has “📘 Tajweed fundamentals”: an introduction, rules of noon sakinah and tanween, meem sakinah, and madd, with examples from the ayahs and quizzes. Tajweed is mastered by learning from a teacher, so recite to a qualified teacher and listen often to the reciters.'],
    es: ['¿Cómo aprendo tajwid?', 'En la «🎓 Academia», «📘 Fundamentos del tajwid» (introducción, nun sakina y tanwin, mim sakina, madd). El tajwid se perfecciona con un maestro.'],
    fr: ['Comment apprendre le tajwid ?', 'Dans l’« 🎓 Académie », « 📘 Fondamentaux du tajwid » (introduction, noun sakina et tanwin, mim sakina, madd). Le tajwid se perfectionne auprès d’un enseignant.'],
  }, { icon: '📘', lesson: 'tajweed-intro', related: ['courses'] }),

  F('scholars_section', 'academy', 'lessons', { anchor: '#learnSection' }, ['العلماء والمصادر', 'مواقع العلماء', 'تحقق من حديث', 'درجه الحديث', 'صحه حديث', 'scholars and sources', 'check a hadith', 'verify hadith', 'verificar un hadiz', 'verifier un hadith'], {
    ar: ['أين أجد العلماء والمصادر، وكيف أتحقق من حديث؟', 'في «🕋 تعلم الصلاة الصحيحة» قسم «العلماء والمصادر»: روابط إلى مواقع رسمية ودروس علماء. وتحته «🔍 للتحقق من الأحاديث ودرجتها»: أدوات بحث في موسوعات الحديث. وكل حديث في دروس الموقع (وفي إجاباتي) معه رابط «تحقق» يبحث عنه في الدرر السنية.'],
    en: ['Where are the scholars and sources, and how do I check a hadith?', 'In “🕋 Learn the prayer”, the “Scholars and sources” section links to official websites and scholars’ lessons. Below it, “🔍 Check a hadith and its grading” offers hadith encyclopedia search tools. Every hadith in the lessons (and in my answers) has a “check” link that searches it on Dorar.net.'],
    es: ['¿Dónde están los sabios y fuentes?', 'En «🕋 Aprender la oración», «Sabios y fuentes», y debajo «🔍 Verificar un hadiz y su grado». Cada hadiz tiene un enlace para comprobarlo en Dorar.net.'],
    fr: ['Où trouver savants et sources ?', 'Dans « 🕋 Apprendre la prière », « Savants et sources », puis « 🔍 Vérifier un hadith et son authenticité ». Chaque hadith a un lien de vérification sur Dorar.net.'],
  }, { icon: '🔗', related: ['consult_scholar'] }),

  // ======================================================================= G. adhkar
  L('adhkar_morning_evening', 'adhkar', 'adhkar', 'adhkar', { dialog: 'adhkarModal' }, ['اذكار الصباح', 'اذكار المساء', 'وين اذكار المساء', 'morning adhkar', 'evening adhkar', 'adhkar de la manana', 'adhkar du soir'], { related: ['count_dhikr', 'hisn_what', 'sleep_adhkar'] }),

  F('hisn_what', 'adhkar', 'adhkar', { dialog: 'adhkarModal' }, ['ما هو حصن المسلم', 'حصن المسلم', 'what is hisn al muslim', 'fortress of the muslim', 'que es hisn al muslim', 'citadelle du musulman'], {
    ar: ['ما هو «حصن المسلم»؟', '«حصن المسلم» كتاب مشهور يجمع الأذكار والأدعية من القرآن والسنة لمواقف اليوم والليلة. في الموقع تجد منه: أذكار الصباح، والمساء، والنوم، وبعد الصلاة، وأدعية متنوعة، مع عدد كل ذكر، والمسبحة الإلكترونية. افتحه من «📿 حصن المسلم» في الأعلى.'],
    en: ['What is Hisn al-Muslim?', '“Hisn al-Muslim” (Fortress of the Muslim) is a well-known collection of remembrances and supplications from the Quran and Sunnah for the situations of day and night. On the site you find its morning, evening, sleep and after-prayer adhkar and various supplications, with how many times to say each, plus the electronic tasbih. Open it from “📿 Hisn al-Muslim” at the top.'],
    es: ['¿Qué es Hisn al-Muslim?', '«La Fortaleza del Musulmán» es una conocida colección de recuerdos y súplicas del Corán y la Sunna. En el sitio: adhkar de mañana, tarde, sueño, tras la oración y súplicas diversas, con su número, y el tasbih.'],
    fr: ['Qu’est-ce que la Citadelle du musulman ?', '« Hisn al-Muslim » est un recueil connu d’invocations du Coran et de la Sunna. Sur le site : adhkar du matin, du soir, du sommeil, après la prière et invocations diverses, avec leur nombre, et le tasbih.'],
  }, { icon: '🛡️', related: ['adhkar_morning_evening', 'daily_duas'] }),

  F('daily_duas', 'adhkar', 'dua', { dialog: 'adhkarModal' }, ['الادعيه اليوميه', 'ادعيه يوميه', 'ادعيه متنوعه', 'daily supplications', 'daily duas', 'suplicas diarias', 'invocations quotidiennes'], {
    ar: ['كيف أقرأ الأدعية اليومية؟', 'افتح «📿 حصن المسلم» واختر تبويب «متنوعة 🤲»: أدعية لمواقف اليوم. اقرأ الدعاء واضغط على بطاقته ليُعدّ تنازليًا إن كان له عدد.'],
    en: ['How do I read daily supplications?', 'Open “📿 Hisn al-Muslim” and choose the “Daily 🤲” tab: supplications for everyday situations. Read each one and tap its card to count down if it has a number of repetitions.'],
    es: ['¿Cómo leo las súplicas diarias?', 'Abre «📿 Hisn al-Muslim» y elige «Diario 🤲». Toca cada tarjeta para contar.'],
    fr: ['Comment lire les invocations quotidiennes ?', 'Ouvrez « 📿 Citadelle » et choisissez « Quotidien 🤲 ». Touchez chaque carte pour compter.'],
  }, { icon: '🤲', related: ['find_dua', 'count_dhikr'] }),

  L('tasbih', 'rosary', 'adhkar', 'rosary', { run: 'rosary' }, ['المسبحه الالكترونيه', 'سبحه', 'tasbih', 'digital tasbih', 'tasbih digital', 'tasbih numerique'], { related: ['count_dhikr', 'reset_counter'] }),

  F('count_dhikr', 'adhkar', 'adhkar', { dialog: 'adhkarModal' }, ['عد الذكر', 'كيف اعد', 'العداد', 'كم مره', 'count dhikr', 'counter', 'contar dhikr', 'compter le dhikr'], {
    ar: ['كيف أعدّ الأذكار؟', '• في تبويبات الأذكار: اضغط على بطاقة الذكر في كل مرة تقوله؛ ينقص العدد حتى يكتمل.\n• للتسبيح الحر: تبويب «📿 المسبحة»: اختر الذكر و«الهدف» (بدون هدف، 33، 100) واضغط على الدائرة للعد.'],
    en: ['How do I count dhikr?', '• In the adhkar tabs: tap the dhikr’s card each time you say it; the count goes down until it is complete.\n• For free tasbih: the “📿 Rosary” tab: choose the phrase and the “Target” (No target, 33, 100) and tap the circle to count.'],
    es: ['¿Cómo cuento el dhikr?', '• En los adhkar: toca la tarjeta cada vez; el número baja.\n• En «📿 Tasbih»: elige la frase y la «Meta» (sin meta, 33, 100) y toca el círculo.'],
    fr: ['Comment compter le dhikr ?', '• Dans les adhkar : touchez la carte à chaque fois ; le nombre diminue.\n• Dans « 📿 Tasbih » : choisissez la phrase et l’« Objectif » (sans, 33, 100) et touchez le cercle.'],
  }, { icon: '🔢', related: ['reset_counter', 'tasbih'] }),

  F('reset_counter', 'adhkar', 'rosary', { dialog: 'adhkarModal' }, ['صفر العداد', 'تصفير', 'اعاده العد', 'reset the counter', 'reset count', 'reiniciar contador', 'reinitialiser le compteur'], {
    ar: ['كيف أصفّر العدّاد؟', '• للأذكار: زر «إعادة العد 🔄» أسفل قائمة الأذكار.\n• للمسبحة: زر «تصفير العداد 🔄» تحت الدائرة.'],
    en: ['How do I reset the counter?', '• For the adhkar: the “Restart counting 🔄” button under the list.\n• For the tasbih: the “Reset counter 🔄” button under the circle.'],
    es: ['¿Cómo reinicio el contador?', '• Adhkar: «Reiniciar conteo 🔄».\n• Tasbih: «Reiniciar contador 🔄».'],
    fr: ['Comment remettre le compteur à zéro ?', '• Adhkar : « Recommencer 🔄 ».\n• Tasbih : « Réinitialiser le compteur 🔄 ».'],
  }, { icon: '🔄', related: ['count_dhikr'] }),

  F('sleep_adhkar', 'adhkar', 'adhkar', { dialog: 'adhkarModal' }, ['اذكار النوم', 'دعاء النوم', 'قبل النوم', 'supplications before sleeping', 'before sleep', 'dua before sleep', 'antes de dormir', 'avant de dormir'], {
    ar: ['أين أجد أذكار النوم؟', 'في «📿 حصن المسلم» ← تبويب «النوم 🛏️»: الأذكار التي تقال قبل النوم مع عدد كل منها.'],
    en: ['Where can I find the supplications before sleeping?', 'In “📿 Hisn al-Muslim” → the “Sleep 🛏️” tab: the adhkar said before sleeping, each with its count.'],
    es: ['¿Dónde están las súplicas antes de dormir?', 'En «📿 Hisn al-Muslim» → pestaña «Dormir 🛏️»: los adhkar que se dicen antes de dormir, cada uno con su número.'],
    fr: ['Où sont les invocations avant de dormir ?', 'Dans « 📿 Citadelle » → onglet « Sommeil 🛏️ » : les adhkar dits avant de dormir, chacun avec son nombre.'],
  }, { icon: '🛏️', related: ['adhkar_morning_evening'] }),

  F('after_prayer_adhkar', 'adhkar', 'adhkar', { dialog: 'adhkarModal' }, ['اذكار بعد الصلاه', 'الاذكار بعد السلام', 'بعد الفريضه', 'supplications after prayer', 'after prayer', 'despues de la oracion', 'apres la priere'], {
    ar: ['أين أجد أذكار ما بعد الصلاة؟', 'في «📿 حصن المسلم» ← تبويب «بعد الصلاة 🕌»: الاستغفار والتسبيح والأذكار المأثورة بعد السلام من الفريضة.'],
    en: ['Where can I find the supplications after prayer?', 'In “📿 Hisn al-Muslim” → the “Prayer 🕌” tab: seeking forgiveness, tasbih and the adhkar narrated after the obligatory prayer.'],
    es: ['¿Dónde están los adhkar tras la oración?', 'En «📿 Hisn al-Muslim» → pestaña «Oración 🕌»: pedir perdón, tasbih y los adhkar transmitidos tras la oración obligatoria.'],
    fr: ['Où sont les adhkar après la prière ?', 'Dans « 📿 Citadelle » → onglet « Prière 🕌 » : demande de pardon, tasbih et adhkar rapportés après la prière obligatoire.'],
  }, { icon: '🕌', related: ['count_dhikr'] }),

  F('find_dua', 'adhkar', 'dua', { dialog: 'islamicSearchModal' }, ['ابحث عن دعاء', 'دعاء معين', 'دعاء السفر', 'دعاء الكرب', 'find a supplication', 'specific dua', 'buscar una suplica', 'trouver une invocation'], {
    ar: ['كيف أجد دعاءً معيّنًا؟', 'افتح «🔎 البحث الإسلامي» من لوحة التحكم واكتب كلمة من الدعاء أو موضوعه (مثل: النوم، الكرب)؛ يبحث في الأذكار والدروس. أو اكتب لي «دعاء …» وأعرض لك ما في المحتوى الموثّق مع مصدره. إن لم يكن الدعاء موجودًا في الموقع أخبرك بذلك.'],
    en: ['How do I find a specific supplication?', 'Open “🔎 Islamic Search” on the dashboard and type a word from the supplication or its topic; it searches the adhkar and lessons. Or write to me “dua for …” and I show what the verified content has, with its source. If the supplication is not on the site, I will tell you.'],
    es: ['¿Cómo encuentro una súplica concreta?', 'Usa «🔎 Búsqueda Islámica» o pregúntame. Si no está en el sitio, te lo diré.'],
    fr: ['Comment trouver une invocation précise ?', 'Utilisez « 🔎 Recherche Islamique » ou demandez-moi. Si elle n’est pas sur le site, je vous le dirai.'],
  }, { icon: '🔎', related: ['daily_duas', 'search_features'] }),

  // ======================================================================= H. personal
  L('favorites', 'favorites', 'personal', 'favorites', { dialog: 'favoritesModal' }, ['سوره مفضله', 'اضف للمفضله', 'favorite surah', 'favourites', 'favoritos', 'favoris'], { related: ['favorite_ayahs'] }),

  F('favorite_ayahs', 'personal', 'notes', { dialog: 'notesModal' }, ['ايات مفضله', 'ايه مفضله', 'احفظ ايه مفضله', 'favorite ayahs', 'favourite verses', 'aleyas favoritas', 'ayahs favorites'], {
    ar: ['كيف أحفظ آياتي المفضلة؟', 'زر ☆ «المفضلة» خاص بالسور. للآيات المفضلة أنشئ مجموعة باسم «المفضلة» (أو أي اسم): اضغط على الآية ← «📝 ملاحظة وتصنيف» ← «＋ مجموعة جديدة» ← «حفظ». تجدها كلها في «📝 ملاحظاتي».'],
    en: ['How do I save favourite ayahs?', 'The ☆ “Favorites” button is for surahs. For favourite ayahs, create a collection called “Favourites” (or any name): tap the ayah → “📝 Note & collection” → “＋ New collection” → “Save”. They are all in “📝 My notes”.'],
    es: ['¿Cómo guardo aleyas favoritas?', 'El botón ☆ es para suras. Para aleyas, crea una colección «Favoritas»: toca la aleya → «📝 Nota y colección» → «＋ Nueva colección» → «Guardar».'],
    fr: ['Comment enregistrer mes ayahs favorites ?', 'Le bouton ☆ concerne les sourates. Pour les ayahs, créez une collection « Favorites » : touchez l’ayah → « 📝 Note et collection » → « ＋ Nouvelle collection » → « Enregistrer ».'],
  }, { icon: '⭐', related: ['collections', 'favorites'] }),

  F('collections', 'personal', 'notes', { dialog: 'notesModal' }, ['انشئ مجموعه', 'مجموعه جديده', 'المجموعات', 'تصنيف الايات', 'create collections', 'new collection', 'crear colecciones', 'creer des collections'], {
    ar: ['كيف أنشئ مجموعات للآيات؟', 'طريقتان:\n• من الآية: اضغط عليها في وضع القراءة ← «📝 ملاحظة وتصنيف» ← «＋ مجموعة جديدة».\n• من «📝 ملاحظاتي»: في الأسفل «إنشاء مجموعة جديدة»، اكتب الاسم ثم «إنشاء».\nأمثلة: آيات الصبر، أدعية قرآنية، للمراجعة.'],
    en: ['How do I create collections?', 'Two ways:\n• From an ayah: tap it in the reading view → “📝 Note & collection” → “＋ New collection”.\n• From “📝 My notes”: at the bottom, “Create a new collection”, type the name, then “Create”.\nExamples: ayahs on patience, Quranic supplications, to revise.'],
    es: ['¿Cómo creo colecciones?', '• Desde una aleya: «📝 Nota y colección» → «＋ Nueva colección».\n• Desde «📝 Mis notas»: «Crear una nueva colección» → «Crear».'],
    fr: ['Comment créer des collections ?', '• Depuis une ayah : « 📝 Note et collection » → « ＋ Nouvelle collection ».\n• Depuis « 📝 Mes notes » : « Créer une nouvelle collection » → « Créer ».'],
  }, { icon: '🗃️', related: ['notes', 'organize_notes'] }),

  L('notes', 'notes', 'personal', 'notes', { dialog: 'notesModal' }, ['اكتب ملاحظه', 'ملاحظه علي ايه', 'add notes', 'note on an ayah', 'anadir notas', 'ajouter une note'], { related: ['organize_notes', 'collections'] }),

  F('organize_notes', 'personal', 'notes', { dialog: 'notesModal' }, ['رتب ملاحظاتي', 'نظم الملاحظات', 'ابحث في ملاحظاتي', 'صدر الملاحظات', 'organize my notes', 'search notes', 'export notes', 'organizar mis notas', 'organiser mes notes'], {
    ar: ['كيف أنظّم ملاحظاتي؟', 'في «📝 ملاحظاتي ومجموعاتي»:\n• «المجموعة»: اعرض مجموعة واحدة فقط.\n• «بحث في الملاحظات»: ابحث بكلمة من ملاحظاتك.\n• «⬇ تصدير كنص»: احفظ كل ملاحظاتك في ملف نصي.\n• لتعديل ملاحظة أو نقلها لمجموعة أخرى: افتح الآية واضغط «📝 ملاحظة وتصنيف» من جديد، أو «إزالة».'],
    en: ['How do I organise my notes?', 'In “📝 My notes and collections”:\n• “Collection”: show a single collection.\n• “Search notes”: find a word in your notes.\n• “⬇ Export as text”: save all your notes to a text file.\n• To edit a note or move it to another collection: open the ayah and press “📝 Note & collection” again, or “Remove”.'],
    es: ['¿Cómo organizo mis notas?', 'En «📝 Mis notas y colecciones»: filtro «Colección», «Buscar en las notas», «⬇ Exportar como texto». Para editar, vuelve a «📝 Nota y colección» en la aleya.'],
    fr: ['Comment organiser mes notes ?', 'Dans « 📝 Mes notes et collections » : filtre « Collection », « Rechercher dans les notes », « ⬇ Exporter en texte ». Pour modifier, rouvrez « 📝 Note et collection » sur l’ayah.'],
  }, { icon: '🗂️', related: ['collections', 'backup'] }),

  F('khatma_plan', 'personal', 'khatma', { anchor: '#insightsTitle' }, ['خطه ختمه', 'ختم القران', 'اختم القران', 'مخطط الختمه', 'khatmah plan', 'finish the quran', 'complete the quran', 'plan de jatma', 'plan de khatma'], {
    ar: ['كيف أضع خطة لختم القرآن؟', 'في لوحة التحكم ← «📊 بصيرة» ← «مخطط الختمة»: اختر التاريخ الذي تريد أن تختم فيه ثم «احسب الخطة». يحسب لك عدد الآيات (ونحو الصفحات) اليومية، اعتمادًا على ما قرأته فعلًا في وضع القراءة، ويخبرك إن كان معدّلك يكفي.'],
    en: ['How do I create a khatmah plan?', 'On the dashboard → “📊 Insights” → “Khatma planner”: choose the date by which you want to finish, then “Calculate plan”. It works out the ayahs (and roughly the pages) per day from what you have actually read in the reading view, and tells you whether your pace is enough.'],
    es: ['¿Cómo creo un plan de jatma?', 'En «📊 Perspectiva» → planificador: elige la fecha y calcula. Indica las aleyas y páginas diarias según lo que ya leíste.'],
    fr: ['Comment créer un plan de khatma ?', 'Dans « 📊 Perspective » → planificateur : choisissez la date et calculez. Il indique les ayahs et pages par jour selon ce que vous avez lu.'],
  }, { icon: '🏁', related: ['insights', 'daily_progress'] }),

  L('insights', 'insights', 'personal', 'khatma', { anchor: '#insightsTitle' }, ['بصيره', 'تحليل تقدمي', 'احصائياتي', 'insights', 'statistics', 'estadisticas', 'statistiques'], { related: ['khatma_plan', 'memo_progress'] }),

  F('daily_progress', 'personal', null, { anchor: '#dashboardSection' }, ['تقدمي اليومي', 'تابع يومي', 'هدف القراءه اليومي', 'track daily progress', 'daily goal', 'progreso diario', 'progression quotidienne'], {
    ar: ['كيف أتابع تقدمي اليومي؟', 'في لوحة التحكم:\n• «📖 وردك اليومي»: أربعة عناصر تؤشّر عليها (القرآن، أذكار الصباح، أذكار المساء، المحافظة على الصلاة).\n• «🌿 رحلتي اليومية»: آيات اليوم من هدف القراءة، والحفظ، والأذكار، وآخر ما استمعت إليه، والدروس.\nهدف القراءة اليومي تضبطه من «⚙️ الإعدادات» ← «🎯 الأهداف».'],
    en: ['How do I track my daily progress?', 'On the dashboard:\n• “📖 Daily Wird”: four items to tick (Quran, morning adhkar, evening adhkar, keeping the prayers).\n• “🌿 My daily journey”: today’s ayahs against your reading goal, memorisation, adhkar, recent listening and lessons.\nSet the daily reading goal in “⚙️ Settings” → “🎯 Goals”.'],
    es: ['¿Cómo sigo mi progreso diario?', 'En el panel: «📖 Wird Diario» y «🌿 Mi recorrido diario». La meta diaria se ajusta en «⚙️ Ajustes» → «🎯 Metas».'],
    fr: ['Comment suivre ma progression quotidienne ?', 'Dans le tableau de bord : « 📖 Wird Quotidien » et « 🌿 Mon parcours du jour ». L’objectif se règle dans « ⚙️ Paramètres » → « 🎯 Objectifs ».'],
  }, { icon: '📅', related: ['wird', 'dashboard'] }),

  L('wird', 'wird', 'personal', null, { anchor: '#dashboardSection' }, ['الورد اليومي', 'وردي', 'daily wird', 'wird diario', 'wird quotidien'], { related: ['daily_progress'] }),
  L('backup', 'backup', 'personal', 'backup', { dialog: 'profileModal' }, ['نسخه احتياطيه', 'احفظ بياناتي', 'back up my data', 'backup', 'copia de seguridad', 'sauvegarde'], { related: ['restore', 'clear_storage'] }),

  F('restore', 'personal', 'backup', { dialog: 'profileModal' }, ['استعاده النسخه', 'استرجاع بياناتي', 'استعيد', 'restore my backup', 'restore data', 'restaurar copia', 'restaurer la sauvegarde'], {
    ar: ['كيف أستعيد النسخة الاحتياطية؟', 'افتح «👤 حسابي» ← «💾 نسخة احتياطية لبياناتك» ← «⬆ استعادة من ملف»، واختر الملف الذي حفظته من قبل. تُستعاد خطتك وتقدمك وملاحظاتك. الملف لا يُرفع إلى أي مكان؛ يُقرأ على جهازك فقط.'],
    en: ['How do I restore my backup?', 'Open “👤 My Profile” → “💾 Back up your data” → “⬆ Restore from a file” and pick the file you saved earlier. Your plan, progress and notes are restored. The file is not uploaded anywhere; it is read on your device only.'],
    es: ['¿Cómo restauro mi copia?', '«👤 Mi Perfil» → «💾 Copia de seguridad» → «⬆ Restaurar desde un archivo». El archivo no se sube a ningún sitio.'],
    fr: ['Comment restaurer ma sauvegarde ?', '« 👤 Mon Profil » → « 💾 Sauvegarder vos données » → « ⬆ Restaurer depuis un fichier ». Le fichier n’est envoyé nulle part.'],
  }, { icon: '⬆️', related: ['backup'] }),

  F('dashboard', 'personal', null, { anchor: '#dashboardSection' }, ['لوحه التحكم', 'لوحتي الشخصيه', 'اين لوحتي', 'رحلتي اليوميه', 'personal dashboard', 'my dashboard', 'panel personal', 'tableau de bord'], {
    ar: ['أين لوحتي الشخصية؟', 'لوحة التحكم تحت أول الصفحة مباشرة: «🕌 الصلاة القادمة»، و«📖 وردك اليومي»، وأزرار الأدوات (المفضلة، البحث الإسلامي، حسابي، الإعدادات، المساعد، ملاحظاتي)، ثم «🌿 رحلتي اليومية»، و«☀️ رفيقك اليومي» (آية وذكر لليوم)، و«📊 بصيرة». و«👤 حسابي» فيه اسمك وهدفك.'],
    en: ['Where is my personal dashboard?', 'The dashboard is right below the top of the page: “🕌 Next Prayer”, “📖 Daily Wird”, the tool buttons (Favorites, Islamic Search, My Profile, Settings, Assistant, My notes), then “🌿 My daily journey”, “☀️ Your daily companion” (an ayah and a dhikr for the day) and “📊 Insights”. “👤 My Profile” holds your name and goal.'],
    es: ['¿Dónde está mi panel personal?', 'Justo debajo del inicio: próxima oración, wird diario, botones de herramientas, «🌿 Mi recorrido diario», «☀️ Tu compañero diario» y «📊 Perspectiva».'],
    fr: ['Où est mon tableau de bord ?', 'Juste sous le haut de la page : prochaine prière, wird quotidien, boutons d’outils, « 🌿 Mon parcours du jour », « ☀️ Votre compagnon du jour » et « 📊 Perspective ».'],
  }, { icon: '🧾', related: ['daily_progress', 'profile'] }),

  F('profile', 'personal', null, { dialog: 'profileModal' }, ['حسابي', 'ملفي', 'اسمي', 'هدفي', 'my profile', 'profile', 'mi perfil', 'mon profil'], {
    ar: ['ما هو «👤 حسابي»؟', 'ملف محلي على جهازك: تكتب فيه اسمك وهدفك (مثل: حفظ جزء عم) ثم «حفظ الملف»، وترى فيه نسبة إنجاز الورد اليومي وعدد السور المفضلة، وزر تفعيل تنبيهات الصلاة، والنسخة الاحتياطية، وزر «إعادة ضبط بياناتي».'],
    en: ['What is “👤 My Profile”?', 'A local profile on your device: enter your name and goal (e.g. memorise Juz Amma) and press “Save Profile”. It shows your daily wird progress and number of favourite surahs, the prayer-alert button, the backup tools and “Reset Data”.'],
    es: ['¿Qué es «👤 Mi Perfil»?', 'Un perfil local: tu nombre y meta, progreso del wird, suras favoritas, alertas, copia de seguridad y «Restablecer Datos».'],
    fr: ['Qu’est-ce que « 👤 Mon Profil » ?', 'Un profil local : nom et objectif, progression du wird, sourates favorites, alertes, sauvegarde et « Réinitialiser Données ».'],
  }, { icon: '👤', related: ['backup', 'reset_data'] }),

  F('reset_data', 'personal', null, { dialog: 'profileModal' }, ['امسح بياناتي', 'اعاده ضبط', 'احذف تقدمي', 'ابدا من جديد', 'reset my data', 'delete my data', 'start over', 'borrar mis datos', 'effacer mes donnees'], {
    ar: ['كيف أعيد ضبط بياناتي؟', 'في «👤 حسابي» زر «إعادة ضبط بياناتي»؛ بعد التأكيد يمسح ملفك والورد اليومي والسور المفضلة والإحصائيات. أما الملاحظات وخطة الحفظ وتقدم الدروس فتبقى. ولمسح كل شيء امسح «بيانات الموقع» من إعدادات المتصفح.\nنصيحة: احفظ نسخة احتياطية قبل المسح.'],
    en: ['How do I reset my saved data?', 'In “👤 My Profile”, the “Reset Data” button, after confirmation, clears your profile, daily wird, favourite surahs and statistics. Notes, the memorisation plan and lesson progress are kept. To erase everything, clear the site’s data in your browser settings.\nTip: save a backup first.'],
    es: ['¿Cómo restablezco mis datos?', '«Restablecer Datos» en «👤 Mi Perfil» borra perfil, wird, favoritos y estadísticas; notas, plan y lecciones se conservan. Para borrarlo todo, borra los datos del sitio en el navegador. Haz antes una copia.'],
    fr: ['Comment réinitialiser mes données ?', '« Réinitialiser Données » dans « 👤 Mon Profil » efface profil, wird, favoris et statistiques ; notes, plan et leçons restent. Pour tout effacer, supprimez les données du site dans le navigateur. Faites d’abord une sauvegarde.'],
  }, { icon: '🧹', related: ['backup', 'clear_storage'] }),

  F('clear_storage', 'personal', 'backup', { dialog: 'profileModal' }, ['هل ستضيع بياناتي', 'مسح بيانات المتصفح', 'مسحت الكاش', 'ضاع تقدمي', 'clear browser storage', 'clear cache', 'lose my data', 'borrar datos del navegador', 'effacer les donnees du navigateur'], {
    ar: ['هل تضيع بياناتي إذا مسحت بيانات المتصفح؟', 'نعم. كل تقدمك محفوظ في هذا المتصفح فقط، فمسح «بيانات المواقع» أو «ملفات تعريف الارتباط وبيانات الموقع»، أو استخدام التصفح الخاص، يحذفه، ولا توجد نسخة على أي خادم. احمِ بياناتك بـ«⬇ حفظ نسخة احتياطية» من «👤 حسابي» بين حين وآخر.'],
    en: ['Will my data disappear if I clear browser storage?', 'Yes. All your progress is stored in this browser only, so clearing “site data” or “cookies and site data”, or using private browsing, deletes it; there is no copy on any server. Protect it with “⬇ Save a backup” in “👤 My Profile” from time to time.'],
    es: ['¿Se borran mis datos si limpio el navegador?', 'Sí. Todo está solo en este navegador; no hay copia en servidores. Guarda copias con «⬇ Guardar una copia» en «👤 Mi Perfil».'],
    fr: ['Mes données disparaissent-elles si je vide le navigateur ?', 'Oui. Tout est dans ce navigateur seulement ; aucune copie sur un serveur. Faites des sauvegardes avec « ⬇ Enregistrer une sauvegarde » dans « 👤 Mon Profil ».'],
  }, { icon: '⚠️', related: ['backup', 'progress_not_saved'] }),

  L('settings', 'settings', 'personal', 'settings', { dialog: 'settingsModal' }, ['الاعدادات', 'اعدادات', 'settings', 'ajustes', 'parametres'], { related: ['reading_display', 'memo_goals'] }),

  F('daily_companion', 'personal', null, { anchor: '#dashboardSection' }, ['رفيقك اليومي', 'ايه اليوم', 'ذكر اليوم', 'daily companion', 'verse of the day', 'aleya del dia', 'verset du jour'], {
    ar: ['ما هو «☀️ رفيقك اليومي»؟', 'بطاقة في لوحة التحكم تعرض كل يوم آية من القرآن (من المصدر الموثّق) مع زر لفتحها في المصحف، وذكرًا من حصن المسلم. تتغير يوميًا.'],
    en: ['What is “☀️ Your daily companion”?', 'A dashboard card showing an ayah each day (from the verified source) with a button to open it in the Mushaf, and a dhikr from Hisn al-Muslim. It changes daily.'],
    es: ['¿Qué es «☀️ Tu compañero diario»?', 'Una tarjeta del panel con una aleya cada día (de la fuente verificada), un botón para abrirla en el Mushaf y un dhikr de Hisn al-Muslim.'],
    fr: ['Qu’est-ce que « ☀️ Votre compagnon du jour » ?', 'Une carte du tableau de bord avec une ayah chaque jour (source vérifiée), un bouton pour l’ouvrir dans le Mushaf et un dhikr de la Citadelle.'],
  }, { icon: '☀️', related: ['dashboard'] }),

  // ======================================================================= I. prayer times
  L('prayer_times', 'prayer_times', 'prayer_times', 'prayer_times', { anchor: '#prayerSection' }, ['مواقيت الصلاه', 'اوقات الصلاه', 'متي الاذان', 'وقت الصلاه', 'prayer times', 'see prayer times', 'horarios de oracion', 'horaires de priere'], { related: ['prayer_calc', 'enable_notifications'] }),

  F('prayer_calc', 'prayer_times', 'prayer_times', { anchor: '#prayerSection' }, ['كيف تحسب المواقيت', 'طريقه الحساب', 'حساب المواقيت', 'how are prayer times calculated', 'calculation method', 'como se calculan', 'comment sont calcules'], {
    ar: ['كيف تُحسب مواقيت الصلاة؟', 'تُحسب فلكيًا حسب إحداثيات موقعك (إذا سمحت للمتصفح بتحديد الموقع) عن طريق خدمة AlAdhan، بطريقة حساب ثابتة (رقم 8 في الخدمة). إذا لم تسمح بالموقع تُعرض مواقيت عمّان (الأردن). ويظهر التاريخ الهجري وعدّاد للصلاة القادمة.\nالحساب الفلكي تقريبي، وقد يختلف دقائق عن تقويم بلدك.'],
    en: ['How are prayer times calculated?', 'They are calculated astronomically for your coordinates (if you let the browser share your location), through the AlAdhan service, with a fixed calculation method (method 8 of that service). Without location permission, the times of Amman (Jordan) are shown. The Hijri date and a countdown to the next prayer are shown too.\nAstronomical calculation is approximate and can differ by a few minutes from your country’s calendar.'],
    es: ['¿Cómo se calculan los horarios?', 'Astronómicamente según tus coordenadas (si permites la ubicación), con el servicio AlAdhan y un método fijo (n.º 8). Sin ubicación se muestran los de Amán (Jordania). Puede diferir unos minutos del calendario local.'],
    fr: ['Comment les horaires sont-ils calculés ?', 'Astronomiquement selon vos coordonnées (si vous autorisez la position), via le service AlAdhan et une méthode fixe (n° 8). Sans position, ce sont ceux d’Amman (Jordanie). Cela peut différer de quelques minutes du calendrier local.'],
  }, { icon: '🧮', related: ['mosque_difference', 'location_settings'] }),

  L('enable_notifications', 'notify', 'prayer_times', 'notifications', { dialog: 'settingsModal' }, ['فعل التنبيهات', 'تفعيل الاشعارات', 'تنبيه الصلاه', 'enable notifications', 'turn on notifications', 'activar avisos', 'activer les notifications'], { related: ['configure_reminders', 'notifications_missing'] }),

  F('configure_reminders', 'prayer_times', 'notifications', { dialog: 'settingsModal' }, ['اضبط التنبيه', 'قبل الصلاه بكم دقيقه', 'وقت التنبيه', 'configure reminders', 'minutes before prayer', 'configurar recordatorios', 'configurer les rappels'], {
    ar: ['كيف أضبط وقت التنبيه؟', 'من «⚙️ الإعدادات» ← «🔔 التنبيهات» ← «التنبيه قبل الصلاة بـ»: اختر عدد الدقائق، ثم «تفعيل الإشعارات» إن لم تكن مفعّلة. يصلك تنبيه قبل كل صلاة بالمدة التي اخترتها.'],
    en: ['How do I configure reminders?', 'In “⚙️ Settings” → “🔔 Notifications” → “Notify before prayer”, choose the number of minutes, then “Enable Notifications” if not enabled yet. You are alerted before each prayer by the time you chose.'],
    es: ['¿Cómo configuro los recordatorios?', '«⚙️ Ajustes» → «🔔 Avisos» → «Avisar antes de la oración»: elige los minutos y activa los avisos.'],
    fr: ['Comment configurer les rappels ?', '« ⚙️ Paramètres » → « 🔔 Notifications » → « Prévenir avant la prière » : choisissez les minutes et activez les notifications.'],
  }, { icon: '⏰', related: ['enable_notifications', 'notifications_missing'] }),

  F('mosque_difference', 'prayer_times', 'prayer_times', { anchor: '#prayerSection' }, ['تختلف عن المسجد', 'تختلف عن الاذان', 'المواقيت غلط', 'غير دقيقه', 'different from my mosque', 'times are wrong', 'diferentes de mi mezquita', 'differents de ma mosquee'], {
    ar: ['لماذا تختلف المواقيت عن مسجدي؟', 'أسباب شائعة:\n• طرق الحساب تختلف بين البلدان (زاوية الفجر والعشاء مثلًا)، والموقع يستخدم طريقة واحدة ثابتة.\n• إذا لم تسمح بتحديد الموقع فالمواقيت لعمّان وليست لمدينتك.\n• بعض المساجد تؤخر الإقامة أو تعتمد تقويمًا رسميًا محليًا.\nفي الصلاة اعتمد تقويم بلدك الرسمي ومسجدك؛ ومواقيت الموقع تقريبية للاسترشاد.'],
    en: ['Why are the prayer times different from my local mosque?', 'Common reasons:\n• Calculation methods differ between countries (e.g. the Fajr and Isha angles); the site uses one fixed method.\n• If you did not allow location, the times are for Amman, not your city.\n• Some mosques follow an official local calendar or delay the iqamah.\nFor your prayers, rely on your country’s official calendar and your mosque; the site’s times are an approximate guide.'],
    es: ['¿Por qué difieren de mi mezquita?', 'Los métodos de cálculo varían por país y el sitio usa uno fijo; sin ubicación se muestran los de Amán; algunas mezquitas siguen un calendario oficial. Sigue el calendario oficial de tu país y tu mezquita.'],
    fr: ['Pourquoi diffèrent-ils de ma mosquée ?', 'Les méthodes varient selon les pays et le site en utilise une seule ; sans position, ce sont ceux d’Amman ; certaines mosquées suivent un calendrier officiel. Suivez le calendrier officiel de votre pays et votre mosquée.'],
  }, { icon: '🕰️', related: ['prayer_calc', 'location_settings'] }),

  F('location_settings', 'prayer_times', 'prayer_times', { anchor: '#prayerSection' }, ['غير الموقع', 'مدينتي', 'تحديد الموقع', 'الموقع الجغرافي', 'المواقيت لعمان', 'change location', 'my city', 'location permission', 'cambiar ubicacion', 'changer la position'], {
    ar: ['كيف أغيّر الموقع الجغرافي للمواقيت؟', 'لا يوجد في الموقع اختيار مدينة يدويًا؛ يعتمد على موقع جهازك. في قسم «مواقيت الصلاة» اضغط «استخدام موقعي 📍» واسمح للمتصفح بتحديد الموقع. إن رفضت سابقًا: اضغط رمز القفل بجانب عنوان الموقع ← «الموقع» ← «السماح»، ثم أعد تحميل الصفحة. ويجب تشغيل خدمة الموقع (GPS) في الهاتف.'],
    en: ['How do I change the location used for prayer times?', 'There is no manual city choice; the site uses your device’s location. In “Prayer Times”, press “Use my location 📍” and allow the browser to share your location. If you refused before: click the lock icon next to the address → “Location” → “Allow”, then reload. Location services (GPS) must be on in your phone.'],
    es: ['¿Cómo cambio la ubicación?', 'No hay selección manual de ciudad. Pulsa «Usar mi ubicación 📍» y permite la ubicación; si la rechazaste, cámbialo con el candado junto a la dirección y recarga.'],
    fr: ['Comment changer la position ?', 'Il n’y a pas de choix manuel de ville. Appuyez sur « Utiliser ma position 📍 » et autorisez-la ; si vous avez refusé, changez-le via le cadenas près de l’adresse puis rechargez.'],
  }, { icon: '📍', related: ['prayer_calc', 'mosque_difference'] }),

  F('notifications_missing', 'prayer_times', 'notifications', { dialog: 'settingsModal' }, ['التنبيهات لا تصل', 'لا يظهر التنبيه', 'الاشعارات لا تعمل', 'ما وصلني تنبيه', 'notifications not appearing', 'no notifications', 'notifications not working', 'no llegan los avisos', 'pas de notifications'], {
    ar: ['لماذا لا تظهر التنبيهات؟', 'تحقق من:\n1. أنك ضغطت «تفعيل الإشعارات» وسمحت بها في المتصفح (رمز القفل ← الإشعارات ← السماح).\n2. أن إشعارات المتصفح مسموحة في إعدادات نظام الهاتف أو الحاسوب، وأن وضع «عدم الإزعاج» غير مفعّل.\n3. أن الموقع مفتوح في المتصفح أو مثبتًا كتطبيق ونشطًا: التنبيهات لا تصل إذا كان الموقع مغلقًا تمامًا.\n4. على iPhone تحتاج غالبًا إلى تثبيت الموقع على الشاشة الرئيسية أولًا.'],
    en: ['Why are notifications not appearing?', 'Check that:\n1. You pressed “Enable Notifications” and allowed them in the browser (lock icon → Notifications → Allow).\n2. Browser notifications are allowed in your phone or computer settings, and “Do not disturb” is off.\n3. The site is open in the browser or installed and active: alerts do not arrive when the site is completely closed.\n4. On iPhone you usually need to add the site to the home screen first.'],
    es: ['¿Por qué no aparecen los avisos?', 'Comprueba: 1. que activaste y permitiste las notificaciones; 2. que el sistema las permite y «No molestar» está apagado; 3. que el sitio está abierto o instalado y activo; 4. en iPhone, añade el sitio a la pantalla de inicio.'],
    fr: ['Pourquoi les notifications n’apparaissent-elles pas ?', 'Vérifiez : 1. que vous les avez activées et autorisées ; 2. que le système les autorise et que « Ne pas déranger » est désactivé ; 3. que le site est ouvert ou installé et actif ; 4. sur iPhone, ajoutez le site à l’écran d’accueil.'],
  }, { icon: '🔕', related: ['enable_notifications', 'browser_compat'] }),

  F('hijri_date', 'prayer_times', 'prayer_times', { anchor: '#prayerSection' }, ['التاريخ الهجري', 'اليوم هجري', 'hijri date', 'islamic date', 'fecha hegiriana', 'date hegirienne'], {
    ar: ['أين أرى التاريخ الهجري؟', 'في قسم «مواقيت الصلاة» تحت العنوان، مع مواقيت اليوم. يأتي من خدمة المواقيت نفسها، وقد يختلف يومًا عن رؤية الهلال المعتمدة في بلدك.'],
    en: ['Where do I see the Hijri date?', 'In the “Prayer Times” section under the title, with today’s times. It comes from the same prayer-times service and may differ by a day from the moon sighting adopted in your country.'],
    es: ['¿Dónde veo la fecha hegiriana?', 'En «Horarios de Oración». Puede diferir un día de la observación lunar de tu país.'],
    fr: ['Où voir la date hégirienne ?', 'Dans « Horaires de Prière ». Elle peut différer d’un jour de l’observation lunaire de votre pays.'],
  }, { icon: '🌙', related: ['prayer_times'] }),

  // ======================================================================= J. support
  F('not_loading', 'support', null, null, ['الموقع لا يفتح', 'الموقع لا يعمل', 'الصفحه لا تحمل', 'السور لا تظهر', 'الموقع ما بفتح', 'website not loading', 'site not working', 'page does not load', 'el sitio no carga', 'le site ne charge pas'], {
    ar: ['لماذا لا يُحمَّل الموقع؟', 'جرّب:\n1. تأكد من اتصالك بالإنترنت، ثم أعد تحميل الصفحة.\n2. تأكد أن JavaScript مفعّل؛ الموقع يحتاجه لعرض المصحف والمواقيت.\n3. جرّب متصفحًا حديثًا (Chrome أو Edge أو Firefox أو Safari) وحدّثه.\n4. عطّل مؤقتًا إضافات حجب المحتوى إن كانت تمنع خدمات القرآن أو المواقيت.\n5. إن ظهرت الواجهة ولم يظهر نص سورة، فالخدمة قد تكون غير متاحة مؤقتًا: أعد المحاولة بعد قليل.'],
    en: ['Why is the website not loading?', 'Try:\n1. Check your internet connection, then reload the page.\n2. Make sure JavaScript is enabled; the site needs it for the Mushaf and prayer times.\n3. Use an up-to-date browser (Chrome, Edge, Firefox or Safari).\n4. Temporarily disable content-blocking extensions if they block the Quran or prayer-time services.\n5. If the interface shows but a surah’s text does not, the data service may be temporarily unavailable: try again shortly.'],
    es: ['¿Por qué no carga el sitio?', '1. Comprueba la conexión y recarga. 2. Activa JavaScript. 3. Usa un navegador actualizado. 4. Desactiva bloqueadores que impidan los servicios. 5. Si no aparece el texto de una sura, reinténtalo más tarde.'],
    fr: ['Pourquoi le site ne se charge-t-il pas ?', '1. Vérifiez la connexion et rechargez. 2. Activez JavaScript. 3. Utilisez un navigateur à jour. 4. Désactivez les bloqueurs qui gênent les services. 5. Si le texte d’une sourate n’apparaît pas, réessayez plus tard.'],
  }, { icon: '⏳', related: ['browser_compat', 'feature_broken'] }),

  F('progress_not_saved', 'support', 'backup', { dialog: 'profileModal' }, ['تقدمي لا يحفظ', 'لم يحفظ تقدمي', 'التقدم يختفي', 'ضاع الحفظ', 'progress not saved', 'my progress disappeared', 'no se guarda mi progreso', 'ma progression ne s enregistre pas'], {
    ar: ['لماذا لا يُحفظ تقدمي؟', 'التقدم يُحفظ في تخزين المتصفح على هذا الجهاز. لا يُحفظ أو يختفي إذا:\n• كنت تستخدم التصفح الخاص (يُمسح عند إغلاق النافذة).\n• مسحت بيانات المتصفح، أو يمسحها المتصفح تلقائيًا عند الإغلاق.\n• فتحت الموقع من متصفح أو جهاز آخر (لكل متصفح تخزينه).\n• كان التخزين ممتلئًا أو محظورًا.\nالحل: استخدم نافذة عادية، واحفظ نسخة احتياطية، وانقلها بـ«استعادة من ملف».'],
    en: ['Why is my progress not saved?', 'Progress is stored in the browser’s storage on this device. It is not kept, or disappears, if:\n• you use private browsing (cleared when the window closes);\n• you cleared browser data, or the browser clears it on exit;\n• you opened the site in another browser or device (each has its own storage);\n• storage is full or blocked.\nFix: use a normal window, save a backup and move it with “Restore from a file”.'],
    es: ['¿Por qué no se guarda mi progreso?', 'Se guarda en el navegador de este dispositivo. Se pierde en navegación privada, al borrar datos, en otro navegador o si el almacenamiento está bloqueado. Usa una ventana normal y copias de seguridad.'],
    fr: ['Pourquoi ma progression n’est-elle pas enregistrée ?', 'Elle est stockée dans ce navigateur. Elle se perd en navigation privée, en effaçant les données, dans un autre navigateur ou si le stockage est bloqué. Utilisez une fenêtre normale et des sauvegardes.'],
  }, { icon: '💾', related: ['backup', 'clear_storage'] }),

  F('phone_differs', 'support', 'app', null, ['يختلف علي الهاتف', 'شكل مختلف علي الجوال', 'على الموبايل غير', 'works differently on my phone', 'different on mobile', 'diferente en el movil', 'different sur telephone'], {
    ar: ['لماذا يعمل الموقع بشكل مختلف على هاتفي؟', '• التصميم يتكيّف مع الشاشة: بعض الروابط في شريط يُسحب جانبيًا، وتسمية زر المساعد تختفي في الشاشات الصغيرة.\n• بياناتك منفصلة لكل جهاز ومتصفح؛ انقلها بالنسخة الاحتياطية.\n• بعض الميزات تعتمد على المتصفح: التسميع يحتاج دعم التعرف على الكلام (Chrome على أندرويد مثلًا)، والتنبيهات على iPhone تحتاج غالبًا تثبيت الموقع على الشاشة الرئيسية.'],
    en: ['Why does the website work differently on my phone?', '• The layout adapts to the screen: some links are in a bar you swipe sideways, and the assistant button’s label is hidden on small screens.\n• Your data is separate on each device and browser; move it with a backup.\n• Some features depend on the browser: recitation needs speech recognition (e.g. Chrome on Android), and notifications on iPhone usually need the site added to the home screen.'],
    es: ['¿Por qué funciona distinto en mi móvil?', 'El diseño se adapta a la pantalla; los datos son distintos por dispositivo; algunas funciones dependen del navegador (reconocimiento de voz, notificaciones en iPhone).'],
    fr: ['Pourquoi le site fonctionne-t-il différemment sur mon téléphone ?', 'La mise en page s’adapte ; les données sont propres à chaque appareil ; certaines fonctions dépendent du navigateur (reconnaissance vocale, notifications sur iPhone).'],
  }, { icon: '📱', related: ['site_mobile', 'browser_compat'] }),

  F('offline_unavailable', 'support', 'app', null, ['لماذا لا يعمل بدون انترنت', 'الوضع بدون انترنت لا يعمل', 'offline not working', 'offline mode unavailable', 'sin conexion no funciona', 'hors ligne ne marche pas'], {
    ar: ['لماذا لا يعمل وضع عدم الاتصال؟', '• يحتاج الموقع زيارة أولى كاملة وأنت متصل ليحفظ نسخته على جهازك.\n• يعمل فقط في المتصفحات التي تدعم «عامل الخدمة» (Service Worker)، ولا يعمل غالبًا في التصفح الخاص.\n• السور تعمل بدون إنترنت فقط إذا فتحتها من قبل.\n• التلاوات الصوتية ومواقيت الصلاة والبحث تحتاج إنترنت دائمًا.'],
    en: ['Why is offline mode unavailable?', '• The site needs one full visit while online to store its copy on your device.\n• It works only in browsers that support service workers, and usually not in private browsing.\n• Surahs work offline only if you opened them before.\n• Audio recitations, prayer times and search always need the internet.'],
    es: ['¿Por qué no funciona sin conexión?', 'Necesita una visita previa con conexión, un navegador con service workers (no en modo privado), y solo las suras ya abiertas funcionan. Audio, horarios y búsqueda requieren internet.'],
    fr: ['Pourquoi le mode hors ligne ne marche-t-il pas ?', 'Il faut une visite connectée préalable, un navigateur avec service workers (pas en navigation privée), et seules les sourates déjà ouvertes fonctionnent. Audio, horaires et recherche demandent internet.'],
  }, { icon: '📴', related: ['offline_use', 'lost_internet'] }),

  F('lost_internet', 'support', 'app', null, ['انقطع الانترنت', 'فصل النت', 'لو انقطع الاتصال', 'lose internet', 'connection lost', 'internet drops', 'si pierdo la conexion', 'si je perds internet'], {
    ar: ['ماذا يحدث إذا انقطع الإنترنت؟', 'يبقى ما حُمِّل يعمل: الصفحة المفتوحة، والأذكار، والدروس، والسور التي فتحتها، وملاحظاتك وتقدمك (فهي على جهازك). تتوقف التلاوة الصوتية بعد نفاد ما حُمِّل منها، ولا تتحدث المواقيت، ولا يعمل بحث الآيات. عند عودة الاتصال يكمل الموقع عمله، ولا تحتاج لفعل شيء.'],
    en: ['What happens if I lose internet access?', 'What is loaded keeps working: the open page, adhkar, lessons, surahs you opened, and your notes and progress (they are on your device). Audio stops once the buffered part runs out, prayer times do not update and ayah search does not work. When the connection returns, the site carries on; you do not need to do anything.'],
    es: ['¿Qué pasa si pierdo internet?', 'Lo cargado sigue funcionando (adhkar, lecciones, suras abiertas, tus datos). El audio, los horarios y la búsqueda se detienen hasta que vuelva la conexión.'],
    fr: ['Que se passe-t-il si je perds internet ?', 'Ce qui est chargé continue (adhkar, leçons, sourates ouvertes, vos données). L’audio, les horaires et la recherche s’arrêtent jusqu’au retour de la connexion.'],
  }, { icon: '📶', related: ['offline_use'] }),

  F('update_app', 'support', 'app', null, ['تحديث التطبيق', 'حدث الموقع', 'نسخه جديده', 'update the app', 'get the latest version', 'actualizar la app', 'mettre a jour'], {
    ar: ['كيف أحدّث التطبيق؟', 'لا تحتاج إلى تحديث يدوي: عند فتح الموقع وأنت متصل يجلب النسخة الجديدة في الخلفية، وتظهر في الزيارة التالية. إن أردتها فورًا: أغلق كل نوافذ الموقع (أو التطبيق المثبت) ثم افتحه من جديد، أو أعد تحميل الصفحة مرتين.'],
    en: ['How do I update the application?', 'No manual update is needed: when you open the site online it fetches the new version in the background, and it appears on your next visit. To get it at once, close every window of the site (or the installed app) and open it again, or reload the page twice.'],
    es: ['¿Cómo actualizo la aplicación?', 'Se actualiza sola en segundo plano y aparece en la siguiente visita. Para verla ya, cierra todas sus ventanas y ábrela de nuevo.'],
    fr: ['Comment mettre à jour l’application ?', 'Elle se met à jour seule en arrière-plan et apparaît à la visite suivante. Pour l’avoir tout de suite, fermez toutes ses fenêtres puis rouvrez-la.'],
  }, { icon: '🔄', related: ['install'] }),

  F('browser_compat', 'support', null, null, ['المتصفح لا يدعم', 'مشكله في المتصفح', 'اي متصفح', 'افضل متصفح', 'browser compatibility', 'which browser', 'browser problem', 'navegador compatible', 'navigateur compatible'], {
    ar: ['كيف أحل مشكلة توافق المتصفح؟', '• استخدم أحدث إصدار من Chrome أو Edge أو Firefox أو Safari.\n• التسميع بالميكروفون يعمل أفضل في Chrome وEdge (يحتاج التعرف على الكلام)؛ وقد لا يعمل في Firefox.\n• التنبيهات والتثبيت كتطبيق يختلفان حسب المتصفح والنظام.\n• إن ظهر خلل في الشكل، جرّب إعادة التحميل أو نافذة جديدة، أو عطّل الإضافات مؤقتًا.'],
    en: ['How do I fix a browser compatibility problem?', '• Use the latest Chrome, Edge, Firefox or Safari.\n• Microphone recitation works best in Chrome and Edge (it needs speech recognition) and may not work in Firefox.\n• Notifications and installing as an app depend on the browser and system.\n• If the layout looks broken, reload, open a new window, or temporarily disable extensions.'],
    es: ['¿Cómo resuelvo problemas de compatibilidad?', 'Usa la última versión de Chrome, Edge, Firefox o Safari. La recitación funciona mejor en Chrome y Edge. Recarga o desactiva extensiones si algo se ve mal.'],
    fr: ['Comment résoudre un problème de navigateur ?', 'Utilisez la dernière version de Chrome, Edge, Firefox ou Safari. La récitation marche mieux dans Chrome et Edge. Rechargez ou désactivez les extensions si l’affichage est cassé.'],
  }, { icon: '🌐', related: ['not_loading', 'mic_trouble'] }),

  F('feature_broken', 'support', null, { dialog: 'contactModal' }, ['ميزه لا تعمل', 'زر لا يعمل', 'في خلل', 'في مشكله', 'خطا في الموقع', 'a feature is not working', 'something is broken', 'bug', 'una funcion no funciona', 'une fonction ne marche pas'], {
    ar: ['ماذا أفعل إذا لم تعمل ميزة ما؟', '1. أعد تحميل الصفحة، وتأكد من الاتصال بالإنترنت إن كانت الميزة تحتاجه (التلاوة، المواقيت، البحث).\n2. جرّب متصفحًا آخر أو نافذة جديدة.\n3. اسألني عن الميزة نفسها، فلكثير منها خطوات حل خاصة.\n4. إن بقيت المشكلة، راسل الفريق من «✉️ تواصل معنا» مع وصف ما حدث، واسم المتصفح والجهاز.'],
    en: ['What should I do if a feature is not working?', '1. Reload the page, and check your connection if the feature needs it (audio, prayer times, search).\n2. Try another browser or a new window.\n3. Ask me about that feature: many have their own troubleshooting steps.\n4. If it persists, write to the team from “✉️ Contact Us” describing what happened, with your browser and device.'],
    es: ['¿Qué hago si una función no va?', 'Recarga, comprueba la conexión, prueba otro navegador, pregúntame por la función y, si sigue, escribe al equipo desde «✉️ Contáctenos».'],
    fr: ['Que faire si une fonction ne marche pas ?', 'Rechargez, vérifiez la connexion, essayez un autre navigateur, demandez-moi, et sinon écrivez à l’équipe via « ✉️ Contactez-nous ».'],
  }, { icon: '🧰', related: ['contact', 'browser_compat'] }),

  F('privacy_data', 'support', null, null, ['خصوصيتي', 'هل ترسلون بياناتي', 'من يرى ملاحظاتي', 'الخصوصيه', 'هل المساعد يحفظ اسئلتي', 'privacy', 'is my data sent', 'who sees my data', 'privacidad', 'confidentialite'], {
    ar: ['هل بياناتي وأسئلتي خاصة؟', 'نعم. ملفك وتقدمك وملاحظاتك تُحفظ في متصفحك على جهازك فقط. وأسئلتك لي تُعالج داخل الصفحة ولا تُرسل إلى أي خادم ولا تُحفظ بعد إغلاق الصفحة. الموقع يتصل بخدمات خارجية فقط لجلب نص القرآن والتفسير والتلاوات ومواقيت الصلاة (ويرسل لها إحداثياتك إن سمحت بالموقع).'],
    en: ['Are my data and questions private?', 'Yes. Your profile, progress and notes are stored in your browser on your device only. Your questions to me are handled inside the page; they are not sent to any server and are not kept after you close the page. The site contacts external services only to fetch the Quran text, tafsir, recitations and prayer times (sending your coordinates if you allow location).'],
    es: ['¿Mis datos y preguntas son privados?', 'Sí. Tus datos están solo en tu navegador. Tus preguntas se procesan en la página, no se envían a ningún servidor ni se guardan. Los servicios externos solo se usan para el texto, el audio y los horarios.'],
    fr: ['Mes données et questions sont-elles privées ?', 'Oui. Vos données restent dans votre navigateur. Vos questions sont traitées dans la page, ne sont envoyées à aucun serveur et ne sont pas conservées. Les services externes servent seulement au texte, à l’audio et aux horaires.'],
  }, { icon: '🔒', related: ['login', 'clear_storage'] }),

  F('javascript_needed', 'support', null, null, ['جافاسكربت', 'javascript', 'enable javascript', 'activar javascript', 'activer javascript'], {
    ar: ['لماذا يطلب الموقع تفعيل JavaScript؟', 'المصحف والتلاوات والمواقيت والمساعد وكل الأدوات تعمل بـJavaScript داخل المتصفح. فعّله من إعدادات المتصفح (المحتوى ← JavaScript ← مسموح) ثم أعد تحميل الصفحة.'],
    en: ['Why does the site ask for JavaScript?', 'The Mushaf, recitations, prayer times, the assistant and all tools run with JavaScript in the browser. Enable it in your browser settings (Content → JavaScript → Allowed) and reload.'],
    es: ['¿Por qué pide JavaScript?', 'Todas las herramientas funcionan con JavaScript. Actívalo en los ajustes del navegador y recarga.'],
    fr: ['Pourquoi JavaScript est-il demandé ?', 'Tous les outils fonctionnent avec JavaScript. Activez-le dans le navigateur puis rechargez.'],
  }, { icon: '⚙️', related: ['not_loading'] }),
];
