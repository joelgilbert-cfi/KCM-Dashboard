# Development Setup

Follow these steps to set up the KCM Dashboard locally.

## Prerequisites
- Node.js (v20+)
- npm, yarn, pnpm, or bun
- A Supabase project (or local Supabase instance)

## 1. Clone & Install
```bash
git clone https://github.com/joelgilbert-cfi/KCM-Dashboard.git
cd "KCM Dashboard/V1"
npm install
```

## 2. Environment Configuration
Copy the example environment file and populate it with your Supabase credentials:
```bash
cp .env.local.example .env.local
```
Fill in the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 3. Database Setup
1. Open the Supabase SQL Editor in your project.
2. Execute the scripts found in `supabase/migrations/` in numerical order (e.g., `001_create_tables.sql`, `002_audit_trigger.sql`, etc.) to establish the schema, RLS policies, and triggers.

## 4. Run the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

## 5. Deployment
The application is optimized for deployment on Vercel. Connect the GitHub repository to Vercel and ensure the environment variables from `.env.local` are mirrored in the Vercel project settings.
