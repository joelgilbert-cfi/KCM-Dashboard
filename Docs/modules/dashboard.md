# Module: Dashboard Features

**Path:** `app/(dashboard)/`

## Overview
This is the core module of the application, encompassing all logged-in views.

## Key Sub-Modules
- `app/(dashboard)/clusters/`: Management of Kitchen Clusters.
- `app/(dashboard)/kitchens/`: Management of individual Kitchen Brands.
- `app/(dashboard)/closure-requests/`: Workflow for initiating closure approvals.
- `app/(dashboard)/audit-log/`: Interface for viewing system-wide changes.
- `app/(dashboard)/settings/`: User and system settings.
- `app/(dashboard)/assets/`: Fixed Asset Register (FAR) management.
- `app/(dashboard)/dashboard/`: High-level metrics and overviews.

## Responsibilities
- Rendering data tables and forms for all primary entities.
- Enforcing layout consistency via `app/(dashboard)/layout.tsx`.
- Handling data mutations (creates/updates) via Server Actions or Client Supabase calls.
