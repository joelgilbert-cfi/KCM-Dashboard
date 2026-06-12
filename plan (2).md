# Kitchen Closure Management Dashboard — Full Project Plan

---

## Persona Prompt (paste this first when talking to an AI coder)

You are an expert full-stack developer specialising in Next.js, Supabase, and Tailwind CSS. You write clean, production-quality code with proper error handling, TypeScript types, and comments. You follow these principles:

- Always use TypeScript, never plain JavaScript
- Use Supabase for all database operations, authentication, and row-level security
- Use Next.js App Router (not Pages Router)
- Use shadcn/ui for all UI components — never build UI from scratch
- Use Tailwind CSS for all styling
- Use Resend for sending emails
- Use react-select (creatable) for email tag inputs
- Write modular code — one component per file, one concern per function
- Always handle loading states, empty states, and error states in the UI
- Never hardcode secrets — use environment variables
- When creating database queries, always use Supabase's typed client

When I give you a task, first confirm your understanding of what needs to be built, then build it step by step. Ask clarifying questions if anything is ambiguous before writing code.

---

## Project Overview

**What we are building:** A centralised internal web dashboard that replaces 6 scattered Excel sheets and endless back-and-forth emails between the Business Finance (BF) team and the Expansion team during the kitchen closure process.

**The core problem being solved:**
- The BF team sends manual emails to the Expansion team to initiate kitchen closures
- Status updates are tracked in a shared Excel sheet that is hard to keep up to date
- Asset tracking (movements and sales) is done in two separate Excel sheets
- The Fixed Asset Register (FAR) is a separate Finance-owned Excel sheet
- There is no audit trail of who changed what and when
- Back-and-forth emails cause confusion and delays

**Who uses it:**
| Role | What they do |
|---|---|
| Business Finance (BF) | Initiates closure requests, manages the Fixed Asset Register |
| Expansion | Updates closure statuses, manages kitchen master, logs asset movements and sales |
| Both | View the dashboard in real time |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Works perfectly with Vercel, great ecosystem |
| UI Components | shadcn/ui + Tailwind CSS | Clean professional look, no custom CSS needed |
| Database | Supabase (PostgreSQL) | Free tier, built-in auth, auto-generated API |
| Authentication | Supabase Auth | Role-based access, free |
| Email Sending | Resend | Free tier 3000 emails/month, works great with Next.js |
| Hosting | Vercel | Free tier, one-click deploy, made for Next.js |
| Email Input | react-select (Creatable) | Gmail-style tag input with autocomplete |

---

## Important Domain Knowledge

### How kitchens are structured

A **cluster kitchen** is a physical building. Multiple brands operate inside it in partitioned spaces. Each brand's partition is an individual kitchen.

```
Cluster 41 — Brookfield, Bangalore
  ├── MLE    (one kitchen)
  ├── KK     (one kitchen)
  ├── CFI    (one kitchen)
  ├── CZ     (one kitchen)
  ├── Olio   (one kitchen)
  └── ROW    (one kitchen)
```

**Cluster Marker**: unique identifier for the physical building. Can be numeric (41, 93, 121) or alphanumeric (A135, A63).
**Brand**: text code e.g. MLE, KK, CFI, CZ, Olio, ROW. List is not exhaustive — more brands exist.

Kitchen names are **not consistent** — the Expansion team and Finance use different names for the same cluster. The cluster marker is the only reliable identifier.

### Critical rule: BF always closes the WHOLE cluster

BF never decides to close just one brand within a cluster. When they initiate a closure, they close the **entire cluster kitchen** (all brands inside it together).

This means:
- There is no per-brand closure decision
- Last Ops Date, Last Rent Date, LL Clearance, SD — all tracked at the **cluster level**
- No separate tracking needed per brand

### Why the email still lists individual brands

Even though BF closes the whole cluster, the closure email still lists one row per brand. This is purely so the email receiver can see exactly which brand kitchens are inside that cluster and plan accordingly.

**When BF selects Cluster 41 for closure:**
```
The system automatically fetches all brands under cluster 41
and generates one row per brand in the email:

| Cluster Marker | Brand | Kitchen Name       | City      |
|----------------|-------|--------------------|-----------|
| 41             | MLE   | Brookfield         | Bangalore |
| 41             | KK    | KK Cloud Brookfield| Bangalore |
| 41             | CFI   | BLR Brookfield     | Bangalore |
| 41             | CZ    | Brookfield         | Bangalore |
| 41             | Olio  | BLR Brookfield     | Bangalore |
| 41             | ROW   | BLR Brookfield     | Bangalore |
```

