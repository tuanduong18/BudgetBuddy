from .extension import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Numeric, String, Date, Text, ForeignKey, Enum
from datetime import date
import enum
# table to manage accounts
class User(db.Model): 
    id:       Mapped[int] = mapped_column(primary_key = True)
    username: Mapped[str] = mapped_column(String(255), unique = True, nullable = False)
    password: Mapped[str] = mapped_column(String(255), nullable = False)

# custom data type
class ExpenseTypes(enum.Enum):
    UTILITIES              = "Utilities"
    SUBSCRIPTIONS          = "Subscriptions"
    RENT                   = "Rent"
    INSURANCE              = "Insurance"
    EDUCATION              = "Education"
    ENTERTAINMENT          = "Entertainment"
    MAINTENANCE_REPAIRS    = "Maintenance and repairs"
    TRAVEL                 = "Travel"
    FOOD                   = "Food"
    SHOPPING               = "Shopping"
    OTHER                  = "Other"

class Expenses(db.Model):
    id:            Mapped[int]              = mapped_column(primary_key = True)
    user_id:       Mapped[int]              = mapped_column(ForeignKey("user.id"), nullable = False)
    category:      Mapped[str]              = mapped_column(Enum(ExpenseTypes), nullable=False)
    optional_cat:  Mapped[str]              = mapped_column(String(100), nullable = True)
    amount:        Mapped[float]            = mapped_column(Numeric(10, 2), nullable = False)
    currency:      Mapped[str]              = mapped_column(String(3), nullable=False)
    description:   Mapped[str]              = mapped_column(Text, nullable = True)
    time:          Mapped[date]             = mapped_column(Date, default=date.today(), nullable=False)
    