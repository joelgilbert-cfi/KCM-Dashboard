-- KCM Dashboard: Drop the old closure_tracker table
-- Run this only after confirming the old tracker data is no longer needed
-- or after exporting/migrating it elsewhere.

DROP TRIGGER IF EXISTS audit_closure_tracker ON closure_tracker;
DROP TABLE IF EXISTS closure_tracker;
