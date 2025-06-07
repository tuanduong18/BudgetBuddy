from .sign_up import auth_bp as sign_up_bp
from .sign_in import auth_bp as sign_in_bp
from .sign_out import auth_bp as sign_out_bp
from .refresh import auth_bp as refresh_bp

# Create a list of blueprints
blueprints = [sign_up_bp, sign_in_bp, sign_out_bp, refresh_bp]
