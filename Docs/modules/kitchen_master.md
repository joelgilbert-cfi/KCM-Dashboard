# Module: Kitchen Master

## Overview
The Kitchen Master is the source of truth for all physical locations. It tracks combinations of `cluster_marker` and `brand`.

## Source Path
- UI: `app/(dashboard)/kitchens/page.tsx`

## Core Responsibilities
- View all kitchens.
- Inline editing of kitchen records (handled by the Expansion team).
- Add new kitchens.
- Soft-delete kitchens (sets `removed_at`, never hard deletes).

## Interactions
- Used as the reference list when the Business Finance team initiates a closure request. The system looks up all brands belonging to a selected cluster.
- Changes to this module are explicitly **excluded** from the automated audit log.
