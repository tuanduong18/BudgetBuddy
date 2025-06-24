from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db, FINANCE_DATA
from app.models import CurrencyTypes, Group
from sqlalchemy import select

# Create a blueprint
auth_bp = Blueprint('group_data', __name__, url_prefix='/group/data')

# List of allowed currencies
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes} # type: ignore

# Route for getting all joined groups
# Return a list of elements
# Each element is a dict
# @params
#    name: string
#    gid: string
@auth_bp.route('/all', methods=['POST'])
@jwt_required()
def all_joined_groups():
    data = []
    all_groups = current_user.groups
    for group in all_groups:
        data.append({
            'name': group.name,
            'group_id' : group.group_id
        })
    return sorted(data, key=lambda x: x['name'])

# Route for getting all information in a group
# Return a dict
# @params
#    name: string
#    group_id: string
#    members: list of string
@auth_bp.route('/current', methods=['POST'])
@jwt_required()
def group_information():
    data = request.get_json() or {}
    gid = data.get('group_id')
    if not gid:
        return jsonify({'error': 'Group id is missing'}), 400
    group = Group.query.filter_by(group_id=gid).first()
    if not group:
        return jsonify({'error': 'Group not found'}), 404
    
    members=[]
    for u in group.members:
        members.append(u.username)
    members.sort()

    return  jsonify({
        'name': group.name,
        'group_id': group.group_id,
        'members': members
    }), 201

    
    
