from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import CurrencyTypes, User
from sqlalchemy import update, delete

# Create a blueprint
auth_bp = Blueprint('profile_action', __name__, url_prefix='/profile/action')

# List of allowed currencies
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes}   # type: ignore

# Route for updating currency preference
# Return status only (201, 400, 404, 500)
@auth_bp.route('/currency', methods =['POST'])
@jwt_required()
def set_profile_currency():
    # @params
    #   currency: string
    data = request.get_json()

    currency = data.get('currency')
    
    if currency is None:
        pass

    # Check and convert string to custom data type
    elif currency not in ALLOWED_CURRENCIES:
        return jsonify({ 'message': 'Unknown currency' }), 400
    currency = CurrencyTypes(currency) # type: ignore

    try:
        upd: dict={
            'currency': currency,
        }
        query = (
            update(User)
            .where(User.id == current_user.id)
            .values(**upd)
        )
        result = db.session.execute(query)
        if not result:
            return jsonify({ 'message': 'Account not found or no changes' }), 404
        db.session.commit()
        return jsonify({'message': 'Successfully updated your user profile'}), 201
    
    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500