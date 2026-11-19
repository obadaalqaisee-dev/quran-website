"""Command-line tasks.

python -m app.cli seed      # import the verified datasets (after `alembic upgrade head`)
python -m app.cli verify    # check datasets and database against the checksums
"""

from __future__ import annotations

import argparse
import sys

from app.db.session import get_sessionmaker
from app.services.datasets import DatasetError, load_verified, seed, verify_database


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    parser.add_argument("command", choices=["seed", "verify"])
    args = parser.parse_args(argv)
    try:
        data = load_verified()
    except DatasetError as exc:
        print(f"Dataset verification FAILED: {exc}", file=sys.stderr)
        return 1
    print("Datasets verified (checksums and Quran structure).")
    session = get_sessionmaker()()
    try:
        if args.command == "seed":
            print("Imported:", seed(session, data))
        problems = verify_database(session, data)
    finally:
        session.close()
    if problems:
        print("Database verification FAILED:", *problems, sep="\n  ", file=sys.stderr)
        return 1
    print("Database matches the verified datasets.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
