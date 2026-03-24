"""
Personal expense write endpoints (add / update / delete).

All routes are JWT-protected. Input validation is performed before any
database operation to keep the try/except blocks narrow.
"""
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Expenses, ExpenseTypes, CurrencyTypes
from datetime import datetime
from sqlalchemy import update, delete

bp = Blueprint('expense_action', __name__, url_prefix='/expenses/action')

# Pre-computed sets for O(1) input validation.
ALLOWED_CATEGORIES = {e.value for e in ExpenseTypes}  # type: ignore
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes}  # type: ignore


@bp.route('/add', methods=['POST'])
@jwt_required()
def add_expense():
    """Create a new personal expense record for the authenticated user.

    Request JSON:
        category    (str):   Must be one of the ALLOWED_CATEGORIES values.
        amount      (float): Positive monetary amount.
        currency    (str):   ISO 4217 currency code.
        description (str):   Optional free-text note.
        time        (str):   ISO 8601 date string.

    Returns:
        201: Expense created.
        400: Missing or invalid field.
        500: Database error.
    """
    data = request.get_json()

    category = data.get('category')
    if category not in ALLOWED_CATEGORIES:
        return jsonify({'message': 'Invalid expense type'}), 400
    category = ExpenseTypes(category)  # type: ignore

    amount = float(data.get('amount'))

    currency = data.get('currency')
    if currency not in ALLOWED_CURRENCIES:
        return jsonify({'message': 'Unknown currency'}), 400
    # Convert the raw string to the enum type expected by the ORM.
    currency = CurrencyTypes(currency)  # type: ignore

    description = data.get('description')
    time = datetime.fromisoformat(data.get('time')).date()

    if not category or not amount or not currency or not time:
        return jsonify({'message': 'Missing values'}), 400

    try:
        new_expense = Expenses(
            user_id=current_user.id,   # type: ignore
            category=category,         # type: ignore
            amount=amount,             # type: ignore
            currency=currency,         # type: ignore
            description=description,   # type: ignore
            time=time,                 # type: ignore
        )
        db.session.add(new_expense)
        db.session.commit()
        return jsonify({'message': 'Successfully add a new Expense'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500


@bp.route('/update', methods=['POST'])
@jwt_required()
def update_expense():
    """Update an existing expense record owned by the authenticated user.

    The WHERE clause includes both the expense id AND the current user's id
    to prevent one user from modifying another user's expenses.

    Request JSON:
        id          (int):   Primary key of the expense to update.
        category    (str):   New expense category.
        amount      (float): New amount.
        currency    (str):   New ISO 4217 currency code.
        description (str):   New optional note.
        time        (str):   New ISO 8601 date.

    Returns:
        201: Expense updated.
        400: Invalid or missing field.
        404: Expense not found or no rows changed.
        500: Database error.
    """
    data = request.get_json()

    expense_id = data.get('id')
    category = data.get('category')
    if category not in ALLOWED_CATEGORIES:
        return jsonify({'message': 'Invalid Expense type'}), 400
    category = ExpenseTypes(category)  # type: ignore

    amount = float(data.get('amount'))

    currency = data.get('currency')
    if currency not in ALLOWED_CURRENCIES:
        return jsonify({'message': 'Unknown currency'}), 400
    currency = CurrencyTypes(currency)  # type: ignore

    description = data.get('description')
    time = datetime.fromisoformat(data.get('time')).date()

    if not category or not amount or not currency or not time:
        return jsonify({'message': 'Missing values'}), 400

    try:
        values: dict = {
            'user_id':     current_user.id,
            'category':    category,
            'amount':      amount,
            'currency':    currency,
            'description': description,
            'time':        time,
        }
        query = (
            update(Expenses)
            .where(Expenses.id == expense_id)
            .where(Expenses.user_id == current_user.id)  # ownership check
            .values(**values)
        )
        result = db.session.execute(query)
        if not result:
            return jsonify({'message': 'Expense not found or no changes'}), 404

        db.session.commit()
        return jsonify({'message': 'Successfully updated your expense'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500


@bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_expense():
    """Delete an expense record by its primary key.

    Request JSON:
        id (int): Primary key of the expense to delete.

    Returns:
        201: Expense deleted.
        500: Database error.
    """
    data = request.get_json()
    expense_id = int(data.get('id'))

    try:
        query = delete(Expenses).where(Expenses.id == expense_id)
        db.session.execute(query)
        db.session.commit()
        return jsonify({'message': 'Successfully deleted your expense'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500
