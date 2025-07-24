import os, select, json, psycopg2
from .extension import socketio

def start_listening():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute("LISTEN table_updates;")

    while True:
        # wait 5 secs to check if there is any activity
        if select.select([conn], [], [], 5) == ([], [], []):
            continue

        conn.poll()

        for notify in conn.notifies:
            # parse the JSON payload
            payload = json.loads(notify.payload)
            if payload['table'] == 'group_expenses':
                gid = payload['data']
                room = f"group_{gid}"

                # emit *only* to that room
                socketio.emit('table_update', payload, room=room) # type: ignore
            else:
                # fallback: broadcast to all
                socketio.emit('table_update', payload)

        # clear the queue
        conn.notifies.clear()