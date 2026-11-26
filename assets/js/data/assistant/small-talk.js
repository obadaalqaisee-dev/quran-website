// Ordinary conversation: greetings, thanks, questions about the assistant itself. Patterns are matched as whole
// words after normalisation (diacritics, hamza and dialect spellings do not matter); longer patterns are listed
// first so «السلام عليكم ورحمة الله وبركاته» is consumed before «السلام عليكم». A reply may be a list of
// variants; one is chosen per turn. The assistant never claims to be a person or to have feelings.

const T = (ar, en, es, fr) => ({ ar, en, es, fr });

export const SMALL_TALK = [
  {
    id: 'salam',
    patterns: ['السلام عليكم ورحمه الله وبركاته', 'السلام عليكم ورحمه الله', 'السلام عليكم', 'سلام عليكم', 'السلام عليك', 'سلام عليك', 'assalamu alaikum', 'assalamu alaykum', 'as salamu alaykum', 'as salamu alaikum', 'assalam alaikum', 'salam alaikum', 'salamu alaikum', 'assalamualaikum', 'salam aleykoum', 'salam'],
    reply: T('وعليكم السلام ورحمة الله وبركاته 🌿 أهلًا وسهلًا بك.', 'Wa alaykum assalam wa rahmatullahi wa barakatuh 🌿 Welcome!', 'Wa alaykum assalam wa rahmatullahi wa barakatuh 🌿 ¡Bienvenido!', 'Wa alaykoum assalam wa rahmatoullahi wa barakatouh 🌿 Bienvenue !'),
    offerHelp: true,
  },
  {
    id: 'morning',
    patterns: ['صباح الخير', 'صباح النور', 'صباحو', 'good morning', 'buenos dias', 'bonjour'],
    reply: T('صباح النور والسرور ☀️', 'Good morning to you too ☀️', '¡Buenos días! ☀️', 'Bonjour à vous aussi ☀️'),
    offerHelp: true,
  },
  {
    id: 'evening',
    patterns: ['مساء الخير', 'مساء النور', 'مسا الخير', 'good evening', 'buenas tardes', 'buenas noches', 'bonsoir'],
    reply: T('مساء النور 🌙', 'Good evening to you too 🌙', '¡Buenas tardes! 🌙', 'Bonsoir à vous aussi 🌙'),
    offerHelp: true,
  },
  {
    id: 'hello',
    patterns: ['مرحبا بك', 'مرحبتين', 'مرحبا', 'مراحب', 'اهلا وسهلا', 'اهلين', 'اهلا', 'هلا والله', 'هلا', 'هاي', 'hello there', 'hello', 'hi there', 'hi', 'hey', 'greetings', 'hola', 'salut', 'coucou'],
    reply: T('أهلًا وسهلًا بك 😊', 'Hello, and welcome 😊', '¡Hola, bienvenido! 😊', 'Bonjour et bienvenue 😊'),
    offerHelp: true,
  },
  {
    id: 'how_are_you',
    patterns: ['كيف حالك', 'كيف الحال', 'كيف حالكم', 'كيفك', 'كيفكم', 'ما اخبارك', 'ما اخبارك', 'اخبارك', 'ما احوالك', 'عامل ايه', 'شخبارك', 'شلونك', 'كيف صحتك', 'how are you doing', 'how are you', 'how r u', 'are you okay', 'are you ok', 'how is it going', 'como estas', 'que tal', 'comment ca va', 'comment allez vous', 'ca va'],
    reply: T(
      ['الحمد لله، شكرًا لسؤالك 🌿 أنا برنامج مساعد فليست لي مشاعر، لكنني جاهز دائمًا لمساعدتك. وأنت، كيف حالك؟', 'بخير والحمد لله، شكرًا لك! أنا مساعد آلي داخل الموقع، وسعيد بخدمتك. كيف أقدر أساعدك اليوم؟'],
      ['Alhamdulillah, thank you for asking 🌿 I am a software assistant, so I have no feelings, but I am always ready to help. How are you?', 'All good, thank you! I am an automated assistant inside the site and happy to help. What can I do for you today?'],
      ['Alhamdulillah, gracias por preguntar 🌿 Soy un asistente de software, así que no tengo sentimientos, pero siempre estoy listo para ayudar. ¿Y tú, cómo estás?'],
      ['Alhamdoulillah, merci de demander 🌿 Je suis un assistant logiciel, je n’ai donc pas de sentiments, mais je suis toujours prêt à aider. Et vous, comment allez-vous ?'],
    ),
    offerHelp: true,
  },
  {
    id: 'fine',
    standalone: true,
    patterns: ['انا بخير', 'بخير الحمد لله', 'الحمد لله بخير', 'بخير', 'الحمد لله', 'تمام الحمد لله', 'i am fine', 'i am good', 'im fine', 'im good', 'fine thanks', 'estoy bien', 'muy bien', 'je vais bien', 'tres bien'],
    reply: T('الحمد لله، أدام الله عليك الخير 🌿', 'Alhamdulillah, glad to hear it 🌿', 'Alhamdulillah, me alegra saberlo 🌿', 'Alhamdoulillah, ravi de l’entendre 🌿'),
    offerHelp: true,
  },
  {
    id: 'who',
    patterns: ['من انت', 'من انتي', 'ما انت', 'ما اسمك', 'عرف بنفسك', 'عرفني بنفسك', 'هل انت انسان', 'هل انت روبوت', 'هل انت بشر', 'هل انت ذكاء اصطناعي', 'who are you', 'what are you', 'are you human', 'are you a bot', 'are you a robot', 'are you an ai', 'are you ai', 'your name', 'quien eres', 'que eres', 'eres humano', 'qui es tu', 'qui etes vous', 'es tu humain'],
    reply: T(
      'أنا «مساعد الموقع» 💬: برنامج يعمل داخل متصفحك، ولست إنسانًا ولا عالمًا شرعيًا ولا نموذج ذكاء اصطناعي. أجيب من محتوى موثّق كتبه فريق الموقع: شرح ميزات الموقع، وأسئلة عن الإسلام مع مصادرها من القرآن والسنة. لا أُرسل أسئلتك إلى أي خادم.',
      'I am the “Site assistant” 💬: a program that runs in your browser. I am not a person, a scholar or an AI model. I answer from reviewed content written for this site: how to use its features, and questions about Islam with their sources from the Quran and Sunnah. Your questions are not sent to any server.',
      'Soy el «Asistente del sitio» 💬: un programa que funciona en tu navegador. No soy una persona, ni un sabio, ni un modelo de IA. Respondo con contenido revisado del sitio: cómo usar sus funciones y preguntas sobre el islam con sus fuentes del Corán y la Sunna. Tus preguntas no se envían a ningún servidor.',
      'Je suis l’« Assistant du site » 💬 : un programme qui fonctionne dans votre navigateur. Je ne suis ni une personne, ni un savant, ni un modèle d’IA. Je réponds avec un contenu vérifié écrit pour ce site : l’utilisation de ses fonctions, et des questions sur l’islam avec leurs sources du Coran et de la Sunna. Vos questions ne sont envoyées à aucun serveur.',
    ),
    offerHelp: true,
  },
  {
    id: 'capabilities',
    patterns: ['بماذا تساعدني', 'بماذا تستطيع مساعدتي', 'ماذا تستطيع', 'ما الذي تستطيع', 'ماذا تعرف', 'ما عملك', 'ما وظيفتك', 'كيف تساعدني', 'شو بتعرف', 'شو بتقدر تعمل', 'ايش تقدر تسوي', 'ساعدني', 'محتاج مساعده', 'اريد مساعده', 'what can you do', 'what can you help me with', 'how can you help', 'help me', 'i need help', 'que puedes hacer', 'en que me puedes ayudar', 'ayudame', 'que peux tu faire', 'aide moi', 'j ai besoin d aide'],
    reply: T(
      'أستطيع مساعدتك في:\n• استخدام الموقع: قراءة القرآن، الاستماع، التسميع والحفظ، الأذكار، مواقيت الصلاة، الملاحظات والنسخ الاحتياطي.\n• تعلّم الصلاة والوضوء من دروس الموقع خطوة بخطوة.\n• أسئلة عن الإسلام: أركانه، العقيدة، العبادات، والسيرة، مع المصادر.\n• إن كنت تفكر في الدخول في الإسلام، أشرح لك الخطوات بهدوء ووضوح.\nاكتب سؤالك بأي طريقة، حتى باللهجة العامية.',
      'I can help you with:\n• Using the site: reading the Quran, listening, recitation and memorisation, adhkar, prayer times, notes and backups.\n• Learning the prayer and wudu step by step from the site’s lessons.\n• Questions about Islam: its pillars, belief, worship and the Prophet’s life, with sources.\n• If you are thinking about becoming Muslim, I can explain the steps calmly and clearly.\nAsk in your own words.',
      'Puedo ayudarte con:\n• Usar el sitio: leer el Corán, escuchar, recitar y memorizar, adhkar, horarios de oración, notas y copias de seguridad.\n• Aprender la oración y el wudu paso a paso con las lecciones del sitio.\n• Preguntas sobre el islam: sus pilares, la creencia, la adoración y la vida del Profeta, con fuentes.\n• Si piensas en hacerte musulmán, te explico los pasos con calma y claridad.\nPregunta con tus propias palabras.',
      'Je peux vous aider pour :\n• Utiliser le site : lire le Coran, écouter, réciter et mémoriser, les adhkar, les horaires de prière, les notes et sauvegardes.\n• Apprendre la prière et les ablutions pas à pas avec les leçons du site.\n• Les questions sur l’islam : ses piliers, la croyance, l’adoration et la vie du Prophète, avec les sources.\n• Si vous pensez à devenir musulman, je vous explique les étapes calmement et clairement.\nPosez votre question avec vos propres mots.',
    ),
    offerHelp: true,
  },
  {
    id: 'jazak',
    patterns: ['جزاك الله خيرا', 'جزاك الله خير', 'جزاكم الله خيرا', 'جزاكم الله خير', 'جزاك الله', 'jazakallah khair', 'jazakallahu khairan', 'jazakallah', 'jazak allah'],
    reply: T('وإياك، وجزاك الله خيرًا 🌿', 'Wa iyyakum, and may Allah reward you too 🌿', 'Wa iyyakum, y que Allah también te recompense 🌿', 'Wa iyyakoum, et qu’Allah vous récompense aussi 🌿'),
  },
  {
    id: 'barak',
    patterns: ['بارك الله فيك', 'بارك الله فيكم', 'بارك الله', 'الله يبارك فيك', 'barakallahu feek', 'barakallah'],
    reply: T('وفيك بارك الله 🌿', 'Wa feekum barakallah 🌿', 'Wa feekum barakallah 🌿', 'Wa fikoum barakallah 🌿'),
  },
  {
    id: 'afia',
    patterns: ['الله يعطيك العافيه', 'يعطيك العافيه', 'الله يعطيك الف عافيه', 'يعطيكم العافيه'],
    reply: T('الله يعافيك ويبارك فيك 🌿', 'May Allah grant you well-being too 🌿', 'Que Allah te conceda bienestar también 🌿', 'Qu’Allah vous accorde aussi le bien-être 🌿'),
  },
  {
    id: 'thanks',
    patterns: ['شكرا جزيلا', 'شكرا لك', 'شكرا', 'مشكور', 'مشكوره', 'يسلمو', 'تسلم', 'يسلموا', 'ثانكس', 'thank you so much', 'thank you very much', 'thank you', 'thanks a lot', 'thanks', 'thx', 'muchas gracias', 'gracias', 'merci beaucoup', 'merci'],
    reply: T(['العفو، يسعدني أنني ساعدتك 🌿', 'على الرحب والسعة! هل هناك شيء آخر تريد معرفته؟'], ['You are welcome, glad I could help 🌿', 'My pleasure! Is there anything else you would like to know?'], ['De nada, me alegra haber ayudado 🌿'], ['Avec plaisir, ravi d’avoir pu aider 🌿']),
  },
  {
    id: 'praise',
    standalone: true,
    patterns: ['ممتاز', 'رائع', 'جميل', 'احسنت', 'ما شاء الله', 'ماشاء الله', 'مفيد', 'افدتني', 'حلو', 'كفو', 'excellent', 'great', 'awesome', 'perfect', 'that s helpful', 'thats helpful', 'very helpful', 'helpful', 'nice', 'genial', 'perfecto', 'muy util', 'super', 'parfait', 'tres utile'],
    reply: T('يسعدني أن ذلك أفادك، الحمد لله 🌿', 'I am glad that helped, alhamdulillah 🌿', 'Me alegra que te haya servido, alhamdulillah 🌿', 'Ravi que cela vous ait aidé, alhamdoulillah 🌿'),
  },
  {
    id: 'bye',
    patterns: ['مع السلامه', 'في امان الله', 'في حفظ الله', 'الى اللقاء', 'باي', 'سلام عليكم وداعا', 'وداعا', 'تصبح علي خير', 'goodbye', 'bye', 'see you', 'good night', 'adios', 'hasta luego', 'au revoir', 'a bientot', 'bonne nuit'],
    reply: T('في أمان الله وحفظه 🌿 عد متى شئت.', 'Take care, may Allah protect you 🌿 Come back any time.', 'Cuídate, que Allah te proteja 🌿 Vuelve cuando quieras.', 'Prenez soin de vous, qu’Allah vous protège 🌿 Revenez quand vous voulez.'),
  },
  {
    id: 'ok',
    standalone: true,
    patterns: ['تمام', 'طيب', 'حسنا', 'اوكي', 'اوك', 'ماشي', 'فهمت', 'واضح', 'okay', 'ok', 'got it', 'i see', 'understood', 'vale', 'de acuerdo', 'entendido', 'd accord', 'compris'],
    reply: T('تمام 👍 هل تريد أن تسأل عن شيء آخر؟', 'Great 👍 Would you like to ask anything else?', 'Perfecto 👍 ¿Quieres preguntar algo más?', 'Parfait 👍 Voulez-vous demander autre chose ?'),
  },
  {
    id: 'insha',
    standalone: true,
    patterns: ['ان شاء الله', 'insha allah', 'inshallah'],
    reply: T('إن شاء الله، يسّر الله أمرك 🌿', 'In sha Allah, may Allah make it easy for you 🌿', 'In sha Allah, que Allah te lo facilite 🌿', 'In cha Allah, qu’Allah vous facilite 🌿'),
  },
];

