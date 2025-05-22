from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Expenses, ExpenseTypes, CurrencyTypes
from datetime import datetime
from sqlalchemy import update, delete

auth_bp = Blueprint('action', __name__, url_prefix='/home_page/action')

ALLOWED_CATEGORIES = {e.value for e in ExpenseTypes}  # type: ignore
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes} # type: ignore

# route to retrieve personal data from db
@auth_bp.route('/add', methods=['POST'])
@jwt_required()
def add_expense():
    
    data = request.get_json()

    category = data.get('category')
    if category not in ALLOWED_CATEGORIES:
        return jsonify({ 'message': 'Invalid expense type' }), 400
    
    category = ExpenseTypes(category) # type: ignore

    optional_cat = data.get('optional_cat')
    amount = float(data.get('amount'))

    currency = data.get('currency')
    if currency not in ALLOWED_CURRENCIES:
        return jsonify({ 'message': 'Unknown currency' }), 400

    currency = CurrencyTypes(currency) # type: ignore
    description = data.get('description')
    time = datetime.fromisoformat(data.get('time')).date()

    if not category or not amount or not currency or not time:
        return jsonify({ 'message': 'Missing values' }), 400

    try:
        new_trs = Expenses(
            user_id = current_user.id,          # type: ignore
            category = category,                # type: ignore
            optional_cat = optional_cat,        # type: ignore
            amount = amount,                    # type: ignore
            currency = currency,                # type: ignore
            description = description,          # type: ignore
            time = time,                        # type: ignore
        ) 
        db.session.add(new_trs)
        db.session.commit()
        return jsonify({'message': 'Successfully add a new Expense'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500

@auth_bp.route('/update', methods=['POST'])
@jwt_required()
def update_expense():
    data = request.get_json()

    id = data.get('id')
    category = data.get('category')
    if category not in ALLOWED_CATEGORIES:
        return jsonify({ 'message': 'Invalid Expense type' }), 400
    
    category = ExpenseTypes(category) # type: ignore

    optional_cat = data.get('optional_cat')
    amount = float(data.get('amount'))

    currency = data.get('currency')
    if currency not in ALLOWED_CURRENCIES:
        return jsonify({ 'message': 'Unknown currency' }), 400

    currency = CurrencyTypes(currency) # type: ignore
    
    description = data.get('description')
    time = datetime.fromisoformat(data.get('time')).date()

    if not category or not amount or not currency or not time:
        return jsonify({ 'message': 'Missing values' }), 400

    try:
        upd: dict = {
            'user_id':          current_user.id, 
            'category':         category,             
            'optional_cat':     optional_cat,      
            'amount':           amount,                
            'currency':         currency,                
            'description':      description,          
            'time':             time,                        
        }
        query = (
            update(Expenses)
            .where(Expenses.id == id)
            .where(Expenses.user_id == current_user.id)
            .values(**upd)
        )
        
        result = db.session.execute(query)
        if not result:
            return jsonify({ 'message': 'Expense not found or no changes' }), 404

        db.session.commit()
        return jsonify({'message': 'Successfully updated your expense'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500    


@auth_bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_expense():
    data = request.get_json()

    id = int(data.get('id'))
    try:
        query = delete(Expenses).where(Expenses.id == id)
        db.session.execute(query)
        db.session.commit()
        return jsonify({'message': 'Successfully deleted your expense'}), 201
    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500  


