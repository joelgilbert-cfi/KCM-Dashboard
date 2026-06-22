# Kitchen Closure Status Module

## Overview
This module tracks the complex, multi-step process of closing a kitchen. It tracks both operational milestones and financial impacts.

## Data Model
Backed by the `kitchen_status` table (which replaced the legacy `closure_tracker` table).
Key metrics tracked include:
- Operational: `ops_closed`, `last_ops_date`, `shut_suspend_continue`.
- Financial: `rent`, `dec_net_revenue`, `dec_ebitda`, `sd_recovery`, `capex`.
- Timeline: `lock_in_end_date`, `notice_period`.

## Functionality
- **Detailed Tracking**: Allows `expansion` and `admin` users to update the myriad of fields related to a closure.
- **Financial Review**: Allows `finance` users to review the financial implications (EBITDA hit, SD recovery, Capex) of a pending closure.

## Dependencies
- Relies heavily on the `cluster_marker` to associate tracking data with specific kitchens in the `kitchen_master`.
- The `audit_log` table actively monitors all changes to `kitchen_status` via PostgreSQL triggers.
