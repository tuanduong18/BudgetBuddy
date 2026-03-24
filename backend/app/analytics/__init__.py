"""
Analytics Blueprint registration.

Collects the data (read) blueprint into a list so create_app() can register
it alongside other feature modules.
"""
from .data import bp as data_bp

blueprints = [data_bp]
