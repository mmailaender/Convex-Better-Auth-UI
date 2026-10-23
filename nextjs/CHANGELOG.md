# @auth/nextjs

## 0.3.0

### Minor Changes

- 4ed7f9e: feat: Add the Better Auth admin plugin as a feature toggle. Set `admin: true` in `auth.constants.ts` to get an admin dashboard at `/admin` for managing every user: search by name and email, page through, create users, make or remove admins, ban for a set duration or permanently, unban, set a password, sign out everywhere, impersonate and delete. Each user has a profile page to edit their name and email and to see and sign out their sessions. When `organizations` is also enabled, the dashboard lists and searches every organization, each with a page to change its logo, name and slug, add and remove members, change their roles and hand the ownership to another member (or delete the organization); new users can go straight into an organization, and the user profile manages a user's memberships and roles. While an admin impersonates someone, a banner across the app shows who they are acting as and returns them to their own session. Every admin Convex function checks the caller's role on the server; the UI gating only hides the entry points. Admins can't ban, delete, sign out or set the password of another admin until they remove that admin's role, and admins from `ADMIN_USER_IDS` can only be changed through that env var, so one admin can't lock out or take over another. For the same reason, Better Auth's own admin HTTP endpoints are disabled, except for starting and stopping an impersonation, so these rules can't be bypassed from the browser, and no one can impersonate an admin. Impersonation sessions keep Better Auth's one hour limit, which Convex mutations used to extend to seven days.
  
  #### Setup
  
  1. Install the new registry items: `jsrepo add admin/convex admin/lib admin/routes`.
  2. Update the items the admin items build on with `jsrepo update config base auth/lib`, keeping your own `auth.constants.ts`:
     - `config`: `auth.ts` registers the `admin()` plugin and blocks its HTTP endpoints, with the role helpers in the new `model/admin/roles.ts`, and `auth.constants.types.ts` gains `admin?: boolean`.
     - `base`: the generated Better Auth schema moves from `betterAuth/schema.ts` to `betterAuth/generatedSchema.ts` and gains the plugin's fields (`role`, `banned`, `banReason` and `banExpires` on users, `impersonatedBy` on sessions). `betterAuth/schema.ts` now builds on it and adds the search indexes the dashboard needs (user name and email, organization name and slug), so they survive regenerating the schema (`npx auth generate --output generatedSchema.ts`). The root layout mounts the impersonation banner, so `base` now depends on `admin/lib`.
     - `auth/lib`: the Better Auth client registers `adminClient()`.
  3. Set `admin: true` in `auth.constants.ts`.
  4. Bootstrap the first admin by setting the `ADMIN_USER_IDS` Convex env var to a comma-separated list of Better Auth user ids (`npx convex env set ADMIN_USER_IDS <userId>`). That admin can promote others from the dashboard.
  5. Optionally drop the `AdminButton` component into your navigation. The default layout doesn't link to `/admin`.
- 545c1b0: fix: Redesign the transactional emails (verify email, verification code, magic link, password reset, email change, invitation). Each one now shows the brand name above a white card with a heading, one sentence, a button, the raw link as a fallback and the "you can ignore this" note at the bottom. Every value interpolated into the HTML is escaped, so a user's display name or an organization name can no longer put markup or links into an invitation. The body font stack no longer cuts off its own `style` attribute, the footer keeps the tagline's capitalization, muted text meets WCAG AA contrast, and the invitation no longer relies on flexbox, which Outlook and Gmail ignore. The email-change message goes to the current address, so it now asks the user to confirm the change (subject "Confirm your email address change"); the magic-link subject names the brand.
  
  **BREAKING:** The emails take the brand name and tagline from `brandName` and `brandTagline` in `auth.constants.ts`, the same values the sign-in screen shows, and no longer read the `BRAND_NAME` and `BRAND_TAGLINE` environment variables. If you set those variables, move their values into `AUTH_CONSTANTS` and remove them. `BRAND_LOGO_URL` stays an environment variable.
