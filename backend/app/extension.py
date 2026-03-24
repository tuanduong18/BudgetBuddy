"""
Shared Flask extension singletons and application-wide constants.

Extensions are instantiated here without an app so they can be imported
throughout the codebase before create_app() is called (application factory
pattern). They are bound to the app inside create_app() via init_app().

Currency rates are fetched once at startup from the Exchange Rates API and
cached for the lifetime of the process to avoid repeated network calls.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
import requests

# --- Extension singletons ---

db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*", async_mode='eventlet')

# --- Expense categories ---

EXPENSE_TYPES = [
    "Food", "Travel", "Shopping", "Rent", "Utilities",
    "Subscription", "Insurance", "Education", "Medication",
    "Maintainance&repairs", "Entertainment", "Other",
]

# --- Currency data (fetched once at import time) ---

# Fetch live exchange rates relative to USD as the base currency.
FINANCE_DATA = requests.get("https://open.er-api.com/v6/latest", {"base": "USD"}).json()

# Build an alphabetically sorted list of all supported currency codes.
CURRENCIES = sorted(FINANCE_DATA['rates'].keys())
