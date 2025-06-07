from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db, FINANCE_DATA
from app.models import CurrencyTypes, MonthlyLimit
from sqlalchemy import select
from .calculator import calulate_percentage

# Create a blueprint
auth_bp = Blueprint('monthly_limit_data', __name__, url_prefix='/limits/data')

# List of allowed currencies
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes} # type: ignore

# Route for getting all monthly limit
# Return a list of elements
# Each element is a dict
# @params
#    id: int
#    amount: float rounded to 2 decimal point 
#    currency: string
#    percentage: float rounded to 2 decimal point
#    total: float rounded to 2 decimal point
#    types: list of string (each string is an expense type)      
@auth_bp.route('/all', methods=['POST'])
@jwt_required()
def all_monthly_limit():
    # Select all monthly limit of user
    query = select(MonthlyLimit).where(MonthlyLimit.user_id==current_user.id) 
    all_limits = db.session.execute(query).scalars().all()

    # Initialize return list
    limit_list = []

    # @params
    #   currency: string
    data = request.get_json()

    # Check if receive anything from frontend
    if data is None or data.get('currency') is None:
        # Check if user has set currency preference
        currency = current_user.currency
        if currency is None:
            for element in all_limits:
                # Create list of string (each is an expense type)
                types=[val.value for val in element.types]
                
                # Calculation performed by helper function
                temp = calulate_percentage(float(element.amount), element.currency.value, element.types)     # type: ignore
                limit_list.append({
                    'id':           element.id,
                    'amount':       element.amount,
                    'currency':     element.currency.value,  # type: ignore
                    'percentage':   temp.get('percentage'),
                    'total':        temp.get('total'),
                    'types':        types
                })
        else:
            currency = currency.value
            for element in all_limits:
                # Create list of string (each is an expense type)
                types=[val.value for val in element.types]

                # calculate new value of each element based on currency
                value = float(element.amount)/FINANCE_DATA['rates'][element.currency.value]* FINANCE_DATA['rates'][currency] # type: ignore
                
                # Calculation performed by helper function
                temp = calulate_percentage(value, currency, element.types)     # type: ignore
                limit_list.append({
                    'id':           element.id,
                    'amount':       round(value,2),
                    'currency':     currency,
                    'percentage':   temp.get('percentage'),
                    'total':        temp.get('total'),
                    'types':        types
                })
    else:
        # Retrieve currency from frontend
        currency = data.get('currency')
        if currency not in ALLOWED_CURRENCIES:
            return jsonify({ 'message': 'Unknown currency' }), 400
        
        for element in all_limits:
            # Create list of string (each is an expense type)
            types=[val.value for val in element.types]

            # calculate new value of each element based on currency
            value = float(element.amount)/FINANCE_DATA['rates'][element.currency.value]* FINANCE_DATA['rates'][currency] # type: ignore

            # Calculation performed by helper function
            temp = calulate_percentage(value, currency, element.types)     # type: ignore
            limit_list.append({
                'id':           element.id,
                'amount':       round(value,2),
                'currency':     currency,
                'percentage':   temp.get('percentage'),
                'total':        temp.get('total'),
                'types':        types
            })
            
    return limit_list

# Route for getting updating monthly limit
# Return a dict
# @params
#    id: int
#    amount: float rounded to 2 decimal point 
#    currency: string
#    types: list of string (each string is an expense type)  
@auth_bp.route('/updating', methods=['POST'])
@jwt_required()
def updating_limit():
    # @params
    #   id: int
    data = request.get_json()
    limit_id = int(data.get('id'))
    
    # Select the monthly limit with the same id
    query = select(MonthlyLimit).filter_by(id=limit_id)
    lim = db.session.execute(query).scalars().one_or_none()

    # Convert to string list
    types=[val.value for val in lim.types] # type: ignore
    if lim is None:
        return jsonify({"message":"Unauthorized"}), 400
    
    return jsonify({                           
            'id':           lim.id,
            'amount':       lim.amount,
            'currency':     lim.currency.value,     #type: ignore
            'types':        types,
        }), 200 