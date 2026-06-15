# KCM Dashboard — API Reference

## Overview
As this is a Next.js App Router application relying heavily on Server Components and Server Actions directly querying Supabase, there is limited traditional REST API surface. 

## Internal API Routes
These routes exist within the Next.js `app/api` directory.

### `POST /api/send-closure-email`
Used to send a closure notification email to the specified recipients.

- **Request Body (JSON)**:
  - `toEmails` (array of strings): Primary recipients.
  - `ccEmails` (array of strings): CC recipients.
  - `senderName` (string): Name used in the email signature.
  - `brands` (array of objects): Brand rows used to generate the email table.

- **Behavior**:
  1. Validates input.
  2. Constructs the HTML email template.
  3. Sends the email via Nodemailer using Gmail SMTP.
  4. Returns `{ success: true, messageId }` when Gmail accepts the message.

- **Requires Auth**: Yes (handled via Supabase SSR).
