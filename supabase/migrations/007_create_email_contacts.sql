-- KCM Dashboard: Manual email contacts for recipient autocomplete

CREATE TABLE IF NOT EXISTS email_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance_admin_view_email_contacts" ON email_contacts
  FOR SELECT USING (
    public.current_user_role() IN ('finance', 'admin')
  );

CREATE POLICY "admins_manage_email_contacts" ON email_contacts
  FOR ALL USING (
    public.current_user_role() = 'admin'
  )
  WITH CHECK (
    public.current_user_role() = 'admin'
  );

