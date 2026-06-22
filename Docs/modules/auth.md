# Authentication and Authorization

## Overview
Authentication is handled by Supabase Auth. Authorization is handled via a combination of Supabase Row Level Security (RLS) policies at the database level and Next.js layout/page checks at the application level.

## User Roles
There are three primary roles defined in the `users` table:
1. **Admin (`admin`)**: Full access to all tables and configurations (e.g., managing `email_contacts`).
2. **Expansion (`expansion`)**: Can manage and update kitchen operational statuses and create closure requests.
3. **Finance (`finance`)**: Read-only access to operational data, focused on financial metrics.

## RLS Policies
RLS policies are defined in `supabase/migrations/`. 
For example, in `kitchen_status`:
- `expansion` and `admin` can `INSERT`, `UPDATE`, `DELETE`.
- `finance` can only `SELECT`.

## Next.js Implementation
- User session is retrieved on the server using `@supabase/ssr`.
- Protected routes typically check for the session in their respective `page.tsx` or `layout.tsx` before rendering. If no session exists, the user is redirected to the `/login` route.
