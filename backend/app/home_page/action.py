from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Transactions, TransactionTypes
from datetime import datetime

auth_bp = Blueprint('action', __name__, url_prefix='/home_page/action')

ALLOWED_CATEGORIES = {e.value for e in TransactionTypes}

# route to retrieve personal data from db
@auth_bp.route('/add', methods=['POST'])
@jwt_required()
def add():
    
    data = request.get_json()

    category = data.get('category')
    if category not in ALLOWED_CATEGORIES:
        return jsonify({ 'message': 'Invalid transaction type' }), 400
    
    category = TransactionTypes(category)

    optional_cat = data.get('optional_cat')
    amount = float(data.get('amount'))
    currency = data.get('currency')
    description = data.get('description')
    date = datetime.fromisoformat(data.get('date'))

    if not category or not amount or not currency or not date:
        return jsonify({ 'message': 'Missing values' }), 400

    try:
        new_trs = Transactions(
            user_id = current_user.id,          # type: ignore
            category = category,                # type: ignore
            optional_cat = optional_cat,        # type: ignore
            amount = amount,                    # type: ignore
            currency = currency,                # type: ignore
            description = description,          # type: ignore
            date = date,                        # type: ignore
        ) 
        db.session.add(new_trs)
        db.session.commit()
        return jsonify({'message': 'Successfully add a new transaction'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500

@auth_bp.route('/update', methods=['POST'])
@jwt_required()
def update():
    return

@auth_bp.route('/delete', methods=['POST'])
@jwt_required()
def delete():
    return

