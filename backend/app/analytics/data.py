from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import jwt_required, current_user
from datetime import datetime, timedelta
from app.extension import FINANCE_DATA, db
from app.models import Expenses
from sqlalchemy import func
from collections import defaultdict

bp = Blueprint('analytics_data', __name__, url_prefix='/analytics/data')

# helper for 2 functions below
# find the time period the visualisation will show (a week or a month)
def _parse_period(data):

    # Extract period type and reference date string from payload
    period = data.get('period')
    ref_str = data.get('referenceDate')

    # Validate: period must be 'weekly' or 'monthly', and referenceDate must be provided
    if period not in ('weekly', 'monthly') or not ref_str:
        abort(400, 'Invalid period or referenceDate')

    # Convert referenceDate to a date object. strptime() converts str -> datetime obj
    try:
        ref_date = datetime.strptime(ref_str, '%Y-%m-%d').date()
    except ValueError:
        abort(400, 'referenceDate must be YYYY-MM-DD')

    if period == 'weekly':
        # datetime.weekday() returns an integer representing the day of the week Monday == 0, Tuesday == 1,..., Sunday == 6
        # To find the Monday of that week, subtract weekday() days from ref_date
        start = ref_date - timedelta(days=ref_date.weekday())

        # A week spans 7 days: Monday through Sunday, so add 6 days to start
        end = start + timedelta(days=6)

    else:  # monthly
        # day=1 gives the first day of the month, so start is day=1
        start = ref_date.replace(day=1)
        # to find the last day of the month, 
        # we set day=28 for safe lower bound (since all months have at least 28 days),
        # then add 4 days to ensure even if the month has 31 days, we still move to the next month,
        # then set day=1 to get the first day of next month, and subtract 1 to get the last day of previous month(the month we need)
        next_month = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
        end = next_month - timedelta(days=1)

    return start, end


@bp.route('/expenses', methods=['POST'])
@jwt_required()
def get_analytics_expenses():
    """
    Returns daily total expenses for the current user over a given period.

    Request JSON payload (data):
      { "period": "weekly" | "monthly",
        "referenceDate": "YYYY-MM-DD" }
    
    Response: JSON list of {date: ISO string, total: float} for each day.
    """
    data = request.get_json() or {}

    start_date, end_date = _parse_period(data)

    # determine target currency
    target_cur = current_user.currency.value if current_user.currency else "SGD"

    # conversion helper
    def convert(amount: float, from_cur: str) -> float:
        rates = FINANCE_DATA['rates']
        if from_cur not in rates:
            abort(500, "Missing FX rate")
        # first to USD (base), then to target
        return float(amount) / rates[from_cur] * rates[target_cur]

    # fetch every expense row in the window
    rows = (
        db.session
        .query(
            Expenses.time.label('day'),  # YYYY-MM-DD
            Expenses.currency,
            func.sum(Expenses.amount).label('total')
        )
        .filter(
            Expenses.user_id == current_user.id,
            Expenses.time >= start_date,
            Expenses.time <= end_date
        )
        .group_by(Expenses.time, Expenses.currency)
        .all()
    )

    totals_by_day = defaultdict(float)
    for day, currency, total in rows:
        cur = currency.value if hasattr(currency, "value") else currency
        totals_by_day[day] += convert(total, cur)

    # 5) Build full list (one entry per calendar day)
    days_count = (end_date - start_date).days + 1
    output = []
    for i in range(days_count):
        day = start_date + timedelta(days=i)
        output.append({
            "date": day.isoformat(),
            # round at the very end
            "total": round(totals_by_day.get(day, 0.0), 2)
        })

    return jsonify(output)

@bp.route('/categories', methods=['POST'])
@jwt_required()
def get_analytics_categories():
    """
    Returns expense breakdown by category for the current user.

    Request JSON: same as /expenses:
      { "period": "weekly" | "monthly",
        "referenceDate": "YYYY-MM-DD" }

    Response: list of {category: str, amount: float, percent: float}.
    """
    data = request.get_json() or {}

    start_date, end_date = _parse_period(data)

    # determine target currency
    target_cur = current_user.currency.value if current_user.currency else "SGD"

    # conversion helper
    def convert(amount: float, from_cur: str) -> float:
        rates = FINANCE_DATA['rates']
        if from_cur not in rates:
            abort(500, "Missing FX rate")
        # first to USD (base), then to target
        return float(amount) / rates[from_cur] * rates[target_cur]

    # fetch **all** raw expenses in the date window
    raw = (
        db.session.query(Expenses)
        .filter(
            Expenses.user_id == current_user.id,
            Expenses.time >= start_date,
            Expenses.time <= end_date
        )
        .all()
    )

    # group into a dict: category → total_converted_amount
    sums = defaultdict(float)
    for trn in raw:
        cat = trn.category.value if hasattr(trn.category, "value") else trn.category    # type: ignore
        cur = trn.currency.value if hasattr(trn.currency, "value") else trn.currency    # type: ignore
        amt_converted = convert(trn.amount, cur)
        sums[cat] += amt_converted

    # compute grand total
    grand = sum(sums.values())

    # build result list
    result = []
    for cat, amt in sums.items():
        percent = (amt / grand * 100) if grand else 0
        result.append({
            'category': cat,
            'amount':   round(amt,   2),
            'percent':  round(percent, 1)
        })

    return jsonify(result)

