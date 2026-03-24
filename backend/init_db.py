"""
Database initialisation script.

Run this script once before starting the server to create all SQLAlchemy
model tables and install the required PostgreSQL NOTIFY triggers.

Usage:
    python init_db.py
"""
from app import create_app, db
from app.triggers import create_triggers

app = create_app()

with app.app_context():
    db.create_all()
    create_triggers(db.engine)
    print("Tables and triggers created successfully.")