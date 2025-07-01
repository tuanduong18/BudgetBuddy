from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db, FINANCE_DATA
from sqlalchemy import select, desc, extract
from app.models import Expenses, ExpenseTypes, CurrencyTypes
from datetime import date

# Create a blueprint
auth_bp = Blueprint('expense_data', __name__, url_prefix='/expenses/data')

# List of allowed currencies
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes} # type: ignore

# Route for getting username
# Return a single string
@auth_bp.route('/username', methods=['POST'])
@jwt_required()
def username():
    return jsonify(current_user.username)

# Route for getting all expense types
# Return a list
@auth_bp.route('/expense_types', methods=['POST'])
@jwt_required()
def expense_types():
    categories = [e.value for e in ExpenseTypes] # type: ignore
    return jsonify(categories)

# Route for getting all allowed currencies
# Return a list
@auth_bp.route('/currency_types', methods=['POST'])
@jwt_required()
def currency_types():
    currencies = [c.value for c in CurrencyTypes] # type: ignore
    return jsonify(currencies)

# Route for getting all expenses of user
# Return a list of elements
# Each element is a dict 
# @params
#   id: int                        
#   category: string
#   optional_cat: string
#   amount: float rounded to 2 decimal point
#   currency: string of length 3
#   description: string
#   time: string of date in isoformat
@auth_bp.route('/expenses', methods=['POST'])
@jwt_required()
def expenses():
    # Select all expenses and sort from newest to oldest
    query = select(Expenses).filter_by(user_id=current_user.id).order_by(desc(Expenses.time), desc(Expenses.id))     # type: ignore
    trs = db.session.execute(query).scalars().all()
    
    # @params
    #   currency: string
    data = request.get_json()
    
    # Initialize return list
    trs_list = []

    # Check if nothing is sent from frontend
    if data is None or data.get('currency') is None:
        currency = current_user.currency
        # Check if user has not set their currency preference
        if currency is None:
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
            currency = currency.value
            
            # Lambda function to convert money
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
    else:
        # retrieve currency from frontend
        currency = data.get('currency')

        # Check for allowance
        if currency not in ALLOWED_CURRENCIES:
            return jsonify({ 'message': 'Unknown currency' }), 400
        
        # Lambda function to convert money
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

# Route for getting the updating expense of user
# Return a dict
# @params                      
#   category: string
#   optional_cat: string
#   amount: float rounded to 2 decimal point
#   currency: string of length 3
#   description: string
#   time: string of date in isoformat
@auth_bp.route('/updating', methods=['POST'])
@jwt_required()
def updating_expense():
    
    data = request.get_json()
    # @params
    # id: maybe a string to link to primary key in table 'expense'

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

# Route for getting 5 newest expenses of user and total spending today
# Return a dict
# @params
#   total: float rounded to 2 decimal point
#   currency: string of length 3
#   newestExpenses: list of length 5, each is a dict 
#       @params
#           id: int                        
#           category: string
#           optional_cat: string
#           amount: float rounded to 2 decimal point
#           currency: string of length 3
#           description: string
#           time: string of date in isoformat
@auth_bp.route('/dashboard', methods = ['POST'])
@jwt_required()
def newest_expenses(): 
    # Select the newest 5 expenses 
    query = (select(Expenses)
                .where(Expenses.user_id == current_user.id)
                .order_by(desc(Expenses.time), desc(Expenses.id))
                .limit(5))
    trs = db.session.execute(query).scalars().all()

    # Default currency of the app
    currency = "SGD"
    
    # Check if user has set their currency preference
    if current_user.currency is not None:
        currency = current_user.currency.value

    # Lambda function to convert money
    amt = lambda x, y: round(float(x)/FINANCE_DATA['rates'][y]* FINANCE_DATA['rates'][currency], 2)
    
    # List of 5 newest expenses after converting
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

    # Select all expenses today
    today = date.today().day
    query = (select(Expenses)
                .where(Expenses.user_id == current_user.id)
                .where(extract('day', Expenses.time) == today))
    trs = db.session.execute(query).scalars().all() 
    
    # Calculate today's total spending
    total = float(0)
    for trn in trs:
        total += float(amt(trn.amount, trn.currency.value)) # type: ignore

    return jsonify({
        'total': round(total, 2),
        'currency': currency,
        'newestExpenses': trs_list,
    }), 200