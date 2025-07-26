from flask import jsonify, request, Blueprint
from werkzeug.security import generate_password_hash
from app.extension import db
from app.models import User

# Create a blueprint
bp = Blueprint('sign_up', __name__, url_prefix='/auth')

# Route for sign up
# Return status only (201, 400, 409, 500)
@bp.route('/sign_up', methods=['POST'])
def sign_up():
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
        # Check if user already exists
        find_username = db.session.query(User).filter_by(username = cur_username).first()

        if find_username:
            return jsonify({'message': 'Already used username'}), 409

        # Create new user
        hashed_password = generate_password_hash(cur_password)
        new_user = User(username = cur_username, password = hashed_password) # type: ignore
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Successfully signed up a new account'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500