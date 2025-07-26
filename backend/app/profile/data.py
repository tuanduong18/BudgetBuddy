from flask import jsonify, Blueprint
from flask_jwt_extended import jwt_required, current_user

# Create a bluprint
bp = Blueprint('profile_data', __name__, url_prefix='/profile/data')

# Route for retrieving user's currency preference
# Return a string or nothing
@bp.route('/currency', methods =['POST'])
@jwt_required()
def profile_currency():
    if current_user.currency is not None:
        return jsonify(current_user.currency.value)
    return jsonify()