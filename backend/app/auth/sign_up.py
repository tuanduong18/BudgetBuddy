"""
Sign-up endpoint.

Creates a new user account after validating that the username is not already
taken. The password is stored as a bcrypt hash; the plaintext is never persisted.
"""
from flask import jsonify, request, Blueprint
from werkzeug.security import generate_password_hash
from app.extension import db
from app.models import User

bp = Blueprint('sign_up', __name__, url_prefix='/auth')


@bp.route('/sign_up', methods=['POST'])
def sign_up():
    """Register a new user account.

    Request JSON:
        username (str): Desired username (must be globally unique).
        password (str): Plaintext password; stored as a bcrypt hash.

    Returns:
        201: Account created successfully.
        400: Missing username or password.
        409: Username already taken.
        500: Unexpected database error.
    """
    data = request.get_json()

    cur_username = data.get('username')
    cur_password = data.get('password')

    if not cur_username or not cur_password:
        return jsonify({'message': 'Missing username and/or password'}), 400

    try:
        # Check for duplicate username before inserting.
        existing_user = db.session.query(User).filter_by(username=cur_username).first()
        if existing_user:
            return jsonify({'message': 'Already used username'}), 409

        hashed_password = generate_password_hash(cur_password)
        new_user = User(username=cur_username, password=hashed_password)  # type: ignore
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'Successfully signed up a new account'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500