from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from sqlalchemy import select
from app.models import Transactions, TransactionTypes
from datetime import datetime

auth_bp = Blueprint('home_page', __name__, url_prefix='/home_page/data')

# route to retrieve personal data from db
@auth_bp.route('/username', methods=['POST'])
@jwt_required()
def username():
    return jsonify({
        "username":current_user.username,
    })


@auth_bp.route('/types', methods=['POST'])
@jwt_required()
def types():
    categories = [e.value for e in TransactionTypes]
    return jsonify(categories)


@auth_bp.route('/transactions', methods=['POST'])
@jwt_required()
def transactions():
    query = select(Transactions).filter_by(user_id=current_user.id).order_by(Transactions.date)     # type: ignore
    trs = db.session.execute(query).scalars().all()
    trs_list = [
        {
            "id":               trn.id,                           
            "category":         trn.category.value,                 # type: ignore
            "optional_cat":     trn.optional_cat,        
            "amount":           trn.amount,                    
            "currency":         trn.currency,                
            "description":      trn.description,          
            "date":             trn.date.isoformat(),
        } 
        for trn in trs
    ]
    return jsonify(trs_list), 200

