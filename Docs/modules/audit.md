# Module: Audit Log

## Overview
The Audit Log provides a complete, immutable history of changes across the core operational tables. It is designed to replace email-based "who changed what" tracking.

## Source Path
- UI: `app/(dashboard)/audit-log/`
- SQL: `supabase/migrations/002_audit_trigger.sql`

## Tracked Tables
- `closure_tracker`
- `fixed_asset_register`
- `asset_movements`
- `asset_sales`
- `closure_requests`

## Excluded Tables
- `kitchen_master` (Intentionally excluded to prevent noise from routine typo fixes).

## Mechanism
The audit log is fully automated at the database level.
A PostgreSQL function (`log_audit`) is attached as a trigger to the tracked tables. On every `INSERT`, `UPDATE`, or `DELETE`, it silently captures:
- The table name and record ID.
- The action performed.
- The user who made the change (via `auth.uid()`).
- The entire JSON payload of the row before (`old_data`) and after (`new_data`).

## Access
- The frontend only reads from the `audit_log` table.
- Nobody (not even admins) can write, update, or delete from this table via the application interface.
