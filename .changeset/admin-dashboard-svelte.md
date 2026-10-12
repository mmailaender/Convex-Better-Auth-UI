---
'@auth/svelte': minor
---

feat: Add the Better Auth admin plugin as a feature toggle. Set `admin: true` in `auth.constants.ts` to get an admin dashboard at `/admin` for managing every user (create, search by name or email, change role, ban for a set duration or permanently, unban, set password, sign out everywhere, impersonate, delete) and, when `organizations` is also enabled, every organization (list, view members, delete). While an admin impersonates someone, a banner across the app shows who they are acting as and returns them to their own session. Every admin Convex function checks the caller's role on the server; the UI gating only hides the entry points. Admins can't ban, delete, sign out or set the password of another admin until they remove that admin's role, and admins from `ADMIN_USER_IDS` can only be changed through that env var, so one admin can't lock out or take over another.

#### Setup

1. Install the new registry items: `jsrepo add admin/convex admin/lib admin/routes`.
2. Update the items the admin items build on with `jsrepo update config base auth/lib`, keeping your own `auth.constants.ts`:
   - `config`: `auth.ts` registers the `admin()` plugin, and `auth.constants.types.ts` gains `admin?: boolean`.
   - `base`: `betterAuth/schema.ts` gains the plugin's fields (`role`, `banned`, `banReason` and `banExpires` on users, `impersonatedBy` on sessions), and the root layout mounts the impersonation banner (so `base` now needs `admin/lib` installed).
   - `auth/lib`: the Better Auth client registers `adminClient()`.
3. Set `admin: true` in `auth.constants.ts`.
4. Bootstrap the first admin by setting the `ADMIN_USER_IDS` Convex env var to a comma-separated list of Better Auth user ids (`npx convex env set ADMIN_USER_IDS <userId>`). That admin can promote others from the dashboard.
5. Optionally drop the `AdminButton` component into your navigation. The default layout doesn't link to `/admin`.
