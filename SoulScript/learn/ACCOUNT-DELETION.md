# Account Deletion with Cascade

## Overview

Account deletion removes all user data (entries, reports, profile) and then deletes the Supabase auth user. Uses two different Supabase clients: the regular session client for user-scoped data and the admin client for auth user deletion.

## API Route (`src/app/api/account/route.ts`)

### Two-Client Pattern

```typescript
// Regular client — user-scoped (respects RLS)
const supabase = await createClient();

// Admin client — bypasses RLS (needed to delete auth users)
const adminSupabase = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

- **Regular client** (`@supabase/ssr`) — uses session cookies, respects RLS policies
- **Admin client** (`@supabase/supabase-js`) — uses service role key, bypasses RLS

### Cascade Deletion Order

```typescript
// 1. Delete journal entries
const { error: entriesError } = await supabase
  .from("journal_entries")
  .delete()
  .eq("user_id", user.id);

// 2. Delete monthly reports
const { error: reportsError } = await supabase
  .from("monthly_reports")
  .delete()
  .eq("user_id", user.id);

// 3. Delete user profile
const { error: profileError } = await supabase
  .from("user_profiles")
  .delete()
  .eq("user_id", user.id);

// 4. Delete auth user (admin client)
const { error: authError } = await adminSupabase.auth.admin.deleteUser(user.id);
```

**Why this order?**
- Data tables first → if auth deletion fails, data is already cleaned up
- Auth user last → if data deletion fails, user can still log in and retry
- Each step checks for errors and throws if any fail

### Error Handling

```typescript
if (entriesError) throw new Error("Failed to delete journal entries");
if (reportsError) throw new Error("Failed to delete monthly reports");
if (profileError) throw new Error("Failed to delete user profile");
if (authError) throw new Error("Failed to delete auth user");
```

All-or-nothing semantics: if any step fails, the entire operation fails and returns 500.

## Confirmation Modal (`src/app/settings/page.tsx`)

### Type-to-Confirm Pattern

Users must type "DELETE" to confirm account deletion:

```tsx
<input
  value={confirmText}
  onChange={(e) => setConfirmText(e.target.value)}
  placeholder='Type "DELETE" to confirm'
/>
<button
  disabled={confirmText !== "DELETE"}
  onClick={handleDelete}
>
  Delete Account
</button>
```

This prevents accidental deletion from a single click.

### Modal Animation

```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
>
```

Scale animation on the modal backdrop.

## Why Service Role Key?

The `SUPABASE_SERVICE_ROLE_KEY` is used because:
1. **RLS blocks user self-deletion** — RLS policies check `user_id = auth.uid()`, but the user can't delete their own auth record
2. **Admin API requires service role** — `auth.admin.deleteUser()` is an admin-only operation
3. **Bypasses RLS** — needed to delete data across multiple tables in one operation

## Security Considerations

- `SUPABASE_SERVICE_ROLE_KEY` is server-side only (no `NEXT_PUBLIC_` prefix)
- Only used in the account deletion endpoint
- Regular API routes use the session-based client (respects RLS)
- The deletion endpoint requires authentication (proxy middleware + route handler check)

## What Gets Deleted

| Table | Method | Notes |
|-------|--------|-------|
| `journal_entries` | Hard delete | All entries for user |
| `monthly_reports` | Hard delete | All reports for user |
| `user_profiles` | Hard delete | Profile record |
| `auth.users` | Admin delete | Auth account + session |

**Not deleted:** The RLS policies and database schema remain intact.

## Key Decisions

- **Hard delete, not soft delete** — account deletion is permanent (unlike entry soft delete)
- **Data before auth** — if auth deletion fails, data is already gone (user can't recover)
- **Type-to-confirm** — prevents accidental deletion better than a simple checkbox
- **Admin client isolation** — only one endpoint uses the service role key
- **No undo** — account deletion is irreversible by design
