# API Reference

The KCM Dashboard utilizes Next.js Route Handlers (`app/api/...`) for specific integrations that are better suited for REST-like endpoints rather than Server Actions.

## Endpoint: `/api/send-closure-email`
- **Method**: `POST`
- **Purpose**: Dispatches the closure notification email to the specified recipients using Nodemailer.
- **Request Body**:
  ```json
  {
    "toEmails": ["email@example.com"],
    "ccEmails": ["email2@example.com"],
    "senderName": "Sender Name",
    "brands": [
      {
        "cluster_marker": "1",
        "brand": "CFI",
        "kitchen_name": "BLR_WFD"
      }
    ]
  }
  ```
- **Process**:
  1. Validates the request data.
  2. Constructs the HTML email body.
  3. Uses Nodemailer with Gmail credentials from server-only environment variables.
  4. Returns `{ "success": true, "messageId": "..." }` after Gmail accepts the message.
- The calling UI logs or marks the closure request as `Sent` only after this endpoint succeeds.
- **Dependencies**: `nodemailer`.

## Endpoint: `/api/email-contacts`
- **Method**: `GET`
- **Query**: `q`, a partial name or email.
- **Purpose**: Searches active app users and manually maintained `email_contacts` for To/CC autocomplete.
- **Behavior**: Case-insensitive search, email deduplication, app-user priority, maximum 15 results.
- **Response**: `{ label, value, name, email, source }[]`.

## Endpoint: `/api/admin/create-user`
- **Method**: `POST`
- **Purpose**: Creates a Supabase Auth user and corresponding `users` row.
- **Request Body**: `{ name, email, password, role }`.
- **Role Values**: Lowercase `finance`, `expansion`, or `admin`.
- Rolls back the Auth account if profile creation fails.

## Endpoint: `/api/admin/delete-user`
- **Method**: `DELETE`
- **Purpose**: Removes another user's login access while retaining historical profile references.
- **Request Body**: `{ userId }`.
- Verifies the caller is an authenticated, active Admin.
- Rejects self-removal.
- Sets `users.deleted_at`, then deletes the Supabase Auth account.
- Restores `deleted_at` if Auth deletion fails.

Most table reads and ordinary RLS-protected mutations are made with the browser Supabase client. Service-role access is restricted to server route handlers that require administrative privileges.
