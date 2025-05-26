from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db, FINANCE_DATA
from sqlalchemy import select, desc
from app.models import Expenses, ExpenseTypes, CurrencyTypes
from datetime import date

auth_bp = Blueprint('data', __name__, url_prefix='/expenses/data')

ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes} # type: ignore

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
    query = select(Expenses).filter_by(user_id=current_user.id).order_by(desc(Expenses.time))     # type: ignore
    trs = db.session.execute(query).scalars().all()
    if trs is None:
        return jsonify({"message":"Unauthorized"}), 400
    
    data = request.get_json()
    trs_list = []
    if data is None or data.get('currency') is None:
        trs_list = [
            {
                "id":               trn.id,                           
                "category":         trn.category.value,                 # type: ignore
                "optional_cat":     trn.optional_cat,        
                "amount":           round(float(trn.amount), 2),                    
                "currency":         trn.currency.value,                 # type: ignore
                "description":      trn.description,          
                "time":             trn.time.isoformat(),
            } 
            for trn in trs
        ]
    else:
        currency = data.get('currency')
        if currency not in ALLOWED_CURRENCIES:
            return jsonify({ 'message': 'Unknown currency' }), 400
        amt = lambda x, y: round(float(x)/FINANCE_DATA['rates'][y]* FINANCE_DATA['rates'][currency], 2)
        trs_list = [
            {
                "id":               trn.id,                           
                "category":         trn.category.value,                     # type: ignore
                "optional_cat":     trn.optional_cat,        
                "amount":           amt(trn.amount, trn.currency.value),    # type: ignore
                "currency":         currency,           
                "description":      trn.description,          
                "time":             trn.time.isoformat(),
            } 
            for trn in trs
        ]
    return jsonify(trs_list), 200

@auth_bp.route('/updating', methods=['POST'])
@jwt_required()
def updating_expense():
    
    data = request.get_json()

    expense_id = int(data.get('id'))
    query = select(Expenses).filter_by(id=expense_id)
    trn = db.session.execute(query).scalars().one_or_none()
    if trn is None:
        return jsonify({"message":"Unauthorized"}), 400
    
    return jsonify({                           
            "category":         trn.category.value,                 # type: ignore
            "optional_cat":     trn.optional_cat,        
            "amount":           trn.amount,                    
            "currency":         trn.currency.value,                 # type: ignore
            "description":      trn.description,          
            "time":             trn.time.isoformat(),
        }), 200 