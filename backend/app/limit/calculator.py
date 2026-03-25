"""
Spending-limit percentage calculator.

Computes how much of a monthly limit has been consumed so the frontend can
render progress bars. This is a pure helper module with no routes.
"""
from app.models import Expenses
from app.extension import FINANCE_DATA, db
from sqlalchemy import select, extract
from flask_jwt_extended import current_user
from datetime import date


def calulate_percentage(amount: float, currency: str, types) -> dict:
    """Calculate the current month's total spend and its percentage of a limit.

    Fetches all expenses for the authenticated user in the current calendar
    month whose category matches one of the given types, converts them to
    the target currency, and computes the fraction of ``amount`` used.

    Args:
        amount   (float): The limit cap in ``currency`` units.
        currency (str):   ISO 4217 target currency code for the result.
        types:           Iterable of ExpenseTypes enum values to include.

    Returns:
        dict: {
            'percentage' (float): Spend as a percentage of amount (2 d.p.),
            'total'      (float): Absolute spend in ``currency`` (2 d.p.).
        }
    """
    today = date.today()

    # Convert individual expense amounts to the target currency.
    def convert(x, y: str) -> float:
        return float(x) / FINANCE_DATA['rates'][y] * FINANCE_DATA['rates'][currency]

    # Query all matching expenses in the current month.
    query = (
        select(Expenses)
        .where(Expenses.user_id == current_user.id)
        .where(Expenses.category.in_(list(types)))
        .where(extract('year',  Expenses.time) == today.year)
        .where(extract('month', Expenses.time) == today.month)
    )
    trs = db.session.execute(query).scalars().all()

    total = sum(convert(trn.amount, trn.currency.value) for trn in trs)  # type: ignore

    percentage = round(float(total / amount) * 100, 2)
    total = round(total, 2)

    return {
        'percentage': percentage,
        'total':      total,
    }
