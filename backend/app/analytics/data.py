"""
Analytics read endpoints.

Returns aggregated expense data for the authenticated user over a requested
time period, used by the frontend to render charts and category breakdowns.
"""
from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import jwt_required, current_user
from datetime import datetime, timedelta
from app.extension import FINANCE_DATA, db
from app.models import Expenses
from sqlalchemy import func
from collections import defaultdict

bp = Blueprint('analytics_data', __name__, url_prefix='/analytics/data')


def _parse_period(data: dict):
    """Parse and validate the period and referenceDate fields from a request payload.

    Computes an inclusive [start_date, end_date] range:
      - 'weekly':  Monday → Sunday of the week containing referenceDate.
      - 'monthly': First → last calendar day of the month containing referenceDate.

    Args:
        data (dict): Parsed JSON request body.

    Returns:
        tuple[date, date]: (start_date, end_date), both inclusive.

    Raises:
        HTTPException (400): If period is not 'weekly'/'monthly', referenceDate is
                             absent, or referenceDate is not in YYYY-MM-DD format.
    """
    period = data.get('period')
    ref_str = data.get('referenceDate')

    if period not in ('weekly', 'monthly') or not ref_str:
        abort(400, 'Invalid period or referenceDate')

    try:
        ref_date = datetime.strptime(ref_str, '%Y-%m-%d').date()
    except ValueError:
        abort(400, 'referenceDate must be YYYY-MM-DD')

    if period == 'weekly':
        # weekday() returns 0 for Monday; subtract to get the start of the week.
        start = ref_date - timedelta(days=ref_date.weekday())
        end = start + timedelta(days=6)  # Sunday
    else:
        start = ref_date.replace(day=1)
        # Advance 28+ days to safely cross the month boundary, then snap to day=1
        # of the next month, then subtract one day to get the last day of this month.
        next_month = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
        end = next_month - timedelta(days=1)

    return start, end


@bp.route('/expenses', methods=['POST'])
@jwt_required()
def get_analytics_expenses():
    """Return daily total spending for the authenticated user over a given period.

    Amounts from different currencies are converted to the user's preferred
    currency (defaulting to SGD) using live exchange rates.

    Request JSON:
        period        (str): 'weekly' or 'monthly'.
        referenceDate (str): Any date within the desired period (YYYY-MM-DD).

    Returns:
        200: JSON list of {date (ISO str), total (float)} for every calendar
             day in the period, including days with zero spend.
    """
    data = request.get_json() or {}
    start_date, end_date = _parse_period(data)

    target_cur = current_user.currency.value if current_user.currency else "SGD"

    def convert(amount: float, from_cur: str) -> float:
        """Convert amount from from_cur to target_cur via USD as the base."""
        rates = FINANCE_DATA['rates']
        if from_cur not in rates:
            abort(500, "Missing FX rate")
        return float(amount) / rates[from_cur] * rates[target_cur]

    # Aggregate stored amounts per (day, currency) pair to minimise Python-side loops.
    rows = (
        db.session.query(
            Expenses.time.label('day'),
            Expenses.currency,
            func.sum(Expenses.amount).label('total'),
        )
        .filter(
            Expenses.user_id == current_user.id,
            Expenses.time >= start_date,
            Expenses.time <= end_date,
        )
        .group_by(Expenses.time, Expenses.currency)
        .all()
    )

    totals_by_day: dict = defaultdict(float)
    for day, currency, total in rows:
        cur = currency.value if hasattr(currency, "value") else currency
        totals_by_day[day] += convert(total, cur)

    # Build a complete day-by-day list, filling in 0.0 for days with no expenses.
    days_count = (end_date - start_date).days + 1
    output = [
        {
            "date":  (start_date + timedelta(days=i)).isoformat(),
            "total": round(totals_by_day.get(start_date + timedelta(days=i), 0.0), 2),
        }
        for i in range(days_count)
    ]
    return jsonify(output)


@bp.route('/categories', methods=['POST'])
@jwt_required()
def get_analytics_categories():
    """Return spending broken down by expense category for a given period.

    Amounts are converted to the user's preferred currency (defaulting to SGD).
    The ``percent`` field is each category's share of the period's grand total.

    Request JSON:
        period        (str): 'weekly' or 'monthly'.
        referenceDate (str): Any date within the desired period (YYYY-MM-DD).

    Returns:
        200: JSON list of {category (str), amount (float), percent (float)}
             for each category with at least one expense in the period.
    """
    data = request.get_json() or {}
    start_date, end_date = _parse_period(data)

    target_cur = current_user.currency.value if current_user.currency else "SGD"

    def convert(amount: float, from_cur: str) -> float:
        """Convert amount from from_cur to target_cur via USD as the base."""
        rates = FINANCE_DATA['rates']
        if from_cur not in rates:
            abort(500, "Missing FX rate")
        return float(amount) / rates[from_cur] * rates[target_cur]

    # Fetch all raw expense rows; grouping by category is done in Python so that
    # the conversion can be applied per-row before accumulation.
    raw = (
        db.session.query(Expenses)
        .filter(
            Expenses.user_id == current_user.id,
            Expenses.time >= start_date,
            Expenses.time <= end_date,
        )
        .all()
    )

    # Accumulate converted amounts per category.
    sums: dict = defaultdict(float)
    for trn in raw:
        cat = trn.category.value if hasattr(trn.category, "value") else trn.category  # type: ignore
        cur = trn.currency.value if hasattr(trn.currency, "value") else trn.currency  # type: ignore
        sums[cat] += convert(trn.amount, cur)

    grand_total = sum(sums.values())

    result = [
        {
            'category': cat,
            'amount':   round(amt, 2),
            # Avoid division by zero when there are no expenses in the period.
            'percent':  round(amt / grand_total * 100, 1) if grand_total else 0,
        }
        for cat, amt in sums.items()
    ]
    return jsonify(result)
