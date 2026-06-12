# KCM Dashboard — Conventions and Patterns

## TypeScript
- Always use TypeScript interfaces for database structures (located in `lib/types.ts`).
- Never use plain JavaScript.

## Next.js (App Router)
- Use Server Components by default for reading data.
- Use `"use client"` only for components that require interactivity (e.g., forms, buttons, state).
- Use Next.js Server Actions for mutations where appropriate.
- Fetch data using Supabase's typed client (`@supabase/ssr`).

## UI & Styling
- Build UIs exclusively using `shadcn/ui` components and Tailwind CSS.
- Do not write custom CSS outside of Tailwind utility classes unless absolutely necessary.
- Consistent application of the brand color palette (Navy primary `#0D1F6E`).
- Use `react-select` (Creatable) specifically for email tag inputs.

## Database & Supabase
- Always handle Row Level Security (RLS) properly. The frontend connects as the authenticated user, so queries will automatically filter based on RLS policies.
- Do not write manual backend audit logs. The PostgreSQL trigger (`log_audit`) handles it automatically.
- Never hard delete data (especially in `kitchen_master`); always use soft deletes (`removed_at`).
