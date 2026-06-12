# KCM Dashboard — Architecture

## Overview
The project is a standard **Next.js App Router** monolith backed by **Supabase**. It follows a server-rendered first approach using Server Components and Server Actions where possible, paired with Client Components for interactivity.

## Architecture Pattern
- **Frontend**: Next.js App Router (`app/`).
- **Backend/Database**: Supabase handles Authentication, PostgreSQL database, and Row Level Security (RLS).
- **Styling**: Utility-first CSS via Tailwind. Components are isolated and built with shadcn/ui.

## Directory Structure
- `app/`: Next.js file-system routing.
  - `(dashboard)/`: Grouped routes for the main dashboard (requires auth).
  - `api/`: Route handlers (e.g., `/api/send-closure-email`).
  - `login/`: Public route for authentication.
- `components/`: React components.
  - `ui/`: shadcn/ui generic components (e.g., Button, Input, Table).
- `lib/`: Utility functions and shared definitions.
  - `types.ts`: TypeScript interfaces for database models.
  - `supabase.ts`: Supabase client initialization.
- `supabase/migrations/`: SQL migration files defining schema, triggers, and RLS.

## Data Flow
1. **Reads**: Server Components fetch data directly from Supabase.
2. **Writes**: Client components trigger Server Actions or API routes, which mutate data in Supabase.
3. **Auditing**: Writes to core tables trigger a PostgreSQL function (`log_audit`) that automatically inserts a record into the `audit_log` table.

## Security & Authentication
- Managed by **Supabase Auth**.
- **Row Level Security (RLS)** is strictly enforced at the database level.
- Three user roles: `finance`, `expansion`, `admin`.
- Example RLS: Expansion can manage the `kitchen_master`, Finance can only view it. Finance can manage `fixed_asset_register`, Expansion can only view it.
