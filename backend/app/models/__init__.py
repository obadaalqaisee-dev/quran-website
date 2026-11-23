"""ORM models. Importing this package registers every table on ``Base.metadata``."""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Surah(Base):
    __tablename__ = "surahs"
    __table_args__ = (CheckConstraint("number BETWEEN 1 AND 114", name="ck_surah_number"),)

    number: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    name_ar: Mapped[str] = mapped_column(String(64))
    name_en: Mapped[str] = mapped_column(String(64))
    name_en_translation: Mapped[str] = mapped_column(String(128))
    revelation_type: Mapped[str] = mapped_column(String(16))
    ayah_count: Mapped[int] = mapped_column(Integer)

    ayahs: Mapped[list["Ayah"]] = relationship(back_populates="surah", order_by="Ayah.number_in_surah")


class Ayah(Base):
    __tablename__ = "ayahs"
    __table_args__ = (
        UniqueConstraint("surah_number", "number_in_surah", name="uq_ayah_position"),
        CheckConstraint("id BETWEEN 1 AND 6236", name="ck_ayah_id"),
        Index("ix_ayahs_surah", "surah_number"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    surah_number: Mapped[int] = mapped_column(ForeignKey("surahs.number", ondelete="RESTRICT"))
    number_in_surah: Mapped[int] = mapped_column(Integer)
    text_uthmani: Mapped[str] = mapped_column(Text)
    text_simple: Mapped[str] = mapped_column(Text)
    text_search: Mapped[str] = mapped_column(Text)  # normalised form used by search
    juz: Mapped[int] = mapped_column(Integer)
    page: Mapped[int] = mapped_column(Integer)
    hizb_quarter: Mapped[int] = mapped_column(Integer)
    sajda: Mapped[bool] = mapped_column(Boolean, default=False)

    surah: Mapped[Surah] = relationship(back_populates="ayahs")


class Edition(Base):
    __tablename__ = "editions"

    identifier: Mapped[str] = mapped_column(String(32), primary_key=True)
    kind: Mapped[str] = mapped_column(String(16))  # 'tafsir' | 'translation'
    language: Mapped[str] = mapped_column(String(8))
    name: Mapped[str] = mapped_column(String(128))
    english_name: Mapped[str] = mapped_column(String(128))


class AyahText(Base):
    __tablename__ = "ayah_texts"

    edition: Mapped[str] = mapped_column(ForeignKey("editions.identifier", ondelete="CASCADE"), primary_key=True)
    ayah_id: Mapped[int] = mapped_column(ForeignKey("ayahs.id", ondelete="CASCADE"), primary_key=True)
    text: Mapped[str] = mapped_column(Text)
    # Normalised form used by /tafsir/search (migration 0002). NULL until `python -m app.cli seed` runs.
    text_search: Mapped[str | None] = mapped_column(Text, nullable=True)


class Reciter(Base):
    __tablename__ = "reciters"

    slug: Mapped[str] = mapped_column(String(32), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, unique=True)
    name_ar: Mapped[str] = mapped_column(String(128))
    name_en: Mapped[str] = mapped_column(String(128))
    i18n_key: Mapped[str | None] = mapped_column(String(64), nullable=True)
    base_url: Mapped[str] = mapped_column(String(255))
    rewaya: Mapped[str] = mapped_column(String(128))
    mp3quran_reciter_id: Mapped[int] = mapped_column(Integer)
    mp3quran_moshaf_id: Mapped[int] = mapped_column(Integer)


class Dhikr(Base):
    __tablename__ = "adhkar"
    __table_args__ = (
        UniqueConstraint("category", "position", name="uq_dhikr_position"),
        CheckConstraint("count >= 1", name="ck_dhikr_count"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(String(16), index=True)
    position: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    count: Mapped[int] = mapped_column(Integer)


class LearningResource(Base):
    """A scholar resource or verification tool shown in the learning section, with its link status.

    status: 'existing' (link already published on the site), 'official' (official website, home page),
    'search' (a search on a public platform). `checked_at` is set only by a live link check.
    """

    __tablename__ = "learning_resources"
    __table_args__ = (CheckConstraint("status IN ('existing', 'official', 'search')", name="ck_resource_status"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, unique=True)
    scholar: Mapped[str | None] = mapped_column(String(32), nullable=True)
    scholar_name_ar: Mapped[str | None] = mapped_column(String(128), nullable=True)
    scholar_name_en: Mapped[str | None] = mapped_column(String(128), nullable=True)
    kind: Mapped[str] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(16))
    url: Mapped[str] = mapped_column(String(512))
    title_ar: Mapped[str] = mapped_column(String(255))
    title_en: Mapped[str] = mapped_column(String(255))
    topic: Mapped[str] = mapped_column(String(32))
    checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class DataImport(Base):
    """Provenance record: which verified dataset (by checksum) was loaded, and when."""

    __tablename__ = "data_imports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dataset: Mapped[str] = mapped_column(String(64))
    source: Mapped[str] = mapped_column(String(255))
    sha256: Mapped[str] = mapped_column(String(64))
    records: Mapped[int] = mapped_column(Integer)
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


__all__ = ["Base", "Surah", "Ayah", "Edition", "AyahText", "Reciter", "Dhikr", "DataImport"]
