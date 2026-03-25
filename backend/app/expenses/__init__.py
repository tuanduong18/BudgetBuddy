"""
Expenses Blueprint registration.

Collects the data (read) and action (write) blueprints into a single list
so create_app() can register them alongside other feature modules.
"""
from .data import bp as data_bp
from .action import bp as action_bp

blueprints = [data_bp, action_bp]
