-- KCM Dashboard: Create all 9 tables
-- Run this in the Supabase SQL Editor

-- 1. Users table
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('finance', 'expansion', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Kitchen Master
CREATE TABLE kitchen_master (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_marker TEXT NOT NULL,
  brand          TEXT NOT NULL,
  kitchen_name   TEXT,
  format         TEXT,
  status         TEXT NOT NULL DEFAULT 'Active'
                 CHECK (status IN ('Active', 'Under Closure', 'Closed')),
  added_by       UUID REFERENCES users(id),
  added_at       TIMESTAMPTZ DEFAULT NOW(),
  removed_at     TIMESTAMPTZ,
  UNIQUE (cluster_marker, brand)
);

-- 3. Closure Requests
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

-- 4. Closure Request Clusters
CREATE TABLE closure_request_clusters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     UUID REFERENCES closure_requests(id) NOT NULL,
  cluster_marker TEXT NOT NULL
);

-- 5. Closure Tracker
CREATE TABLE closure_tracker (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_marker        TEXT NOT NULL UNIQUE,
  kitchen_name          TEXT,
  oracle_code           TEXT,
  rent                  NUMERIC(12, 2),
  city                  TEXT,
  zone                  TEXT,
  format                TEXT,
  entity                TEXT,
  status_31_march       TEXT,
  reason_for_change     TEXT,
  lock_in               TEXT,
  lock_in_end_date      DATE,
  ops_closed            TEXT,
  last_ops_date         DATE,
  last_rent_date        DATE,
  ll_clearance          TEXT,
  shut_suspend_continue TEXT,
  dec_net_revenue       NUMERIC(12, 2),
  dec_ebitda            NUMERIC(12, 2),
  sd                    NUMERIC(12, 2),
  sd_adjustment         NUMERIC(12, 2),
  sd_recovery           NUMERIC(12, 2),
  remarks               TEXT,
  notice_period         TEXT,
  remarks_2             TEXT,
  rental_hit_lock_in    NUMERIC(12, 2),
  capex                 NUMERIC(12, 2),
  framework             INTEGER,
  closure_phasing       INTEGER,
  hr_remarks            TEXT,
  updated_by            UUID REFERENCES users(id),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Fixed Asset Register (FAR)
CREATE TABLE fixed_asset_register (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id     UUID REFERENCES kitchen_master(id) NOT NULL,
  asset_name     TEXT NOT NULL,
  category       TEXT,
  purchase_date  DATE,
  value          NUMERIC(12, 2),
  condition      TEXT CHECK (condition IN ('Good', 'Fair', 'Poor', 'Damaged')),
  current_status TEXT DEFAULT 'In Kitchen'
                 CHECK (current_status IN ('In Kitchen', 'Moved to Warehouse', 'Sold', 'Disposed')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Asset Movements
CREATE TABLE asset_movements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_location     TEXT,
  from_oracle_code  TEXT,
  to_location       TEXT,
  to_oracle_code    TEXT,
  item_name         TEXT,
  quantity          NUMERIC(10, 2),
  movement_date     DATE,
  asset_id          UUID REFERENCES fixed_asset_register(id),
  kitchen_id        UUID REFERENCES kitchen_master(id),
  logged_by         UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Asset Sales
CREATE TABLE asset_sales (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID REFERENCES fixed_asset_register(id),
  kitchen_id UUID REFERENCES kitchen_master(id),
  item_name  TEXT,
  quantity   NUMERIC(10, 2),
  sale_price NUMERIC(12, 2),
  buyer      TEXT,
  sale_date  DATE,
  notes      TEXT,
  logged_by  UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Audit Log
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

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE closure_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE closure_request_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE closure_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_asset_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
