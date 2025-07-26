from flask import jsonify, Blueprint
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

# Create a blueprint
bp = Blueprint('refresh', __name__, url_prefix='/auth')

# Route for refreshing jwt token
# Return access token (string)
@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh = True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity, fresh=False)
    return jsonify(access_token=access_token)