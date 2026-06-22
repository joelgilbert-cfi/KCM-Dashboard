# Closure Requests Module

## Overview
Automates the process of notifying stakeholders when a kitchen closure is initiated. It drafts an email, selects relevant clusters, manages recipients, and dispatches via Nodemailer.

## Data Model
Backed by two tables:
- `closure_requests`: Tracks the overall request state (`Draft`, `Sent`), recipients (`to_emails`, `cc_emails`), and timestamps.
- `closure_request_clusters`: Maps the request to specific kitchen `cluster_marker`s.

## Workflow
1. **Drafting**: An `expansion` or `admin` user selects the kitchens (clusters) they wish to send a closure notification for.
2. **Recipient Selection**: The user enters the "To" emails (often default stakeholders) and "CC" emails. The "CC" field features an autocomplete that queries the `email_contacts` table.
3. **Dispatch**: Upon confirmation, the Next.js Client Component invokes the `/api/send-closure-email` route handler.
4. **Sending**: The API handler constructs the email body with the selected cluster details and sends it via Nodemailer.
5. **Completion**: The `status` in `closure_requests` is updated to `Sent`.

## Dependencies
- Relies on the `email_contacts` table for the autocomplete feature.
- Relies on `kitchen_master` and `kitchen_status` for the details included in the email payload.
