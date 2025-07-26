from sqlalchemy import DDL

# The function DDL
create_function = DDL("""
CREATE OR REPLACE FUNCTION notify_table_update()
RETURNS trigger AS $$
DECLARE
  payload TEXT;
  gid integer;
  group_unique_id TEXT;
BEGIN
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

# The trigger DDL
create_trigger = DDL("""
  DROP TRIGGER IF EXISTS on_group_expenses_change ON group_expenses;
  CREATE TRIGGER on_group_expenses_change
  AFTER INSERT OR UPDATE OR DELETE
  ON group_expenses
  FOR EACH ROW
  EXECUTE FUNCTION notify_table_update();
""")

# Function to execute both
def create_triggers(engine):
    with engine.begin() as conn:
        conn.execute(create_function)
        conn.execute(create_trigger)
