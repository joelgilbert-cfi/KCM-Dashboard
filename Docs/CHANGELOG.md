# Changelog

## [Initial Scan] — 2026-06-18
### Overview
The KCM Dashboard is a fully functional prototype for managing kitchen closures, featuring role-based access control, complex financial status tracking, automated email workflows, and comprehensive asset management, all backed by a robust Supabase backend with active audit logging.

### Modules Present
- **Kitchen Master**: Core directory of all kitchens and baseline statuses.
- **Kitchen Closure Status**: Detailed tracking of operational milestones and financial impacts (rent, EBITDA).
- **Closure Requests**: Workflow for drafting and dispatching automated closure notification emails.
- **Assets**: Fixed Asset Register (FAR), tracking condition, movements to warehouses, and asset sales.
- **Audit Log**: Passive, trigger-based tracking of all database mutations.
- **Settings**: Administrative configuration, including manual email contact management for auto-complete.

### Tech Stack
- Next.js 16.2.9 (App Router)
- React 19
- Supabase (PostgreSQL, Auth, RLS)
- TailwindCSS v4
- shadcn/ui
- Nodemailer

### Notes
- The legacy `closure_tracker` table was dropped and replaced by `kitchen_status`.
- Email functionality relies on an external SMTP server configured via `.env.local`.
- User roles are currently hardcoded in the database schema (`CHECK` constraint) and TypeScript interfaces.
