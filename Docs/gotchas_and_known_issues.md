# KCM Dashboard — Gotchas and Known Issues

## 1. Kitchen Master Soft Deletes
The `kitchen_master` table relies on soft deletion (`removed_at`). Ensure all queries filtering for active kitchens explicitly check `removed_at IS NULL`. 

## 2. Cluster vs. Brand Tracking
A frequent point of confusion: Closures are tracked at the **cluster** level, not the brand level. A single cluster may house multiple brands. When the Business Finance team initiates a closure, they select the cluster, and the system automatically groups all associated brands from the `kitchen_master`.

## 3. Asset Migrations (CSV)
The `asset_movements.csv` has two major issues to keep in mind:
- **Missing Dates**: The CSV has no movement dates. Migrated rows will have `NULL` for `movement_date`.
- **Oracle Code Linking**: Legacy asset movements rely on `from_oracle_code` to link to the `closure_tracker`, not a direct reference to the `kitchen_master`.

## 4. Audit Log Exclusions
Changes to the `kitchen_master` table are **not** tracked in the `audit_log` by design. Only operational tracking tables (e.g., `closure_tracker`, `fixed_asset_register`) have the trigger applied.
