-- KCM Dashboard: Kitchen Master is managed by Finance/Admin, viewed by Expansion.
-- Run this after 003_rls_policies.sql in existing Supabase projects.

DROP POLICY IF EXISTS "expansion_manage_kitchen_master" ON kitchen_master;
DROP POLICY IF EXISTS "finance_view_kitchen_master" ON kitchen_master;
DROP POLICY IF EXISTS "finance_manage_kitchen_master" ON kitchen_master;
DROP POLICY IF EXISTS "expansion_view_kitchen_master" ON kitchen_master;

CREATE POLICY "finance_manage_kitchen_master" ON kitchen_master
  FOR ALL USING (
    public.current_user_role() IN ('finance', 'admin')
  )
  WITH CHECK (
    public.current_user_role() IN ('finance', 'admin')
  );

CREATE POLICY "expansion_view_kitchen_master" ON kitchen_master
  FOR SELECT USING (
    public.current_user_role() = 'expansion'
  );

