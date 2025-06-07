from datetime import timedelta
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Need for jwt token
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    SECRET_KEY = os.getenv("SECRET_KEY")

    # Need to link to database
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Access token lifespan
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)

    # Refresh token lifespan
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Place to search for token in json
    JWT_TOKEN_LOCATION = ['headers']

    # Name of element contains token
    JWT_HEADER_NAME = 'Authorization'
    
    # Word to flag token (token string start after this)
    JWT_HEADER_TYPE = 'Bearer'
    
