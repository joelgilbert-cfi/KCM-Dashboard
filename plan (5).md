# Kitchen Closure Management Dashboard — Full Project Plan

---

## Persona Prompt (paste this first when talking to an AI coder)

You are an expert full-stack developer specialising in Next.js, Supabase, and Tailwind CSS. You write clean, production-quality code with proper error handling, TypeScript types, and comments. You follow these principles:

- Always use TypeScript, never plain JavaScript
- Use Supabase for all database operations, authentication, and row-level security
- Use Next.js App Router (not Pages Router)
- Use shadcn/ui for all UI components — never build UI from scratch
- Use Tailwind CSS for all styling
- Use Nodemailer + Gmail SMTP for sending emails
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

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| UI Components | shadcn/ui + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Email Sending | Nodemailer + Gmail SMTP |
| Hosting | Vercel |
| Email Tag Input | react-select (Creatable) |
| Dark/Light Mode | next-themes |

---

## Branding & Theme

**Company:** Curefoods
**Logo:** White bold uppercase wordmark inside a white rounded rectangle, on a dark navy background.

### Color Palette

Derived from the Curefoods logo. Use these as Tailwind CSS custom colors and shadcn/ui CSS variables.

```
Primary navy:   #0D1F6E   ← main brand color (buttons, active nav, accents)
Navy dark:      #091559   ← hover states, dark mode sidebar
Navy light:     #1A3299   ← secondary accents
White:          #FFFFFF
Off-white:      #F4F6FB   ← light mode page background
Muted:          #E2E8F7   ← light mode borders, dividers
Text dark:      #0D1F6E   ← light mode primary text
Text muted:     #5B6FA6   ← light mode secondary text
Dark bg:        #080F33   ← dark mode page background
Dark surface:   #0D1A4A   ← dark mode cards, sidebar
Dark border:    #1A2B6B   ← dark mode dividers
```

### Tailwind Config (tailwind.config.ts)

```ts
colors: {
  brand: {
    DEFAULT: '#0D1F6E',
    dark:    '#091559',
    light:   '#1A3299',
  }
}
```

### shadcn/ui CSS Variables (globals.css)

```css
/* Light mode */
:root {
  --background:         240 33% 97%;   /* #F4F6FB */
  --foreground:         228 74% 24%;   /* #0D1F6E */
  --primary:            228 74% 24%;   /* #0D1F6E */
  --primary-foreground: 0 0% 100%;     /* white */
  --muted:              220 40% 90%;
  --muted-foreground:   225 35% 50%;
  --border:             220 40% 88%;
  --card:               0 0% 100%;
  --ring:               228 74% 24%;
}

/* Dark mode */
.dark {
  --background:         232 76% 12%;   /* #080F33 */
  --foreground:         0 0% 100%;     /* white */
  --primary:            228 60% 45%;   /* lighter navy for dark mode */
  --primary-foreground: 0 0% 100%;
  --muted:              228 65% 18%;
  --muted-foreground:   220 30% 65%;
  --border:             228 60% 25%;   /* #1A2B6B */
  --card:               228 70% 17%;   /* #0D1A4A */
  --ring:               228 74% 45%;
}
```

### Dark / Light Mode Toggle

- Use the `next-themes` package
- `ThemeProvider` wraps the entire app in `app/layout.tsx`
- Every page has a toggle button in the top-right of the navbar
- Toggle shows a Sun icon in dark mode, Moon icon in light mode (use lucide-react: `Sun` and `Moon`)
- Selected theme persists in localStorage automatically via next-themes
- System preference respected on first load (`defaultTheme="system"`)

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Navbar (present on every page after login)

```
[ CUREFOODS ]   Dashboard  Kitchen Master  Closure Requests  Assets  Audit Log    [ ☀️/🌙 ]  [ avatar ]
```

- Logo: white text on navy rounded pill — matches company logo
- Active nav item: navy background pill highlight
- Theme toggle: top-right, Sun ↔ Moon icon
- User avatar: shows initials, clicking shows role + logout option

