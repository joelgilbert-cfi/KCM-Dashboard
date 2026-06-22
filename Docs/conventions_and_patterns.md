# Conventions and Patterns

## Next.js App Router
- **Server Components by Default**: Components in the `app/` directory are Server Components by default. We only use `'use client'` when hooks (`useState`, `useEffect`) or browser APIs are required (e.g., in interactive forms or the `Navbar` toggle).
- **Data Fetching**: Data fetching is performed on the server within Server Components where possible, passing the resolved data down as props.
- **Mutations**: Data mutations (inserts, updates) should be handled via Next.js Server Actions.

## Supabase Integration
- **Client Instantiation**: Always use the utility functions in `lib/supabase.ts` to create the Supabase client. This ensures the correct cookies and SSR context are maintained.
- **Types**: Always type Supabase responses using the interfaces defined in `lib/types.ts`.
- **Row Level Security**: Never bypass RLS unless absolutely necessary for an administrative background job. Rely on the authenticated user's token.

## UI and Styling
- **Tailwind CSS**: Use Tailwind utility classes for styling.
- **shadcn/ui**: Use the pre-built components in `components/ui/` for consistency. If modifying a shadcn component, do so cautiously as it may break intended accessibility patterns.
- **Icons**: Use `lucide-react` for all iconography.
