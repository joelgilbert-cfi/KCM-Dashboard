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
- **Finance**: View-only access to kitchen status and closure records, primarily concerned with revenue impacts, rent hits, and EBITDA.
- **Expansion**: Can manage and update kitchen statuses.
- **Admin**: Full system access, including managing underlying reference data (e.g., email contacts for requests).
