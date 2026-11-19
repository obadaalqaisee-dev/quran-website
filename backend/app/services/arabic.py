"""Arabic normalisation for search.

The normaliser is used for **matching only**. Displayed Quran text is never
modified. ``assets/js/core/arabic.js`` implements the same rules in the
browser so that both search paths behave identically.
"""

from __future__ import annotations

import re

# Harakat, Quranic annotation marks, superscript alef, tatweel.
_DIACRITICS = re.compile("[ؐ-ًؚ-ٰٟۖ-ۭـ]")
_ALEF = re.compile("[أإآٱ]")
_NON_WORD = re.compile(r"[^\w\s]")
_SPACES = re.compile(r"\s+")


def normalize_arabic(text: str) -> str:
    text = (text or "").replace("﻿", "")
    text = _DIACRITICS.sub("", text)
    text = _ALEF.sub("ا", text)
    text = text.replace("ى", "ي").replace("ة", "ه").replace("ؤ", "و").replace("ئ", "ي")
    text = _NON_WORD.sub(" ", text)
    return _SPACES.sub(" ", text).strip().lower()
