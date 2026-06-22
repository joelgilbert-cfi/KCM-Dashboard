-- KCM Dashboard: Finance, Expansion, and Admin can manage Kitchen Master.
-- Run this after 008_fix_kitchen_master_permissions.sql in existing projects.

DROP POLICY IF EXISTS "expansion_manage_kitchen_master" ON kitchen_master;
DROP POLICY IF EXISTS "finance_view_kitchen_master" ON kitchen_master;
DROP POLICY IF EXISTS "finance_manage_kitchen_master" ON kitchen_master;
DROP POLICY IF EXISTS "expansion_view_kitchen_master" ON kitchen_master;
DROP POLICY IF EXISTS "finance_expansion_manage_kitchen_master" ON kitchen_master;

CREATE POLICY "finance_expansion_manage_kitchen_master" ON kitchen_master
  FOR ALL USING (
    public.current_user_role() IN ('finance', 'expansion', 'admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('finance', 'expansion', 'admin')
  );

