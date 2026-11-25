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
    // نشيد «أبداً لا لن نحيد» (track 5 «جند الله» of the album «وأعدوا 2», تسجيلات الإسراء – الكويت;
    // performed by عبدالله الكندري and صباح عنان; 4:33, MP3 128 kbps). The file is byte-identical to the
    // Internet Archive copy below (MD5 40374cad3619ef30d6ae0dab9d99d2c1). Its ID3 tag reads «©2002 Enshad.com»;
    // no licence is stated by the upload, and the site owner chose to use it on their own responsibility
    // (replacing «يا ذاكر الأصحاب كن متأدباً», at the owner's request). See docs/about_page.md §2.
    src: 'assets/audio/abadan-la-lan-nahid.mp3',
    firstLine: 'أبداً لا لن نحيد',
    title: 'نشيد أبداً لا لن نحيد',
    performer: 'عبدالله الكندري وصباح عنان',
    album: 'وأعدوا 2 — تسجيلات الإسراء (الكويت)',
    copyright: '©2002 Enshad.com',
    license: 'No licence stated; used at the site owner\'s decision (Internet Archive community upload)',
    sourceUrl: 'https://archive.org/details/wa-a-3do-2',
    md5: '40374cad3619ef30d6ae0dab9d99d2c1',
  }),
});

/** Whether a media entry is ready to be shown/played (a local file with its provenance filled in). */
export const isConfigured = (entry) => typeof entry?.src === 'string' && entry.src.length > 0
  && !/^(https?:)?\/\//.test(entry.src) && Boolean(entry.sourceUrl && entry.license);