BF selects the **cluster** — the system handles generating the brand rows automatically.

### The closure process
1. BF team decides certain cluster kitchens need to be closed
2. BF selects clusters on the website, adds To/CC email addresses, previews the email
3. The preview shows a table with one row per brand under each selected cluster
4. BF clicks "Confirm & Send" — website fires the email automatically via Resend
5. Discussion continues over email (Expansion team may push back, extensions may be granted)
6. Once decided, the Expansion team updates the cluster's closure status on the website
7. Expansion team tracks: Last Ops Date, Last Rent Date, LL Clearance, SD, SD Adjustment, SD Recovery, Lock-in, On Hold etc.
8. Assets inside the cluster are either moved to a warehouse or sold to the second-hand market
9. All changes are automatically logged in the audit trail

### The Fixed Asset Register (FAR)
- Owned and edited by Finance only
- Master list of all assets — stored at the brand+cluster level (each brand has its own assets)
- When the Expansion team logs a movement or sale, they pick the asset from the FAR via a dropdown — no manual typing

---

## Database Schema

The database has **10 tables** in total.

### Table 1: `users`
```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('finance', 'expansion', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Table 2: `clusters`
One row per physical building. The primary unit of closure.
```sql
CREATE TABLE clusters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_marker TEXT UNIQUE NOT NULL,  -- "41", "93", "A135" — always unique
  oracle_code    TEXT,
  ops_name       TEXT,                  -- name the Expansion team uses
  finance_name   TEXT,                  -- name Finance uses
  rent           NUMERIC(12, 2),
  city           TEXT,
  zone           TEXT,                  -- "South", "North", "West", "East", "Central"
  format         TEXT CHECK (format IN ('Cloud', 'Restaurant', 'Takeaway')),
  status         TEXT NOT NULL DEFAULT 'Active'
                 CHECK (status IN ('Active', 'Under Closure', 'Closed')),
  added_by       UUID REFERENCES users(id),
  added_at       TIMESTAMPTZ DEFAULT NOW(),
  removed_at     TIMESTAMPTZ            -- soft delete only, never hard delete
);
```
**Access:** Expansion team can INSERT and UPDATE. Finance can SELECT only.

---

### Table 3: `kitchens`
One row per brand within a cluster. Used for asset tracking (FAR, movements, sales).
```sql
CREATE TABLE kitchens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id UUID REFERENCES clusters(id) NOT NULL,
  brand      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'Active'
             CHECK (status IN ('Active', 'Under Closure', 'Closed')),
  added_by   UUID REFERENCES users(id),
  added_at   TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,               -- soft delete only
  UNIQUE (cluster_id, brand)
);
```
**Access:** Expansion team can INSERT and UPDATE. Finance can SELECT only.

---

### Table 4: `closure_requests`
One row per closure email event sent by BF.
```sql
CREATE TABLE closure_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by  UUID REFERENCES users(id) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'Draft'
                CHECK (status IN ('Draft', 'Sent')),
  to_emails     TEXT[],                 -- manually entered To addresses
  cc_emails     TEXT[],                 -- manually entered CC addresses
  email_sent_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```
**Access:** Finance can INSERT and UPDATE. Expansion team can SELECT only.

---

### Table 5: `closure_request_clusters`
Links which clusters were included in a closure request email.
One closure email can include multiple clusters.
```sql
CREATE TABLE closure_request_clusters (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES closure_requests(id) NOT NULL,
  cluster_id UUID REFERENCES clusters(id) NOT NULL
);
```

---

### Table 6: `closure_tracker`
Cluster-level closure tracking. One row per cluster under closure.
All fields here are shared across all brands in the cluster — there is no per-brand tracking.
```sql
CREATE TABLE closure_tracker (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id         UUID REFERENCES clusters(id) NOT NULL,
  ops_closed         BOOLEAN DEFAULT FALSE,
  last_ops_date      DATE,
  last_rent_date     DATE,
  ll_clearance       BOOLEAN,           -- Landlord clearance: true = cleared
  lock_in            TEXT CHECK (lock_in IN ('Yes', 'No', 'Closed')),
  lock_in_end_date   DATE,
  sd                 NUMERIC(12, 2),    -- Security Deposit amount
  sd_adjustment      NUMERIC(12, 2),
  sd_recovery        NUMERIC(12, 2),
  notice_period      TEXT,              -- "60 days", "90 days", "180 days"
  dec_net_revenue    NUMERIC(12, 2),
  dec_ebitda         NUMERIC(12, 2),
  rental_hit_lock_in NUMERIC(12, 2),
  capex              NUMERIC(12, 2),
  framework          INTEGER,
  closure_phasing    INTEGER,
  hr_remarks         TEXT,
  remarks            TEXT,
  on_hold            BOOLEAN DEFAULT FALSE,
  progress           TEXT CHECK (progress IN ('Initiated', 'In Progress', 'Completed')),
  updated_by         UUID REFERENCES users(id),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
```
**Access:** Expansion team can INSERT and UPDATE. Finance can SELECT only.

---

### Table 7: `fixed_asset_register` (FAR)
Master list of all assets. Owned by Finance. Assets belong to a specific brand+cluster kitchen.
```sql
CREATE TABLE fixed_asset_register (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id     UUID REFERENCES kitchens(id) NOT NULL,
  asset_name     TEXT NOT NULL,
  category       TEXT,
  purchase_date  DATE,
  value          NUMERIC(12, 2),
  condition      TEXT CHECK (condition IN ('Good', 'Fair', 'Poor', 'Damaged')),
  current_status TEXT DEFAULT 'In Kitchen'
                 CHECK (current_status IN ('In Kitchen', 'Moved to Warehouse', 'Sold', 'Disposed')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
```
**Access:** Finance can INSERT, UPDATE, DELETE. Expansion team can SELECT only.

---

### Table 8: `asset_movements`
Logs when an asset is moved from a kitchen to a warehouse.
```sql
CREATE TABLE asset_movements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id      UUID REFERENCES fixed_asset_register(id) NOT NULL,
  kitchen_id    UUID REFERENCES kitchens(id) NOT NULL,
  moved_to      TEXT NOT NULL,
  movement_date DATE NOT NULL,
  notes         TEXT,
  logged_by     UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```
**Access:** Expansion team can INSERT. Both can SELECT.

---

### Table 9: `asset_sales`
Logs when an asset is sold to the second-hand market.
```sql
CREATE TABLE asset_sales (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID REFERENCES fixed_asset_register(id) NOT NULL,
  kitchen_id UUID REFERENCES kitchens(id) NOT NULL,
  sale_price NUMERIC(12, 2),
  buyer      TEXT,
  sale_date  DATE NOT NULL,
  notes      TEXT,
  logged_by  UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Access:** Expansion team can INSERT. Both can SELECT.

---

### Table 10: `audit_log`
Automatic. Never edited directly. Populated by database triggers on every change.
```sql
CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id  UUID NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  old_data   JSONB,
  new_data   JSONB
);
```

---

### Audit Trigger (attach to all tables except audit_log)
```sql
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_clusters
  AFTER INSERT OR UPDATE OR DELETE ON clusters
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_kitchens
  AFTER INSERT OR UPDATE OR DELETE ON kitchens
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_closure_tracker
  AFTER INSERT OR UPDATE OR DELETE ON closure_tracker
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_far
  AFTER INSERT OR UPDATE OR DELETE ON fixed_asset_register
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_asset_movements
  AFTER INSERT OR UPDATE OR DELETE ON asset_movements
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_asset_sales
  AFTER INSERT OR UPDATE OR DELETE ON asset_sales
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_closure_requests
  AFTER INSERT OR UPDATE OR DELETE ON closure_requests
  FOR EACH ROW EXECUTE FUNCTION log_audit();
```

---

## Row Level Security (RLS) Rules

Enable RLS on all tables in Supabase.

```sql
-- Clusters: Expansion manages, Finance views
CREATE POLICY "expansion_manage_clusters" ON clusters
  USING (auth.jwt() ->> 'role' = 'expansion');
CREATE POLICY "finance_view_clusters" ON clusters
  FOR SELECT USING (auth.jwt() ->> 'role' = 'finance');

-- Kitchens: Expansion manages, Finance views
CREATE POLICY "expansion_manage_kitchens" ON kitchens
  USING (auth.jwt() ->> 'role' = 'expansion');
CREATE POLICY "finance_view_kitchens" ON kitchens
  FOR SELECT USING (auth.jwt() ->> 'role' = 'finance');

-- FAR: Finance manages, Expansion views
CREATE POLICY "finance_manage_far" ON fixed_asset_register
  USING (auth.jwt() ->> 'role' = 'finance');
CREATE POLICY "expansion_view_far" ON fixed_asset_register
  FOR SELECT USING (auth.jwt() ->> 'role' = 'expansion');

-- Closure tracker: Expansion manages, Finance views
CREATE POLICY "expansion_manage_closure" ON closure_tracker
  USING (auth.jwt() ->> 'role' = 'expansion');
CREATE POLICY "finance_view_closure" ON closure_tracker
  FOR SELECT USING (auth.jwt() ->> 'role' = 'finance');

-- Closure requests: Finance manages, Expansion views
CREATE POLICY "finance_manage_requests" ON closure_requests
  USING (auth.jwt() ->> 'role' = 'finance');
CREATE POLICY "expansion_view_requests" ON closure_requests
  FOR SELECT USING (auth.jwt() ->> 'role' = 'expansion');

-- Audit log: both roles view, nobody edits
CREATE POLICY "view_audit_log" ON audit_log
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('finance', 'expansion', 'admin')
  );
```

---

## Pages to Build

### 1. `/login`
- Email + password login via Supabase Auth
- Redirects to `/dashboard` on success
- All other pages are protected

### 2. `/dashboard`
- Overview cards: Total clusters under closure, Completed, On Hold, Pending
- Table of all clusters currently under closure with key statuses
- Filter by: status, city, zone, on_hold
- Both Finance and Expansion can view
- Clicking a cluster row goes to `/cluster/[id]`

### 3. `/cluster/[id]`
- Full detail page for one cluster
- Top section: cluster-level closure data (rent, LL clearance, SD, dates, lock-in) — editable by Expansion team
- Brand list section: shows all brands in this cluster (from `kitchens` table) — read only, informational
- Tabs: Overview | Assets | Movements | Sales | Audit Log

### 4. `/kitchens` (Kitchen Master)
- Full list of all clusters, each expandable to show brands inside
- Expansion team can add a new cluster (cluster marker, oracle code, ops name, finance name, rent, city, zone, format)
- Within each cluster, Expansion team can add or remove brands
- Soft delete only — never hard delete
- Finance can only view
- Search and filter by cluster marker, city, zone, brand, status

### 5. `/closure-requests/new`
- Only accessible to Finance role
- Multi-select clusters from a searchable list (not individual brands — always the whole cluster)
- To field: react-select Creatable — autocomplete from `users` table, or type any email manually
- CC field: same component
- "Preview Email" button → modal showing exactly how the email will look
- Preview auto-generates one row per brand under each selected cluster
- "Confirm & Send" button in modal → fires email via Resend, saves to `closure_requests` and `closure_request_clusters`

### 6. `/closure-requests`
- History of all closure emails sent
- Shows: date sent, sent by, number of clusters, To/CC addresses
- Clicking a row expands to show which clusters (and their brands) were in that email

### 7. `/assets`
- Tabbed view: FAR | Movements | Sales
- FAR tab: Finance adds/edits/deletes. Expansion views only. Filter by cluster, brand, category, status.
- Movements tab: Expansion logs new movement — picks asset from FAR dropdown, enters warehouse destination and date
- Sales tab: Expansion logs new sale — picks asset from FAR dropdown, enters price, buyer, date

### 8. `/audit-log`
- Full audit trail
- Filter by: table, action (INSERT/UPDATE/DELETE), user, date range, cluster
- Shows: what changed, old value vs new value, who, when

### 9. `/settings`
- Admin only
- Manage users: add, deactivate, change role
- Manage brand list: the dropdown of brand codes shown when adding kitchens

---

## Email Template (sent via Resend)

BF selects clusters. The system auto-generates one row per brand under each selected cluster.

```
Subject: Kitchen Closure Request — [DD MMM YYYY]

Hi Team,

Please find below the list of kitchens identified for closure:

| Cluster Marker | Brand | Kitchen Name        | City      |
|----------------|-------|---------------------|-----------|
| 41             | MLE   | Brookfield          | Bangalore |
| 41             | KK    | KK Cloud Brookfield | Bangalore |
| 41             | CFI   | BLR Brookfield      | Bangalore |
| 41             | CZ    | Brookfield          | Bangalore |
| 41             | Olio  | BLR Brookfield      | Bangalore |
| 41             | ROW   | BLR Brookfield      | Bangalore |
| 93             | KK    | KK Cloud Okhla      | Delhi     |
| 93             | CFI   | DEL Okhla Kitchen   | Delhi     |
| 93             | Olio  | DEL Okhla Kitchen   | Delhi     |

Kindly review and update the status on the dashboard at [website URL].

Regards,
[Sender Name]
[Sender Email]
```

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## Folder Structure

```
/app
  /login
  /dashboard
  /cluster/[id]
  /kitchens
  /closure-requests
    /new
    /page.tsx
  /assets
  /audit-log
  /settings
  /api
    /send-closure-email       → API route that calls Resend

/components
  /ui                         → shadcn/ui components (auto-generated)
  /cluster-table.tsx          → Cluster list with expandable brand rows
  /closure-tracker-form.tsx   → Expansion team cluster-level edit form
  /email-tag-input.tsx        → react-select creatable for To/CC fields
  /email-preview-modal.tsx    → Preview modal (auto-generates brand rows)
  /audit-log-table.tsx
  /asset-form.tsx

/lib
  /supabase.ts
  /types.ts
  /utils.ts

/hooks
  /use-user.ts
  /use-clusters.ts
  /use-kitchens.ts
```

---

## Build Order (do one step at a time)

1. Set up Next.js project + install shadcn/ui + connect Supabase
2. Create all 10 tables in Supabase + set up audit trigger + RLS policies
3. Build login page and auth middleware (protect all routes)
4. Build Kitchen Master page (`/kitchens`) — clusters and brands — foundation for everything
5. Build Dashboard page (`/dashboard`)
6. Build Cluster Detail page (`/cluster/[id]`) with closure_tracker editing
7. Build Closure Request flow (`/closure-requests/new`) — cluster selection, email preview auto-generating brand rows, Resend integration
8. Build Assets section (`/assets` — FAR + movements + sales)
9. Build Audit Log page (`/audit-log`)
10. Build Settings/Admin page (`/settings`)

---

## Key Business Rules to Enforce in Code

- `cluster_marker` must be unique in `clusters` — DB constraint + clear UI error
- `cluster_id + brand` must be unique in `kitchens` — DB constraint
- Never hard delete a cluster or kitchen — always soft delete (set `removed_at`)
- BF always closes the whole cluster — the closure request UI lets BF select clusters, not individual brands
- The email preview auto-generates one row per brand under each selected cluster — BF does not manually add brand rows
- Only Finance can edit the FAR — RLS in Supabase + hide edit buttons in UI for Expansion
- Only Expansion can edit the Kitchen Master and Closure Tracker
- The audit log is read-only — never write to it from the frontend
- When an asset is logged in `asset_movements` or `asset_sales`, automatically update `current_status` in `fixed_asset_register`
- Email fires only after BF explicitly clicks "Confirm & Send" in the preview modal

---

## Data Migration Plan (one-time before go-live)

**Import order — must follow this sequence due to FK dependencies:**
1. `users` — create accounts in Supabase Auth manually
2. `clusters` — from Kitchen Master Excel (one row per unique cluster marker)
3. `kitchens` — from Kitchen Master Excel (one row per brand per cluster)
4. `closure_tracker` — from Kitchen Status Excel (cluster-level columns only)
5. `fixed_asset_register` — from FAR Excel (Finance provides)
6. `asset_movements` — from Asset Movement Excel
7. `asset_sales` — from Asset Sales Excel

**How to import:**
- Export each Excel sheet as CSV
- Clean data first: standardise cluster markers, fill blanks, fix date formats
- Use Supabase CSV import for clean sheets
- Write a one-time Python script for the Kitchen Status Excel since the Entity column has multiple brands in one cell — these need to be split and matched to individual `kitchens` rows

**After go-live:** All new data is entered through the website only. Nobody touches the database directly.
