// Media of the «من أنا» page (about.html): the photograph of the Dome of the Rock and the nasheed.
//
// Both are stored locally and documented here (source and licence). The page shows the photo and plays
// the nasheed only when `src` is a local path and `sourceUrl` and `license` are filled in (isConfigured).

export const ABOUT_MEDIA = Object.freeze({
  image: Object.freeze({
    // قبة الصخرة المشرفة، المسجد الأقصى المبارك (with the Dome of the Chain in front). Wikimedia Commons
    // featured picture, cropped to 1280×800 and converted to WebP (~100 KB).
    src: 'assets/img/about/dome-of-the-rock.webp',
    width: 1280,
    height: 800,
    alt: 'قبة الصخرة المشرفة في المسجد الأقصى المبارك',
    credit: 'Andrew Shiva / Wikipedia',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Jerusalem-2013-Temple_Mount-Dome_of_the_Rock_%26_Chain_02.jpg',
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
