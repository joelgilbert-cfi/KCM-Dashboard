# API Reference

The KCM Dashboard utilizes Next.js Route Handlers (`app/api/...`) for specific integrations that are better suited for REST-like endpoints rather than Server Actions.

## Endpoint: `/api/send-closure-email`
- **Method**: `POST`
- **Purpose**: Dispatches the closure notification email to the specified recipients using Nodemailer.
- **Request Body**:
  ```json
  {
    "requestId": "UUID",
    "to": ["email@example.com"],
    "cc": ["email2@example.com"],
    "clusters": ["CLUSTER_MARKER"]
  }
  ```
- **Process**:
  1. Validates the request data.
  2. Constructs the HTML email body.
  3. Uses `nodemailer` to send the email via the configured SMTP server (credentials in `.env.local`).
  4. Upon success, updates the `closure_requests` table status to `Sent` and records the `email_sent_at` timestamp.
- **Dependencies**: `nodemailer`.

## Endpoint: `/api/email-contacts`
- **Method**: `GET`
- **Purpose**: Fetches the list of standard and user-defined email contacts for the CC autocomplete field in the Closure Request form.
- **Response**: Array of `EmailContact` objects.

## Endpoint: `/api/admin/...`
- Various admin-related utility endpoints, if applicable. Mostly handled by Server Actions in the App Router architecture.

*Note: The majority of data fetching and mutation in this application is handled via Next.js Server Actions directly imported into Client Components, bypassing traditional API routes.*
