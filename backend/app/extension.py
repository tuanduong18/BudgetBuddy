from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
import requests

db = SQLAlchemy()
jwt =JWTManager()

# expense types
EXPENSE_TYPES=["Utilities", "Subscription", "Rent", "Insurance", "Education", "Medication", "Entertainment", "Maintainance&repairs", "Travel", "Food", "Shopping", "Other"]

# currency types
FINANCE_DATA = requests.get("https://open.er-api.com/v6/latest", {"base": "USD"}).json()
CURRENCIES = list(FINANCE_DATA['rates'].keys())
CURRENCIES.sort()
