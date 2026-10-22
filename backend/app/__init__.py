"""
Application factory for BudgetBuddy.

Instantiates the Flask app, registers all extensions, and mounts the
Blueprint groups exposed by each feature module. A background daemon thread
is also started here to listen for PostgreSQL NOTIFY events and push them
to Socket.IO clients in real time.
"""
from flask import Flask
from flask_cors import CORS
from sqlalchemy import text
from .extension import db, jwt, socketio
from .config import Config
from .models import User
import threading


def create_app() -> Flask:
    """Create and configure the Flask application.

    Returns:
        Flask: The fully configured Flask application instance.
    """
    app = Flask(__name__)

    # Allow cross-origin requests with cookies/credentials (required by the
    # React Native frontend when it communicates with the Flask API).
    CORS(app, supports_credentials=True)
    app.config.from_object(Config)

    # Bind extensions to this app instance (application factory pattern).
    db.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app)

    # Import blueprint collections from each feature module.
    from app.auth import blueprints as auth_bps
    from app.expenses import blueprints as expenses_bps
    from app.subscriptions import blueprints as subscriptions_bps
    from app.limit import blueprints as limit_bps
    from app.profile import blueprints as profile_bps
    from app.group import blueprints as split_bps
    from app.analytics import blueprints as analytics_bps

    all_blueprints = (
        auth_bps + expenses_bps + subscriptions_bps +
        limit_bps + profile_bps + analytics_bps + split_bps
    )
    for bp in all_blueprints:
        app.register_blueprint(bp)

    # Teach flask_jwt_extended how to load a User object from a JWT identity.
    # The identity is stored as a string to keep the JWT serialisable.
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        user_id = int(jwt_data["sub"])
        return User.query.filter_by(id=user_id).one_or_none()

    # Liveness probe for the hosting platform. Every feature route is POST-only,
    # so without this the platform's GET health check sees a 404 and can mark
    # an otherwise healthy deploy as failed.
    #
    # Deliberately does NOT touch the database: this is what the platform polls,
    # and a transient database blip must not cause it to tear down a process
    # that is otherwise serving fine.
    @app.route('/health', methods=['GET'])
    def health():
        return {'status': 'ok'}, 200

    # Readiness probe that issues a real query. Two jobs:
    #   1. Tells you whether the DATABASE_URL actually works, without needing
    #      to sign in through the app.
    #   2. Generates database activity. Supabase pauses free projects after a
    #      period of inactivity, and pinging /health alone would not prevent
    #      that because it never opens a connection.
    @app.route('/health/db', methods=['GET'])
    def health_db():
        try:
            db.session.execute(text('SELECT 1'))
            return {'status': 'ok', 'database': 'connected'}, 200
        except Exception as exc:  # noqa: BLE001 - report any failure as degraded
            return {'status': 'degraded', 'database': str(exc)[:200]}, 503

    @app.route('/', methods=['GET'])
    def index():
        return {'service': 'BudgetBuddy API', 'status': 'ok'}, 200

    # Start the PostgreSQL NOTIFY listener in a daemon thread so it does not
    # block process shutdown.
    from app.socket_listener import start_listening
    threading.Thread(target=start_listening, daemon=True).start()

    from flask_socketio import join_room

    @socketio.on('join_group')
    def on_join_group(msg):
        """Add the connecting client to the Socket.IO room for the given group.

        Clients must emit 'join_group' with {'group_id': str} immediately after
        connecting so they receive subsequent table_update events for that group.
        """
        group_room = f"group_{msg['group_id']}"
        join_room(group_room)

    return app
