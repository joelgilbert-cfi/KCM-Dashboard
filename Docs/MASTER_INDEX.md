# MASTER INDEX

**Summary**: The Kitchen Closure Management (KCM) Dashboard is a Next.js/Supabase internal tool that replaces Excel sheets and email threads to manage kitchen closures, asset tracking, and audit logging.

## Documentation Index

- [Project Overview](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/project_overview.md) — High-level purpose and user roles.
- [Architecture](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/architecture.md) — Application structure, data flow, and security.
- [Tech Stack](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/tech_stack.md) — Frameworks, libraries, and tools.
- [Data Models](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/data_models.md) — Database tables and schemas.
- [API Reference](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/api_reference.md) — Internal API endpoints (e.g., email sending).
- [Config and Env](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/config_and_env.md) — Environment variables and setup requirements.
- [Dev Setup](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/dev_setup.md) — Instructions for local development.
- [Conventions and Patterns](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/conventions_and_patterns.md) — Coding standards and React patterns.
- [Gotchas and Known Issues](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/gotchas_and_known_issues.md) — Important edge cases and historical quirks.
- [Changelog](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/CHANGELOG.md) — Running history of project updates.

### Modules
- [Authentication](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/modules/auth.md) — User roles and access control.
- [Kitchen Master](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/modules/kitchen_master.md) — Master list of clusters and brands.
- [Closure Process](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/modules/closure_process.md) — Requesting and tracking closures.
- [Asset Management](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/modules/asset_management.md) — Fixed Asset Register, movements, and sales.
- [Audit Log](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/modules/audit.md) — Automated database change tracking.

---

## Task-to-Docs Routing Table

| Task Type | Read These Docs First |
|---|---|
| Modifying the auth flow or roles | `modules/auth.md`, `data_models.md` |
| Adding a new API endpoint | `api_reference.md`, `architecture.md`, `conventions_and_patterns.md` |
| Changing database schema | `data_models.md`, `architecture.md` |
| Fixing a UI component | `architecture.md`, `conventions_and_patterns.md`, `tech_stack.md` |
| Modifying the Kitchen list | `modules/kitchen_master.md`, `gotchas_and_known_issues.md` |
| Updating the closure tracker | `modules/closure_process.md`, `gotchas_and_known_issues.md` |
| Adding an asset field | `modules/asset_management.md`, `data_models.md` |
| Setting up the project | `dev_setup.md`, `config_and_env.md` |
| Debugging an issue | `gotchas_and_known_issues.md` |

---

## Module Map

- **Authentication**: Manages user roles and Supabase Auth. (`lib/supabase.ts`)
- **Kitchen Master**: Master list of all kitchen combinations. (`app/(dashboard)/kitchens`)
- **Closure Process**: Workflow for initiating emails and tracking closures. (`app/(dashboard)/closure-requests`, `app/(dashboard)/cluster`)
- **Asset Management**: Tracking fixed assets, movements, and sales. (`app/(dashboard)/assets`)
- **Audit Log**: Database trigger that logs operational changes. (`supabase/migrations/002_audit_trigger.sql`)
