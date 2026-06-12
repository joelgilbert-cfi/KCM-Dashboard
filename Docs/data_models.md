# KCM Dashboard — Data Models

## Overview
The application uses Supabase PostgreSQL. There are 9 core tables.
For full TypeScript interfaces, see `lib/types.ts`.
For the raw SQL schema, see `supabase/migrations/001_create_tables.sql`.

## 1. Users (`users`)
Stores authenticated users and their roles (`finance`, `expansion`, `admin`).
- **Access**: Admin can edit.

## 2. Kitchen Master (`kitchen_master`)
Master list of all kitchens. A kitchen is uniquely identified by `cluster_marker` + `brand`.
- **Fields**: `cluster_marker`, `brand`, `kitchen_name`, `format`, `status`.
- **Access**: Expansion (Insert/Update), Finance (Select).
- **Note**: Soft deletion is used (`removed_at`). Changes are NOT tracked in the audit log.

## 3. Closure Requests (`closure_requests`)
Records closure initiation emails sent by BF.
- **Fields**: `requested_by`, `status` (Draft/Sent), `to_emails`, `cc_emails`, `email_sent_at`.
- **Access**: Finance (Insert/Update), Expansion (Select).

## 4. Closure Request Clusters (`closure_request_clusters`)
Links `closure_requests` to multiple clusters (`cluster_marker`).

## 5. Closure Tracker (`closure_tracker`)
Tracks the closure progress for each cluster. Fields map directly to the original "Kitchen Status" Excel sheet.
- **Fields**: `cluster_marker` (Unique), `kitchen_name`, `oracle_code`, `rent`, `lock_in`, etc.
- **Access**: Expansion (Insert/Update), Finance (Select).
- **Rule**: Closure tracking is done per *cluster*, not per brand.

## 6. Fixed Asset Register (`fixed_asset_register` / FAR)
Master list of physical assets, owned by Finance. Linked to a specific kitchen via `kitchen_id`.
- **Fields**: `asset_name`, `category`, `purchase_date`, `value`, `condition`, `current_status`.
- **Access**: Finance (Insert/Update/Delete), Expansion (Select).

## 7. Asset Movements (`asset_movements`)
Logs when an asset is moved (e.g., to a warehouse).
- **Fields**: `from_location`, `from_oracle_code`, `to_location`, `to_oracle_code`, `item_name`, `quantity`, `asset_id`.
- **Access**: Expansion (Insert), Both (Select).

## 8. Asset Sales (`asset_sales`)
Logs when an asset is sold to the secondary market.
- **Fields**: `asset_id`, `kitchen_id`, `item_name`, `quantity`, `sale_price`, `buyer`.
- **Access**: Expansion (Insert), Both (Select).

## 9. Audit Log (`audit_log`)
Automatically records every INSERT, UPDATE, DELETE to tracked tables via a PostgreSQL trigger (`log_audit`).
- **Fields**: `table_name`, `record_id`, `action`, `changed_by`, `old_data` (JSONB), `new_data` (JSONB).
- **Access**: Read-only for all users. Never written to from the frontend.
