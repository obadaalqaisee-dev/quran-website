"""learning resources and tafsir search

Adds, without changing any existing column or table:
  * ayah_texts.text_search — normalised text for /api/v1/tafsir/search (nullable: filled by
    `python -m app.cli seed`; existing rows keep working and simply have no search text until then);
  * learning_resources — the scholar resources and verification tools of the learning section,
    with their link status and the time of the last live link check.

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-23 09:00:00
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table("ayah_texts", schema=None) as batch_op:
        batch_op.add_column(sa.Column("text_search", sa.Text(), nullable=True))

    op.create_table(
        "learning_resources",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("scholar", sa.String(length=32), nullable=True),
        sa.Column("scholar_name_ar", sa.String(length=128), nullable=True),
        sa.Column("scholar_name_en", sa.String(length=128), nullable=True),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("url", sa.String(length=512), nullable=False),
        sa.Column("title_ar", sa.String(length=255), nullable=False),
        sa.Column("title_en", sa.String(length=255), nullable=False),
        sa.Column("topic", sa.String(length=32), nullable=False),
        sa.Column("checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('existing', 'official', 'search')", name="ck_resource_status"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("position"),
    )


def downgrade() -> None:
    op.drop_table("learning_resources")
    with op.batch_alter_table("ayah_texts", schema=None) as batch_op:
        batch_op.drop_column("text_search")
