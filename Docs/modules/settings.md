# Settings Module

## Overview
Provides the admin-only interface for user administration, email-recipient reference data, and application information.

## Functionality
### User Management
- Lists active application users from the `users` table.
- Creates a Supabase Auth account and matching `users` profile through `POST /api/admin/create-user`.
- Allows changing another user's role between `finance`, `expansion`, and `admin`.
- Removes another user through `DELETE /api/admin/delete-user`.
- The current administrator cannot remove their own account.
- Removal deletes the Supabase Auth account and sets `users.deleted_at`, preserving historical foreign-key references.

### Email Contacts
- Lists, adds, and removes records in `email_contacts`.
- These contacts supplement application users in the Gmail-like To/CC autocomplete.
- Users may still enter valid email addresses that are not saved as contacts.

### Role Values
- Stored/submitted role identifiers are lowercase: `finance`, `expansion`, `admin`.
- UI labels are capitalized: Finance, Expansion, Admin.
- Do not capitalize the underlying `<SelectItem value>` because the API and database constraint expect lowercase values.

## Dependencies
- Uses the `users` and `email_contacts` tables.
- Uses Supabase Auth Admin APIs through server-only route handlers.
- Requires `SUPABASE_SERVICE_ROLE_KEY`.
- Requires the `admin` role.
- User removal requires migration `010_add_user_soft_delete.sql`.
