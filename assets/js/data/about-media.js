// Media of the «من أنا» page (about.html): the photograph of Al-Aqsa Mosque and the nasheed.
//
// Both must be AUTHENTIC and LICENSED, stored locally, and documented here. They are deliberately
// left empty (null) until real, verified files are added: nothing is invented or substituted.
// See docs/about_page.md for the exact steps (file paths, size, licence checks).
//
// While `src` is null:
//   * image  — the page shows its decorative pattern header only; it never shows another mosque in
//              place of Al-Aqsa and never captions an unrelated picture as Al-Aqsa;
//   * nasheed — the player is shown with the status «لم يُضف تسجيل النشيد بعد», its controls disabled,
//               and no playback is attempted (it never claims to be playing).

export const ABOUT_MEDIA = Object.freeze({
  image: Object.freeze({
    src: null, // e.g. 'assets/img/about/al-aqsa.webp' (local file, ~1600 px wide, WebP or JPEG)
    width: 1600,
    height: 1000,
    alt: 'المسجد الأقصى المبارك',
    credit: '', // photographer / author, exactly as the licence requires
    license: '', // e.g. 'CC BY-SA 4.0'
    licenseUrl: '', // link to the licence text
    sourceUrl: '', // page the file was obtained from (e.g. its Wikimedia Commons file page)
  }),
  nasheed: Object.freeze({
    src: null, // e.g. 'assets/audio/nasheed.mp3' (local file the site is allowed to publish)
    // The first line of the nasheed's lyrics, as requested by the site owners.
    firstLine: 'سبّوا خيار الخلق من لهم العلى ولهم مقام في ذرى الأحساب...',
    title: '', // title of the recording
    performer: '', // munshid
    license: '', // usage permission (e.g. written permission, CC licence)
    sourceUrl: '', // where the recording was obtained
  }),
});

/** Whether a media entry is ready to be shown/played (a local file with its provenance filled in). */
export const isConfigured = (entry) => typeof entry?.src === 'string' && entry.src.length > 0
  && !/^(https?:)?\/\//.test(entry.src) && Boolean(entry.sourceUrl && entry.license);
