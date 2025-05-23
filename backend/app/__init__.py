from flask import Flask
from flask_cors import CORS
from .extension import db, jwt
from .config import Config
from .models import User

def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True)
    app.config.from_object(Config)
   
    # initialization
    db.init_app(app)
    jwt.init_app(app)

    # Import blueprint groups from each module
    from app.auth import blueprints as auth_bps
    from app.expenses import blueprints as expenses_bps
    
    # Adding all the blueprints
    all_blueprints = auth_bps + expenses_bps

    for bp in all_blueprints:
        app.register_blueprint(bp) 
    
    # This declaration is for flask_jwt_extended.current_user to be 'User' data type
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity_str = jwt_data["sub"]          # this is now a string
        user_id      = int(identity_str)        # cast back to int
        return User.query.filter_by(id=user_id).one_or_none()
    
    return app