- 017d0bf: chore: Upgrade Convex to 1.46, `@convex-dev/better-auth` to 0.12.5, `@convex-dev/resend` to 0.2.9, `@convex-dev/migrations` to 0.3.7 and `convex-helpers` to 0.1.128; `updateUser` now uses the validator's built-in `.partial()` instead of the deprecated `convex-helpers` helper (shared backend kept in lockstep with the SvelteKit registry)
  
  chore: Upgrade `@icons-pack/react-simple-icons` to 13.15; Slack and Salesforce, which Simple Icons removed in v16, now ship as local `primitives/ui/brand-icons` components (CC0 paths from Simple Icons 15)
  
  chore: Upgrade Next.js to 16.4, React to 19.3, `lucide-react` to 1.x, `@ark-ui/react` to 5.39, `react-easy-crop` to 6, `@zxcvbn-ts/core` to 4.2, `sonner`, `tailwind-merge`, Tailwind CSS 4.3, Prettier 3.9 and ESLint 10
  
  fix: The header brand link in the `base` layout is readable in light mode (`text-surface-950-50` instead of `text-white`)
  
  **BREAKING:** Upgrade to Skeleton 5. The `auth` theme uses the Skeleton 5 token names (`--typo-*`, `--color-root-bg-*`, brand/outline/corner-shape tokens) and no longer ships a copy of the Skeleton 4 component styles; it restores the pointer cursor on buttons, checkboxes and radios that Skeleton 5 dropped, and keeps badge text at `text-xs` (Skeleton 5 shrinks it to 0.8 × `text-xs`). The API key dialog uses `field-group` instead of the removed `input-group`/`ig-*` classes. Components now follow Skeleton 5's defaults (e.g. bold pill badges, neutral `preset-tonal`).
  
  #### Migration
  
  1. Upgrade `@skeletonlabs/skeleton` to 5 and migrate any custom theme with `npx skeleton migrate skeleton-5` (see https://skeleton.dev).
  
  → `jsrepo update 'base' 'primitives' 'auth/lib' 'users/convex' 'users/lib' 'themes'`

### Patch Changes

- a78a177: fix: Deleting a user now deletes their API keys. Better Auth left them behind, and they kept verifying after the account was gone. The user `onDelete` trigger in `auth.ts` (`config`) calls a new `betterAuth/user.ts` mutation (`users/convex`), so update both: `jsrepo update config users/convex`, keeping your own `auth.constants.ts`.
- 78a6971: fix: `deviceAuthorization.requestDeviceCode` no longer asks for the hard-coded scopes `read:orgs read:themes`, which were left over from the app this registry came from. It takes an optional `scope` argument instead, the space-separated scopes your device client requests, and sends none when you leave it out. Update it with `jsrepo update device-authorization/convex`.
- abb5fa1: fix: The organization members list applies one rule on desktop and mobile: owners and admins can change the role of and remove any member, other admins included, as Better Auth's server allows. The list doesn't offer it for an owner or for yourself; that is a choice of the UI, not a server check. The mobile drawer used to stop an admin from editing another admin while the desktop table allowed it. In Svelte, your own row no longer shows a role picker and a remove button either, because the list compared member ids with your user id. Update it with `jsrepo update organizations/lib`.
- 956c371: fix: The `base` item installs into a fresh Next.js app again. Its `next.config.mjs` no longer sets `turbopack.root` to the parent folder, which only this repository's monorepo layout needs, and `@tailwindcss/postcss`, which `postcss.config.mjs` loads, is now a declared dev dependency. If you installed `base` before, remove the `turbopack` block from your `next.config.mjs` and run `npm install -D @tailwindcss/postcss` if it's missing.
- 3ebd791: fix: The device authorization page now lives at `/device` and reads the code from `?user_code=`, the URL Better Auth hands to the device (`verification_uri_complete`). It used to live at `/device-authorization/[code]`, so the link a CLI printed opened a 404. Update it with `jsrepo update device-authorization/routes` and delete `src/app/device-authorization/[code]/page.tsx`.
- bc0251c: fix: The admin organizations search keeps the magnifier clear of the field's left edge, like the other search fields. Update it with `jsrepo update admin/lib`.
- 2546837: fix: The search fields for members, invitations and admin users keep the magnifier clear of the field's left edge. Update them with `jsrepo update organizations/lib admin/lib`.
- 2ec3333: fix: Better Auth no longer tries to refresh the session inside Convex queries, where it can't write. The Convex plugin skipped that refresh with an injected query parameter, but endpoints that validate their query strip it, so their session lookups failed whenever the session was due for a refresh. The API keys list hit this for every admin impersonation session and returned 401. `auth.ts` (`config`) now sets `session.disableSessionRefresh` outside mutations and actions; update it with `jsrepo update config`, keeping your own `auth.constants.ts`.
- 7ae4c1d: fix: The sign-in heading reads "Sign in to <brandName>" instead of "Sign in into <brandName>". Update it with `jsrepo update auth/lib`.

## 0.2.0
### Minor Changes

- 2011d34: Add a `signInTrigger` render prop to `UserButton` that replaces the default sign-in button and opens the `UserButton`'s own sign-in dialog. The avatar, loading placeholder and trigger now share the same size.

### Patch Changes

- 2011d34: Install Better Auth and `@better-auth/api-key` 1.6.16 with the registry items. 0.1.2 upgraded the apps but still requested 1.6.9 for new installs.
- 2011d34: Preserve the current page after embedded social, magic-link, and verification sign-in flows without introducing a same-page navigation after password or OTP sign-in.
- 2011d34: Only follow a sign-in or organization redirect to a path on the app's own site. `redirectTo` (component prop or query parameter) on `SignIn`, `CreateOrganization` and `DeleteOrganization` that points to another host, such as `https://attacker.example`, `//attacker.example` or `/..//attacker.example`, now goes home instead. Better Auth callbacks (email verification, magic link, social sign-in) are sent as absolute URLs on the current origin. The new `auth/utils/safeRedirect.ts` holds the rule.

## 0.1.2

### Patch Changes

- chore: Updated dependency versions (Better Auth 1.6.16, `@zxcvbn-ts` 4.x)

## 0.1.0

### Minor Changes

- Initial Next.js jsrepo registry release
- feat: Add auth, user profile, organization management, API keys, and device authorization UI for Next.js

→ `jsrepo add @auth/nextjs --all`
