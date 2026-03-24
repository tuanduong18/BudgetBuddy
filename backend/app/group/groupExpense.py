"""
Group expense and settlement endpoints.

These routes manage the lifecycle of split-bill events within a group:
  - /add:    Record a new expense paid by the current user on behalf of others.
  - /settle: Mark debts between two members as paid and record a Settlement entry.
"""
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Group, CurrencyTypes, GroupExpenseOwe, GroupExpenses, User, Settlement
from datetime import datetime
from sqlalchemy import or_

bp = Blueprint('group_expense', __name__, url_prefix='/group/groupExpense')

ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes}  # type: ignore


@bp.route('/add', methods=['POST'])
@jwt_required()
def add_group_expense():
    """Record a new group expense paid by the authenticated user (the lender).

    Each entry in ``owes`` creates a GroupExpenseOwe row. If the lender also
    appears in the owes list, their own share is immediately marked settled.
    A db.session.flush() is used after inserting the parent row so the
    auto-generated PK is available for the child owe rows before committing.

    Request JSON:
        group_id (str):            6-character group invitation code.
        amount   (float):          Total amount paid by the lender.
        currency (str):            ISO 4217 currency code.
        note     (str):            Short description of the expense.
        time     (str):            ISO 8601 date string.
        owes     (list[dict]):     Per-borrower split:
            username (str):  Borrower's username.
            amount   (float): Amount owed by this borrower.

    Returns:
        201: Expense and owe rows created.
        400: Missing/invalid field or unknown borrower username.
        404: Group not found.
        500: Database error.
    """
    data = request.get_json() or {}

    group_id = data.get('group_id')
    amount = data.get('amount')
    currency = data.get('currency')
    note = data.get('note')
    time = data.get('time')
    owes = data.get('owes')

    if not group_id or not amount or not currency or not note or not time or not owes:
        return jsonify({'message': 'Missing values'}), 400

    if currency not in ALLOWED_CURRENCIES:
        return jsonify({'message': 'Unknown currency'}), 400
    currency = CurrencyTypes(currency)  # type: ignore

    try:
        time = datetime.fromisoformat(time).date()
    except ValueError:
        return jsonify({'message': 'Invalid time format'}), 400

    group = Group.query.filter_by(group_id=group_id).first()
    if not group:
        return jsonify({'message': 'Group not found'}), 404

    try:
        new_group_expense = GroupExpenses(
            group_id=group.id,          # type: ignore
            lender_id=current_user.id,  # type: ignore
            amount=amount,              # type: ignore
            currency=currency,          # type: ignore
            note=note,                  # type: ignore
            created_at=time,            # type: ignore
        )
        db.session.add(new_group_expense)
        # Flush to generate the PK so child owe rows can reference it.
        db.session.flush()

        for entry in owes:
            borrower_username = entry.get('username')
            owe_amount = entry.get('amount')

            if borrower_username is None or owe_amount is None:
                db.session.rollback()
                return jsonify({'message': 'Invalid owes entry'}), 400

            borrower = User.query.filter_by(username=borrower_username).first()
            if borrower is None:
                db.session.rollback()
                return jsonify({'message': 'Invalid owes entry'}), 400

            owe_row = GroupExpenseOwe(
                expense_id=new_group_expense.id,  # type: ignore
                borrower_id=borrower.id,          # type: ignore
                amount=owe_amount,                # type: ignore
                currency=currency,                # type: ignore
            )
            # The lender's own share is automatically settled on creation.
            if borrower.id == current_user.id:
                owe_row.settled = True

            new_group_expense.owes.append(owe_row)

        group.history.append(new_group_expense)
        db.session.commit()
        return jsonify({'message': f'Expense added to group {group.name}'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500


@bp.route('/settle', methods=['POST'])
@jwt_required()
def settle():
    """Record a settlement payment between the current user and another member.

    Settlement logic (three steps):
      1. Mark all GroupExpenseOwe rows where current_user is the lender and
         ``payer`` is the borrower as settled.
      2. Mark all GroupExpenseOwe rows where ``payer`` is the lender and
         current_user is the borrower as settled.
      3. For any GroupExpenses whose *all* owe rows are now settled, mark the
         parent expense as settled too.

    Finally, a Settlement record is created to log the monetary transfer.

    Request JSON:
        payer    (str):   Username of the member who is paying the current user.
        group_id (str):   6-character group invitation code.
        amount   (float): Amount being transferred.
        currency (str):   ISO 4217 currency code.
        time     (str):   ISO 8601 date string.

    Returns:
        201: Settlement recorded.
        400: Missing field or invalid amount/date format.
        404: Payer user or group not found.
        500: Database error.
    """
    data = request.get_json() or {}

    payer_username = data.get('payer')
    group_id = data.get('group_id')
    amount = data.get('amount')
    currency = data.get('currency')
    time = data.get('time')

    if not payer_username or not amount or not currency or not time:
        return jsonify({'message': 'Missing values'}), 400

    try:
        time = datetime.fromisoformat(time).date()
    except ValueError:
        return jsonify({'message': 'Invalid time format'}), 400

    payer = User.query.filter_by(username=payer_username).first()
    if not payer:
        return jsonify({'message': 'User not found'}), 404

    if currency not in ALLOWED_CURRENCIES:
        return jsonify({'message': 'Unknown currency'}), 400
    currency = CurrencyTypes(currency)  # type: ignore

    try:
        amount = float(amount)
    except ValueError:
        return jsonify({'message': 'Invalid amount'}), 400

    group = Group.query.filter_by(group_id=group_id).first()
    if not group:
        return jsonify({'message': 'Group not found'}), 404

    # Step 1: Mark owe rows where current_user lent to payer → settled.
    ges = GroupExpenses.query.filter_by(group_id=group.id, lender_id=current_user.id).all()
    for ge in ges:
        for geo in ge.owes:
            if geo.borrower_id == payer.id:
                geo.settled = True
                break

    # Step 2: Mark owe rows where payer lent to current_user → settled.
    ges = GroupExpenses.query.filter_by(group_id=group.id, lender_id=payer.id).all()
    for ge in ges:
        for geo in ge.owes:
            if geo.borrower_id == current_user.id:
                geo.settled = True
                break

    # Step 3: Close any GroupExpenses where every owe row is now settled.
    ges = (
        GroupExpenses.query
        .filter(
            GroupExpenses.group_id == group.id,
            or_(
                GroupExpenses.lender_id == current_user.id,
                GroupExpenses.lender_id == payer.id,
            ),
        )
        .all()
    )
    for ge in ges:
        if all(geo.settled for geo in ge.owes):
            ge.settled = True

    try:
        settlement = Settlement(
            group_id=group.id,          # type: ignore
            payer_id=payer.id,          # type: ignore
            payee_id=current_user.id,   # type: ignore
            amount=amount,              # type: ignore
            currency=currency,          # type: ignore
            created_at=time,            # type: ignore
        )
        db.session.add(settlement)
        db.session.commit()
        return jsonify({'message': 'Added new settlement'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500
