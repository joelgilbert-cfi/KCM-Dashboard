# Architecture

The KCM Dashboard follows a standard Next.js App Router architecture integrated with Supabase for data and authentication.

## Pattern
- **Serverless Fullstack**: Utilizes Next.js App Router (React Server Components and Client Components) for both frontend rendering and backend API routes.
- **Backend-as-a-Service**: Supabase handles the database, authentication, and Row Level Security (RLS).
- **Database-Centric Security**: Data access logic is heavily pushed to the database layer using PostgreSQL Row Level Security (RLS) policies instead of application-level checks.

## Key Layers
1. **Frontend (App Router)**
   - Located in `app/`.
   - Uses Server Components by default for fast initial load and direct database access.
   - Client components used where interactivity is required (e.g., forms, data tables).
2. **Backend (API Routes & Server Actions)**
   - Next.js API routes (e.g., `app/api/send-closure-email/route.ts`) for external integrations like Resend.
   - Supabase SSR clients (in `lib/supabase/server.ts`) handle secure server-side data fetching.
3. **Database Layer (Supabase)**
   - Detailed schema defined in `supabase-schema.sql`.
   - Stores tables like `users`, `clusters`, `kitchens`, `closure_tracker`, `fixed_asset_register`.
   - Employs triggers for automated audit logging and asset status updates.

## Data Flow
- **Reads**: Server Components fetch data using the Supabase Server Client. Data is passed as props to Client Components if necessary.
- **Writes**: Client Components trigger Server Actions or API routes, which perform mutations via the Supabase client.
- **Real-time**: While not explicitly prominent, Supabase supports real-time subscriptions if needed in the future.
