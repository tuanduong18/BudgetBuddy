"""
PostgreSQL trigger definitions for real-time group activity notifications.

The triggers fire after any INSERT / UPDATE / DELETE on the tables listed
below and call pg_notify() with a JSON payload containing the affected
group's public identifier. The Python socket listener (socket_listener.py)
then broadcasts the event to the relevant Socket.IO room.

Tables monitored:
  - group_expenses   → on_group_expenses_change
  - group_members    → on_group_members_change
  - settlement       → on_owe_change
"""
from sqlalchemy import DDL

# Shared PL/pgSQL function that all three triggers invoke.
# Resolves the internal group PK to the public group_id string so the
# frontend can identify which group was updated without exposing PKs.
expense_function = DDL("""
CREATE OR REPLACE FUNCTION notify_table_update()
RETURNS trigger AS $$
DECLARE
  payload TEXT;
  gid integer;
  group_unique_id TEXT;
BEGIN
  -- Use OLD.group_id on DELETE because NEW is not available.
  IF (TG_OP = 'DELETE') THEN 
    gid := OLD.group_id;
  ELSE
    gid := NEW.group_id;
  END IF;
                      
  SELECT "group_id" INTO group_unique_id FROM "group" WHERE id = gid;
                                                             
  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'data', group_unique_id
  )::text;
                      
  PERFORM pg_notify('table_updates', payload);
                      
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
""")

# Trigger on group_expenses: fires after expense rows change.
expense_trigger = DDL("""
  DROP TRIGGER IF EXISTS on_group_expenses_change ON group_expenses;
  CREATE TRIGGER on_group_expenses_change
  AFTER INSERT OR UPDATE OR DELETE
  ON group_expenses
  FOR EACH ROW
  EXECUTE FUNCTION notify_table_update();
""")

# Trigger on group_members: fires when users join or leave a group.
members_trigger = DDL("""
  DROP TRIGGER IF EXISTS on_group_members_change ON group_members;
  CREATE TRIGGER on_group_members_change
  AFTER INSERT OR UPDATE OR DELETE
  ON group_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_table_update();
""")

# Trigger on settlement: fires when a debt is marked as settled.
settle_trigger = DDL("""
  DROP TRIGGER IF EXISTS on_owe_change ON settlement;
  CREATE TRIGGER on_owe_change
  AFTER INSERT OR UPDATE OR DELETE
  ON settlement
  FOR EACH ROW
  EXECUTE FUNCTION notify_table_update();
""")


def create_triggers(engine) -> None:
    """Install the shared notify function and all table triggers.

    Executes each DDL statement inside a single transaction so that either
    all triggers are created or none are (atomicity).

    Args:
        engine: A SQLAlchemy Engine connected to the target PostgreSQL DB.
    """
    with engine.begin() as conn:
        conn.execute(expense_function)
        conn.execute(expense_trigger)
        conn.execute(members_trigger)
        conn.execute(settle_trigger)
