"""
Group expense and settlement helper.

Computes the net amount owed between the current user and every other group
member by walking all unsettled GroupExpenses and their associated
GroupExpenseOwe entries.
"""
from app.models import GroupExpenses, GroupExpenseOwe, User
from app.extension import FINANCE_DATA
from flask_jwt_extended import current_user


def calulate_settlements(currency: str, gid: int, ls_of_members: list) -> list:
    """Compute net balances between the current user and each group member.

    For every unsettled expense:
      - If the current user is the *lender*, their borrowers owe them money
        (negative values in amt_dict mean others owe them, so we subtract).
      - If the current user is a *borrower*, they owe the lender money
        (we add the amount to the lender's entry in amt_dict).

    A positive final value in amt_dict means the current user owes that person;
    a negative value means that person owes the current user.

    Args:
        currency       (str):       ISO 4217 target currency for all amounts.
        gid            (int):       Internal primary key of the group.
        ls_of_members  (list[str]): Sorted list of all member usernames.

    Returns:
        list[dict]: One entry per member with a non-zero net balance:
            {name (str), amount (float, 2 d.p.), currency (str), owe (bool)}.
            ``owe=True`` means the current user owes that member.
    """
    # Initialise every member's net balance at zero.
    amt_dict: dict[str, float] = {mem: 0.0 for mem in ls_of_members}

    def convert(x, from_cur: str) -> float:
        """Convert amount x from from_cur to the target currency."""
        return float(x) / FINANCE_DATA['rates'][from_cur] * FINANCE_DATA['rates'][currency]

    all_group_expenses = (
        GroupExpenses.query
        .filter_by(group_id=gid)
        .filter_by(settled=False)
        .all()
    )

    for ge in all_group_expenses:
        if ge.lender_id == current_user.id:
            # Current user paid: find all borrowers who still owe them.
            geos = (
                GroupExpenseOwe.query
                .filter_by(expense_id=ge.id)
                .filter_by(settled=False)
                .all()
            )
            for geo in geos:
                borrower = User.query.filter_by(id=geo.borrower_id).first()
                if not borrower:
                    continue
                # Borrower owes the current user → decrement their balance
                # (negative means they owe current user).
                amt_dict[borrower.username] -= convert(geo.amount, geo.currency.value)
        else:
            # Current user may be a borrower in this expense.
            lender = User.query.filter_by(id=ge.lender_id).first()
            if not lender:
                continue

            geo = (
                GroupExpenseOwe.query
                .filter_by(expense_id=ge.id)
                .filter_by(borrower_id=current_user.id)
                .filter_by(settled=False)
                .first()
            )
            if not geo:
                continue

            # Current user owes the lender → increment lender's balance.
            amt_dict[lender.username] += convert(geo.amount, geo.currency.value)

    # Exclude members with a zero net balance (nothing owed in either direction).
    return [
        {
            'name':     key,
            'amount':   abs(round(float(amt_dict[key]), 2)),
            'currency': currency,
            'owe':      amt_dict[key] > 0,  # True  = current user owes this person
        }
        for key in amt_dict
        if amt_dict[key] != 0.0
    ]
