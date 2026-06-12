# KCM Dashboard — Developer Setup

## Prerequisites
- Node.js (v20+)
- npm or pnpm
- A Supabase project
- A Resend account

## Local Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   - Copy `.env.local.example` to `.env.local`.
   - Fill in your Supabase credentials and Resend API key.

3. **Database Setup**
   - Apply the migrations located in `supabase/migrations/` to your Supabase project.
   - Run the files in numerical order:
     1. `001_create_tables.sql` (Creates tables and RLS)
     2. `002_audit_trigger.sql` (Creates audit triggers)
     3. `003_rls_policies.sql` (Sets up specific access policies)

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Working with Tailwind & shadcn/ui
- When adding new shadcn/ui components, use the CLI: `npx shadcn@latest add [component]`
- Styling is defined using utility classes and grouped in `tailwind.config.ts`.
