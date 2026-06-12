# KCM Dashboard — Configuration and Environments

## Environment Variables

The application relies on the following environment variables (defined in `.env.local` for local development):

```env
NEXT_PUBLIC_SUPABASE_URL=       # The URL of the Supabase project
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Public anonymous key for Supabase client
SUPABASE_SERVICE_ROLE_KEY=      # Secret key with admin rights (used in server actions/APIs only)
RESEND_API_KEY=                 # API key for Resend email service
NEXT_PUBLIC_APP_URL=            # Base URL of the app (used for generating links in emails)
```

**Important**:
- Keys prefixed with `NEXT_PUBLIC_` are exposed to the browser.
- Never commit `.env.local` or any real secrets to version control.
- `SUPABASE_SERVICE_ROLE_KEY` must never be used in client components.

## Supabase Configuration
- Supabase migrations are located in `supabase/migrations/`.
- Ensure Row Level Security (RLS) is enabled in the hosted Supabase instance.
- Supabase Auth must be configured to use email/password sign-ins.
