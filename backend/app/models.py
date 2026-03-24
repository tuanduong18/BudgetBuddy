"""
SQLAlchemy ORM models for BudgetBuddy.

Each class maps to a PostgreSQL table. Relationships are declared with
SQLAlchemy's Mapped / relationship API to enable lazy loading and
cascade deletes where appropriate.

Enum types (ExpenseTypes, CurrencyTypes) are built dynamically from the
constants defined in extension.py so that adding a new category or currency
only requires a single change.
"""
from .extension import db, CURRENCIES, EXPENSE_TYPES
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Numeric, String, Date, Text, ForeignKey, ARRAY, Boolean
from sqlalchemy import Enum as SQLEnum
from datetime import date
import enum

# Build Python enum types from the application-wide constant lists.
ExpenseTypes  = enum.Enum('ExpenseTypes', {e: e for e in EXPENSE_TYPES})
CurrencyTypes = enum.Enum('CurrencyTypes', {c: c for c in CURRENCIES})

# ---------------------------------------------------------------------------
# Association table – User ↔ Group (many-to-many)
# ---------------------------------------------------------------------------

group_members = db.Table(
    "group_members",
    db.Column("group_id", db.ForeignKey("group.id"), primary_key=True),
    db.Column("user_id",  db.ForeignKey("user.id"),  primary_key=True),
)

# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(db.Model):
    """Represents a registered BudgetBuddy account.

    Passwords are stored as bcrypt hashes (see auth/sign_up.py).
    The optional currency field stores each user's preferred display currency.
    """
    id:       Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    # Nullable so existing accounts without a preference still work.
    currency: Mapped[str] = mapped_column(SQLEnum(CurrencyTypes), nullable=True, default=CurrencyTypes.SGD)  # type: ignore

    groups: Mapped[list["Group"]] = relationship(
        "Group", secondary=group_members, back_populates="members"
    )

    # Settlements initiated by this user (outgoing payments).
    settlements_made: Mapped[list["Settlement"]] = relationship(
        "Settlement",
        foreign_keys="Settlement.payer_id",
        back_populates="payer",
        cascade="all, delete-orphan",
    )

    # Settlements received by this user (incoming payments).
    settlements_received: Mapped[list["Settlement"]] = relationship(
        "Settlement",
        foreign_keys="Settlement.payee_id",
        back_populates="payee",
        cascade="all, delete-orphan",
    )

# ---------------------------------------------------------------------------
# Expenses
# ---------------------------------------------------------------------------

class Expenses(db.Model):
    """A single personal expense entry recorded by a user."""

    id:          Mapped[int]   = mapped_column(primary_key=True)
    user_id:     Mapped[int]   = mapped_column(ForeignKey("user.id"), nullable=False)
    category:    Mapped[str]   = mapped_column(SQLEnum(ExpenseTypes), nullable=False)   # type: ignore
    amount:      Mapped[float] = mapped_column(Numeric(scale=2), nullable=False)
    currency:    Mapped[str]   = mapped_column(SQLEnum(CurrencyTypes), nullable=False)  # type: ignore
    description: Mapped[str]   = mapped_column(Text, nullable=True)
    time:        Mapped[date]  = mapped_column(Date, default=date.today(), nullable=False)

# ---------------------------------------------------------------------------
# Subscriptions (reminder model)
# ---------------------------------------------------------------------------

class Subscriptions(db.Model):
    """A recurring subscription reminder for a user.

    noti_id stores the device-side notification identifier so the app can
    cancel the scheduled push notification when the reminder is deleted.
    """
    id:         Mapped[int]  = mapped_column(primary_key=True)
    noti_id:    Mapped[str]  = mapped_column(nullable=True)
    user_id:    Mapped[int]  = mapped_column(ForeignKey("user.id"), nullable=False)
    name:       Mapped[str]  = mapped_column(String(150), nullable=False)
    start_time: Mapped[date] = mapped_column(Date, default=date.today(), nullable=True)
    end_time:   Mapped[date] = mapped_column(Date, default=date.today(), nullable=False)

# ---------------------------------------------------------------------------
# MonthlyLimit
# ---------------------------------------------------------------------------

class MonthlyLimit(db.Model):
    """A user-defined spending cap for one or more expense categories per month."""

    id:       Mapped[int]                = mapped_column(primary_key=True)
    user_id:  Mapped[int]                = mapped_column(ForeignKey("user.id"), nullable=False)
    amount:   Mapped[float]              = mapped_column(Numeric(scale=2), nullable=False)
    currency: Mapped[str]                = mapped_column(SQLEnum(CurrencyTypes), nullable=False)         # type: ignore
    # ARRAY stores multiple expense-type enum values so one limit can cover
    # several categories (e.g. Food + Utilities budget).
    types:    Mapped[list[ExpenseTypes]] = mapped_column(ARRAY(SQLEnum(ExpenseTypes)), nullable=False)   # type: ignore

