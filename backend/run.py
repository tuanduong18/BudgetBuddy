"""
Entry point for the BudgetBuddy Flask application.

Applies eventlet monkey-patching before any other imports to enable
non-blocking async I/O required by Flask-SocketIO in eventlet mode.
"""
import eventlet
eventlet.monkey_patch()

from app import create_app
from app.extension import socketio

app = create_app()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0')
