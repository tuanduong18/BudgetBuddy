"""
Group read endpoints (joined groups, group details, net owes).
"""
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.models import CurrencyTypes, Group, User
from .helpers import calulate_settlements

bp = Blueprint('group_data', __name__, url_prefix='/group/data')

# Pre-computed set for O(1) currency validation.
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes}  # type: ignore


@bp.route('/all', methods=['POST'])
@jwt_required()
def all_joined_groups():
    """Return all groups the authenticated user belongs to.

    Returns:
        200 (implicit): JSON list of {name (str), group_id (str)}, sorted by name.
    """
    result = [
        {'name': group.name, 'group_id': group.group_id}
        for group in current_user.groups
    ]
    return sorted(result, key=lambda x: x['name'])


@bp.route('/current', methods=['POST'])
@jwt_required()
def group_information():
    """Return full details of a single group including expenses and settlements.

    Settled expenses are excluded from the history list. Deleted users are
    silently skipped to avoid breaking the response for remaining members.

    Request JSON:
        group_id (str): 6-character group invitation code.

    Returns:
        201: JSON dict:
            {
              name        (str):   Group display name,
              group_id    (str):   Invitation code,
              members     (list):  Sorted list of member usernames,
              history     (list):  Unsettled expenses (newest first), each:
                {type, id, lender, amount, currency, note, time, borrowers},
              settlements (list):  All settlement records (newest first), each:
                {id, type, payer, payee, amount, currency, time}.
            }
        400: Missing group_id.
        404: Group not found.
    """
    data = request.get_json() or {}
    gid = data.get('group_id')
    if not gid:
        return jsonify({'error': 'Group id is missing'}), 400

    group = Group.query.filter_by(group_id=gid).first()
    if not group:
        return jsonify({'error': 'Group not found'}), 404

    members = sorted(u.username for u in group.members)

    # Build unsettled expense history.
    history = []
    for expense in group.history:
        if expense.settled:
            continue  # Skip fully settled expenses.

        lender = User.query.filter_by(id=expense.lender_id).first()
        if not lender:
            continue  # Lender account deleted; skip this expense.

        # Collect each borrower's outstanding share.
        borrowers = []
        for owe in expense.owes:
            borrower = User.query.filter_by(id=owe.borrower_id).first()
            if not borrower:
                continue  # Borrower account deleted; skip this owe row.
            borrowers.append({
                'name':     borrower.username,
                'amount':   owe.amount,
                'currency': owe.currency.value,
                'settled':  owe.settled,
            })
        borrowers.sort(key=lambda x: x['name'])

        history.append({
            'type':      "expense",
            'id':        expense.id,
            'lender':    lender.username,
            'amount':    round(float(expense.amount), 2),
            'currency':  expense.currency.value,
            'note':      expense.note,
            'time':      expense.created_at.isoformat(),
            'borrowers': borrowers,
        })
    history.sort(key=lambda x: (x['time'], x['id']), reverse=True)

    # Build settlement history.
    settlements = []
    for s in group.settlements:
        payer = User.query.filter_by(id=s.payer_id).first()
        payee = User.query.filter_by(id=s.payee_id).first()
        if not payer or not payee:
            continue  # Either account was deleted; skip this settlement.
        settlements.append({
            'id':       s.id,
            'type':     "settlement",
            'payer':    payer.username,
            'payee':    payee.username,
            'amount':   round(float(s.amount), 2),
            'currency': s.currency.value,
            'time':     s.created_at.isoformat(),
        })
    settlements.sort(key=lambda x: x['id'], reverse=True)

    return jsonify({
        'name':        group.name,
        'group_id':    group.group_id,
        'members':     members,
        'history':     history,
        'settlements': settlements,
    }), 201


@bp.route('/owes', methods=['POST'])
@jwt_required()
def user_owes():
    """Return the net amounts owed between the current user and all group members.

    Currency resolution priority:
      1. Explicitly provided in the request body.
      2. User's saved currency preference.
      3. SGD as the application default.

    Request JSON:
        group_id (str):        6-character group invitation code.
        currency (str, opt):   ISO 4217 target currency for display.

    Returns:
        200 (implicit): JSON list from calulate_settlements():
            {name, amount, currency, owe (True = current user owes this person)}.
        400: Missing group_id.
        404: Group not found.
    """
    data = request.get_json() or {}

    # Resolve the display currency.
    currency = 'SGD'
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

    members = sorted(u.username for u in group.members)
    return calulate_settlements(currency, group.id, members)
