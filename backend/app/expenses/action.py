from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Expenses, ExpenseTypes, CurrencyTypes
from datetime import datetime
from sqlalchemy import update, delete

# Create a blueprint
auth_bp = Blueprint('expense_action', __name__, url_prefix='/expenses/action')

# List of allowed expense types and currencies
ALLOWED_CATEGORIES = {e.value for e in ExpenseTypes}  # type: ignore
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes} # type: ignore

# Route to add new expense
# Return status only (201, 400, 500)
@auth_bp.route('/add', methods=['POST'])
@jwt_required()
def add_expense():
    # @params
    #   category: string
    #   optional_cat: string
    #   amount: float
    #   currency: string
    #   description: string
    #   time: string in isoformat
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

    # Convert string to custom data type
    currency = CurrencyTypes(currency) # type: ignore
    description = data.get('description')
    time = datetime.fromisoformat(data.get('time')).date()

    # Check for compulsory fields
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

# Route to update expense
# Return status only (201, 400, 404, 500)
@auth_bp.route('/update', methods=['POST'])
@jwt_required()
def update_expense():
    # @params
    #   id: int
    #   category: string
    #   optional_cat: string
    #   amount: float
    #   currency: string
    #   description: string
    #   time: string in isoformat
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

    # Convert string to custom data type
    currency = CurrencyTypes(currency) # type: ignore
    
    description = data.get('description')
    time = datetime.fromisoformat(data.get('time')).date()

    # Check for compulsory fields
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

        # Update expense based on expense id and user id
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

# Route to delete expense
# Return status only (201, 500)
@auth_bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_expense():
    # @params
    #   id: int
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


