---
'@auth/nextjs': minor
---

feat: Add the Better Auth admin plugin as a feature toggle. Set `admin: true` in `auth.constants.ts` to get an admin dashboard at `/admin` for managing every user: search by name and email, page through, create users, make or remove admins, ban for a set duration or permanently, unban, set a password, sign out everywhere, impersonate and delete. Each user has a profile page to edit their name and email and to see and sign out their sessions. When `organizations` is also enabled, the dashboard lists and searches every organization, each with a page to change its logo, name and slug, add and remove members, change their roles and hand the ownership to another member (or delete the organization); new users can go straight into an organization, and the user profile manages a user's memberships and roles. While an admin impersonates someone, a banner across the app shows who they are acting as and returns them to their own session. Every admin Convex function checks the caller's role on the server; the UI gating only hides the entry points. Admins can't ban, delete, sign out or set the password of another admin until they remove that admin's role, and admins from `ADMIN_USER_IDS` can only be changed through that env var, so one admin can't lock out or take over another. For the same reason, Better Auth's own admin HTTP endpoints are disabled, except for starting and stopping an impersonation, so these rules can't be bypassed from the browser, and no one can impersonate an admin. Impersonation sessions keep Better Auth's one hour limit, which Convex mutations used to extend to seven days.

#### Setup

1. Install the new registry items: `jsrepo add admin/convex admin/lib admin/routes`.
2. Update the items the admin items build on with `jsrepo update config base auth/lib`, keeping your own `auth.constants.ts`:
   - `config`: `auth.ts` registers the `admin()` plugin and blocks its HTTP endpoints, with the role helpers in the new `model/admin/roles.ts`, and `auth.constants.types.ts` gains `admin?: boolean`.
   - `base`: the generated Better Auth schema moves from `betterAuth/schema.ts` to `betterAuth/generatedSchema.ts` and gains the plugin's fields (`role`, `banned`, `banReason` and `banExpires` on users, `impersonatedBy` on sessions). `betterAuth/schema.ts` now builds on it and adds the search indexes the dashboard needs (user name and email, organization name and slug), so they survive regenerating the schema (`npx auth generate --output generatedSchema.ts`). The root layout mounts the impersonation banner, so `base` now depends on `admin/lib`.
   - `auth/lib`: the Better Auth client registers `adminClient()`.
3. Set `admin: true` in `auth.constants.ts`.
4. Bootstrap the first admin by setting the `ADMIN_USER_IDS` Convex env var to a comma-separated list of Better Auth user ids (`npx convex env set ADMIN_USER_IDS <userId>`). That admin can promote others from the dashboard.
5. Optionally drop the `AdminButton` component into your navigation. The default layout doesn't link to `/admin`.
