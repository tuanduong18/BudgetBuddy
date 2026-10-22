"""
Alembic migration environment for BudgetBuddy.

Connects using the same DATABASE_URL the Flask app reads (environment variable
or .env via app.config), and points autogenerate at the app's SQLAlchemy
metadata so `alembic revision --autogenerate` diffs against app/models.py.

Deliberately does not call create_app(): that would start the Socket.IO
NOTIFY listener thread, which a migration run does not need.
"""
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import Config
from app.extension import db
import app.models  # noqa: F401 - registers every model on db.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

if not Config.SQLALCHEMY_DATABASE_URI:
    raise RuntimeError("DATABASE_URL is not set; cannot run migrations.")
config.set_main_option("sqlalchemy.url", Config.SQLALCHEMY_DATABASE_URI)

target_metadata = db.metadata


def run_migrations_offline() -> None:
    """Emit SQL to stdout instead of executing it (`alembic upgrade --sql`)."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live database connection."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
