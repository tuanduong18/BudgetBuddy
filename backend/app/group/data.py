from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.models import CurrencyTypes, Group, User
from .helpers import calulate_settlements
# Create a blueprint
bp = Blueprint('group_data', __name__, url_prefix='/group/data')

# List of allowed currencies
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes} # type: ignore

# Route for getting all joined groups
# Return a list of elements
# Each element is a dict
# @params
#    name: string
#    gid: string
@bp.route('/all', methods=['POST'])
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
#    history: list of group expenses
#    @params
#       type: "expense"
#       id: int
#       lender: string
#       amount: float
#       currency: string(3)
#       note: string
#       time: string
#       borrowers: list of borrowers
#       @params
#           name: string
#           amount: float
#           currency: string(3)
#           settled: boolean
#    settlements: list of settlements have been made
#    @params
#       type: "settlement"
#       payer: string
#       payee: string
#       amount: float
#       currency: string
#       time: string in isoformat
@bp.route('/current', methods=['POST'])
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

    # all history
    history = []
    for e in group.history:
        # skip if already settled
        if e.settled:
            continue
        lender = User.query.filter_by(id=e.lender_id).first()
        if not lender:
            continue
        # create an array of all payees
        temp = []
        for owe in e.owes:
            borrower = User.query.filter_by(id = owe.borrower_id).first()
            # if that account no longer exist, skip
            if not borrower:
                continue
            temp.append({
                'name': borrower.username,
                'amount': owe.amount,
                'currency': owe.currency.value,
                'settled': owe.settled
            })
        temp = sorted(temp, key=lambda x: x['name']) 
        history.append({
            'type': "expense",
            'id': e.id,
            'lender': lender.username,
            'amount':round(float(e.amount), 2),
            'currency': e.currency.value,
            'note': e.note,
            'time': e.created_at.isoformat(),
            'borrowers': temp
        })
    history = sorted(history, key=lambda x: (x['time'], x['id']), reverse=True)


    # all settlements have been made
    settlements=[]
    for s in group.settlements:
        payer = User.query.filter_by(id = s.payer_id).first()
        payee = User.query.filter_by(id = s.payee_id).first()
        # skip if either one of 2 account does not exist
        if not payee or not payer:
            continue
        settlements.append({
            'id': s.id,
            'type': "settlement",
            'payer': payer.username,
            'payee': payee.username,
            'amount': round(float(s.amount), 2),
            'currency': s.currency.value,
            'time': s.created_at.isoformat(),
        })
    settlements=sorted(settlements, key=lambda x: x['id'], reverse=True)

    return  jsonify({
        'name': group.name,
        'group_id': group.group_id,
        'members': members,
        'history': history,
        'settlements': settlements
    }), 201

# Route for getting all settlement should be made in a group
# Return a list of dict
# @params
#   name: string
#   amount: float
#   currency: string
#   owe: boolean
@bp.route('/owes', methods = ['POST'])
@jwt_required()
def user_owes():
    # @params
    #   currency: string
    #   group_id: string
    data = request.get_json() or {}

    currency ='SGD'
    if current_user.currency is not None:
        currency = current_user.currency.value
    if data.get('currency') is not None and data.get('currency') in ALLOWED_CURRENCIES:
        currency = data.get('currency')

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

    data = calulate_settlements(currency, group.id, members)

    return data
