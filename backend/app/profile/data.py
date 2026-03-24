"""
User profile read endpoints.
"""
from flask import jsonify, Blueprint
from flask_jwt_extended import jwt_required, current_user

# Typo fixed: was 'bluprint'.
bp = Blueprint('profile_data', __name__, url_prefix='/profile/data')


@bp.route('/currency', methods=['POST'])
@jwt_required()
def profile_currency():
    """Return the authenticated user's saved currency preference.

    Returns:
        200: JSON string of the ISO 4217 currency code if set, or empty JSON if not.
    """
    if current_user.currency is not None:
        return jsonify(current_user.currency.value)
    return jsonify()