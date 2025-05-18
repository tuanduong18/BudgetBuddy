from .sign_up import auth_bp as sign_up_bp
from .sign_in import auth_bp as sign_in_bp
from .sign_out import auth_bp as sign_out_bp

blueprints = [sign_up_bp, sign_in_bp, sign_out_bp]