# ---------------------------------------------------------------------------
# Group
# ---------------------------------------------------------------------------

class Group(db.Model):
    """A shared expense group, e.g. a household or a trip."""

    id:       Mapped[int]                   = mapped_column(primary_key=True)
    name:     Mapped[str]                   = mapped_column(String(100), nullable=False)
    # Short, human-readable code shared with others to join the group.
    group_id: Mapped[str]                   = mapped_column(String(6), nullable=False, unique=True)

    members:     Mapped[list["User"]]          = relationship("User", secondary=group_members, back_populates="groups")
    history:     Mapped[list["GroupExpenses"]] = relationship(back_populates="group", cascade="all, delete-orphan")
    settlements: Mapped[list["Settlement"]]    = relationship(back_populates="group", cascade="all, delete-orphan")

# ---------------------------------------------------------------------------
# GroupExpenses
# ---------------------------------------------------------------------------

class GroupExpenses(db.Model):
    """A single expense paid by one member (lender) on behalf of the group.

    Each row represents a bill split event. Individual borrower amounts are
    stored in the related GroupExpenseOwe rows.
    """
    id:         Mapped[int]   = mapped_column(primary_key=True)
    group_id:   Mapped[int]   = mapped_column(ForeignKey("group.id"), nullable=False)
    lender_id:  Mapped[int]   = mapped_column(ForeignKey("user.id"), nullable=False)
    amount:     Mapped[float] = mapped_column(Numeric(scale=2), nullable=False)
    currency:   Mapped[str]   = mapped_column(SQLEnum(CurrencyTypes), nullable=False)  # type: ignore
    note:       Mapped[str]   = mapped_column(String(100), nullable=True)
    # Marked True once every associated GroupExpenseOwe row has been settled.
    settled:    Mapped[bool]  = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[date]  = mapped_column(Date, default=date.today(), nullable=False)

    group: Mapped["Group"]               = relationship("Group", back_populates="history")
    owes:  Mapped[list["GroupExpenseOwe"]] = relationship(
        "GroupExpenseOwe", back_populates="expense", cascade="all, delete-orphan"
    )

# ---------------------------------------------------------------------------
# GroupExpenseOwe
# ---------------------------------------------------------------------------

class GroupExpenseOwe(db.Model):
    """The amount a single borrower owes for one GroupExpenses entry."""

    id:          Mapped[int]   = mapped_column(primary_key=True)
    expense_id:  Mapped[int]   = mapped_column(ForeignKey("group_expenses.id"))
    borrower_id: Mapped[int]   = mapped_column(ForeignKey("user.id"))
    amount:      Mapped[float] = mapped_column(Numeric(scale=2), nullable=False)
    currency:    Mapped[str]   = mapped_column(SQLEnum(CurrencyTypes), nullable=False)  # type: ignore
    settled:     Mapped[bool]  = mapped_column(Boolean, default=False, nullable=False)

    expense: Mapped["GroupExpenses"] = relationship("GroupExpenses", back_populates="owes")

# ---------------------------------------------------------------------------
# Settlement
# ---------------------------------------------------------------------------

class Settlement(db.Model):
    """Records a payment made from one member to another to clear a debt.

    A settlement does not modify individual GroupExpenseOwe rows directly;
    the settle endpoint handles that logic before creating a Settlement record.
    """
    id:         Mapped[int]   = mapped_column(primary_key=True)
    group_id:   Mapped[int]   = mapped_column(ForeignKey("group.id"), nullable=False)
    payer_id:   Mapped[int]   = mapped_column(ForeignKey("user.id"), nullable=False)
    payee_id:   Mapped[int]   = mapped_column(ForeignKey("user.id"), nullable=False)
    amount:     Mapped[float] = mapped_column(Numeric(scale=2), nullable=False)
    currency:   Mapped[str]   = mapped_column(SQLEnum(CurrencyTypes), nullable=False)  # type: ignore
    created_at: Mapped[date]  = mapped_column(Date, default=date.today(), nullable=False)

    group: Mapped["Group"] = relationship("Group", back_populates="settlements")
    payer: Mapped["User"]  = relationship("User", foreign_keys=[payer_id], back_populates="settlements_made")
    payee: Mapped["User"]  = relationship("User", foreign_keys=[payee_id], back_populates="settlements_received")