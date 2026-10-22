"""
Background thread that listens for PostgreSQL NOTIFY events and
forwards them to Socket.IO clients.

The thread opens a dedicated psycopg2 connection in AUTOCOMMIT mode (required
for LISTEN/NOTIFY) and polls it every 5 seconds. When a notification arrives
it emits a 'table_update' event:

  - group_expenses changes → emitted only to the affected group room
  - all other table changes → broadcast to all connected clients
"""
import select
import json
import time
import psycopg2
from .config import get_database_url
from .extension import socketio

# Seconds to wait before re-opening a dropped listener connection. Managed
# Postgres providers close idle connections, so a drop is routine, not fatal.
RECONNECT_DELAY = 5


def _listen_once() -> None:
    """Open a listener connection and forward notifications until it drops.

    Returns normally when the connection is lost so the caller can reconnect.
    """
    conn = psycopg2.connect(get_database_url())
    try:
        # AUTOCOMMIT is mandatory for LISTEN; transactional mode blocks NOTIFY delivery.
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        cur.execute("LISTEN table_updates;")
        print("[socket_listener] Listening for 'table_updates' notifications.")

        while True:
            # Block for up to 5 seconds waiting for activity on the connection.
            if select.select([conn], [], [], 5) == ([], [], []):
                if conn.closed:
                    return  # Server hung up during the idle window.
                continue  # Timeout elapsed, no notifications — poll again.

            conn.poll()

            for notify in conn.notifies:
                try:
                    payload = json.loads(notify.payload)
                except (ValueError, TypeError):
                    # A malformed payload must not tear down the listener.
                    print(f"[socket_listener] Skipping bad payload: {notify.payload!r}")
                    continue

                if payload.get('table') == 'group_expenses':
                    # Scope the event to the specific group room to avoid
                    # broadcasting sensitive data to unrelated clients.
                    gid = payload.get('data')
                    room = f"group_{gid}"
                    socketio.emit('table_update', payload, room=room)  # type: ignore
                else:
                    # Fallback: broadcast to all connected clients.
                    socketio.emit('table_update', payload)

            # Clear the notification queue after processing to prevent reprocessing.
            conn.notifies.clear()
    finally:
        try:
            conn.close()
        except Exception:  # noqa: BLE001 - already tearing down
            pass


def start_listening() -> None:
    """Continuously listen for PostgreSQL NOTIFY events on 'table_updates'.

    Runs forever, reconnecting after any failure. This function is blocking and
    intended to run in a daemon thread so that it does not prevent the process
    from exiting cleanly. Because it runs in a daemon thread, an uncaught
    exception here would kill real-time updates for the whole process with no
    visible error, so every iteration is guarded.
    """
    while True:
        try:
            _listen_once()
            print("[socket_listener] Connection closed; reconnecting.")
        except Exception as exc:  # noqa: BLE001 - the listener must never die
            print(f"[socket_listener] Listener error ({exc}); reconnecting "
                  f"in {RECONNECT_DELAY}s.")
        time.sleep(RECONNECT_DELAY)