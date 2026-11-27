// Media of the «من أنا» page (about.html): the photograph of the Al-Aqsa Mosque compound and the nasheed.
//
// Both are stored locally and documented here (source and licence). The page shows the photo and plays
// the nasheed only when `src` is a local path and `sourceUrl` and `license` are filled in (isConfigured).

export const ABOUT_MEDIA = Object.freeze({
  image: Object.freeze({
    // المسجد الأقصى المبارك (الحرم القدسي الشريف), aerial view from the south (15 November 2013): the whole
    // compound, with المسجد القبلي in the foreground and قبة الصخرة المشرفة (and قبة السلسلة beside it) in the
    // centre of the courtyard. Wikimedia Commons, photographer Andrew Shiva (uploaded by Godot13), CC BY-SA 4.0.
    // Not cropped: only resized (from the Commons 1920 px rendition) and converted to WebP, 1440×892 (~340 KB)
    // and 800×495 (~105 KB). See docs/about_page.md §2.
    src: 'assets/img/about/al-aqsa-compound-1440.webp',
    width: 1440,
    height: 892,
    srcset: Object.freeze([
      Object.freeze({ src: 'assets/img/about/al-aqsa-compound-800.webp', width: 800 }),
      Object.freeze({ src: 'assets/img/about/al-aqsa-compound-1440.webp', width: 1440 }),
    ]),
    sizes: '(min-width: 1140px) 1060px, calc(100vw - 32px)',
    alt: 'المسجد الأقصى المبارك من الجو: المسجد القبلي في المقدمة، وقبة الصخرة المشرفة في وسط الساحة',
    credit: 'Andrew Shiva / Wikipedia',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Jerusalem-A-Quds-2013(2)-Aerial-Al-Aqsa_Mosque_Compound-(south_exposure).jpg',
  }),
  nasheed: Object.freeze({
    // نشيد «فردوس الرحمن ظلال»: the nasheed «تبصرة» by محمد المقيط (2016), widely known by its line
    // «فالغاية والهم الأسمى فردوس الرحمن ظلال» (4:30, MP3 128 kbps, 44.1 kHz stereo; the original vocal version,
    // not the later re-arrangement). The file is byte-identical to the Internet Archive copy below (MD5
    // dcabf005548ab822f173dd0fc4280eb0), uploaded 2016-03-05. No licence is stated by the upload; the site owner
    // chose to use it on their own responsibility (replacing «أبداً لا لن نحيد», at the owner's request).
    // See docs/about_page.md §2.
    src: 'assets/audio/firdaws-al-rahman-dhilal.mp3',
    firstLine: 'فردوس الرحمن ظلال',
    title: 'نشيد فردوس الرحمن ظلال (تبصرة)',
    performer: 'محمد المقيط',
    album: 'تبصرة (2016)',
    license: 'No licence stated; used at the site owner\'s decision (Internet Archive community upload)',
    sourceUrl: 'https://archive.org/details/qalb_js_hotmail_20160305_0511',
    md5: 'dcabf005548ab822f173dd0fc4280eb0',
  }),
});

/** Whether a media entry is ready to be shown/played (a local file with its provenance filled in). */
export const isConfigured = (entry) => typeof entry?.src === 'string' && entry.src.length > 0
  && !/^(https?:)?\/\//.test(entry.src) && Boolean(entry.sourceUrl && entry.license);
