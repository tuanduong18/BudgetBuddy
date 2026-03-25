"""
Application configuration loaded from environment variables.

All sensitive values (keys, database URLs) are read from the .env file via
python-dotenv so that secrets are never hard-coded in source.
"""
from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Secret key used by Flask-JWT-Extended to sign tokens.
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    # Flask session secret key.
    SECRET_KEY = os.getenv("SECRET_KEY")

    # SQLAlchemy connection string for the PostgreSQL database.
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")

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
