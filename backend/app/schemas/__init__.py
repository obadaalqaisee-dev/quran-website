"""Response schemas. Every successful response is ``{"data": ..., "meta"?: ...}``."""

from __future__ import annotations

from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class Envelope(BaseModel, Generic[T]):
    data: T


class PageMeta(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int


class PagedEnvelope(BaseModel, Generic[T]):
    data: list[T]
    meta: PageMeta


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class SurahOut(ORM):
    number: int
    name_ar: str
    name_en: str
    name_en_translation: str
    revelation_type: str
    ayah_count: int


class AyahOut(ORM):
    id: int
    number_in_surah: int
    text: str
    juz: int
    page: int
    sajda: bool


class SurahDetailOut(SurahOut):
    ayahs: list[AyahOut]


class AyahDetailOut(BaseModel):
    id: int
    surah: int
    number_in_surah: int
    text: str
    editions: dict[str, str]


class EditionOut(ORM):
    identifier: str
    kind: str
    language: str
    name: str
    english_name: str


class SearchHit(BaseModel):
    id: int
    surah: int
    surah_name_ar: str
    surah_name_en: str
    number_in_surah: int
    text: str
    text_simple: str


class ReciterOut(ORM):
    slug: str
    position: int
    name_ar: str
    name_en: str
    i18n_key: str | None
    base_url: str
    rewaya: str


class AudioOut(BaseModel):
    reciter: str
    surah: int
    urls: list[str]
    fallback_lookup_error: str | None = None


class HijriOut(BaseModel):
    day: str
    year: str
    month_ar: str
    month_en: str


class PrayerDateOut(BaseModel):
    gregorian: str
    hijri: HijriOut


class PrayerTimesOut(BaseModel):
    timings: dict[str, str]
    date: PrayerDateOut
    timezone: str | None
    method: str | None
    location: dict[str, float | str]


class DhikrOut(ORM):
    category: str
    position: int
    text: str
    count: int


class HealthOut(BaseModel):
    status: Literal["ok", "degraded"]
    database: Literal["ok", "unavailable"]
    version: str
