# MASTER INDEX: KCM Dashboard Docs

**Project Summary:**
The KCM Dashboard is an internal Next.js application used by Finance and Expansion teams to manage kitchen closures, track operational progress, handle fixed asset lifecycles, and generate automated closure request emails, backed by Supabase for database and auth.

## Document Directory

- [CHANGELOG.md](./CHANGELOG.md) - Running history of project updates.
- [project_overview.md](./project_overview.md) - High-level purpose, features, and target audience.
- [architecture.md](./architecture.md) - System design, data flow, and Next.js / Supabase interaction.
- [tech_stack.md](./tech_stack.md) - Frameworks, libraries, and tools used.
- [data_models.md](./data_models.md) - Database schema concepts, RLS, and entity relationships.
- [config_and_env.md](./config_and_env.md) - Environment variables and configuration files.
- [dev_setup.md](./dev_setup.md) - Local development setup instructions.
- [conventions_and_patterns.md](./conventions_and_patterns.md) - Coding standards, file structures, and data fetching rules.
- [gotchas_and_known_issues.md](./gotchas_and_known_issues.md) - Non-obvious quirks, manual sync requirements, and database triggers.
- [modules/dashboard.md](./modules/dashboard.md) - Core dashboard views and logic.
- [modules/auth.md](./modules/auth.md) - Authentication flows and session management.

## Task-to-Docs Routing Table

| Task Type | Read These Docs First |
|---|---|
| Modifying the auth flow | `modules/auth.md`, `data_models.md`, `config_and_env.md` |
| Changing database schema | `data_models.md`, `gotchas_and_known_issues.md`, `conventions_and_patterns.md` |
| Working with Emails / API | `tech_stack.md`, `config_and_env.md`, `architecture.md` |
| Fixing a UI component | `modules/dashboard.md`, `conventions_and_patterns.md` |
| Adding a new feature | `architecture.md`, `conventions_and_patterns.md`, `MASTER_INDEX.md` |
| Debugging an issue | `gotchas_and_known_issues.md`, `architecture.md` |
| Setting up the project | `dev_setup.md`, `config_and_env.md` |
| Modifying Asset logic | `data_models.md`, `gotchas_and_known_issues.md`, `modules/dashboard.md` |

## Module Map

- **Dashboard Core (`app/(dashboard)`)**: Houses all internal application pages (clusters, kitchens, assets, audit logs).
- **Authentication (`app/login`, `lib/supabase`)**: Handles user sign-in and session protection.
- **API Services (`app/api`)**: External communication, primarily Resend for closure emails.
- **Components (`components/`)**: Shared reusable UI elements (sidebar, inputs).
- **Lib (`lib/`)**: Core utilities, Supabase clients, and central TypeScript types.
