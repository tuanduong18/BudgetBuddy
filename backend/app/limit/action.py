"""
Monthly spending-limit write endpoints (add / update / delete).
"""
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import ExpenseTypes, CurrencyTypes, MonthlyLimit
from sqlalchemy import update, delete

bp = Blueprint('monthly_limit_action', __name__, url_prefix='/limits/action')

# Pre-computed sets for O(1) input validation.
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes}   # type: ignore
ALLOWED_CATEGORIES = {e.value for e in ExpenseTypes}    # type: ignore


@bp.route('/add', methods=['POST'])
@jwt_required()
def add_limit():
    """Create a new monthly spending limit for the authenticated user.

    Request JSON:
        amount   (float):     Budget cap.
        currency (str):       ISO 4217 currency code.
        types    (list[str]): One or more expense category names to track.

    Returns:
        201: Limit created.
        400: Unknown currency or invalid expense type.
        500: Database error.
    """
    data = request.get_json()

    amount = data.get('amount')

    currency = data.get('currency')
    if currency not in ALLOWED_CURRENCIES:
        return jsonify({'message': 'Unknown currency'}), 400
    currency = CurrencyTypes(currency)  # type: ignore

    # Validate and convert each category string to its enum counterpart.
    raw_types = list(data.get('types'))
    correct_types = []
    for element in raw_types:
        if element not in ALLOWED_CATEGORIES:
            return jsonify({'message': 'Invalid expense type'}), 400
        correct_types.append(ExpenseTypes(element))  # type: ignore

    try:
        new_limit = MonthlyLimit(
            user_id=current_user.id,   # type: ignore
            amount=amount,             # type: ignore
            currency=currency,         # type: ignore
            types=correct_types,       # type: ignore
        )
        db.session.add(new_limit)
        db.session.commit()
        return jsonify({'message': 'Successfully set up a new monthly limit'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500


@bp.route('/update', methods=['POST'])
@jwt_required()
def update_limit():
    """Update an existing monthly limit owned by the authenticated user.

    Request JSON:
        id       (int):       Primary key of the limit to update.
        amount   (float):     New budget cap.
        currency (str):       New ISO 4217 currency code.
        types    (list[str]): Updated list of expense categories to track.

    Returns:
        201: Limit updated.
        400: Unknown currency or invalid expense type.
        404: Limit not found or no rows changed.
        500: Database error.
    """
    data = request.get_json()

    limit_id = data.get('id')
    amount = data.get('amount')

    currency = data.get('currency')
    if currency not in ALLOWED_CURRENCIES:
        return jsonify({'message': 'Unknown currency'}), 400
    currency = CurrencyTypes(currency)  # type: ignore

    raw_types = list(data.get('types'))
    correct_types = []
    for element in raw_types:
        if element not in ALLOWED_CATEGORIES:
            return jsonify({'message': 'Invalid expense type'}), 400
        correct_types.append(ExpenseTypes(element))  # type: ignore

    try:
        values: dict = {
            'user_id':  current_user.id,
            'amount':   amount,
            'currency': currency,
            'types':    correct_types,
        }
        query = (
            update(MonthlyLimit)
            .where(MonthlyLimit.id == limit_id)
            .where(MonthlyLimit.user_id == current_user.id)  # ownership check
            .values(**values)
        )
        result = db.session.execute(query)
        if not result:
            return jsonify({'message': 'Expense not found or no changes'}), 404

        db.session.commit()
        return jsonify({'message': 'Successfully updated your monthly limit'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500


@bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_limit():
    """Delete a monthly limit by its primary key.

    Request JSON:
        id (int): Primary key of the limit to delete.

    Returns:
        201: Limit deleted.
        500: Database error.
    """
    data = request.get_json()
    limit_id = int(data.get('id'))

    try:
        query = delete(MonthlyLimit).where(MonthlyLimit.id == limit_id)
        db.session.execute(query)
        db.session.commit()
        return jsonify({'message': 'Successfully deleted your monthly limit'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500