from flask import Blueprint

# Create a blueprint
auth_bp = Blueprint('analytics_action', __name__, url_prefix='/analytics/action')
