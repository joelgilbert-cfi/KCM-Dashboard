# Project Overview

## Purpose and Domain
The KCM (Kitchen Closure Management) Dashboard is an internal tool used to track, manage, and execute the closure procedures for kitchens and associated facilities. It serves as a single source of truth for the financial, operational, and asset-related implications of closing a kitchen. 

## Key Responsibilities
- **Status Tracking**: Centralized view of kitchen status across various regions and formats.
- **Workflow Automation**: Facilitates the "Closure Request" process by drafting and dispatching automated emails with dynamic CC lists.
- **Asset Management**: Maintains a Fixed Asset Register (FAR), tracking asset conditions, movements (to warehouses or other kitchens), and sales.
- **Audit & Compliance**: Maintains a strict audit log of all database mutations across tables.

## Primary Stakeholders
The application is governed by role-based access:
- **Finance**: Manages Kitchen Master data, selects kitchens, sends closure request emails, and reviews financial closure-status fields.
- **Expansion**: Manages Kitchen Master and operational closure-status data, but does not send closure request emails.
- **Admin**: Full system access, including user accounts, roles, and email contacts.
