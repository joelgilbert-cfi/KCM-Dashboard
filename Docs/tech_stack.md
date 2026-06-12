# KCM Dashboard — Tech Stack

## Core Technologies
- **Framework**: Next.js 16.2.9 (App Router)
- **Language**: TypeScript 5
- **UI Framework**: React 19.2.4

## Database & Backend
- **Database**: PostgreSQL (hosted on Supabase)
- **Auth**: Supabase Auth (SSR `@supabase/ssr` & Client `@supabase/supabase-js`)
- **API**: Next.js Server Actions and Route Handlers

## Styling & UI Components
- **Styling**: Tailwind CSS 4 (`@tailwindcss/postcss`)
- **UI Library**: shadcn/ui (`shadcn`)
- **Base Components**: Base UI (`@base-ui/react`)
- **Theme**: `next-themes` (Dark/Light mode support)
- **Icons**: `lucide-react`
- **Class Merging**: `clsx`, `tailwind-merge`

## Utilities & External Services
- **Emails**: Resend API (`resend`) for sending closure notification emails.
- **Form/Input**: `react-select` (Creatable variant used for email tag inputs).

## Key Files
- `package.json`: Main dependencies.
- `tailwind.config.ts`: Defines custom colors (brand: navy #0D1F6E).
- `app/globals.css`: shadcn/ui CSS variables.
