"""
Database initialisation script.

Brings the database schema up to date by applying every pending Alembic
migration (tables, enum types and the PostgreSQL NOTIFY triggers all live in
migrations/versions/). Equivalent to running `alembic upgrade head` from this
directory, and safe to run repeatedly.

Usage:
    python init_db.py
"""
from pathlib import Path

from alembic import command
from alembic.config import Config

alembic_cfg = Config(str(Path(__file__).with_name("alembic.ini")))
command.upgrade(alembic_cfg, "head")
print("Database schema is up to date.")
