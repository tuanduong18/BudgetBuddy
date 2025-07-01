from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Group
from datetime import datetime
from sqlalchemy import update, delete
import string, random

# Create a blueprint
auth_bp = Blueprint('group_action', __name__, url_prefix='/group/action')

# Generate a unique group_id of specified length using uppercase letters and digits.
def generate_group_id(length: int = 6) -> str:  
    chars = string.ascii_uppercase + string.digits
    while True:
        gid = ''.join(random.choice(chars) for _ in range(length))
        # Ensure the generated ID is unique
        if not Group.query.filter_by(group_id=gid).first():
            return gid

# Route to create new group
# Return status only (201, 400)
@auth_bp.route('/create', methods=['POST'])
@jwt_required()
def create_group():
    # @params
    #   name: string
    data = request.get_json() or {}

    name = data.get('name')
    if not name:
        return jsonify({'error': 'Group name is required'}), 400
    
    # Generate a unique 6-character group ID
    gid = generate_group_id()
    group = Group(name=name, group_id=gid) # type: ignore

    # Add the creator to the group's members
    group.members.append(current_user)

    db.session.add(group)
    db.session.commit()
    
    return jsonify({'message': 'Successfully created a new group'}), 201

# Route to join a group
# Return status only (201, 400, 404)
@auth_bp.route('/join', methods=['POST'])
@jwt_required()
def join_group():
    # @params
    #   id: string
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

# Route to leave a group
# Return status only (201, 400, 404)
@auth_bp.route('/leave', methods=['POST'])
@jwt_required()
def leave_group():
    # @params
    #   id: string
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

