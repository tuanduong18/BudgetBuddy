"""
Background thread that listens for PostgreSQL NOTIFY events and
forwards them to Socket.IO clients.

The thread opens a dedicated psycopg2 connection in AUTOCOMMIT mode (required
for LISTEN/NOTIFY) and polls it every 5 seconds. When a notification arrives
it emits a 'table_update' event:

  - group_expenses changes → emitted only to the affected group room
  - all other table changes → broadcast to all connected clients
"""
import os
import select
import json
import psycopg2
from .extension import socketio


def start_listening() -> None:
    """Continuously listen for PostgreSQL NOTIFY events on 'table_updates'.

    This function is blocking and intended to run in a daemon thread so that
    it does not prevent the process from exiting cleanly.
    """
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    # AUTOCOMMIT is mandatory for LISTEN; transactional mode blocks NOTIFY delivery.
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute("LISTEN table_updates;")

    while True:
        # Block for up to 5 seconds waiting for activity on the connection.
        if select.select([conn], [], [], 5) == ([], [], []):
            continue  # Timeout elapsed, no notifications — poll again.

        conn.poll()

        for notify in conn.notifies:
            payload = json.loads(notify.payload)

            if payload['table'] == 'group_expenses':
                # Scope the event to the specific group room to avoid
                # broadcasting sensitive data to unrelated clients.
                gid = payload['data']
                room = f"group_{gid}"
                socketio.emit('table_update', payload, room=room)  # type: ignore
            else:
                # Fallback: broadcast to all connected clients.
                socketio.emit('table_update', payload)

        # Clear the notification queue after processing to prevent reprocessing.
        conn.notifies.clear()