from .extension import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Numeric, String, DateTime, Text, ForeignKey, Enum
from datetime import datetime
import enum
# table to manage accounts
class User(db.Model): 
    id:       Mapped[int] = mapped_column(primary_key = True)
    username: Mapped[str] = mapped_column(String(255), unique = True, nullable = False)
    password: Mapped[str] = mapped_column(String(255), nullable = False)

# custom data type
class TransactionTypes(enum.Enum):
    UTILITIES              = "utilities"
    SUBSCRIPTIONS          = "subscriptions"
    RENT                   = "rent"
    INSURANCE              = "Insurance"
    EDUCATION              = "education"
    ENTERTAINMENT          = "entertainment"
    MAINTENANCE_REPAIRS    = "maintenance and repairs"
    TRAVEL                 = "travel"
    MEALS                  = "meals"
    SHOPPING               = "shopping"
    OTHER                  = "other"

class Transactions(db.Model):
    id:            Mapped[int]              = mapped_column(primary_key = True)
    user_id:       Mapped[int]              = mapped_column(ForeignKey("user.id"), nullable = False)
    category:      Mapped[str]              = mapped_column(Enum(TransactionTypes), nullable=False)
    optional_cat:  Mapped[str]              = mapped_column(String(100), nullable = True)
    amount:        Mapped[float]            = mapped_column(Numeric(10, 2), nullable = False)
    currency:      Mapped[str]              = mapped_column(String(3), nullable=False)
    description:   Mapped[str]              = mapped_column(Text, nullable = True)
    date:          Mapped[datetime]         = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    