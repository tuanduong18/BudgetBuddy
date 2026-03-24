"""
Subscription reminder write endpoints (add / update / delete).
"""
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Subscriptions
from datetime import datetime
from sqlalchemy import update, delete

bp = Blueprint('subs_action', __name__, url_prefix='/subscriptions/action')


@bp.route('/add', methods=['POST'])
@jwt_required()
def add_subs():
    """Create a new subscription reminder for the authenticated user.

    Request JSON:
        name       (str): Human-readable subscription name (e.g. "Netflix").
        noti_id    (str): Device-side notification identifier for later cancellation.
        start_time (str): ISO 8601 start date.
        end_time   (str): ISO 8601 renewal/end date.

    Returns:
        201: Reminder created.
        400: Missing required field.
        500: Database error.
    """
    data = request.get_json()

    name = data.get('name')
    noti_id = data.get('noti_id')
    start_time = datetime.fromisoformat(data.get('start_time')).date()
    end_time = datetime.fromisoformat(data.get('end_time')).date()

    if not name or not end_time or not noti_id:
        return jsonify({'message': 'Missing values'}), 400

    try:
        new_sub = Subscriptions(
            user_id=current_user.id,  # type: ignore
            noti_id=noti_id,          # type: ignore
            name=name,                # type: ignore
            start_time=start_time,    # type: ignore
            end_time=end_time,        # type: ignore
        )
        db.session.add(new_sub)
        db.session.commit()
        return jsonify({'message': 'Successfully add a new Subscription reminder'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500


@bp.route('/update', methods=['POST'])
@jwt_required()
def update_subs():
    """Update an existing subscription reminder owned by the authenticated user.

    Request JSON:
        id         (int): Primary key of the reminder to update.
        name       (str): Updated subscription name.
        noti_id    (str): Updated device-side notification identifier.
        start_time (str): Updated ISO 8601 start date.
        end_time   (str): Updated ISO 8601 end date.

    Returns:
        201: Reminder updated.
        400: Missing required field.
        404: Reminder not found or no rows changed.
        500: Database error.
    """
    data = request.get_json()

    sub_id = data.get('id')
    noti_id = data.get('noti_id')
    name = data.get('name')
    start_time = datetime.fromisoformat(data.get('start_time')).date()
    end_time = datetime.fromisoformat(data.get('end_time')).date()

    if not name or not end_time or not noti_id:
        return jsonify({'message': 'Missing values'}), 400

    try:
        values: dict = {
            'user_id':    current_user.id,
            'noti_id':    noti_id,
            'name':       name,
            'start_time': start_time,
            'end_time':   end_time,
        }
        query = (
            update(Subscriptions)
            .where(Subscriptions.id == sub_id)
            .where(Subscriptions.user_id == current_user.id)  # ownership check
            .values(**values)
        )
        result = db.session.execute(query)
        if not result:
            return jsonify({'message': 'Subscription not found or no changes'}), 404

        db.session.commit()
        return jsonify({'message': 'Successfully renewed your subscription reminder'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500


@bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_subs():
    """Delete a subscription reminder by its primary key.

    Request JSON:
        id (int): Primary key of the reminder to delete.

    Returns:
        201: Reminder deleted.
        500: Database error.
    """
    data = request.get_json()
    sub_id = int(data.get('id'))

    try:
        query = delete(Subscriptions).where(Subscriptions.id == sub_id)
        db.session.execute(query)
        db.session.commit()
        return jsonify({'message': 'Successfully deleted your subscription reminder'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500
