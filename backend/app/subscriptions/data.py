from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, current_user
from app.extension import db
from app.models import Subscriptions
from sqlalchemy import select

# Create a blueprint
bp = Blueprint('subs_data', __name__, url_prefix='/subscriptions/data')

# Route for retrieving all user's reminders
# Return a list of elements
# Each element is a dict
# @params
#   id: int
#   name: string
#   noti_id: string
#   start_time: string in isoformat
#   end_time: string in isoformat
@bp.route('/all', methods=['POST'])
@jwt_required()
def subs():
    # Select all reminders of user
    query = select(Subscriptions).filter_by(user_id=current_user.id).order_by(Subscriptions.end_time)     # type: ignore
    trs = db.session.execute(query).scalars().all()

    trs_list = [
        {
            "id":           trn.id,
            "noti_id":      trn.noti_id,                           
            "name":         trn.name,          
            "start_time":   trn.start_time.isoformat(),
            "end_time":     trn.end_time.isoformat(),
        } 
        for trn in trs
    ]
    return jsonify(trs_list), 200

# Route for retrieving updating reminder
# Return a dict
# @params
#   name: string
#   noti_id: string
#   start_time: string in isoformat
#   end_time: string in isoformat
@bp.route('/updating', methods=['POST'])
@jwt_required()
def updating_subs():
    # @params
    #   id: int
    data = request.get_json()

    subs_id = int(data.get('id'))

    # Select the updating reminder
    query = select(Subscriptions).filter_by(id=subs_id)
    trn = db.session.execute(query).scalars().one_or_none()
    if trn is None:
        return jsonify({"message":"Unauthorized"}), 400
    
    return jsonify({                                                
            "name":         trn.name,
            "noti_id":      trn.noti_id,    
            "start_time":   trn.start_time.isoformat(),
            "end_time":     trn.end_time.isoformat(),
        }), 200 