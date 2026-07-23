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

# Minimal offline fallback. Used only if the rates API is unreachable at boot
# so that an outage of a third-party service cannot stop the app from starting.
_FALLBACK_RATES = {
    "USD": 1.0, "EUR": 0.92, "GBP": 0.79, "JPY": 157.0, "AUD": 1.52,
    "CAD": 1.37, "CHF": 0.89, "CNY": 7.24, "SGD": 1.34, "VND": 25400.0,
}


def _load_finance_data() -> dict:
    """Fetch live USD-based exchange rates, falling back to a static table.

    The request is bounded by a timeout and every failure mode is caught: a
    boot-time network call must never be able to crash the process, otherwise
    the container fails its health check and the deploy is rolled back.
    """
    try:
        response = requests.get(
            "https://open.er-api.com/v6/latest",
            params={"base": "USD"},
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
        if data.get("rates"):
            return data
        print("[extension] Rates API returned no 'rates' key; using fallback.")
    except Exception as exc:  # noqa: BLE001 - startup must survive any failure
        print(f"[extension] Could not fetch exchange rates ({exc}); using fallback.")

    return {"result": "fallback", "base_code": "USD", "rates": dict(_FALLBACK_RATES)}


# Fetch live exchange rates relative to USD as the base currency.
FINANCE_DATA = _load_finance_data()

# Build an alphabetically sorted list of all supported currency codes.
CURRENCIES = sorted(FINANCE_DATA['rates'].keys())
