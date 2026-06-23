# Changelog

## [Current Implementation] — 2026-06-23
### Access and User Administration
- Finance, Expansion, and Admin can manage Kitchen Master rows.
- Closure email selection and sending remain limited to Finance and Admin.
- Settings now supports creating users, changing roles, and removing users.
- User removal preserves the `users` profile with `deleted_at` while deleting Supabase Auth access.
- Added migration `010_add_user_soft_delete.sql`.
- Role identifiers remain lowercase internally while UI labels are capitalized.

### Authentication
- Added forgot-password and update-password pages.
- Added Supabase recovery callback/confirmation handling.
- Documented production and localhost redirect URL requirements.

### Email Workflow
- Closure emails use Nodemailer with Gmail App Password credentials.
- Added Gmail-like recipient suggestions from app users and manual `email_contacts`.
- Manual valid email entry remains supported.

### Interface
- Light mode is the default theme.
- Dialog widths and form-label spacing were increased for desktop usability.
- Cluster selection uses natural ascending order.

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
