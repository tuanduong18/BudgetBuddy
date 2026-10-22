"""
Database initialisation script.

Brings the database schema up to date by applying every pending Alembic
migration (tables, enum types and the PostgreSQL NOTIFY triggers all live in
migrations/versions/). Safe to run repeatedly; the Docker image runs it on
every boot.

A database created before Alembic was introduced (by the old
db.create_all() + create_triggers()) already has the baseline schema but no
alembic_version table. Upgrading it from scratch would try to create those
tables again and fail, so it is stamped at the baseline revision first.

Usage:
    python init_db.py
"""
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

from app.config import Config as AppConfig

# Revision that matches the schema db.create_all() used to produce.
BASELINE_REVISION = "c4b73eeee6d0"

alembic_cfg = Config(str(Path(__file__).with_name("alembic.ini")))

engine = create_engine(AppConfig.SQLALCHEMY_DATABASE_URI)
try:
    tables = set(inspect(engine).get_table_names())
finally:
    engine.dispose()

if "alembic_version" not in tables and "user" in tables:
    print(f"Existing pre-Alembic database detected; stamping {BASELINE_REVISION}.")
    command.stamp(alembic_cfg, BASELINE_REVISION)

command.upgrade(alembic_cfg, "head")
print("Database schema is up to date.")
