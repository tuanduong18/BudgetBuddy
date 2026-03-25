"""
Personal expense read endpoints.

All routes are JWT-protected. Amounts are converted to the requester's
preferred currency (or SGD as default) using live exchange rates fetched
at startup in extension.py.
"""
from flask import jsonify, request, Blueprint, Response
import csv
import io
from flask_jwt_extended import jwt_required, current_user
from app.extension import db, FINANCE_DATA
from sqlalchemy import select, desc, extract
from app.models import Expenses, ExpenseTypes, CurrencyTypes
from datetime import date

bp = Blueprint('expense_data', __name__, url_prefix='/expenses/data')

# Pre-computed set for O(1) currency validation.
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes}  # type: ignore


@bp.route('/username', methods=['POST'])
@jwt_required()
def username():
    """Return the authenticated user's username.

    Returns:
        200: JSON string containing the username.
    """
    return jsonify(current_user.username)


@bp.route('/expense_types', methods=['POST'])
@jwt_required()
def expense_types():
    """Return all valid expense category names.

    Returns:
        200: JSON list of category strings.
    """
    categories = [e.value for e in ExpenseTypes]  # type: ignore
    return jsonify(categories)


@bp.route('/currency_types', methods=['POST'])
@jwt_required()
def currency_types():
    """Return all supported currency codes.

    Returns:
        200: JSON list of 3-letter currency code strings.
    """
    currencies = [c.value for c in CurrencyTypes]  # type: ignore
    return jsonify(currencies)


@bp.route('/expenses', methods=['POST'])
@jwt_required()
def expenses():
    """Return all expenses for the authenticated user.

    Amounts are converted to the target currency in this priority order:
      1. Currency explicitly provided in the request body.
      2. User's saved currency preference.
      3. Raw stored currency (no conversion) if no preference is set.

    Request JSON (optional):
        currency (str): ISO 4217 target currency code.

    Returns:
        200: JSON list of expense dicts:
            {id, category, amount, currency, description, time (ISO date)}.
        400: Unrecognised currency code.
    """
    # Fetch all expenses sorted newest-first.
    query = (
        select(Expenses)
        .filter_by(user_id=current_user.id)
        .order_by(desc(Expenses.time), desc(Expenses.id))
    )  # type: ignore
    trs = db.session.execute(query).scalars().all()

    data = request.get_json()
    trs_list = []

    # Currency conversion helper: convert `x` units of `y` to the target currency.
    def convert_amt(x, y):
        return round(float(x) / FINANCE_DATA['rates'][y] * FINANCE_DATA['rates'][currency], 2)

    if data is None or data.get('currency') is None:
        currency = current_user.currency
        if currency is None:
            # No preference set — return amounts in their original stored currency.
            trs_list = [
                {
                    "id":          trn.id,
                    "category":    trn.category.value,     # type: ignore
                    "amount":      round(float(trn.amount), 2),
                    "currency":    trn.currency.value,     # type: ignore
                    "description": trn.description,
                    "time":        trn.time.isoformat(),
                }
                for trn in trs
            ]
        else:
            currency = currency.value
            trs_list = [
                {
                    "id":          trn.id,
                    "category":    trn.category.value,                      # type: ignore
                    "amount":      convert_amt(trn.amount, trn.currency.value),  # type: ignore
                    "currency":    currency,
                    "description": trn.description,
                    "time":        trn.time.isoformat(),
                }
                for trn in trs
            ]
    else:
        currency = data.get('currency')
        if currency not in ALLOWED_CURRENCIES:
            return jsonify({'message': 'Unknown currency'}), 400

        trs_list = [
            {
                "id":          trn.id,
                "category":    trn.category.value,                      # type: ignore
                "amount":      convert_amt(trn.amount, trn.currency.value),  # type: ignore
                "currency":    currency,
                "description": trn.description,
                "time":        trn.time.isoformat(),
            }
            for trn in trs
        ]

    return jsonify(trs_list), 200


@bp.route('/updating', methods=['POST'])
@jwt_required()
def updating_expense():
    """Return a single expense record to pre-populate the update form.

    Request JSON:
        id (int): Primary key of the expense to retrieve.

    Returns:
        200: JSON dict {category, amount, currency, description, time}.
        400: Expense not found or does not belong to the user.
    """
    data = request.get_json()
    expense_id = int(data.get('id'))

    query = select(Expenses).filter_by(id=expense_id)
    trn = db.session.execute(query).scalars().one_or_none()
    if trn is None:
        return jsonify({"message": "Unauthorized"}), 400

    return jsonify({
        "category":    trn.category.value,   # type: ignore
        "amount":      trn.amount,
        "currency":    trn.currency.value,   # type: ignore
        "description": trn.description,
        "time":        trn.time.isoformat(),
    }), 200


@bp.route('/dashboard', methods=['POST'])
@jwt_required()
def newest_expenses():
    """Return dashboard summary data for the authenticated user.

    Provides the 5 most recent expenses and the total spending for today,
    both converted to the user's preferred currency (defaulting to SGD).

    Returns:
        200: JSON dict:
            {
              total    (float): Today's total spending (2 d.p.),
              currency (str):   Active display currency,
              newestExpenses (list): Up to 5 most recent expense dicts.
            }
    """
    # Fetch the 5 most recent expenses.
    query = (
        select(Expenses)
        .where(Expenses.user_id == current_user.id)
        .order_by(desc(Expenses.time), desc(Expenses.id))
        .limit(5)
    )
    trs = db.session.execute(query).scalars().all()

    # Resolve display currency; default to SGD when no preference is saved.
    currency = "SGD"
    if current_user.currency is not None:
        currency = current_user.currency.value

    # Convert any stored currency to the display currency.
    def convert_amt(x, y):
        return round(float(x) / FINANCE_DATA['rates'][y] * FINANCE_DATA['rates'][currency], 2)

    trs_list = [
        {
            "id":          trn.id,
            "category":    trn.category.value,                          # type: ignore
            "amount":      convert_amt(trn.amount, trn.currency.value), # type: ignore
            "currency":    currency,
            "description": trn.description,
            "time":        trn.time.isoformat(),
        }
        for trn in trs
    ]

    # Sum all of today's expenses to display the daily total.
    today = date.today()
    today_query = (
        select(Expenses)
        .where(Expenses.user_id == current_user.id)
        .where(extract('year',  Expenses.time) == today.year)
        .where(extract('month', Expenses.time) == today.month)
        .where(extract('day',   Expenses.time) == today.day)
    )
    today_trs = db.session.execute(today_query).scalars().all()

    total = sum(convert_amt(trn.amount, trn.currency.value) for trn in today_trs)  # type: ignore

    return jsonify({
        'total':          round(total, 2),
        'currency':       currency,
        'newestExpenses': trs_list,
    }), 200