---

## Important Domain Knowledge

### How kitchens are structured

A **cluster** is a physical building identified by a **cluster marker** (e.g. 41, 93, A135). Multiple brands operate inside it. Each brand's partition is an individual kitchen. Cluster marker + brand is the unique identifier for any kitchen.

Kitchen names are inconsistent across teams. The cluster marker is the only reliable identifier.

### Critical rule: BF always closes the WHOLE cluster
BF never closes just one brand. When they initiate a closure, the entire cluster (all brands inside) is closed together. All closure tracking fields (Last Ops Date, Last Rent Date, LL Clearance, SD etc.) are at the cluster level — not per brand.

### Why the email still lists individual brands
The closure email lists one row per brand so the receiver knows exactly which brand kitchens are inside. When BF selects a cluster, the system auto-fetches all brands from kitchen_master and generates the rows — BF does not manually pick brands.

### The closure process
1. BF selects cluster(s) on the website → adds To/CC emails → previews the email
2. Email preview auto-generates one row per brand under each selected cluster
3. BF clicks "Confirm & Send" → email fires via Nodemailer + Gmail → logged in the database
4. Discussion continues over email (Expansion team may push back or extend dates)
5. Expansion team updates the cluster's closure status on the website
6. Assets are logged as moved to warehouse or sold to second-hand market
7. All changes are automatically recorded in the audit log

### The Fixed Asset Register (FAR)
- Owned and edited by Finance only
- Master list of all assets — stored at the brand+cluster level (each brand has its own assets)
- Asset movements reference the FAR asset by ID — Expansion picks from a dropdown, no manual typing

### How Oracle Code works
Oracle Code is a cluster-level identifier used by the operations system (e.g. "CFIBOM006"). It lives in the closure_tracker table. Asset movements use Oracle Code to identify which kitchen assets came from — this is how the existing CSV data links assets to kitchens.

---

## Database Tables (9 total)

---

### 1. `users`
**Purpose:** Stores everyone who has a login. The `role` field controls what each person can see and edit throughout the whole application.

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

### 2. `kitchen_master`
**Purpose:** Master list of all kitchens. One row per brand per cluster. Directly mirrors the Kitchen Master CSV (4 columns). The Expansion team manages this — they can add, edit inline, and soft-delete rows. Finance can only view.

Columns come directly from the Kitchen Master CSV:
- `cluster_marker` — e.g. "1", "41", "A135"
- `brand` — e.g. "MLE", "KK", "CFI", "CZ", "Olio", "ROW"
- `kitchen_name` — e.g. "Hoodi", "BLR_HSR" (inconsistent, just stored as-is)
- `format` — "Cloud", "Cloud Kitchen", "Restaurant", "Kiosk", "B2B", "Franchise"

**No audit logging for this table — changes here are not tracked in audit_log.**

```sql
CREATE TABLE kitchen_master (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_marker TEXT NOT NULL,
  brand          TEXT NOT NULL,
  kitchen_name   TEXT,
  format         TEXT,
  status         TEXT NOT NULL DEFAULT 'Active'
                 CHECK (status IN ('Active', 'Under Closure', 'Closed')),
  added_by       UUID REFERENCES users(id),
  added_at       TIMESTAMPTZ DEFAULT NOW(),
  removed_at     TIMESTAMPTZ,    -- soft delete only, never hard delete
  UNIQUE (cluster_marker, brand)
);
```
**Access:** Expansion can INSERT, UPDATE. Finance can SELECT only.

---

### 3. `closure_requests`
**Purpose:** Records every closure request email event initiated by BF. One row = one email sent. Stores who sent it, when, and the To/CC addresses.

```sql
CREATE TABLE closure_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by  UUID REFERENCES users(id) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'Draft'
                CHECK (status IN ('Draft', 'Sent')),
  to_emails     TEXT[],     -- array of To addresses (manually entered)
  cc_emails     TEXT[],     -- array of CC addresses (manually entered)
  email_sent_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```
