# Conventions and Patterns

## Code Structure
- **App Router**: Uses Next.js `app/` directory paradigm. 
- **Route Groups**: Uses route groups like `(dashboard)` to share layouts without adding to the URL path.
- **Absolute Imports**: Uses `@/` for absolute imports (e.g., `@/components/sidebar`, `@/lib/supabase/client`).

## Supabase Integration
Located in `lib/supabase/`:
- `client.ts`: Used in Client Components.
- `server.ts`: Used in Server Components, API routes, and Server Actions.
- `middleware.ts`: Used in Next.js `middleware.ts` for session management and route protection.

## Type Definitions
- All database types are manually maintained in `lib/types.ts`.
- When modifying the database schema (`supabase-schema.sql`), **always** update the corresponding interfaces in `lib/types.ts`.

## UI Components
- Reusable UI components are stored in `components/`.
- Styling uses Tailwind CSS classes directly in `className`.
- `clsx` and `tailwind-merge` are utilized (often via a utility function in `lib/utils.ts`) to merge conflicting Tailwind classes safely.

## Data Fetching
- Prefer fetching data in Server Components where possible to reduce client-side JavaScript and improve load times.
- Pass fetched data down as props to Client Components.
