# KCM Dashboard — Configuration and Environments

## Environment Variables

The application relies on the following environment variables (defined in `.env.local` for local development):

```env
NEXT_PUBLIC_SUPABASE_URL=       # The URL of the Supabase project
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Public anonymous key for Supabase client
SUPABASE_SERVICE_ROLE_KEY=      # Secret key with admin rights (used in server actions/APIs only)
GMAIL_USER=                     # Gmail/Google Workspace mailbox used to send closure emails
GMAIL_APP_PASSWORD=             # 16-character Google App Password for the mailbox
EMAIL_FROM_NAME=Kitchen Closure # Display name used in the email From header
NEXT_PUBLIC_APP_URL=            # Base URL of the app (used for generating links in emails)
```

**Important**:
- Keys prefixed with `NEXT_PUBLIC_` are exposed to the browser.
- Never commit `.env.local` or any real secrets to version control.
- `SUPABASE_SERVICE_ROLE_KEY` must never be used in client components.
- Gmail credentials are server-only and must only be read inside API routes/server code.

## Gmail App Password Setup
- Use a Gmail or Google Workspace account that will send closure emails.
- Enable 2-Step Verification on that account.
- Create an App Password from Google Account -> Security -> App Passwords.
- Paste the generated 16-character password into `GMAIL_APP_PASSWORD`.
- No DNS, DKIM, SPF, MX, or domain verification setup is required for this email path.

## Supabase Configuration
- Supabase migrations are located in `supabase/migrations/`.
- Ensure Row Level Security (RLS) is enabled in the hosted Supabase instance.
- Supabase Auth must be configured to use email/password sign-ins.
