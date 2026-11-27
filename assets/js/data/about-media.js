// Media of the «من أنا» page (about.html): the owner's video of the Al-Aqsa Mosque courtyard and the nasheed.
//
// Both are stored locally and documented here (source and licence). The page plays the nasheed only when
// `src` is a local path and `sourceUrl` and `license` are filled in (isConfigured).

export const ABOUT_MEDIA = Object.freeze({
  video: Object.freeze({
    // The site owner's own video of المسجد الأقصى المبارك: the courtyard and المسجد القبلي (27 s, 478×850 portrait,
    // 30 fps). Provided by the owner on 2026-11-27; it replaced the aerial photograph of the compound. Re-encoded
    // (H.264, faststart) with the audio track removed so it can never make sound. Referenced directly in about.html
    // (autoplay, muted, loop, playsinline, no controls). See docs/about_page.md §2.
    src: 'assets/video/about/al-aqsa-courtyard.mp4',
    poster: 'assets/video/about/al-aqsa-courtyard-poster.webp',
    width: 478,
    height: 850,
    durationSec: 27.03,
    credit: 'Site owner (own recording)',
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
