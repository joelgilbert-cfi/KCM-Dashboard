# Settings Module

## Overview
Provides an interface for application configuration, primarily focused on managing reference data used by other modules.

## Functionality
Currently focused on **Email Contacts Management**:
- Provides an interface to perform CRUD operations on the `email_contacts` table.
- These contacts are used to populate the autocomplete suggestions when drafting a "Closure Request" CC list.

## Dependencies
- Modifies the `email_contacts` table.
- Requires `admin` role for write access.
