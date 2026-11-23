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
    // نشيد «يا ذاكر الأصحاب كن متأدباً» (3:09, MP3 128 kbps), from the Internet Archive item below,
    // whose description gives the full lyrics of this nasheed.
    src: 'assets/audio/ya-dhakir-al-ashab.mp3',
    firstLine: 'يا ذاكر الأصحاب كن متأدباً واعرف عظيم منازل الأصحابِ',
    title: 'نشيد يا ذاكر الأصحاب كن متأدباً',
    performer: '',
    license: 'Internet Archive (audio_islamic)',
    sourceUrl: 'https://archive.org/details/ya-dakera-ass7abi',
  }),
});

/** Whether a media entry is ready to be shown/played (a local file with its provenance filled in). */
export const isConfigured = (entry) => typeof entry?.src === 'string' && entry.src.length > 0
  && !/^(https?:)?\/\//.test(entry.src) && Boolean(entry.sourceUrl && entry.license);
