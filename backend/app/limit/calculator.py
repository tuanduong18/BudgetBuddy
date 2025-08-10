from app.models import Expenses
from app.extension import FINANCE_DATA, db
from sqlalchemy import select, extract
from flask_jwt_extended import current_user
from datetime import date

# Helper function
# Return a dict
# @params
#   percentage: float rounded to 2 decimal points
#   total: float rounded to 2 decimal points
def calulate_percentage(amount, currency, types):
    # Get today's month
    today = date.today()

    # Get a list of string (each string is an expense type)
    raw_types = [val for val in types]

    # Lambda function for converting money
    convert = lambda x, y: float(x)/FINANCE_DATA['rates'][y]* FINANCE_DATA['rates'][currency]

    # Initialize total amount
    total = float(0)

    # Select all expenses this month so far
    query = (select(Expenses)
        .where(Expenses.user_id==current_user.id)
        .where(Expenses.category.in_(raw_types))   
        .where(extract('year', Expenses.time) == today.year)
        .where(extract('month', Expenses.time) == today.month))
    trs = db.session.execute(query).scalars().all()
    
    # Adding up
    for trn in trs:
        total += convert(trn.amount, trn.currency.value)    # type: ignore
    
    percentage = round(float(total/amount)* 100, 2)
    total = round(total, 2)
    return {
        'percentage': percentage,
        'total': total
    }

