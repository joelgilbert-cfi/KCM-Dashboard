# Configuration & Environment

## Environment Variables
The application relies on environment variables for Supabase and third-party integrations. These are defined in `.env.local` (see `.env.local.example` for the template).

### Required Variables
- `NEXT_PUBLIC_SUPABASE_URL`: The Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The Supabase anonymous key (safe to expose to client).
- `RESEND_API_KEY`: API key for the Resend email service.

## Next.js Config
- **File**: `next.config.ts`
- Standard Next.js 16 setup.

## Styling Config
- **File**: `postcss.config.mjs`, `eslint.config.mjs`
- Uses Tailwind CSS v4, which typically relies heavily on standard PostCSS configuration and global CSS imports (`app/globals.css`).

## TypeScript Config
- **File**: `tsconfig.json`
- Standard strict Next.js TypeScript configuration with path aliases (`@/*` mapping to `./*`).
