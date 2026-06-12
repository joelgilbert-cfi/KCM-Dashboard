-- KCM Dashboard: Audit trigger function and per-table triggers
-- Run this AFTER 001_create_tables.sql

-- Audit trigger function
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach triggers to tracked tables (NOT kitchen_master — intentionally excluded)

CREATE TRIGGER audit_closure_tracker
  AFTER INSERT OR UPDATE OR DELETE ON closure_tracker
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_far
  AFTER INSERT OR UPDATE OR DELETE ON fixed_asset_register
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_asset_movements
  AFTER INSERT OR UPDATE OR DELETE ON asset_movements
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_asset_sales
  AFTER INSERT OR UPDATE OR DELETE ON asset_sales
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_closure_requests
  AFTER INSERT OR UPDATE OR DELETE ON closure_requests
  FOR EACH ROW EXECUTE FUNCTION log_audit();
