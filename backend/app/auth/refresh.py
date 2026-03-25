"""
JWT refresh endpoint.

Issues a new short-lived access token using a valid long-lived refresh token.
This allows the client to maintain a session without asking the user to log in
again every 15 minutes.
"""
from flask import jsonify, Blueprint
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

bp = Blueprint('refresh', __name__, url_prefix='/auth')


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Issue a new access token using a valid refresh token.

    The new token is marked ``fresh=False`` to indicate that the user did not
    re-enter their credentials; endpoints that require freshness (e.g. password
    change) should check for this.

    Returns:
        200: JSON with a new ``access_token``.
    """
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity, fresh=False)
    return jsonify(access_token=access_token)