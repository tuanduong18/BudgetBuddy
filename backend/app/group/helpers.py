from app.models import GroupExpenses, GroupExpenseOwe, User
from app.extension import FINANCE_DATA, db
from sqlalchemy import select, extract
from flask_jwt_extended import current_user
from datetime import date

# Helper function
# Return a list of dict
# @params
#   name: string
#   amount: float
#   currency: string
#   owe: boolean
def calulate_settlements(currency, gid, ls_of_members):
    amt_dict={}
    for mem in ls_of_members:
        amt_dict[mem] = 0.0

    # Lambda function for converting money
    convert = lambda x, y: float(x)/FINANCE_DATA['rates'][y]* FINANCE_DATA['rates'][currency]

    # retrieve all group expenses have not been settled
    all_group_expenses = GroupExpenses.query.filter_by(group_id = gid).filter_by(settled = False).all()
    
    # iterate through all group expense (ge)
    for ge in all_group_expenses:
        # if current user is the payer
        if (ge.payer_id == current_user.id):
            # find all payee
            geos = GroupExpenseOwe.query.filter_by(expense_id = ge.id).filter_by(settled = False).all()
            # iterate through all group expense owe (geo)
            for geo in geos:
                payee = User.query.filter_by(id=geo.payee_id).first()
                if not payee:
                    continue
                amt_dict[payee.username] = amt_dict[payee.username] - convert(geo.amount, geo.currency.value)
        # if current user might be the payee
        else:
            payer = User.query.filter_by(id = ge.payer_id).first()
            if not payer:
                continue
            # check if user is one of the payees
            geo = GroupExpenseOwe.query.filter_by(expense_id = ge.id).filter_by(payee_id = current_user.id).filter_by(settled = False).first()
            if not geo:
                continue
            else:
                amt_dict[payer.username] = amt_dict[payer.username] + convert(geo.amount, geo.currency.value)

        
    data = []
    # initialize amount > 0 => owe == True
    for key in amt_dict.keys():
        amt = amt_dict[key]
        if amt_dict[key] != 0.0:
            data.append({
                'name': key,
                'amount': abs(round(float(amt),2)),
                'currency': currency,
                'owe': amt > 0,
            })

    return data

