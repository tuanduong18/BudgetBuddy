"""
Group Blueprint registration.

Collects the data (read), action (group management), and groupExpense
(expense/settlement) blueprints into a single list so create_app() can
register them alongside other feature modules.
"""
from .data import bp as data_bp
from .action import bp as action_bp
from .groupExpense import bp as exp_bp

blueprints = [data_bp, action_bp, exp_bp]
