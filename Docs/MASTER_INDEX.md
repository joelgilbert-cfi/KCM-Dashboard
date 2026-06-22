# KCM Dashboard Documentation — Master Index

**Project Summary:**
The KCM (Kitchen Closure Management) Dashboard is an internal Next.js/Supabase application used to track operational statuses, manage physical assets, and automate email notifications related to kitchen facility closures.

## Document Directory
- **[CHANGELOG.md](CHANGELOG.md)**: Running history of major project updates.
- **[project_overview.md](project_overview.md)**: High-level purpose, domain, and stakeholders.
- **[architecture.md](architecture.md)**: Next.js App Router and Supabase BaaS interaction patterns.
- **[tech_stack.md](tech_stack.md)**: Frameworks, libraries, and tools in use.
- **[data_models.md](data_models.md)**: Details on the 9 core PostgreSQL tables and relations.
- **[api_reference.md](api_reference.md)**: Details on Next.js Route Handlers (e.g., email sending).
- **[config_and_env.md](config_and_env.md)**: Required environment variables and configuration files.
- **[dev_setup.md](dev_setup.md)**: Instructions for local development and Supabase instantiation.
- **[conventions_and_patterns.md](conventions_and_patterns.md)**: Project-specific coding standards.
- **[gotchas_and_known_issues.md](gotchas_and_known_issues.md)**: Important nuances, constraints, and historical context.

### Modules
- **[modules/auth.md](modules/auth.md)**: User roles and RLS integration.
- **[modules/kitchen_master.md](modules/kitchen_master.md)**: Core kitchen directory management.
- **[modules/kitchen_closure_status.md](modules/kitchen_closure_status.md)**: Operational and financial closure tracking.
- **[modules/closure_requests.md](modules/closure_requests.md)**: The email notification workflow.
- **[modules/assets.md](modules/assets.md)**: Fixed Asset Register, movements, and sales.
- **[modules/audit_log.md](modules/audit_log.md)**: System-wide automated mutation tracking.
- **[modules/settings.md](modules/settings.md)**: Admin configuration (e.g., email contacts).

---

## Task-to-Docs Routing Table

| Task Type | Read These Docs First |
|---|---|
| Modifying the Closure Email flow | `modules/closure_requests.md`, `api_reference.md`, `config_and_env.md` |
| Changing database schema | `data_models.md`, `gotchas_and_known_issues.md`, relevant `modules/[module].md` |
| Fixing/Adding UI components | `conventions_and_patterns.md`, `tech_stack.md` |
| Updating RLS or Authentication | `modules/auth.md`, `data_models.md`, `gotchas_and_known_issues.md` |
| Adding a new Module | `architecture.md`, `conventions_and_patterns.md`, `MASTER_INDEX.md` |
| Debugging DB mutation issues | `gotchas_and_known_issues.md`, `modules/audit_log.md` |
| Setting up the project locally | `dev_setup.md`, `config_and_env.md` |

---

## Module Map
- **Auth**: Manages roles (`finance`, `expansion`, `admin`) via Supabase. (Path: implicit via Supabase/`lib/supabase.ts`)
- **Kitchen Master**: Directory of all kitchens. (Path: `app/(dashboard)/kitchens/`)
- **Kitchen Closure Status**: Tracks financial/ops closure metrics. (Path: `app/(dashboard)/kitchen-closure-status/`)
- **Closure Requests**: Automates closure notification emails. (Path: `app/(dashboard)/closure-requests/`)
- **Assets**: Manages FAR, asset movements, and sales. (Path: `app/(dashboard)/assets/`)
- **Audit Log**: Displays automated change logs. (Path: `app/(dashboard)/audit-log/`)
- **Settings**: Admin config, specifically email contacts. (Path: `app/(dashboard)/settings/`)
