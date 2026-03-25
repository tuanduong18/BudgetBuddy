"""
Sign-out endpoint.

Token invalidation is handled client-side (the client discards the tokens).
This endpoint exists as a server acknowledgement and to satisfy any future
server-side token blocklist integration.
"""
from flask import jsonify, Blueprint
from flask_jwt_extended import jwt_required

bp = Blueprint('sign_out', __name__, url_prefix='/auth')


@bp.route('/sign_out', methods=['POST'])
@jwt_required()
def sign_out():
    """Acknowledge a sign-out request from an authenticated user.

    The client is responsible for deleting the stored tokens after receiving
    this response.

    Returns:
        200: Sign-out acknowledged.
    """
    return jsonify({'message': 'Successfully signed out'})
