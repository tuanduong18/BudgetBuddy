"""
Group management write endpoints (create / join / leave).
"""
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Group
import string
import random

bp = Blueprint('group_action', __name__, url_prefix='/group/action')


def generate_group_id(length: int = 6) -> str:
    """Generate a collision-free alphanumeric group invitation code.

    Retries until a code that does not already exist in the database is found.
    The code consists of uppercase letters and digits, giving 36^6 ≈ 2.2 billion
    unique possibilities, making collisions extremely unlikely.

    Args:
        length (int): Desired code length. Defaults to 6.

    Returns:
        str: A unique group invitation code of the specified length.
    """
    chars = string.ascii_uppercase + string.digits
    while True:
        gid = ''.join(random.choice(chars) for _ in range(length))
        if not Group.query.filter_by(group_id=gid).first():
            return gid


@bp.route('/create', methods=['POST'])
@jwt_required()
def create_group():
    """Create a new expense-sharing group and add the creator as a member.

    Request JSON:
        name (str): Display name for the group.

    Returns:
        201: Group created.
        400: Missing group name.
    """
    data = request.get_json() or {}

    name = data.get('name')
    if not name:
        return jsonify({'error': 'Group name is required'}), 400

    gid = generate_group_id()
    group = Group(name=name, group_id=gid)  # type: ignore
    group.members.append(current_user)

    db.session.add(group)
    db.session.commit()
    return jsonify({'message': 'Successfully created a new group'}), 201


@bp.route('/join', methods=['POST'])
@jwt_required()
def join_group():
    """Add the authenticated user to an existing group by invitation code.

    Request JSON:
        id (str): 6-character group invitation code.

    Returns:
        201: Successfully joined.
        400: Missing code or user already a member.
        404: No group with that code.
    """
    data = request.get_json() or {}

    gid = data.get('id')
    if not gid:
        return jsonify({'error': 'Group id is required'}), 400

    group = Group.query.filter_by(group_id=gid).first()
    if not group:
        return jsonify({'error': 'Group not found'}), 404

    if current_user in group.members:
        return jsonify({'error': 'Already a member of this group'}), 400

    group.members.append(current_user)
    db.session.commit()
    return jsonify({'message': f"Successfully joined group {group.name}"}), 201


@bp.route('/leave', methods=['POST'])
@jwt_required()
def leave_group():
    """Remove the authenticated user from a group.

    Request JSON:
        id (str): 6-character group invitation code.

    Returns:
        201: Successfully left.
        400: Missing code or user is not a member.
        404: No group with that code.
    """
    data = request.get_json() or {}

    gid = data.get('id')
    if not gid:
        return jsonify({'error': 'Group id is required'}), 400

    group = Group.query.filter_by(group_id=gid).first()
    if not group:
        return jsonify({'error': 'Group not found'}), 404

    if current_user not in group.members:
        return jsonify({'error': 'Not a member of this group'}), 400

    group.members.remove(current_user)
    db.session.commit()
    return jsonify({'message': f"Successfully left group {group.name}"}), 201
