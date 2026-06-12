# Development Setup

## Prerequisites
- Node.js (v20+ recommended)
- npm, yarn, pnpm, or bun
- A Supabase project
- A Resend account (for emails)

## Local Setup Steps

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:**
   - Copy `.env.local.example` to `.env.local`.
   - Fill in your Supabase URL, Anon Key, and Resend API Key.
4. **Database Setup:**
   - Run the contents of `supabase-schema.sql` in your Supabase SQL Editor to create tables, triggers, and RLS policies.
5. **Run the development server:**
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Migrations
Currently, the schema is maintained via the `supabase-schema.sql` file. For local development, apply this file directly to your Supabase instance.
