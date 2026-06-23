# Authentication and Authorization

## Overview
Authentication is handled by Supabase Auth. Authorization is handled via a combination of Supabase Row Level Security (RLS) policies at the database level and Next.js layout/page checks at the application level.

## User Roles
There are three primary roles defined in the `users` table:
1. **Admin (`admin`)**: Full application access, Settings access, user management, and email-contact management.
2. **Expansion (`expansion`)**: Can manage Kitchen Master and operational closure-status data. Expansion cannot send closure emails.
3. **Finance (`finance`)**: Can manage Kitchen Master, select kitchens, preview/send closure emails, and view closure-status data.

## RLS Policies
RLS policies are defined in `supabase/migrations/`. 
Key examples:
- In `kitchen_master`, Finance, Expansion, and Admin can manage rows.
- `expansion` and `admin` can `INSERT`, `UPDATE`, `DELETE`.
- In `kitchen_status`, Finance can `SELECT`.
- Settings user deletion additionally verifies the requesting administrator in the server route before using the service-role client.

Role identifiers are lowercase in TypeScript, API payloads, and PostgreSQL. Capitalization is presentation-only.

## Next.js Implementation
- User session is retrieved on the server using `@supabase/ssr`.
- `proxy.ts` refreshes sessions and redirects unauthenticated users to `/login`.
- Password recovery uses `/forgot-password`, `/auth/confirm`, `/auth/callback`, and `/update-password`.
- Supabase Site URL and allowed Redirect URLs must contain the deployed Vercel URL and the localhost URL used for development.
