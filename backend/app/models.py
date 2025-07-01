from .extension import db, CURRENCIES, EXPENSE_TYPES
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Numeric, String, Date, Text, ForeignKey, ARRAY, DateTime, Boolean
from sqlalchemy import Enum as SQLEnum
from datetime import date, datetime
import enum

# enum types
ExpenseTypes  = enum.Enum('ExpenseTypes', {e: e for e in EXPENSE_TYPES})
CurrencyTypes = enum.Enum('CurrencyTypes', {c: c for c in CURRENCIES})

# user - group: many to many relationship
# association table
group_members = db.Table(
    "group_members",
    db.Column("group_id", db.ForeignKey("group.id"), primary_key=True),
    db.Column("user_id",  db.ForeignKey("user.id"),  primary_key=True)
)

# table to manage accounts
class User(db.Model): 
    id:       Mapped[int] = mapped_column(primary_key = True)
    username: Mapped[str] = mapped_column(String(255), unique = True, nullable = False)
    password: Mapped[str] = mapped_column(String(255), nullable = False)
    currency: Mapped[str] = mapped_column(SQLEnum(CurrencyTypes), nullable = True, default=CurrencyTypes.SGD) # type: ignore

    # relationships
    groups:   Mapped[list["Group"]]     = relationship("Group", secondary=group_members, back_populates="members")
    
    # all settlements this user has made (paid out)
    settlements_made: Mapped[list["Settlement"]] = relationship(
        "Settlement",
        foreign_keys="Settlement.payer_id",
        back_populates="payer",
        cascade="all, delete-orphan"
    )

    # all settlements this user has received
    settlements_received: Mapped[list["Settlement"]] = relationship(
        "Settlement",
        foreign_keys="Settlement.payee_id",
        back_populates="payee",
        cascade="all, delete-orphan"
    )

# table to manage user's expenses
class Expenses(db.Model):
    id:            Mapped[int]              = mapped_column(primary_key = True)
    user_id:       Mapped[int]              = mapped_column(ForeignKey("user.id"), nullable = False)
    category:      Mapped[str]              = mapped_column(SQLEnum(ExpenseTypes), nullable=False)  # type: ignore
    optional_cat:  Mapped[str]              = mapped_column(String(100), nullable = True)
    amount:        Mapped[float]            = mapped_column(Numeric(scale=2), nullable = False)
    currency:      Mapped[str]              = mapped_column(SQLEnum(CurrencyTypes), nullable=False) # type: ignore
    description:   Mapped[str]              = mapped_column(Text, nullable = True)
    time:          Mapped[date]             = mapped_column(Date, default=date.today(), nullable=False)

# table to manage user's subscriptions' reminders    
class Subscriptions(db.Model):
    id:            Mapped[int]              = mapped_column(primary_key = True)
    noti_id:       Mapped[str]              = mapped_column(nullable = True)
    user_id:       Mapped[int]              = mapped_column(ForeignKey("user.id"), nullable = False)
    name:          Mapped[str]              = mapped_column(String(150), nullable = False)
    start_time:    Mapped[date]             = mapped_column(Date, default=date.today(), nullable=True)
    end_time:      Mapped[date]             = mapped_column(Date, default=date.today(), nullable=False)

# table to manage user's monthly limitations
class MonthlyLimit(db.Model):
    id:            Mapped[int]                  = mapped_column(primary_key = True)
    user_id:       Mapped[int]                  = mapped_column(ForeignKey("user.id"), nullable = False)
    amount:        Mapped[float]                = mapped_column(Numeric(scale=2), nullable = False)
    currency:      Mapped[str]                  = mapped_column(SQLEnum(CurrencyTypes), nullable=False)         # type: ignore
    types:         Mapped[list[ExpenseTypes]]   = mapped_column(ARRAY(SQLEnum(ExpenseTypes)), nullable=False)   # type: ignore

# table to manage groups
class Group(db.Model):
    id:             Mapped[int]                     = mapped_column(primary_key=True)
    name:           Mapped[str]                     = mapped_column(String(100), nullable=False)
    group_id:       Mapped[str]                     = mapped_column(String(6), nullable = False, unique=True)

    # relationships 
    members:        Mapped[list["User"]]            = relationship("User", secondary=group_members, back_populates="groups")
    history:        Mapped[list["GroupExpenses"]]   = relationship(back_populates="group", cascade="all, delete-orphan")
    settlements:    Mapped[list["Settlement"]]      = relationship(back_populates="group", cascade="all, delete-orphan")

# table to manage all existing debts 
class GroupExpenses(db.Model):
    id:             Mapped[int]         = mapped_column(primary_key=True)
    group_id:       Mapped[int]         = mapped_column(ForeignKey("group.id"), nullable=False)
    lender_id:      Mapped[int]         = mapped_column(ForeignKey("user.id"), nullable=False)
    amount:         Mapped[float]       = mapped_column(Numeric(scale=2), nullable=False)
    currency:       Mapped[str]         = mapped_column(SQLEnum(CurrencyTypes), nullable=False) # type: ignore
    note:           Mapped[str]         = mapped_column(String(100), nullable=True)
    settled:        Mapped[bool]        = mapped_column(Boolean, default=False, nullable=False)
    created_at:     Mapped[date]        = mapped_column(Date, default=date.today(), nullable=False)

    # relationships
    group:          Mapped["Group"]     = relationship("Group", back_populates="history")
    # multiple payees with individual amounts
    owes:        Mapped[list["GroupExpenseOwe"]] = relationship(
        "GroupExpenseOwe", back_populates="expense", cascade="all, delete-orphan"
    )

# table to manage Owe
class GroupExpenseOwe(db.Model):
    id:          Mapped[int]      = mapped_column(primary_key=True)
    expense_id:  Mapped[int]      = mapped_column(ForeignKey("group_expenses.id"))
    borrower_id: Mapped[int]      = mapped_column(ForeignKey("user.id"))
    amount:      Mapped[float]    = mapped_column(Numeric(scale=2), nullable=False)
    currency:    Mapped[str]      = mapped_column(SQLEnum(CurrencyTypes), nullable=False) # type: ignore
    settled:     Mapped[bool]     = mapped_column(Boolean, default=False, nullable=False)

    # relationships
    expense:     Mapped["GroupExpenses"] = relationship("GroupExpenses", back_populates="owes")

# table to manage all settlements
class Settlement(db.Model):
    id:          Mapped[int]        = mapped_column(primary_key=True)
    group_id:    Mapped[int]        = mapped_column(ForeignKey("group.id"), nullable=False)
    payer_id:    Mapped[int]        = mapped_column(ForeignKey("user.id"),  nullable=False)
    payee_id:    Mapped[int]        = mapped_column(ForeignKey("user.id"),  nullable=False)
    amount:      Mapped[float]      = mapped_column(Numeric(scale=2), nullable=False)
    currency:    Mapped[str]        = mapped_column(SQLEnum(CurrencyTypes), nullable=False) # type: ignore
    created_at:  Mapped[date]        = mapped_column(Date, default=date.today(), nullable=False)

    # relationships
    group:      Mapped["Group"]     = relationship("Group", back_populates="settlements")
    payer:      Mapped["User"]      = relationship("User", foreign_keys=[payer_id], back_populates="settlements_made")
    payee:      Mapped["User"]      = relationship("User", foreign_keys=[payee_id], back_populates="settlements_received")