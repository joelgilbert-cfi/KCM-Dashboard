-- Preserve historical references when an administrator removes an app user.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_active_idx
  ON users (created_at DESC)
  WHERE deleted_at IS NULL;
