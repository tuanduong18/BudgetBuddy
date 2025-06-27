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
        # if current user is the lender
        if (ge.lender_id == current_user.id):
            # find all borrowers
            geos = GroupExpenseOwe.query.filter_by(expense_id = ge.id).filter_by(settled = False).all()
            # iterate through all group expense owe (geo)
            for geo in geos:
                borrower = User.query.filter_by(id=geo.borrower_id).first()
                if not borrower:
                    continue
                amt_dict[borrower.username] = amt_dict[borrower.username] - convert(geo.amount, geo.currency.value)
        # if current user might be the borrower
        else:
            lender = User.query.filter_by(id = ge.lender_id).first()
            if not lender:
                continue
            # check if user is one of the borrowers
            geo = (GroupExpenseOwe.query
                   .filter_by(expense_id = ge.id)
                   .filter_by(borrower_id = current_user.id)
                   .filter_by(settled = False).first())
            if not geo:
                continue
            else:
                amt_dict[lender.username] = amt_dict[lender.username] + convert(geo.amount, geo.currency.value)

        
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

