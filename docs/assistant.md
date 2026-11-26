# The conversational assistant («💬 مساعد الموقع»)

The site assistant is a conversational guide to the website and to Islam. It greets people naturally, keeps the
topic of the conversation, answers questions about every feature of the site, answers general questions about
Islam with their sources, and gives particular care to people who are thinking about becoming Muslim.

It runs entirely in the browser. **No AI model, no external AI API, no API key and no download is involved**, and
nothing the visitor types is sent anywhere or stored.

## 1. Why no generative model

Before designing it, the feasible options were compared (the on-device model of PR #7 was reverted and is not
reused):

| Option | Natural replies | Religious accuracy | Privacy | Cost / weight | Offline | Verdict |
|---|---|---|---|---|---|---|
| Cloud LLM API (with retrieval) | very good | can still invent rulings, ayah wording or hadith; needs strict guarding | every question leaves the device; needs a key and a server proxy | recurring cost, a backend secret | no | rejected for now |
| On-device LLM (WebGPU / WASM, as in PR #7) | good | same hallucination risk | good | 100 MB–2 GB download, WebGPU, slow on ordinary phones | after download | rejected (reverted) |
| **Deterministic engine over reviewed content (chosen)** | good for the domains covered; honest "I don't know" outside them | every sentence was written and reviewed in advance; ayahs come from the verified dataset | nothing leaves the page | ~250 KB of text, executed only on first use | yes | **chosen** |

For this site the deciding factor is religious responsibility: an assistant that may fabricate a Quranic wording,
a hadith or a ruling is worse than one that says "I have no reliable source for this". A generative layer can be
added later *on top* of this engine (for rephrasing only), with the engine as the source of facts and the fallback.

## 2. Architecture

```
features/assistant.js        UI: chat bubbles, chips, typing indicator, rendering of reply blocks (textContent only)
        │  dynamic import on first use
core/assistant-engine.js     pure functions, unit-tested
   1. understand   detectLanguage · normalizeText · tokenize (dialect map, conjunctions, pronoun suffixes, stems)
   2. classify     empty · injection · smalltalk · meta follow-up · tafsir · ruling · question
   3. context      newContext / entity history (in memory, per conversation) · follow-up level (pronoun, «و…»)
   4. retrieve     IDF-weighted index over keys / questions / answers in 4 languages, exact-question bonus,
                   question-type aware (where / what / how / why / how many / can), site vs Islam hints
   5. compose      structured blocks: title, text, steps, notice, shahada, quran(ref), hadith, tafsir, action,
                   lesson, sources, follow-up chips
   6. validate     drops invalid ayah refs, unsourced hadith, unknown actions/hrefs, empty or unknown blocks
data/assistant/site-faq.js   127 website questions (10 categories), 26 of them reuse the original help_* strings
data/assistant/islamic-kb.js 67 Islamic records (7 categories) — Quran refs + hadith with collection and Dorar link
data/assistant/small-talk.js greetings, thanks, "who are you", "explain more", "what next", "I don't understand"
data/assistant/entities.js   topics used to resolve follow-ups
core/assistant.js            (unchanged) verbatim passages of the site's lessons and Hisn al-Muslim, ruling detector
```

Each reply may also include **verbatim passages** of the site's lessons (the original behaviour), and — when
nothing answers — the original "search this word in the Quran" offer.

### Small talk
Greetings are matched as whole phrases after normalisation, so «السلام عليكم ورحمة الله وبركاته», «سلام عليكم» and
"Assalamu alaikum" all receive «وعليكم السلام ورحمة الله وبركاته»; «صباح الخير» → «صباح النور»; thanks, «جزاك الله
خيرًا», «بارك الله فيك», «الله يعطيك العافية» get their customary replies. «كيف حالك؟» is answered warmly while stating
that the assistant is a program without feelings. A greeting followed by a question («السلام عليكم، كيف أصبح
مسلمًا؟») is greeted back and then answered. Words such as «الحمد لله» or «تمام» count as small talk only on their own.

### Context
The context holds the last record and the last three topics («quran», «prayer», «wudu»…). A follow-up is detected by
an attached pronoun («أحفظه»، «إليه»), a leading «و/ف + question word», "and how…", or a very short question. The
engine then completes the question with a recent topic and keeps the completion only if it is a confident match.
"Explain more", "what's next" and "I don't understand" act on the previous answer (`more`, `next`, short version).

## 3. Religious sources and safety

* **Quran:** records store references only (`{ ref: '3:19', expect: 'الإسلام' }`). The text is fetched at display time
  from the same verified source as the Mushaf, with the Sahih International / Cortés / Hamidullah translation for
  non-Arabic replies. A unit test checks every reference against `backend/app/data/ayahs.json.gz` and that no answer
  contains a hand-typed ayah (`﴿…﴾`).
* **Hadith:** well-known narrations, cited by collection only («رواه مسلم»، «متفق عليه»), never with an asserted
  number, each with a Dorar.net search link; translations are labelled "Meaning", not presented as quotations.
* **Tafsir:** «ما معنى سورة …» / «تفسير آية الكرسي» / «2:255» show the ayahs with Tafsir al-Muyassar from the verified
  editions, never a paraphrase written by the assistant.
* **Rulings:** questions with حكم / يجوز / حرام / fatwa… always carry the "not a fatwa" notice; the assistant only points
  to lessons that explain the scholars' differences and recommends qualified scholars. Records about personal
  situations carry a "consult a scholar" note. Where scholars differ (e.g. ghusl after embracing Islam), the answer
  says so.
* **No source → no answer:** if nothing reliable matches, the assistant says so and offers starters.
* **Prompt injection:** messages like "ignore previous instructions" get a fixed reply; there is no model to steer.
* **Rendering:** every string — including user input — is inserted with `textContent`; CSP is unchanged.

### "How can I become Muslim?"
The answer (`become_muslim`) is welcoming and practical: faith in the heart in the oneness of Allah and the message
of Muhammad ﷺ; the Shahada in Arabic, transliterated, and translated («I bear witness that there is no deity worthy of
worship except Allah, and I bear witness that Muhammad is the Messenger of Allah»); understanding and sincerity, not
mere repetition; no ceremony, building or witnesses required; the value of a trusted Muslim or a local mosque; the
next steps (belief, wudu, the five prayers gradually, Al-Fatihah, the basic obligations, good company); and
reassurance that nobody needs to be perfect first. It cites 3:19, 2:256, 39:53 and «الإسلام يهدم ما كان قبله» (Muslim).
"What next?" continues to `after_conversion`, then `new_muslim_first`. Separate records answer the common
questions: mosque, witnesses, name, Arabic, wudu/ghusl, pronunciation, doing it immediately or privately, family.

## 4. Privacy and performance
* The conversation exists only in memory; «🧹 محادثة جديدة» clears it. Nothing is logged, stored or sent.
* Ayah, tafsir and translation requests are the same ones the Mushaf makes.
* The engine and knowledge base (~250 KB) are module-preloaded like every module of the site, but only evaluated when
  the assistant is first used; a reply takes well under 30 ms (unit test).
* All new files are precached by the service worker (version 3.4.0), so the assistant works offline after a visit
  (ayah texts need to have been loaded once).

## 5. Known limitations
* The assistant understands what its records cover; it is not open-domain. Unusual phrasings can miss, in which case
  it says so honestly instead of guessing.
* Spanish and French answers are sometimes shorter than the Arabic and English ones; the lesson bodies themselves are
  in Arabic (as before).
* Dialect support covers common Levantine, Gulf and Egyptian words, not every variant.
* Follow-up resolution is heuristic (pronouns, short questions, recent topics).
* The site has no ayah "share" or "copy" button; the answers say so and describe the manual way.
