# Architecture

The KCM Dashboard follows a modern Serverless Next.js architecture heavily reliant on Server Components and Supabase for backend-as-a-service (BaaS) functionality.

## Core Patterns
- **Next.js App Router**: Utilizes the Next.js `app` directory structure, with pages composed predominantly of React Server Components (RSC).
- **Server Actions & API Routes**: Data mutation is handled via Server Actions (and some dedicated API routes like `/api/send-closure-email`), keeping secrets and complex business logic securely on the server.
- **Supabase BaaS**: Supabase PostgreSQL is used as the primary data store. Supabase Auth is used for user authentication and role management.
- **Row Level Security (RLS)**: Data access control is enforced at the database level using Supabase RLS policies based on the authenticated user's role.

## Data Flow
1. **Client -> Server**: Client components (like forms or data tables) invoke Server Actions or `fetch` requests to Next.js API routes.
2. **Server -> Supabase**: The Server Action/API route uses the `@supabase/ssr` client to communicate with the database. Supabase verifies the JWT and applies RLS policies.
3. **Supabase -> Server**: The query results are returned to the Next.js server.
4. **Server -> Client**: The Next.js server passes the data down to the React Client Components as props or returns JSON from an API route.

## Module Boundaries
- `app/`: Contains all Next.js routes, pages, layouts, and API endpoints.
- `components/`: Contains shared React components, primarily shadcn/ui components (`components/ui`) and complex interactive widgets (e.g., `email-recipient-select.tsx`).
- `lib/`: Contains utility functions (`utils.ts`), TypeScript definitions (`types.ts`), and the Supabase client instantiation (`supabase.ts`).
- `supabase/migrations/`: Contains the definitive schema definitions, RLS policies, and triggers for the database.
