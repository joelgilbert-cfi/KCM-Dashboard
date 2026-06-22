# Audit Log Module

## Overview
Provides a system-wide view of data mutations for compliance and debugging purposes.

## Data Model
Backed by the `audit_log` table.
- Records the `table_name`, `record_id`, `action` (`INSERT`, `UPDATE`, `DELETE`), `changed_by` (user ID), and the `old_data`/`new_data` payloads (JSONB).

## Functionality
- **Passive Logging**: The logging mechanism is completely passive from the application's perspective. PostgreSQL triggers (e.g., `audit_kitchen_status`) fire automatically upon data modification.
- **Viewing**: The Audit Log module provides a UI for `admin` (and potentially `expansion`) users to filter and review these changes chronologically.

## Dependencies
- Heavily reliant on Supabase PostgreSQL triggers and functions (e.g., `log_audit()`).
