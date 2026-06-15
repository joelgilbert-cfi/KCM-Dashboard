# Module: Closure Process

## Overview
The closure process is the primary workflow of the application, replacing scattered email chains and Excel trackers.

## Source Paths
- UI: `app/(dashboard)/closure-requests/`
- UI: `app/(dashboard)/cluster/[cluster_marker]/`
- API: `app/api/send-closure-email/`

## Phase 1: Initiation (Finance Team)
1. **Selection**: Finance selects one or more clusters to close.
2. **Drafting**: They enter To and CC emails using a creatable tag input (`react-select`).
3. **Preview**: A modal shows the generated email, listing every brand within the selected clusters.
4. **Sending**: Confirming triggers an email via Nodemailer + Gmail (`/api/send-closure-email`) and logs the event in `closure_requests` and `closure_request_clusters`.

## Phase 2: Tracking (Expansion Team)
1. **Dashboard**: The Expansion team views active closures on the main dashboard (`/dashboard`).
2. **Cluster Detail**: They navigate to a specific cluster (`/cluster/[cluster_marker]`) to update specific tracker fields (e.g., lock-in end date, last ops date).
3. **Storage**: Data is saved to the `kitchen_status` table.

## Notes
- See `data_models.md` for specific tracker fields.
- Tracking is strictly done at the **cluster** level, not the individual brand level.
