# Kitchen Master Module

## Overview
The Kitchen Master module serves as the core directory of all kitchen facilities within the system.

## Data Model
Backed by the `kitchen_master` table.
- Primary identifier: `id` (UUID).
- Natural key: `cluster_marker` and `brand` (unique constraint).

## Functionality
- **Listing**: Displays all active, under-closure, or closed kitchens.
- **Search and Sort**: Supports filtering and natural cluster-marker sorting.
- **Status Tracking**: The baseline `status` field (`Active`, `Under Closure`, `Closed`) dictates how the kitchen is treated in other modules (e.g., the Kitchen Closure Status module focuses on those `Under Closure`).
- **Management**: Finance, Expansion, and Admin can add, edit, and soft-delete Kitchen Master rows.
- **Closure Email Selection**: Finance and Admin can select Kitchen Master rows and open the closure email workflow. Expansion can manage Kitchen Master data but cannot send closure emails.

## Dependencies
- Changes to a kitchen's status in `kitchen_master` often trigger workflows in the `kitchen_status` tracking module.
- Permissions are enforced by the Kitchen Master UI and RLS migration `009_allow_expansion_manage_kitchen_master.sql`.
