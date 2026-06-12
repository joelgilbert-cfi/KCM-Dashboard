-- KCM Dashboard: Row Level Security policies
-- Run this AFTER 001_create_tables.sql

-- Users: everyone can read their own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users: admins can manage all users
CREATE POLICY "admins_manage_users" ON users
  USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Kitchen Master: Expansion can manage
CREATE POLICY "expansion_manage_kitchen_master" ON kitchen_master
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('expansion', 'admin')
    )
  );

-- Kitchen Master: Finance can view
CREATE POLICY "finance_view_kitchen_master" ON kitchen_master
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'finance'
    )
  );

-- Closure Tracker: Expansion can manage
CREATE POLICY "expansion_manage_closure_tracker" ON closure_tracker
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('expansion', 'admin')
    )
  );

-- Closure Tracker: Finance can view
CREATE POLICY "finance_view_closure_tracker" ON closure_tracker
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'finance'
    )
  );

-- Fixed Asset Register: Finance can manage
CREATE POLICY "finance_manage_far" ON fixed_asset_register
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('finance', 'admin')
    )
  );

-- Fixed Asset Register: Expansion can view
CREATE POLICY "expansion_view_far" ON fixed_asset_register
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'expansion'
    )
  );

-- Closure Requests: Finance can manage
CREATE POLICY "finance_manage_closure_requests" ON closure_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('finance', 'admin')
    )
  );

-- Closure Requests: Expansion can view
CREATE POLICY "expansion_view_closure_requests" ON closure_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'expansion'
    )
  );

-- Closure Request Clusters: Finance can manage
CREATE POLICY "finance_manage_closure_request_clusters" ON closure_request_clusters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('finance', 'admin')
    )
  );

-- Closure Request Clusters: Expansion can view
CREATE POLICY "expansion_view_closure_request_clusters" ON closure_request_clusters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'expansion'
    )
  );

-- Asset Movements: Expansion can insert
CREATE POLICY "expansion_manage_asset_movements" ON asset_movements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('expansion', 'admin')
    )
  );

-- Asset Movements: Both can view
CREATE POLICY "all_view_asset_movements" ON asset_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('finance', 'expansion', 'admin')
    )
  );

-- Asset Sales: Expansion can manage
CREATE POLICY "expansion_manage_asset_sales" ON asset_sales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('expansion', 'admin')
    )
  );

-- Asset Sales: Both can view
CREATE POLICY "all_view_asset_sales" ON asset_sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('finance', 'expansion', 'admin')
    )
  );

-- Audit Log: Read-only for all authenticated users
CREATE POLICY "all_view_audit_log" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('finance', 'expansion', 'admin')
    )
  );
