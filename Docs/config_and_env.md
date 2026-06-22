# Configuration and Environment

## Environment Variables
The application requires an `.env.local` file at the root to function. The required variables are detailed in `.env.local.example`.

### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL`: The URL of the Supabase project.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The anonymous public key for Supabase client initialization.
- `SUPABASE_SERVICE_ROLE_KEY`: (Optional/Admin) The service role key used for administrative actions bypassing RLS.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Credentials used by Nodemailer to send closure request emails.

## Configuration Files
- **`next.config.ts`**: Standard Next.js configuration.
- **`tailwind.config.js` / `postcss.config.mjs`**: Configuration for Tailwind CSS v4, defining the custom `brand` colors and utility classes.
- **`components.json`**: Configuration for `shadcn/ui`, mapping component paths and CSS variables.
- **`tsconfig.json`**: TypeScript configuration, defining strict typing rules and path aliases (e.g., `@/*` maps to `./*`).
