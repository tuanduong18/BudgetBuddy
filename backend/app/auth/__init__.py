"""
Auth Blueprint registration.

Collects the individual auth blueprints into a single list so create_app()
can register them all in one loop alongside other feature modules.
"""
from .sign_up import bp as sign_up_bp
from .sign_in import bp as sign_in_bp
from .sign_out import bp as sign_out_bp
from .refresh import bp as refresh_bp

blueprints = [sign_up_bp, sign_in_bp, sign_out_bp, refresh_bp]
