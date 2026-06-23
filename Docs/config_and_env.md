# Configuration and Environment

## Environment Variables
The application requires an `.env.local` file at the root to function. The required variables are detailed in `.env.local.example`.

### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL`: The URL of the Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous public key for Supabase client initialization.
- `SUPABASE_SERVICE_ROLE_KEY`: Server-only key used by protected administrative routes and recipient search. Never expose it with a `NEXT_PUBLIC_` prefix.
- `GMAIL_USER`: Gmail or Google Workspace sender account.
- `GMAIL_APP_PASSWORD`: App Password for `GMAIL_USER`; server-only.
- `EMAIL_FROM_NAME`: Display name used in the closure email From header.
- `NEXT_PUBLIC_APP_URL`: Deployed application URL used for links inside closure emails.

The current email implementation uses Nodemailer with Gmail. It does not require Resend configuration or DNS records.

## Configuration Files
- **`next.config.ts`**: Standard Next.js configuration.
- **`tailwind.config.js` / `postcss.config.mjs`**: Configuration for Tailwind CSS v4, defining the custom `brand` colors and utility classes.
- **`components.json`**: Configuration for `shadcn/ui`, mapping component paths and CSS variables.
- **`tsconfig.json`**: TypeScript configuration, defining strict typing rules and path aliases (e.g., `@/*` maps to `./*`).
