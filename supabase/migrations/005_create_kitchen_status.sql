-- KCM Dashboard: Create kitchen_status table from Kitchen Status.csv columns
-- Run this AFTER 004_drop_closure_tracker.sql.

CREATE TABLE IF NOT EXISTS kitchen_status (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_name            TEXT,
  oracle_code             TEXT,
  cluster_marker          TEXT NOT NULL UNIQUE,
  rent                    NUMERIC(12, 2),
  city                    TEXT,
  zone                    TEXT,
  format_final            TEXT,
  entity                  TEXT,
  status                  TEXT,
  reason_for_change       TEXT,
  lock_in                 TEXT,
  lock_in_end_date        DATE,
  ops_closed              TEXT,
  last_ops_date           DATE,
  last_rent_date          DATE,
  ll_clearance            TEXT,
  shut_suspend_continue   TEXT,
  dec_net_revenue         NUMERIC(12, 2),
  dec_ebitda              NUMERIC(12, 2),
  sd                      NUMERIC(12, 2),
  sd_adjustment           NUMERIC(12, 2),
  sd_recovery             NUMERIC(12, 2),
  remarks                 TEXT,
  notice_period           TEXT,
  remarks_2               TEXT,
  rental_hit_till_lock_in NUMERIC(12, 2),
  capex                   NUMERIC(12, 2),
  framework               INTEGER,
  closure_phasing         INTEGER,
  hr_remarks              TEXT,
  updated_by              UUID REFERENCES users(id),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kitchen_status ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS audit_kitchen_status ON kitchen_status;
CREATE TRIGGER audit_kitchen_status
  AFTER INSERT OR UPDATE OR DELETE ON kitchen_status
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "expansion_manage_kitchen_status" ON kitchen_status;
CREATE POLICY "expansion_manage_kitchen_status" ON kitchen_status
  FOR ALL USING (
    public.current_user_role() IN ('expansion', 'admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('expansion', 'admin')
  );

DROP POLICY IF EXISTS "finance_view_kitchen_status" ON kitchen_status;
CREATE POLICY "finance_view_kitchen_status" ON kitchen_status
  FOR SELECT USING (
    public.current_user_role() = 'finance'
  );
