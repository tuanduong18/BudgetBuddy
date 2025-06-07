from flask import jsonify, Blueprint
from flask_jwt_extended import jwt_required

# Create a blueprint
auth_bp = Blueprint('sign_out', __name__, url_prefix='/auth')

# Route for sign out
@auth_bp.route('/sign_out', methods=['POST'])
@jwt_required()
def sign_out():
    return jsonify({'message': 'Successfully signed out'})