**Access:** Finance can INSERT and UPDATE. Expansion can SELECT only.

---

### 4. `closure_request_clusters`
**Purpose:** Links which clusters were in a closure request email. Separate from closure_requests because one email can cover multiple clusters.

```sql
CREATE TABLE closure_request_clusters (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     UUID REFERENCES closure_requests(id) NOT NULL,
  cluster_marker TEXT NOT NULL
);
```

---

### 5. `closure_tracker`
**Purpose:** Tracks closure progress for each cluster. One row per cluster under closure. All fields are cluster-level — no per-brand tracking. Columns map 1:1 to the Kitchen Status Excel sheet.

The `entity` field is informational only — a comma-separated list of brands in the cluster (e.g. "CFI, CZ, Olio"). It is not linked to kitchen_master.

```sql
CREATE TABLE closure_tracker (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity (from Excel cols A, B, C)
  cluster_marker        TEXT NOT NULL UNIQUE,
  kitchen_name          TEXT,           -- col A: "HSR - Arambam"
  oracle_code           TEXT,           -- col B: "CFIBLR022"

  -- Cluster info (cols D, E, F, G, H)
  rent                  NUMERIC(12, 2), -- col D
  city                  TEXT,           -- col E: "Bangalore", "Mumbai"
  zone                  TEXT,           -- col F: "South", "West"
  format                TEXT,           -- col G: "Restaurant", "Cloud"
  entity                TEXT,           -- col H: "CFI, CZ, Olio" (informational only)

  -- Status fields (cols I, J, K, L, M, N, O, P, Q)
  status_31_march       TEXT,           -- col I: "Yes" / "No"
  reason_for_change     TEXT,           -- col J: free text
  lock_in               TEXT,           -- col K: "Yes" / "No" / "Closed"
  lock_in_end_date      DATE,           -- col L
  ops_closed            TEXT,           -- col M: "Yes" / "No"
  last_ops_date         DATE,           -- col N
  last_rent_date        DATE,           -- col O
  ll_clearance          TEXT,           -- col P: "Yes" / "No"
  shut_suspend_continue TEXT,           -- col Q: "Done" / "Hold" (free text)

  -- Financial fields (cols R, S, T, U, V)
  dec_net_revenue       NUMERIC(12, 2), -- col R
  dec_ebitda            NUMERIC(12, 2), -- col S
  sd                    NUMERIC(12, 2), -- col T: Security Deposit
  sd_adjustment         NUMERIC(12, 2), -- col U
  sd_recovery           NUMERIC(12, 2), -- col V

  -- Remarks and other (cols W, X, Y, Z, AA, AB, AC, AD)
  remarks               TEXT,           -- col W: "LL Discussion in process"
  notice_period         TEXT,           -- col X: "60 days", "90 days"
  remarks_2             TEXT,           -- col Y: free text
  rental_hit_lock_in    NUMERIC(12, 2), -- col Z
  capex                 NUMERIC(12, 2), -- col AA
  framework             INTEGER,        -- col AB
  closure_phasing       INTEGER,        -- col AC
  hr_remarks            TEXT,           -- col AD: "Employees Transferred"

  updated_by            UUID REFERENCES users(id),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```
**Access:** Expansion can INSERT and UPDATE. Finance can SELECT only.

---

### 6. `fixed_asset_register` (FAR)
**Purpose:** Master list of all physical assets. Finance owned — only they can add, edit, delete. Expansion can view to pick assets when logging movements and sales. Each asset belongs to a specific brand+cluster kitchen (kitchen_master row).

Note: The FAR Excel has not been shared yet — columns below are based on standard FAR structure and should be confirmed with the Finance team before building.

