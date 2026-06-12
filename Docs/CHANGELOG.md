# Changelog

## [Initial Scan] — 2026-06-12
### Overview
This project is a Next.js (App Router) and Supabase-based internal web dashboard designed to replace manual Excel sheets and emails for the Kitchen Closure Management (KCM) process. The current state reflects a complete architectural foundation and plan for the 9 core database tables, Supabase Auth integration, and UI component setup using shadcn/ui.

### Modules Present
- **Authentication**: Role-based access control (Finance, Expansion, Admin) via Supabase.
- **Kitchen Master**: Master list of all kitchen locations (cluster + brand).
- **Closure Process**: Workflow for initiating closure emails and tracking operational closure progress at the cluster level.
- **Asset Management**: Centralized tracking of the Fixed Asset Register (FAR), asset movements, and asset sales.
- **Audit Log**: Automated database-level trigger logging all operational changes.

### Tech Stack
- Next.js 16.2.9 (App Router)
- React 19.2.4
- Supabase (PostgreSQL, Auth, RLS)
- Tailwind CSS 4 & shadcn/ui
- Resend (Email Delivery)

### Notes
- The `kitchen_master` table utilizes soft deletes and is intentionally excluded from the audit log.
- Asset movement data migration from legacy CSVs lacks date columns and links via `oracle_code`.
- FAR Excel structure requires confirmation with the Finance team before finalizing the database schema.
