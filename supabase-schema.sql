-- ============================================
-- KCM Dashboard — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Users table
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('finance', 'expansion', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clusters table
CREATE TABLE clusters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_marker TEXT NOT NULL,         -- "1", "41"
  brand          TEXT,                  -- e.g. "MLE", "KK"
  kitchen_name   TEXT,                  -- e.g. "Hoodi", "Whitefield"
  format         TEXT,                  -- e.g. "Cloud Kitchen", "Restaurant"
  status         TEXT NOT NULL DEFAULT 'Active'
                 CHECK (status IN ('Active', 'Under Closure', 'Closed')),
  added_by       UUID REFERENCES users(id),
  added_at       TIMESTAMPTZ DEFAULT NOW(),
  removed_at     TIMESTAMPTZ            -- soft delete only, never hard delete
);



-- 4. Closure Requests table
CREATE TABLE closure_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by  UUID REFERENCES users(id) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'Draft'
                CHECK (status IN ('Draft', 'Sent')),
  to_emails     TEXT[],
  cc_emails     TEXT[],
  email_sent_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Closure Request Clusters (join table)
CREATE TABLE closure_request_clusters (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES closure_requests(id) NOT NULL,
  cluster_marker TEXT NOT NULL
);

-- 6. Closure Tracker table
CREATE TABLE closure_tracker (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_marker     TEXT NOT NULL,
  ops_closed         BOOLEAN DEFAULT FALSE,
  last_ops_date      DATE,
  last_rent_date     DATE,
  ll_clearance       BOOLEAN,
  lock_in            TEXT CHECK (lock_in IN ('Yes', 'No', 'Closed')),
  lock_in_end_date   DATE,
  sd                 NUMERIC(12, 2),
  sd_adjustment      NUMERIC(12, 2),
  sd_recovery        NUMERIC(12, 2),
  notice_period      TEXT,
  dec_net_revenue    NUMERIC(12, 2),
  dec_ebitda         NUMERIC(12, 2),
  rental_hit_lock_in NUMERIC(12, 2),
  capex              NUMERIC(12, 2),
  framework          INTEGER,
  closure_phasing    INTEGER,
  hr_remarks         TEXT,
  remarks            TEXT,
  on_hold            BOOLEAN DEFAULT FALSE,
  progress           TEXT CHECK (progress IN ('Initiated', 'In Progress', 'Completed')),
  updated_by         UUID REFERENCES users(id),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Fixed Asset Register (FAR)
CREATE TABLE fixed_asset_register (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id     UUID REFERENCES clusters(id) NOT NULL,
  asset_name     TEXT NOT NULL,
  category       TEXT,
  purchase_date  DATE,
  value          NUMERIC(12, 2),
  condition      TEXT CHECK (condition IN ('Good', 'Fair', 'Poor', 'Damaged')),
  current_status TEXT DEFAULT 'In Kitchen'
                 CHECK (current_status IN ('In Kitchen', 'Moved to Warehouse', 'Sold', 'Disposed')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Asset Movements
CREATE TABLE asset_movements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      UUID REFERENCES fixed_asset_register(id) NOT NULL,
  cluster_id    UUID REFERENCES clusters(id) NOT NULL,
  moved_to      TEXT NOT NULL,
  movement_date DATE NOT NULL,
  notes         TEXT,
  logged_by     UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Asset Sales
CREATE TABLE asset_sales (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID REFERENCES fixed_asset_register(id) NOT NULL,
  cluster_id UUID REFERENCES clusters(id) NOT NULL,
  sale_price NUMERIC(12, 2),
  buyer      TEXT,
  sale_date  DATE NOT NULL,
  notes      TEXT,
  logged_by  UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Audit Log
CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id  UUID NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  old_data   JSONB,
  new_data   JSONB
);

-- ============================================
-- Audit Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach audit triggers
CREATE TRIGGER audit_clusters
  AFTER INSERT OR UPDATE OR DELETE ON clusters
  FOR EACH ROW EXECUTE FUNCTION log_audit();



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

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchens ENABLE ROW LEVEL SECURITY;
ALTER TABLE closure_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE closure_request_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE closure_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_asset_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users: everyone can read
CREATE POLICY "users_select" ON users FOR SELECT USING (true);

-- Clusters: Expansion manages, Finance views
CREATE POLICY "expansion_manage_clusters" ON clusters
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('expansion', 'admin')));
CREATE POLICY "finance_view_clusters" ON clusters
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'finance'));

-- FAR: Finance manages, Expansion views
CREATE POLICY "finance_manage_far" ON fixed_asset_register
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('finance', 'admin')));
CREATE POLICY "expansion_view_far" ON fixed_asset_register
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'expansion'));

-- Closure tracker: Expansion manages, Finance views
CREATE POLICY "expansion_manage_closure" ON closure_tracker
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('expansion', 'admin')));
CREATE POLICY "finance_view_closure" ON closure_tracker
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'finance'));

-- Closure requests: Finance manages, Expansion views
CREATE POLICY "finance_manage_requests" ON closure_requests
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('finance', 'admin')));
CREATE POLICY "expansion_view_requests" ON closure_requests
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'expansion'));

-- Closure request clusters: same as closure requests
CREATE POLICY "finance_manage_request_clusters" ON closure_request_clusters
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('finance', 'admin')));
CREATE POLICY "all_view_request_clusters" ON closure_request_clusters
  FOR SELECT USING (true);

-- Asset movements: Expansion creates, all view
CREATE POLICY "expansion_manage_movements" ON asset_movements
  FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('expansion', 'admin')));
CREATE POLICY "finance_view_movements" ON asset_movements
  FOR SELECT USING (auth.jwt() ->> 'role' = 'finance');

-- Asset sales: Expansion creates, all view
CREATE POLICY "expansion_manage_sales" ON asset_sales
  FOR ALL USING (auth.jwt() ->> 'role' = 'expansion' OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "finance_view_sales" ON asset_sales
  FOR SELECT USING (auth.jwt() ->> 'role' = 'finance');

-- Audit log: read-only for everyone
CREATE POLICY "view_audit_log" ON audit_log
  FOR SELECT USING (true);

-- ============================================
-- Auto-update asset status triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_asset_status_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fixed_asset_register
  SET current_status = 'Moved to Warehouse'
  WHERE id = NEW.asset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER asset_movement_status
  AFTER INSERT ON asset_movements
  FOR EACH ROW EXECUTE FUNCTION update_asset_status_on_movement();

CREATE OR REPLACE FUNCTION update_asset_status_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fixed_asset_register
  SET current_status = 'Sold'
  WHERE id = NEW.asset_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER asset_sale_status
  AFTER INSERT ON asset_sales
  FOR EACH ROW EXECUTE FUNCTION update_asset_status_on_sale();