```sql
CREATE TABLE fixed_asset_register (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitchen_id     UUID REFERENCES kitchen_master(id) NOT NULL,
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
**Access:** Finance can INSERT, UPDATE, DELETE. Expansion can SELECT only.

⚠️ **Action needed:** Get the actual FAR Excel from Finance and confirm exact column names before building this table.

---

### 7. `asset_movements`
**Purpose:** Logs every asset moved from a kitchen to a warehouse. Columns map directly to the Asset Movement CSV.

Key notes from the actual CSV:
- Source kitchen is identified by **Oracle Code** (not cluster_marker + brand)
- Destination is a warehouse name + warehouse Oracle Code
- The CSV has no date column — migrated rows will have NULL movement_date
- `kitchen_id` is nullable — NULL for migrated data (linked via oracle_code instead), filled for new entries going forward

```sql
CREATE TABLE asset_movements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- From the Asset Movement CSV (cols A, B, C, D, E, F)
  from_location     TEXT,           -- col A: "Katra" (kitchen name)
  from_oracle_code  TEXT,           -- col B: "CFIPUN003" (links to closure_tracker.oracle_code)
  to_location       TEXT,           -- col C: "Anangpura WH" (warehouse name)
  to_oracle_code    TEXT,           -- col D: "200002208" (warehouse oracle code)
  item_name         TEXT,           -- col E: "Ceiling fan", "Microwave"
  quantity          NUMERIC(10, 2), -- col F: 6, 1, 2

  -- For new entries going forward (not in CSV)
  movement_date     DATE,           -- NULL for migrated data
  asset_id          UUID REFERENCES fixed_asset_register(id), -- NULL for migrated data
  kitchen_id        UUID REFERENCES kitchen_master(id),       -- NULL for migrated data
  logged_by         UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```
**Access:** Expansion can INSERT. Both can SELECT.

⚠️ **Migration note:** The existing CSV has no date column. Confirm with the team if movement dates exist anywhere else, or if migrated rows should have a NULL date.

---

### 8. `asset_sales`
**Purpose:** Logs every asset sold to the second-hand market. The Asset Sales Excel has not been shared yet — columns below should be confirmed once the file is provided.

```sql
CREATE TABLE asset_sales (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID REFERENCES fixed_asset_register(id),
  kitchen_id UUID REFERENCES kitchen_master(id),
  item_name  TEXT,           -- for migrated data without FAR linkage
  quantity   NUMERIC(10, 2),
  sale_price NUMERIC(12, 2),
  buyer      TEXT,
  sale_date  DATE,
  notes      TEXT,
  logged_by  UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Access:** Expansion can INSERT. Both can SELECT.

⚠️ **Action needed:** Share the Asset Sales Excel so columns can be confirmed.

---

### 9. `audit_log`
**Purpose:** Automatically records every change to every tracked table. Nobody writes to this directly — a database trigger fires silently in the background on every INSERT, UPDATE, DELETE. Completely replaces back-and-forth emails for tracking changes.

**Tables tracked:** closure_tracker, fixed_asset_register, asset_movements, asset_sales, closure_requests.
**NOT tracked:** kitchen_master (intentionally excluded).

```sql
CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id  UUID NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  old_data   JSONB,    -- full row before the change
  new_data   JSONB     -- full row after the change
);
```
**Access:** Both roles can SELECT only. Nobody can INSERT, UPDATE, or DELETE.

---

## Summary: All 9 Tables

| # | Table | Source file | Managed by | Purpose |
|---|---|---|---|---|
| 1 | `users` | — | Admin | Logins and roles |
| 2 | `kitchen_master` | Kitchen_Master.csv | Expansion | All kitchens (brand + cluster) |
| 3 | `closure_requests` | — | Finance | Closure email events |
| 4 | `closure_request_clusters` | — | Finance | Which clusters per email |
| 5 | `closure_tracker` | Kitchen_Status.xlsx | Expansion | Cluster-level closure tracking |
| 6 | `fixed_asset_register` | FAR Excel (not shared yet) | Finance | Master list of all assets |
| 7 | `asset_movements` | Asset_Movement.csv | Expansion | Kitchen → Warehouse moves |
| 8 | `asset_sales` | Asset Sales Excel (not shared yet) | Expansion | Assets sold to market |
| 9 | `audit_log` | — | Automatic | Full change history |

---

## Audit Trigger

Write once — fires automatically on every change to tracked tables.

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

-- Attach to all tracked tables (NOT kitchen_master)
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

## Row Level Security (RLS)

```sql
-- kitchen_master
CREATE POLICY "expansion_manage_kitchen_master" ON kitchen_master
  USING (auth.jwt() ->> 'role' = 'expansion');
CREATE POLICY "finance_view_kitchen_master" ON kitchen_master
  FOR SELECT USING (auth.jwt() ->> 'role' = 'finance');

-- closure_tracker
CREATE POLICY "expansion_manage_closure_tracker" ON closure_tracker
  USING (auth.jwt() ->> 'role' = 'expansion');
CREATE POLICY "finance_view_closure_tracker" ON closure_tracker
  FOR SELECT USING (auth.jwt() ->> 'role' = 'finance');

-- fixed_asset_register
CREATE POLICY "finance_manage_far" ON fixed_asset_register
  USING (auth.jwt() ->> 'role' = 'finance');
CREATE POLICY "expansion_view_far" ON fixed_asset_register
  FOR SELECT USING (auth.jwt() ->> 'role' = 'expansion');

-- closure_requests
CREATE POLICY "finance_manage_closure_requests" ON closure_requests
  USING (auth.jwt() ->> 'role' = 'finance');
CREATE POLICY "expansion_view_closure_requests" ON closure_requests
  FOR SELECT USING (auth.jwt() ->> 'role' = 'expansion');

-- audit_log (read only for both)
CREATE POLICY "view_audit_log" ON audit_log
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('finance', 'expansion', 'admin')
  );
```

---

## Pages to Build

### 1. `/login`
Email + password login via Supabase Auth. All other pages are protected.

### 2. `/dashboard`
Overview cards: Total clusters under closure, Completed, On Hold, Pending. Table of all clusters in closure_tracker with key status columns. Clicking a row goes to `/cluster/[cluster_marker]`.

### 3. `/cluster/[cluster_marker]`
Full detail page for one cluster. Shows all brands in that cluster (from kitchen_master). Shows all closure_tracker fields — editable by Expansion. Tabs: Overview | Assets | Movements | Sales | Audit Log.

### 4. `/kitchens`
Kitchen Master page. Full list — columns: Cluster Marker, Brand, Kitchen Name, Format, Status.

Each row has:
- **Pencil icon (left)** — clicking turns the row into inline editable inputs. Save / Cancel buttons appear. One row editable at a time.
- **Delete icon (right)** — soft delete (sets removed_at). Never hard deletes.

Expansion can add new rows via "+ Add Row". Finance can only view — no edit or delete icons shown. Search and filter by cluster marker, brand, format, status.

No audit logging for kitchen_master.

### 5. `/closure-requests/new`
Finance only. Select clusters from a searchable list. Add To and CC addresses using react-select Creatable. Preview modal shows exact email with one row per brand per selected cluster. "Confirm & Send" fires the email via Nodemailer + Gmail.

### 6. `/closure-requests`
History of all closure emails sent. Expandable rows show which clusters and brands were in each email.

### 7. `/assets`
Three tabs: FAR | Movements | Sales. Finance manages FAR. Expansion logs movements and sales by picking assets from FAR dropdown.

### 8. `/audit-log`
Full change history. Filter by table, action, user, date range, cluster marker.

### 9. `/settings`
Admin only. Manage users and roles. Manage brand dropdown list.

---

## Email Template

BF selects clusters. System auto-generates one row per brand.

```
Subject: Kitchen Closure Request — [DD MMM YYYY]

Hi Team,

Please find below the list of kitchens identified for closure:

| Cluster Marker | Brand | Kitchen Name        |
|----------------|-------|---------------------|
| 41             | MLE   | Brookfield          |
| 41             | KK    | KK Cloud Brookfield |
| 41             | CFI   | BLR Brookfield      |
| 93             | KK    | KK Cloud Okhla      |
| 93             | CFI   | DEL Okhla Kitchen   |

Please review and update the status on the dashboard: [APP_URL]

Regards,
[Sender Name]
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GMAIL_USER=
GMAIL_APP_PASSWORD=
EMAIL_FROM_NAME=Kitchen Closure
NEXT_PUBLIC_APP_URL=
```

---

## Folder Structure

```
/app
  /login
  /dashboard
  /cluster/[cluster_marker]
  /kitchens
  /closure-requests
    /new
    /page.tsx
  /assets
  /audit-log
  /settings
  /api
    /send-closure-email

/components
  /ui                          → shadcn/ui (auto-generated)
  /kitchen-master-table.tsx    → Table with inline edit + soft delete
  /closure-tracker-form.tsx    → Expansion team edit form
  /email-tag-input.tsx         → react-select creatable for To/CC
  /email-preview-modal.tsx     → Preview modal before sending
  /audit-log-table.tsx
  /asset-form.tsx

/lib
  /supabase.ts
  /types.ts
  /utils.ts

/hooks
  /use-user.ts
  /use-kitchen-master.ts
  /use-closure-tracker.ts
```

---

## Build Order

1. Set up Next.js + shadcn/ui + Supabase connection
2. Create all 9 tables + audit trigger + RLS in Supabase
3. Login page + auth middleware
4. Kitchen Master page (`/kitchens`) — inline edit + soft delete
5. Dashboard (`/dashboard`)
6. Cluster Detail page (`/cluster/[cluster_marker]`)
7. Closure Request flow (`/closure-requests/new` + Nodemailer + Gmail)
8. Assets section (`/assets`)
9. Audit Log (`/audit-log`)
10. Settings (`/settings`)

---

## Key Business Rules

- `cluster_marker + brand` must be unique in kitchen_master — DB constraint + clear UI error
- Never hard delete — always soft delete (set removed_at)
- Kitchen Master rows are inline editable — pencil icon per row, one row editable at a time
- Kitchen Master changes are NOT in the audit log
- BF selects clusters — system auto-generates brand rows for the email
- Only Finance edits FAR — RLS at DB level, edit buttons hidden in UI for Expansion
- Only Expansion edits Kitchen Master and Closure Tracker
- Audit log is read-only — never written to from the frontend
- When an asset movement or sale is logged, automatically update current_status in fixed_asset_register
- Email only fires after BF explicitly clicks "Confirm & Send" in the preview modal

---

## Data Migration (one-time before go-live)

### Import order (must follow — FK dependencies)
1. `users` — create accounts in Supabase Auth manually
2. `kitchen_master` — import directly from Kitchen_Master.csv
3. `closure_tracker` — import from Kitchen_Status.xlsx
4. `fixed_asset_register` — import from FAR Excel (not shared yet)
5. `asset_movements` — import from Asset_Movement.csv
6. `asset_sales` — import from Asset Sales Excel (not shared yet)

### Kitchen_Master.csv — cleaning needed
- Standardise format: "Cloud Kitchen" → "Cloud"
- Decide with team: should cluster 0 (B2B/Franchise) rows be included?
- "(blank)" kitchen names → import as NULL

### Kitchen_Status.xlsx — mostly clean
- Two columns named "Remarks" (cols W and Y) → map to remarks and remarks_2
- Date columns (lock_in_end_date, last_ops_date, last_rent_date) — stored as Excel serial numbers, convert to proper dates

### Asset_Movement.csv — two issues to resolve before migrating
- ⚠️ No date column — confirm with team if dates exist elsewhere, otherwise migrated rows will have NULL movement_date
- ⚠️ Uses Oracle Code (not cluster_marker + brand) — from_oracle_code links to closure_tracker.oracle_code, not directly to kitchen_master

### After go-live
All new data goes through the website only. Nobody touches the database directly.
