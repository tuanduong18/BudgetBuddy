from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Group, CurrencyTypes, GroupExpenseOwe, GroupExpenses, User, Settlement
from datetime import datetime
from sqlalchemy import or_

# Create a blueprint
bp = Blueprint('group_expense', __name__, url_prefix='/group/groupExpense')

ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes} # type: ignore

# Route to create new group expense
# Return status only (201, 400, 404)
@bp.route('/add', methods=['POST'])
@jwt_required()
def add_group_expense():
    # @params
    #   group_id: string
    #   amount: float
    #   curency: string(3)
    #   note: string
    #   time: string in isoformat
    #   owes: list[{username(string), amount(float)}]
    data=request.get_json() or {}
    #   lender_id: current user id
    group_id = data.get('group_id')
    amount = data.get('amount')
    currency = data.get('currency')
    note = data.get('note')
    time = data.get('time')
    owes = data.get('owes')

    if not group_id or not amount or not currency or not note or not time or not owes:
        return jsonify({ 'message': 'Missing values' }), 400

    if currency not in ALLOWED_CURRENCIES:
        return jsonify({ 'message': 'Unknown currency' }), 400
    
    currency = CurrencyTypes(currency) # type: ignore

    try:
        time = datetime.fromisoformat(time).date()
    except ValueError:
        return jsonify({'message': 'Invalid time format'}), 400

    group = Group.query.filter_by(group_id = group_id).first()
    if not group:
        return jsonify({'message': 'Group not found'}), 404

    try:
        new_group_expense = GroupExpenses(
            group_id = group.id,            # type: ignore
            lender_id = current_user.id,    # type: ignore
            amount = amount,                # type: ignore
            currency = currency,            # type: ignore
            note = note,                    # type: ignore
            created_at = time,              # type: ignore
        )
        db.session.add(new_group_expense)
        db.session.flush()  # ensure new_group_expense.id is generated

        for element in owes:
            borrower_username = element.get('username')
            owe_amount = element.get('amount')

            if borrower_username is None or owe_amount is None:
                db.session.rollback()
                return jsonify({'message': 'Invalid owes entry'}), 400
            
            borrower = User.query.filter_by(username=borrower_username).first()

            if borrower is None:
                db.session.rollback()
                return jsonify({'message': 'Invalid owes entry'}), 400
            
            temp = GroupExpenseOwe(
                expense_id = new_group_expense.id,  # type: ignore
                borrower_id = borrower.id,          # type: ignore
                amount = owe_amount,                # type: ignore
                currency = currency,                # type: ignore
            )
            if borrower.id == current_user.id:
                temp.settled = True
            new_group_expense.owes.append(temp)

        group.history.append(new_group_expense)
        db.session.commit()
        return jsonify({'message': f'Expense added to group {group.name}'}), 201
    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500  

# Route to create a settlement
# Return status only (201, 400, 404)
@bp.route('/settle', methods=['POST'])
@jwt_required()
def settle():
    # @params
    # payee: current_user
    # payer: string
    # group_id: string
    # amount: float
    # currency: string
    # time: string in isoformat
    data=request.get_json() or {}
    payer = data.get('payer')
    group_id = data.get('group_id')
    amount = data.get('amount')
    currency = data.get('currency')
    time = data.get('time')

    if not payer or not amount or not currency or not time:
        return jsonify({ 'message': 'Missing values' }), 400

    try:
        time = datetime.fromisoformat(time).date()
    except ValueError:
        return jsonify({'message': 'Invalid time format'}), 400

    payer = User.query.filter_by(username = payer).first()
    if not payer:
        return jsonify({'message': 'User not found'}), 404
    
    if currency not in ALLOWED_CURRENCIES:
        return jsonify({ 'message': 'Unknown currency' }), 400
    
    currency = CurrencyTypes(currency) # type: ignore
    
    try:
        amount = float(amount)
    except ValueError:
        return jsonify({'message': 'Invalid amount'}), 400
    
    group = Group.query.filter_by(group_id = group_id).first()
    if not group:
        return jsonify({'message': 'Group not found'}), 404
    
    # Set all expenses between user and lender: settled = True
    # User as the lender
    ges = GroupExpenses.query.filter_by(group_id=group.id).filter_by(lender_id=current_user.id).all()
    for ge in ges:
        for geo in ge.owes:
            if geo.borrower_id == payer.id:
                geo.settled=True
                break
    
    # User as the borrower
    ges = GroupExpenses.query.filter_by(group_id=group.id).filter_by(lender_id=payer.id).all()
    for ge in ges:
        for geo in ge.owes:
            if geo.borrower_id == current_user.id:
                geo.settled=True
                break 
    
    # Set all expenses where all the owes have been settled: settled = True
    ges = (
        GroupExpenses.query
        .filter(
            GroupExpenses.group_id == group.id,
            or_(
                GroupExpenses.lender_id == current_user.id,
                GroupExpenses.lender_id == payer.id
            )
        )
        .all()
    )
    for ge in ges:
        temp = True
        for geo in ge.owes:
            temp = temp and geo.settled
        if temp == True:
            ge.settled = True 

    try:
        # Add new settlement
        settlement = Settlement(
            group_id = group.id,            # type: ignore
            payer_id = payer.id,            # type: ignore
            payee_id = current_user.id,     # type: ignore
            amount = amount,                # type: ignore
            currency = currency,            # type: ignore
            created_at = time               # type: ignore
        )

        db.session.add(settlement)
        db.session.commit()
        return jsonify({'message': 'Added new settlement'}), 201
    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500 
