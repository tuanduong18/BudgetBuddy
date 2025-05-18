from flask import jsonify, request, Blueprint

auth_bp = Blueprint('index', __name__, url_prefix='/home_page')

# route for sign up
@auth_bp.route('/index', methods=['POST'])
def index():
    return