# Module: Asset Management

## Overview
This module centralizes the tracking of physical assets across the kitchen lifecycle, replacing multiple Excel sheets.

## Source Path
- UI: `app/(dashboard)/assets/`

## 1. Fixed Asset Register (FAR)
- **Owned by**: Finance Team.
- **Function**: The master list of all purchased assets linked to a specific kitchen (cluster + brand).
- **Data Table**: `fixed_asset_register`

## 2. Asset Movements
- **Owned by**: Expansion Team.
- **Function**: Logs when an asset is moved from a kitchen to a warehouse.
- **Data Table**: `asset_movements`
- **Legacy Quirk**: Legacy data is linked via `oracle_code` rather than direct foreign keys to `kitchen_master`.

## 3. Asset Sales
- **Owned by**: Expansion Team.
- **Function**: Logs when an asset is sold to the secondary market.
- **Data Table**: `asset_sales`

## Automation
- Creating a movement or sale record automatically updates the `current_status` of the corresponding item in the `fixed_asset_register`.
