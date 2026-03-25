"""
Monthly spending-limit read endpoints.

Returns limit records enriched with live spend totals and a percentage so
the frontend can display progress bars without performing any calculations.
"""
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db, FINANCE_DATA
from app.models import CurrencyTypes, MonthlyLimit
from sqlalchemy import select
from .calculator import calulate_percentage

bp = Blueprint('monthly_limit_data', __name__, url_prefix='/limits/data')

# Pre-computed set for O(1) currency validation.
ALLOWED_CURRENCIES = {c.value for c in CurrencyTypes}  # type: ignore


@bp.route('/all', methods=['POST'])
@jwt_required()
def all_monthly_limit():
    """Return all monthly limits for the authenticated user.

    Amounts are converted to the target currency using the same priority as
    the expenses endpoint:
      1. Currency explicitly provided in the request body.
      2. User's saved currency preference.
      3. Each limit's stored currency (no conversion) if no preference is set.

    Request JSON (optional):
        currency (str): ISO 4217 target currency for conversion.

    Returns:
        200 (implicit): JSON list of limit dicts:
            {id, amount, currency, percentage, total, types}.
    """
    query = select(MonthlyLimit).where(MonthlyLimit.user_id == current_user.id)
    all_limits = db.session.execute(query).scalars().all()

    limit_list = []
    data = request.get_json()

    if data is None or data.get('currency') is None:
        currency_pref = current_user.currency

        if currency_pref is None:
            # No preference: show each limit in its original stored currency.
            for element in all_limits:
                types = [val.value for val in element.types]
                stats = calulate_percentage(float(element.amount), element.currency.value, element.types)  # type: ignore
                limit_list.append({
                    'id':         element.id,
                    'amount':     element.amount,
                    'currency':   element.currency.value,  # type: ignore
                    'percentage': stats.get('percentage'),
                    'total':      stats.get('total'),
                    'types':      types,
                })
        else:
            currency = currency_pref.value
            for element in all_limits:
                types = [val.value for val in element.types]
                # Convert the stored limit amount to the user's preferred currency.
                converted = (
                    float(element.amount)
                    / FINANCE_DATA['rates'][element.currency.value]  # type: ignore
                    * FINANCE_DATA['rates'][currency]
                )
                stats = calulate_percentage(converted, currency, element.types)  # type: ignore
                limit_list.append({
                    'id':         element.id,
                    'amount':     round(converted, 2),
                    'currency':   currency,
                    'percentage': stats.get('percentage'),
                    'total':      stats.get('total'),
                    'types':      types,
                })
    else:
        currency = data.get('currency')
        if currency not in ALLOWED_CURRENCIES:
            return jsonify({'message': 'Unknown currency'}), 400

        for element in all_limits:
            types = [val.value for val in element.types]
            converted = (
                float(element.amount)
                / FINANCE_DATA['rates'][element.currency.value]  # type: ignore
                * FINANCE_DATA['rates'][currency]
            )
            stats = calulate_percentage(converted, currency, element.types)  # type: ignore
            limit_list.append({
                'id':         element.id,
                'amount':     round(converted, 2),
                'currency':   currency,
                'percentage': stats.get('percentage'),
                'total':      stats.get('total'),
                'types':      types,
            })

    return limit_list


@bp.route('/updating', methods=['POST'])
@jwt_required()
def updating_limit():
    """Return a single limit record to pre-populate the update form.

    Request JSON:
        id (int): Primary key of the monthly limit.

    Returns:
        200: JSON dict {id, amount, currency, types}.
        400: Limit not found.
    """
    data = request.get_json()
    limit_id = int(data.get('id'))

    query = select(MonthlyLimit).filter_by(id=limit_id)
    lim = db.session.execute(query).scalars().one_or_none()

    if lim is None:
        return jsonify({"message": "Unauthorized"}), 400

    types = [val.value for val in lim.types]  # type: ignore
    return jsonify({
        'id':       lim.id,
        'amount':   lim.amount,
        'currency': lim.currency.value,  # type: ignore
        'types':    types,
    }), 200