from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from sqlalchemy import select
from app.models import Expenses, ExpenseTypes, CurrencyTypes
from datetime import date

auth_bp = Blueprint('data', __name__, url_prefix='/expenses/data')

# route to retrieve personal data from db
@auth_bp.route('/username', methods=['POST'])
@jwt_required()
def username():
    return jsonify(current_user.username)

@auth_bp.route('/expense_types', methods=['POST'])
@jwt_required()
def expense_types():
    categories = [e.value for e in ExpenseTypes] # type: ignore
    return jsonify(categories)

@auth_bp.route('/currency_types', methods=['POST'])
@jwt_required()
def currency_types():
    currencies = [c.value for c in CurrencyTypes] # type: ignore
    return jsonify(currencies)

@auth_bp.route('/expenses', methods=['POST'])
@jwt_required()
def expenses():
    query = select(Expenses).filter_by(user_id=current_user.id).order_by(Expenses.time)     # type: ignore
    trs = db.session.execute(query).scalars().all()
    trs_list = [
        {
            "id":               trn.id,                           
            "category":         trn.category.value,                 # type: ignore
            "optional_cat":     trn.optional_cat,        
            "amount":           trn.amount,                    
            "currency":         trn.currency.value,                 # type: ignore
            "description":      trn.description,          
            "time":             trn.time.isoformat(),
        } 
        for trn in trs
    ]
    return jsonify(trs_list), 200

