# Module: Authentication

**Paths:** `app/login/`, `lib/supabase/`, `middleware.ts`

## Overview
Handles user login, session management, and route protection using Supabase Auth.

## Key Components
- **Login Page (`app/login/page.tsx`)**: The UI for user authentication.
- **Middleware (`middleware.ts`)**: Intercepts requests to ensure the user is authenticated before accessing `(dashboard)` routes. Refreshes the session token.
- **Supabase Clients (`lib/supabase/*`)**: Configured to handle SSR authentication seamlessly, reading and setting cookies as required by Next.js Server Components.
- **Custom Hook (`hooks/use-user.ts`)**: Exposes the current authenticated user to Client Components.
