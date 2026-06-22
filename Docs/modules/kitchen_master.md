# Kitchen Master Module

## Overview
The Kitchen Master module serves as the core directory of all kitchen facilities within the system.

## Data Model
Backed by the `kitchen_master` table.
- Primary identifier: `id` (UUID).
- Natural key: `cluster_marker` and `brand` (unique constraint).

## Functionality
- **Listing**: Displays all active, under-closure, or closed kitchens.
- **Status Tracking**: The baseline `status` field (`Active`, `Under Closure`, `Closed`) dictates how the kitchen is treated in other modules (e.g., the Kitchen Closure Status module focuses on those `Under Closure`).
- **Management**: Users with appropriate roles can add new kitchens or update their status.

## Dependencies
- Changes to a kitchen's status in `kitchen_master` often trigger workflows in the `kitchen_status` tracking module.
