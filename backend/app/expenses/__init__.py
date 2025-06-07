from .data import auth_bp as data_bp
from .action import auth_bp as action_bp

# Create a list of blueprints
blueprints = [data_bp, action_bp]
