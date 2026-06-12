# Module: Authentication and Roles

## Overview
Authentication is handled entirely by Supabase Auth (Email/Password).
The application is protected by middleware; unauthenticated users are redirected to `/login`.

## Roles
The user's role is stored in the `users` table and is mapped to their JWT claims to be used securely within Supabase Row Level Security (RLS) policies.

- **Finance**: Can initiate closure requests. Manages the Fixed Asset Register. Has read-only access to operational tracking.
- **Expansion**: Manages the Kitchen Master list. Updates closure tracking status. Logs asset movements and sales. Has read-only access to the FAR and closure requests.
- **Admin**: Can manage users, roles, and settings.

## Implementation Details
- Client-side: `use-user.ts` (hypothetical) or direct context to fetch user details.
- Server-side: `@supabase/ssr` is used to securely verify sessions and retrieve user roles.
