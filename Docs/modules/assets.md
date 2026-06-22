# Assets Module

## Overview
Manages the physical assets located within kitchens, tracking their lifecycle from active use through to movement or sale during a closure.

## Data Model
Backed by three tables:
1. `fixed_asset_register` (FAR): The primary inventory list. Records `asset_name`, `value`, `condition` (`Good`, `Fair`, `Poor`, `Damaged`), and `current_status` (`In Kitchen`, `Moved to Warehouse`, `Sold`, `Disposed`).
2. `asset_movements`: A log of assets transferred from one location to another (e.g., to a central warehouse).
3. `asset_sales`: A log of assets sold, tracking `sale_price` and `buyer`.

## Functionality
- **Asset Logging**: Adding new assets to a kitchen's FAR.
- **Logistics**: Initiating a movement for an asset. This creates an `asset_movements` record and updates the FAR `current_status`.
- **Liquidation**: Recording a sale. This creates an `asset_sales` record and updates the FAR `current_status`.

## Dependencies
- Every asset must be tied to a valid `kitchen_id` from the `kitchen_master` table.
