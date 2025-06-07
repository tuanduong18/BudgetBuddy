from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Subscriptions
from datetime import datetime
from sqlalchemy import update, delete

# Create a blueprint
auth_bp = Blueprint('subs_action', __name__, url_prefix='/subscriptions/action')

# Route for adding new reminder
# Return only status (201, 400, 500)
@auth_bp.route('/add', methods=['POST'])
@jwt_required()
def add_subs():
    # @params
    #   name: string
    #   noti_id: string
    #   start_time: string in isoformat
    #   end_time: string in isoformat
    data = request.get_json()

    name = data.get('name')
    noti_id = data.get('noti_id')

    # Convert to date object
    start_time = datetime.fromisoformat(data.get('start_time')).date()
    end_time = datetime.fromisoformat(data.get('end_time')).date()

    if not name or not end_time or not noti_id:
        return jsonify({ 'message': 'Missing values' }), 400
    try:
        new_subs = Subscriptions(
            user_id = current_user.id,      # type: ignore
            noti_id = noti_id,              # type: ignore
            name = name,                    # type: ignore
            start_time=start_time,          # type: ignore
            end_time=end_time,              # type: ignore
        )
        db.session.add(new_subs)
        db.session.commit()
        return jsonify({'message': 'Successfully add a new Subscription reminder'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500

# Route for updating reminder
# Return only status (201, 400, 404, 500)    
@auth_bp.route('/update', methods=['POST'])
@jwt_required()
def update_subs():
    # @params
    #   id: int
    #   name: string
    #   noti_id: string
    #   start_time: string in isoformat
    #   end_time: string in isoformat
    data = request.get_json()

    id = data.get('id')
    noti_id = data.get('noti_id')
    name = data.get('name')

    # Convert to date object
    start_time = datetime.fromisoformat(data.get('start_time')).date()
    end_time = datetime.fromisoformat(data.get('end_time')).date()

    if not name or not end_time or not noti_id:
        return jsonify({ 'message': 'Missing values' }), 400
    try:
        upd: dict = {
            'user_id':      current_user.id,
            'noti_id':      noti_id,      
            'name':         name,                    
            'start_time':   start_time,         
            'end_time':     end_time,             
        }
        query = (
            update(Subscriptions)
            .where(Subscriptions.id == id)
            .where(Subscriptions.user_id == current_user.id)
            .values(**upd)
        )

        result = db.session.execute(query)
        if not result:
            return jsonify({ 'message': 'Subscription not found or no changes' }), 404

        db.session.commit()
        return jsonify({'message': 'Successfully renewed your subscription reminder'}), 201

    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500

# Route for deleting reminder
# Return only status (201, 500)    
@auth_bp.route('/delete', methods=['POST'])
@jwt_required()
def delete_subs():
    # @params
    #   id: int
    data = request.get_json()

    id = int(data.get('id'))
    try:
        query = delete(Subscriptions).where(Subscriptions.id == id)
        db.session.execute(query)
        db.session.commit()
        return jsonify({'message': 'Successfully deleted your subscription reminder'}), 201
    except Exception as e:
        print("DB Error:", e)
        db.session.rollback()
        return jsonify({'message': 'Database error'}), 500  

