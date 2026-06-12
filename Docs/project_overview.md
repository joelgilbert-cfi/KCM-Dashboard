# KCM Dashboard — Project Overview

## Purpose
The Kitchen Closure Management (KCM) Dashboard is a centralised internal web application designed to replace scattered Excel sheets and email threads between the Business Finance (BF) and Expansion teams. It streamlines and tracks the entire lifecycle of closing kitchens, managing fixed assets, and auditing changes.

## Problem Solved
- Eliminates manual emails for closure initiation.
- Replaces 6 separate Excel tracking sheets.
- Centralizes asset tracking (movements and sales).
- Provides a real-time audit trail of all changes.

## Core Users
- **Business Finance (BF)**: Initiates closure requests, manages the Fixed Asset Register (FAR).
- **Expansion**: Updates closure statuses, manages the kitchen master list, logs asset movements and sales.

## Key Concepts
- **Cluster**: A physical building identified by a `cluster_marker` (e.g., 41, 93).
- **Kitchen**: A brand's partition inside a cluster. The combination of `cluster_marker + brand` forms the unique identifier for a kitchen.
- **Cluster Closure**: Closures happen at the cluster level. If a cluster is closed, all brands within it are closed.

## Key Links
- [Architecture](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/architecture.md)
- [Tech Stack](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/tech_stack.md)
- [Data Models](file:///c:/CFI/Projects/Prototypes/KCM%20Dashboard/V1/Docs/data_models.md)
