# @auth/nextjs

## 0.3.0

### Minor Changes

- c87e3d0: **Upgrading from 0.2.0:** Make the manual changes below, then update the items you installed with the one command at the end. The entries after this one describe each change and don't need their own update.
  
  #### Migration
  
  1. Upgrade `next` to 16.4.3 (see the security note below) and `@skeletonlabs/skeleton` to 5. Migrate any custom theme with `npx skeleton migrate skeleton-5` (see https://skeleton.dev).
  2. If you set the `BRAND_NAME` or `BRAND_TAGLINE` Convex env vars, move their values into `brandName` and `brandTagline` in `auth.constants.ts` and remove the variables. The emails no longer read them.
  3. Delete `src/app/device-authorization/[code]/page.tsx`. The device page now lives at `/device?user_code=…`; point any links of your own there.
  4. If you keep your own `next.config.mjs`, remove its `turbopack` block.
  5. Keep your own `auth.constants.ts` when the update offers to overwrite it. If you changed any of these files, merge the update into them instead of overwriting:
     - `src/proxy.ts` (`base`): the `/signin` redirect checks the session with `hasValidSession`, and a signed-out request to a protected path is redirected only when it can show the sign-in page.
     - `auth/ui/EmailStep.tsx` (`auth/lib`): a `useLayoutEffect` reads the input's value on mount.
  6. Run the update. Leave out items you haven't installed, but update `config` together with `users/convex` and, with organizations, `organizations/convex`: the new `auth.ts` calls functions they add or change. `base` now also installs `admin/lib` and `admin/convex`, because the root layout mounts the impersonation banner; it renders nothing while `admin` is off.
  
  → `jsrepo update 'config' 'base' 'primitives' 'themes' 'auth/lib' 'users/convex' 'users/lib' 'organizations/convex' 'organizations/lib' 'email/convex' 'device-authorization/convex' 'device-authorization/routes'`
- 4ed7f9e: feat: Add the Better Auth admin plugin as a feature toggle. Set `admin: true` in `auth.constants.ts` to get an admin dashboard at `/admin` for managing every user: search by name and email, page through, create users, make or remove admins, ban for a set duration or permanently, unban, set a password, sign out everywhere, impersonate and delete. Each user has a profile page to edit their name and email and to see and sign out their sessions. When `organizations` is also enabled, the dashboard lists and searches every organization, each with a page to change its logo, name and slug, add and remove members, change their roles and hand the ownership to another member (or delete the organization); new users can go straight into an organization, and the user profile manages a user's memberships and roles. While an admin impersonates someone, a banner across the app shows who they are acting as and returns them to their own session. Every admin Convex function checks the caller's role on the server; the UI gating only hides the entry points. Admins can't ban, delete, sign out or set the password of another admin until they remove that admin's role, and admins from `ADMIN_USER_IDS` can only be changed through that env var, so one admin can't lock out or take over another. For the same reason, Better Auth's own admin HTTP endpoints are disabled, except for starting and stopping an impersonation, so these rules can't be bypassed from the browser, and no one can impersonate an admin. Impersonation sessions keep Better Auth's one hour limit, which Convex mutations would otherwise extend to seven days.
  
  #### Setup
  
  1. Run the upgrade at the top of this release. It updates the items the admin items build on:
     - `config`: `auth.ts` registers the `admin()` plugin and blocks its HTTP endpoints, with the role helpers in the new `model/admin/roles.ts`, and `auth.constants.types.ts` gains `admin?: boolean`.
     - `base`: the generated Better Auth schema moves from `betterAuth/schema.ts` to `betterAuth/generatedSchema.ts` and gains the plugin's fields (`role`, `banned`, `banReason` and `banExpires` on users, `impersonatedBy` on sessions). `betterAuth/schema.ts` now builds on it and adds the search indexes the dashboard needs (user name and email, organization name and slug), so they survive regenerating the schema (`npx auth generate --output generatedSchema.ts`). The root layout mounts the impersonation banner, so `base` now depends on `admin/lib`.
     - `auth/lib`: the Better Auth client registers `adminClient()`.
  2. Install the new registry items: `jsrepo add admin/convex admin/lib admin/routes`.
  3. Set `admin: true` in `auth.constants.ts`.
  4. Bootstrap the first admin by setting the `ADMIN_USER_IDS` Convex env var to a comma-separated list of Better Auth user ids (`npx convex env set ADMIN_USER_IDS <userId>`). That admin can promote others from the dashboard.
  5. Optionally drop the `AdminButton` component into your navigation. The default layout doesn't link to `/admin`.
- 545c1b0: feat: Redesign the transactional emails (verify email, verification code, magic link, password reset, email change, invitation). Each one now shows the brand name above a white card with a heading, one sentence, a button, the raw link as a fallback and the "you can ignore this" note at the bottom. Every value interpolated into the HTML is escaped, so a user's display name or an organization name can no longer put markup or links into an invitation. The body font stack no longer cuts off its own `style` attribute, the footer keeps the tagline's capitalization, muted text meets WCAG AA contrast, and the invitation no longer relies on flexbox, which Outlook and Gmail ignore. The email-change message goes to the current address, so it now asks the user to confirm the change (subject "Confirm your email address change"); the magic-link subject names the brand.
  
  **BREAKING:** The emails take the brand name and tagline from `brandName` and `brandTagline` in `auth.constants.ts`, the same values the sign-in screen shows, and no longer read the `BRAND_NAME` and `BRAND_TAGLINE` environment variables. `BRAND_LOGO_URL` stays an environment variable.
- 017d0bf: chore: Upgrade Convex to 1.46, `@convex-dev/better-auth` to 0.12.5, `@convex-dev/resend` to 0.2.9, `@convex-dev/migrations` to 0.3.7 and `convex-helpers` to 0.1.128; `updateUser` now uses the validator's built-in `.partial()` instead of the deprecated `convex-helpers` helper (shared backend kept in lockstep with the SvelteKit registry)
  
  chore: Upgrade `@icons-pack/react-simple-icons` to 13.15; Slack and Salesforce, which Simple Icons removed in v16, now ship as local `primitives/ui/brand-icons` components (CC0 paths from Simple Icons 15)
  
  chore: Upgrade Next.js to 16.4.3, React to 19.3, `lucide-react` to 1.x, `@ark-ui/react` to 5.39, `react-easy-crop` to 6, `@zxcvbn-ts/core` to 4.2, `sonner`, `tailwind-merge`, Tailwind CSS 4.3, Prettier 3.9 and ESLint 10. Next.js 16.4.1 fixes two critical remote code execution vulnerabilities (in `use cache` functions returning typed arrays, and in the Image Optimization API with SVG files) and a denial of service through Server Actions; 16.4.0 is affected.
  
  fix: The header brand link in the `base` layout is readable in light mode (`text-surface-950-50` instead of `text-white`)
  
  **BREAKING:** Upgrade to Skeleton 5. The `auth` theme uses the Skeleton 5 token names (`--typo-*`, `--color-root-bg-*`, brand/outline/corner-shape tokens) and no longer ships a copy of the Skeleton 4 component styles; it restores the pointer cursor on buttons, checkboxes and radios that Skeleton 5 dropped, and keeps badge text at `text-xs` (Skeleton 5 shrinks it to 0.8 × `text-xs`). The API key dialog uses `field-group` instead of the removed `input-group`/`ig-*` classes. Components now follow Skeleton 5's defaults (e.g. bold pill badges, neutral `preset-tonal`).

### Patch Changes

- ad0c690: fix: `globals.css` (Next.js) and `layout.css` (SvelteKit) list `@plugin '@tailwindcss/forms'` after the `@import`s. Between them, a Vite build that inlines imports with PostCSS, such as vinext for Next.js on Cloudflare Workers, stopped at the `@plugin` line and dropped `tw-animate-css`, Skeleton and the `auth` theme. The built CSS is unchanged for Next.js and SvelteKit.
- a78a177: fix: Deleting a user now deletes their API keys. Better Auth left them behind, and they kept verifying after the account was gone. The user `onDelete` trigger in `auth.ts` (`config`) calls a new `betterAuth/user.ts` mutation (`users/convex`).
- c87e3d0: fix: Deleting a user who is the only member of an organization they own now deletes the organization's logo too. The Better Auth component tried to delete it from its own file storage, which doesn't hold the app's files; `deleteUser` in `betterAuth/organization.ts` (`organizations/convex`) now returns the logo ids, and the user `onDelete` trigger in `auth.ts` (`config`) deletes them. A member whose roles include `owner` next to another role (Better Auth stores them comma-separated, such as `owner,admin`) now counts as an owner there as well: an organization they own alone is deleted with them, and one with other members blocks the deletion, instead of losing its owner.
- 78a6971: fix: `deviceAuthorization.requestDeviceCode` no longer asks for the hard-coded scopes `read:orgs read:themes`, which were left over from the app this registry came from. It takes an optional `scope` argument instead, the space-separated scopes your device client requests, and sends none when you leave it out.
- abb5fa1: fix: The organization members list applies one rule on desktop and mobile: owners and admins can change the role of and remove any member, other admins included, as Better Auth's server allows. The list doesn't offer it for an owner or for yourself; that is a choice of the UI, not a server check. The mobile drawer used to stop an admin from editing another admin while the desktop table allowed it. In Svelte, your own row no longer shows a role picker and a remove button either, because the list compared member ids with your user id.
- 956c371: fix: The `base` item installs into a fresh Next.js app again. Its `next.config.mjs` no longer sets `turbopack.root` to the parent folder, which only this repository's monorepo layout needs, and `@tailwindcss/postcss`, which `postcss.config.mjs` loads, is now a declared dev dependency.
- 3ebd791: fix: The device authorization page now lives at `/device` and reads the code from `?user_code=`, the URL Better Auth hands to the device (`verification_uri_complete`). It used to live at `/device-authorization/[code]`, so the link a CLI printed opened a 404.
- ecfa0ec: fix: Signed out, a request to a protected path is sent to `/signin` only when it can show that page: a page navigation, or the App Router's own request on a client navigation or a prefetch, whose redirect its router follows. A script, an image, a `fetch` to a route handler or a server action now gets `401 Sign-in required` instead of the sign-in page's HTML, which a script would fail to parse (`SyntaxError: Unexpected token '<'`) and a server action can't follow.
- 4d01920: fix: On the sign-in page, an email typed before the page has hydrated is kept. React reset the field to empty on its first render after hydration, so the text disappeared and "Continue with Password" stayed disabled. `EmailStep` now takes the field's text into state when it mounts.
- 2a474cc: fix: Screen readers now announce the password strength meter. In Svelte, the meter had no progressbar role and no value attributes, so it was silent; it now renders Ark UI's `Progress.Track` and `Progress.Range`, like the Next.js meter. In both, the progressbar is named "Password strength" (Next.js announced the fill percentage as its name) and carries the score as `aria-valuenow` from 0 to 4, with `aria-valuetext` "Weak", "Fair", "Good" or "Strong" once a password has a score. The meter looks the same.
- bd3cf64: fix: Session cookies are now `Secure` on deployments whose `BETTER_AUTH_FALLBACK_URL` is `https://`, without setting `BETTER_AUTH_BASE_URL_PROTOCOL`. With the dynamic `baseURL`, Better Auth decides at startup whether cookies get the `__Secure-` prefix and the `Secure` attribute. Without a protocol it decided by `NODE_ENV === 'production'`, which is false on Convex, so those cookies were set without `Secure`. The auth config now sets `advanced.useSecureCookies` when the fallback URL is `https://` and no valid `BETTER_AUTH_BASE_URL_PROTOCOL` is set. Only the cookies change: URLs keep the protocol of each request. A valid `BETTER_AUTH_BASE_URL_PROTOCOL` (`http`, `https` or `auto`) still decides as before.
  
  On such a deployment, everyone is signed out once after the update: the session cookie is now named `__Secure-better-auth.session_token`, and Better Auth no longer reads the old `better-auth.session_token`. They sign in again as usual: the updated sign-in guard (see its fix in this release) no longer lets the old cookie keep them away from `/signin` until it expires.
  
  Local development keeps an `http://` `BETTER_AUTH_FALLBACK_URL`, the documented default. With an `https://` fallback, an app served on `http://localhost` also gets `Secure`, `__Secure-` cookies: current Chrome and Firefox accept them on `localhost`, but Safari on older macOS versions does not, so sign-in fails there.
  
  Previews served over HTTPS whose `BETTER_AUTH_FALLBACK_URL` is `http://` (for example shared defaults pointing at `http://localhost`) still need `BETTER_AUTH_BASE_URL_PROTOCOL=https` for Secure cookies. Set it in the Convex project's default environment variables for preview deployments only, since local development runs on http.
- 2546837: fix: The search fields for members and invitations keep the magnifier clear of the field's left edge.
- 2ec3333: fix: Better Auth no longer tries to refresh the session inside Convex queries, where it can't write. The Convex plugin skipped that refresh with an injected query parameter, but endpoints that validate their query strip it, so their session lookups failed whenever the session was due for a refresh. The API keys list hit this for every admin impersonation session and returned 401. `auth.ts` (`config`) now sets `session.disableSessionRefresh` outside mutations and actions.
- 7ae4c1d: fix: The sign-in heading reads "Sign in to <brandName>" instead of "Sign in into <brandName>".
- a248157: fix: The sign-in page no longer sends a signed-out reader home because of a session cookie Better Auth doesn't accept. The guard (`hooks.server.ts` in SvelteKit, `proxy.ts` in Next.js) redirected `/signin` to `/` whenever `getSessionCookie()` found a session cookie, but that function also accepts one Better Auth no longer reads, for example `better-auth.session_token` once the cookies became `__Secure-` (after setting `BETTER_AUTH_BASE_URL_PROTOCOL=https`, or after the Secure cookies fix in this release). Such a reader couldn't reach sign-in until the old cookie expired, up to 7 days. On `/signin` with a session cookie, the guard now asks the app's own `/api/auth/get-session` and redirects only when it returns a session; no session or a failed request shows sign-in. Other routes keep the optimistic cookie check and cost no extra request.
- 796e88c: perf: The password strength checker (zxcvbn and its word lists, about 1.7 MB) now loads in the browser only, when a strength meter mounts or, in Next.js, when a password field with a `minScore` above 0 mounts. It used to be imported at the top of the password primitive, so it was part of the server bundle and loaded with every page that imports the primitive, such as `/signin`. In a SvelteKit Cloudflare Worker this cuts the bundle from 3830 KiB (1215 KiB gzip) to 2116 KiB (385 KiB gzip). While the checker loads, the meter shows its empty state and a non-empty password stays invalid with "Checking password strength…", so a weak password can't pass with `minScore` above 0. The components' props, exports and types are unchanged.

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
