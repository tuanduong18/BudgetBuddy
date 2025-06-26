from flask import Blueprint, request, jsonify, abort
from flask_jwt_extended import jwt_required, current_user
from datetime import datetime, timedelta
from app import db
from app.models import Expenses, MonthlyLimit, Subscriptions  # adjust imports as needed
from sqlalchemy import func
from app.limit.calculator import calulate_percentage

auth_bp = Blueprint('analytics_data', __name__, url_prefix='/analytics/data')

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


@auth_bp.route('/expenses', methods=['POST'])
@jwt_required()
def get_analytics_expenses():
    """
    Returns daily total expenses for the current user over a given period.

    Request JSON payload (data):
      { "period": "weekly" | "monthly",
        "referenceDate": "YYYY-MM-DD" }
    
    Response: JSON list of {date: ISO string, total: float} for each day.
    """
    data = request.get_json() or {}  # data is a dict with 'period' and 'referenceDate'
    print("🛠️ [DEBUG] /analytics/data/expenses called with payload:", data)
    # get start and end dates for the period (weekly or monthly)
    start_date, end_date = _parse_period(data)
    print(f"🛠️ [DEBUG] period window → start: {start_date}, end: {end_date}")
    print("🛠️ [DEBUG] current_user.id:", current_user and current_user.id)


    # In Expenses table, group by date, then sum amounts for each date
    rows = (
        db.session.query(
            Expenses.time.label('date'),
            func.sum(Expenses.amount).label('total')
        )
        .filter(
            Expenses.user_id == current_user.id,
            Expenses.time >= start_date,
            Expenses.time <= end_date
        )
        .group_by(Expenses.time)
        .all()
    )

    # Map existing results to a dict for quick lookup (this dict will not include days with no expenses)
    date_map = {row.date: float(row.total) for row in rows}
    print("🛠️ [DEBUG] raw expense rows:", [(r.date.isoformat(), float(r.total)) for r in rows])
    days_count = (end_date - start_date).days + 1
    output = []
    for i in range(days_count):
        # to increment to the next day, add i day(s) to start_date, starting from 0
        day = start_date + timedelta(days=i)
        # get the total for this day, default to 0.0 if not found, eg. no expense was made that day
        # return {date: total} for all days shown in the graphs
        output.append({
            'date': day.isoformat(),
            'total': date_map.get(day, 0.0)
        })

    return jsonify(output)



@auth_bp.route('/categories', methods=['POST'])
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
    print("🛠️  [DEBUG] /analytics/data/categories called with payload:", data)

    start_date, end_date = _parse_period(data)
    print(f"🛠️  [DEBUG] period window → start: {start_date}, end: {end_date}")

    # Total sum of all transactions made for this user in this period (not split by day)
    total_sum = (
        db.session.query(func.sum(Expenses.amount))
        .filter(
            Expenses.user_id == current_user.id,
            Expenses.time >= start_date,
            Expenses.time <= end_date
        )
        .scalar() or 0
    )
    print("🛠️  [DEBUG] total_sum of all expenses in window:", total_sum)

    # Find expenses in this period, group by category, and sum amounts
    rows = (
        db.session.query(
            Expenses.category,
            func.sum(Expenses.amount).label('amount')
        )
        .filter(
            Expenses.user_id == current_user.id,
            Expenses.time >= start_date,
            Expenses.time <= end_date
        )
        .group_by(Expenses.category)
        .all()
    )
    print("🛠️  [DEBUG] raw rows (category, sum):", rows)

    # Calculate percentage of total for each category
    result = []
    for category, amt in rows:
        amt_f = float(amt)
        percent = (amt_f / total_sum * 100) if total_sum else 0
        
        result.append({
            'category': category.value,
            'amount': amt_f,
            'percent': round(percent, 1)
        })
        
    return jsonify(result)



@auth_bp.route('/budgets-savings', methods=['POST'])
@jwt_required()
def get_analytics_budgets_savings():
    """
    Returns counts of monthly limits on track and subscription-based savings.

    Request JSON: same as above:
      { "period": "weekly" | "monthly",
        "referenceDate": "YYYY-MM-DD" }

    Response: {
      budgetsOnTrack: int,
      totalBudgets: int,
      savingsCompleted: int,
      totalSavings: int
    }
    """
    data = request.get_json() or {}

    # Retrieve monthly limits for this user
    limits = (
        MonthlyLimit.query
        .filter(MonthlyLimit.user_id == current_user.id)
        .all()
    )

    total_limits    = len(limits)
    # initiate counters
    on_track_budget = 0
    completed_sav   = 0

    for lim in limits:
        # calculate percentage of amount spent for this limit
        # using helper function from app.limit.calculator
        result = calulate_percentage(
            amount   = lim.amount,
            currency = lim.currency.value,
            types    = lim.types
        )
        pct = result['percentage']

        # Budget "on track" if not yet 100% spent
        if pct <= 100:
            on_track_budget += 1

        # Savings "completed" if 100% or more
        if pct >= 100:
            completed_sav += 1

    return jsonify({
        'budgetsOnTrack':   on_track_budget,
        'totalBudgets':     total_limits,
        'savingsCompleted': completed_sav,
        'totalSavings':     total_limits,   
    })

