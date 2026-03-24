"""
Subscription reminder read endpoints.

Subscriptions represent recurring expenses (e.g. Netflix, gym membership)
for which users set push-notification reminders.
"""
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Subscriptions
from sqlalchemy import select

bp = Blueprint('subs_data', __name__, url_prefix='/subscriptions/data')


@bp.route('/all', methods=['POST'])
@jwt_required()
def subs():
    """Return all subscription reminders for the authenticated user, sorted by end date.

    Returns:
        200: JSON list of reminder dicts:
            {id, noti_id, name, start_time (ISO date), end_time (ISO date)}.
    """
    query = (
        select(Subscriptions)
        .filter_by(user_id=current_user.id)
        .order_by(Subscriptions.end_time)
    )  # type: ignore
    records = db.session.execute(query).scalars().all()

    return jsonify([
        {
            "id":         rec.id,
            "noti_id":    rec.noti_id,
            "name":       rec.name,
            "start_time": rec.start_time.isoformat(),
            "end_time":   rec.end_time.isoformat(),
        }
        for rec in records
    ]), 200


@bp.route('/updating', methods=['POST'])
@jwt_required()
def updating_subs():
    """Return a single reminder's data to pre-populate the update form.

    Request JSON:
        id (int): Primary key of the subscription reminder.

    Returns:
        200: JSON dict {name, noti_id, start_time, end_time}.
        400: Reminder not found.
    """
    data = request.get_json()
    subs_id = int(data.get('id'))

    query = select(Subscriptions).filter_by(id=subs_id)
    record = db.session.execute(query).scalars().one_or_none()
    if record is None:
        return jsonify({"message": "Unauthorized"}), 400

    return jsonify({
        "name":       record.name,
        "noti_id":    record.noti_id,
        "start_time": record.start_time.isoformat(),
        "end_time":   record.end_time.isoformat(),
    }), 200