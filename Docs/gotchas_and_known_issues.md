# Gotchas and Known Issues

## Type Syncing
- **Manual Type Management**: Supabase database types in `lib/types.ts` are manually created and extended. They are not auto-generated via the Supabase CLI. You must ensure `lib/types.ts` stays in sync with `supabase-schema.sql` manually.

## Supabase SSR
- **Middleware**: `middleware.ts` is responsible for refreshing the Supabase session. If routing behaves unexpectedly regarding authentication, check the session logic in `lib/supabase/middleware.ts`.

## Database Triggers
- **Automated Logging**: Almost all tables have audit triggers. Direct database modifications via the SQL console will still be logged to `audit_log`, but `changed_by` will be null if no authenticated user session is contextually present.
- **Asset Statuses**: Moving or selling an asset automatically updates its `current_status` in the `fixed_asset_register`. Do not manually update `current_status` in the application code when creating movements or sales.

## Tailwind CSS V4
- The project uses Tailwind CSS v4, which behaves slightly differently than v3 (e.g., configuration is largely handled in CSS variables rather than a `tailwind.config.js` file).
