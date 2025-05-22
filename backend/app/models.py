from .extension import db, CURRENCIES, EXPENSE_TYPES
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Numeric, String, Date, Text, ForeignKey
from sqlalchemy import Enum as SQLEnum
from datetime import date
import enum

# enum types
ExpenseTypes = enum.Enum('ExpenseTypes', {e: e for e in EXPENSE_TYPES})
CurrencyTypes = enum.Enum('CurrencyTypes', {c: c for c in CURRENCIES})

# table to manage accounts
class User(db.Model): 
    id:       Mapped[int] = mapped_column(primary_key = True)
    username: Mapped[str] = mapped_column(String(255), unique = True, nullable = False)
    password: Mapped[str] = mapped_column(String(255), nullable = False)

# table to manage user's expenses
class Expenses(db.Model):
    id:            Mapped[int]              = mapped_column(primary_key = True)
    user_id:       Mapped[int]              = mapped_column(ForeignKey("user.id"), nullable = False)
    category:      Mapped[str]              = mapped_column(SQLEnum(ExpenseTypes), nullable=False)  # type: ignore
    optional_cat:  Mapped[str]              = mapped_column(String(100), nullable = True)
    amount:        Mapped[float]            = mapped_column(Numeric(10, 2), nullable = False)
    currency:      Mapped[str]              = mapped_column(SQLEnum(CurrencyTypes), nullable=False) # type: ignore
    description:   Mapped[str]              = mapped_column(Text, nullable = True)
    time:          Mapped[date]             = mapped_column(Date, default=date.today(), nullable=False)
    