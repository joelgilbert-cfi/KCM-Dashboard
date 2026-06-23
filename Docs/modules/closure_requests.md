# Closure Requests Module

## Overview
Automates the process of notifying stakeholders when a kitchen closure is initiated. It drafts an email, selects relevant clusters, manages recipients, and dispatches via Nodemailer.

## Data Model
Backed by two tables:
- `closure_requests`: Tracks the overall request state (`Draft`, `Sent`), recipients (`to_emails`, `cc_emails`), and timestamps.
- `closure_request_clusters`: Maps the request to specific kitchen `cluster_marker`s.

## Workflow
1. **Drafting**: A `finance` or `admin` user selects the kitchens/clusters to include.
2. **Recipient Selection**: To and CC use the shared Gmail-like autocomplete, which searches active app users and `email_contacts`. Valid one-off email addresses are also accepted.
3. **Dispatch**: Upon confirmation, the Next.js Client Component invokes the `/api/send-closure-email` route handler.
4. **Sending**: The API handler constructs the email body with the selected cluster details and sends it via Nodemailer.
5. **Completion**: The request is marked `Sent` only after the email API succeeds. Failed sends remain Draft or are not logged as Sent.

## Dependencies
- Relies on active `users` and `email_contacts` for autocomplete suggestions.
- Relies on `kitchen_master` and `kitchen_status` for the details included in the email payload.
- Uses `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `EMAIL_FROM_NAME`.
