"""
User profile write endpoints.

Currently manages the user's default display currency preference.
"""
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import CurrencyTypes, User
from sqlalchemy import update

bp = Blueprint('profile_action', __name__, url_prefix='/profile/action')

# Pre-computed set for O(1) currency validation.
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes}  # type: ignore


@bp.route('/currency', methods=['POST'])
@jwt_required()
def set_profile_currency():
    """Set or clear the authenticated user's preferred display currency.

    Passing ``null`` for currency clears the preference (no-op: the existing
    value is preserved via the ``pass`` branch).

    Request JSON:
        currency (str | None): ISO 4217 currency code, or null to keep existing.

    Returns:
        201: Currency preference updated.
        400: Unrecognised currency code.
        404: User record not found.
        500: Database error.
    """
    data = request.get_json()
    currency = data.get('currency')

    if currency is None:
        pass  # No currency provided; keep the existing preference unchanged.
    elif currency not in ALLOWED_CURRENCIES:
        return jsonify({'message': 'Unknown currency'}), 400
    else:
        # Convert the validated string to the enum type expected by the ORM.
        currency = CurrencyTypes(currency)  # type: ignore

    try:
        values: dict = {'currency': currency}
        query = (
            update(User)
            .where(User.id == current_user.id)
            .values(**values)
        )
        result = db.session.execute(query)
        if not result:
            return jsonify({'message': 'Account not found or no changes'}), 404

        db.session.commit()
        return jsonify({'message': 'Successfully updated your user profile'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500