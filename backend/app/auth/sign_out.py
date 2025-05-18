from flask import jsonify, Blueprint, request
from flask_jwt_extended import decode_token, get_jwt_identity, jwt_required, verify_jwt_in_request, current_user

auth_bp = Blueprint('sign_out', __name__, url_prefix='/auth')

# route for sign out
@auth_bp.route('/sign_out', methods=['POST'])
@jwt_required()
def sign_out():
    return jsonify({'message': 'Successfully signed out'})
