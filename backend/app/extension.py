from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
import requests

db = SQLAlchemy()
jwt =JWTManager()
socketio = SocketIO(cors_allowed_origins="*", async_mode='eventlet')

# expense types
EXPENSE_TYPES=["Food", "Travel", "Shopping", "Rent", "Utilities", "Subscription", "Insurance", "Education", "Medication",  "Maintainance&repairs", "Entertainment",  "Other"]

# currency types
FINANCE_DATA = requests.get("https://open.er-api.com/v6/latest", {"base": "USD"}).json()
CURRENCIES = list(FINANCE_DATA['rates'].keys())
CURRENCIES.sort()