/** Follow-ups about the previous answer: explain more, simpler, what is next. */
export const META_FOLLOWUPS = [
  { kind: 'simpler', patterns: ['مش فاهم', 'لا فاهم', 'لم افهم', 'ما فهمت', 'ما فهمت شي', 'ما فهمتش', 'لا افهم', 'وضح اكثر', 'بشكل ابسط', 'ابسط', 'بسط', 'i don t understand', 'i dont understand', 'didn t understand', 'not clear', 'simpler', 'no entiendo', 'mas simple', 'je ne comprends pas', 'plus simple'] },
  { kind: 'next', patterns: ['الخطوه التاليه', 'وبعدين', 'وبعد ذلك', 'ماذا بعد', 'وماذا بعد', 'ثم ماذا', 'what next', 'what s next', 'whats next', 'next step', 'then what', 'and then', 'y despues', 'siguiente paso', 'et ensuite', 'etape suivante'] },
  { kind: 'more', patterns: ['اشرح اكثر', 'اشرح لي اكثر', 'وضح لي', 'زدني', 'تفاصيل اكثر', 'المزيد', 'اكمل', 'كمل', 'احكيلي اكثر', 'تفصيل', 'can you explain more', 'explain more', 'tell me more', 'more details', 'more please', 'go on', 'what about that', 'explica mas', 'mas detalles', 'dime mas', 'explique plus', 'plus de details', 'dis m en plus'] },
];
