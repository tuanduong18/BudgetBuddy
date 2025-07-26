from flask import jsonify, request, Blueprint
from werkzeug.security import check_password_hash
from app.extension import db
from app.models import User
from flask_jwt_extended import create_access_token, create_refresh_token

# Create a blueprint
bp = Blueprint('sign_in', __name__, url_prefix='/auth')

# Route for sign in
# Return status only (200, 400, 401, 501)
@bp.route('/sign_in', methods=['POST'])
def sign_in():
    # @params
    #     username: string
    #     password: string
    data = request.get_json()
    
    cur_username = data.get('username')
    cur_password = data.get('password')

    # Check for missing fields
    if not cur_username or not cur_password:
        return jsonify({ 'message': 'Missing username and/or password' }), 400

    try:
        # Find user with the same username if exists
        user = User.query.filter_by(username=cur_username).first()

        if user is not None and check_password_hash(user.password, cur_password):
            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))
          
            return jsonify(access_token=access_token, refresh_token=refresh_token)

        return jsonify({'message': 'Incorrect username and/or password'}), 401

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 501