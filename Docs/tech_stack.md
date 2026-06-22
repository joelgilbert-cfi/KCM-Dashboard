# Tech Stack

The application leverages a modern, React-based web stack optimized for rapid development and serverless deployment.

## Frontend
- **Framework**: Next.js 16.2.9 (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS v4
- **Component Library**: shadcn/ui (radix-ui primitives, cmdk, lucide-react)
- **Forms & Validation**: Controlled forms, typical React patterns

## Backend & Data
- **Backend Framework**: Next.js API Routes & Server Actions
- **Database**: PostgreSQL (hosted on Supabase)
- **Authentication**: Supabase Auth (integrated via `@supabase/ssr`)
- **Email Service**: Nodemailer (used for sending Closure Requests via `app/api/send-closure-email/route.ts`)

## Tooling
- **Language**: TypeScript (strict mode)
- **Linting**: ESLint (Next.js config)
- **Package Manager**: npm
