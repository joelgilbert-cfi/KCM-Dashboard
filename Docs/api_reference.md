# KCM Dashboard — API Reference

## Overview
As this is a Next.js App Router application relying heavily on Server Components and Server Actions directly querying Supabase, there is limited traditional REST API surface. 

## Internal API Routes
These routes exist within the Next.js `app/api` directory.

### `POST /api/send-closure-email`
Used to send a closure notification email to the specified recipients.

- **Request Body (JSON)**:
  - `request_id` (string): The UUID of the closure request.
  - `to_emails` (array of strings): Primary recipients.
  - `cc_emails` (array of strings): CC recipients.
  - `clusters` (array of objects): Detailed information about the clusters and nested brands to generate the email table.

- **Behavior**:
  1. Validates input.
  2. Constructs the HTML email template.
  3. Sends the email via the Resend API.
  4. Updates the `closure_requests` table to set `status = 'Sent'` and `email_sent_at = NOW()`.

- **Requires Auth**: Yes (handled via Supabase SSR).
