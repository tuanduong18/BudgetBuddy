from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user

auth_bp = Blueprint('home_page', __name__, url_prefix='/home_page/data')

# route to retrieve personal data from db
@auth_bp.route('/username', methods=['POST'])
@jwt_required()
def username():
    return jsonify({
        "username":current_user.username,
    })

