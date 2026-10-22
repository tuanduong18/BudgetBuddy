"""
Application configuration loaded from environment variables.

All sensitive values (keys, database URLs) are read from the .env file via
python-dotenv so that secrets are never hard-coded in source.
"""
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()


def get_database_url() -> str:
    """Return a normalised SQLAlchemy-compatible PostgreSQL URL.

    Managed providers (Heroku, some Render setups) hand out URLs using the
    legacy ``postgres://`` scheme, which SQLAlchemy 2.x refuses to parse. We
    rewrite it to ``postgresql://`` rather than making every operator
    remember to do it by hand.
    """
    url = os.getenv("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Point it at a PostgreSQL instance, e.g. "
            "postgresql://user:pass@host:5432/dbname"
        )

    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    # Supabase's transaction pooler (port 6543) multiplexes many clients onto
    # a few backends, so LISTEN registrations are dropped and real-time group
    # updates silently stop working. Session mode (5432) keeps a dedicated
    # connection per client and is required by app/socket_listener.py.
    if ":6543" in url:
        print(
            "[config] WARNING: DATABASE_URL uses port 6543 (transaction pooler). "
            "LISTEN/NOTIFY will not fire and real-time updates will not work. "
            "Use the session-mode pooler on port 5432 instead."
        )

    return url


class Config:
    # Secret key used by Flask-JWT-Extended to sign tokens.
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    # Flask session secret key.
    SECRET_KEY = os.getenv("SECRET_KEY")

    # SQLAlchemy connection string for the PostgreSQL database.
    SQLALCHEMY_DATABASE_URI = get_database_url()

    # Recycle connections before the pooler's idle timeout and check liveness
    # before handing a connection out. Without this, a paused/idle Supabase
    # project causes the first request after a lull to fail with a stale socket.
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }

    # Disable SQLAlchemy modification tracking to reduce overhead.
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Short-lived access token; expire quickly to limit exposure if stolen.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)

    # Long-lived refresh token used to reissue access tokens without re-login.
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Expect the JWT to be transmitted inside the Authorization HTTP header.
    JWT_TOKEN_LOCATION = ['headers']

    # HTTP header name that carries the token.
    JWT_HEADER_NAME = 'Authorization'

    # Token type prefix; the raw token string follows this keyword.
    JWT_HEADER_TYPE = 'Bearer'
