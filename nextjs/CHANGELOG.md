# @auth/nextjs

## 0.3.0

### Minor Changes

- 017d0bf: chore: Upgrade Convex to 1.46, `@convex-dev/better-auth` to 0.12.5, `@convex-dev/resend` to 0.2.9, `@convex-dev/migrations` to 0.3.7 and `convex-helpers` to 0.1.128; `updateUser` now uses the validator's built-in `.partial()` instead of the deprecated `convex-helpers` helper (shared backend kept in lockstep with the SvelteKit registry)
  
  chore: Upgrade `@icons-pack/react-simple-icons` to 13.15; Slack and Salesforce, which Simple Icons removed in v16, now ship as local `primitives/ui/brand-icons` components (CC0 paths from Simple Icons 15)
  
  chore: Upgrade Next.js to 16.4, React to 19.3, `lucide-react` to 1.x, `@ark-ui/react` to 5.39, `react-easy-crop` to 6, `@zxcvbn-ts/core` to 4.2, `sonner`, `tailwind-merge`, Tailwind CSS 4.3, Prettier 3.9 and ESLint 10
  
  fix: The header brand link in the `base` layout is readable in light mode (`text-surface-950-50` instead of `text-white`)
  
  **BREAKING:** Upgrade to Skeleton 5. The `auth` theme uses the Skeleton 5 token names (`--typo-*`, `--color-root-bg-*`, brand/outline/corner-shape tokens) and no longer ships a copy of the Skeleton 4 component styles; it restores the pointer cursor on buttons, checkboxes and radios that Skeleton 5 dropped, and keeps badge text at `text-xs` (Skeleton 5 shrinks it to 0.8 × `text-xs`). The API key dialog uses `field-group` instead of the removed `input-group`/`ig-*` classes. Components now follow Skeleton 5's defaults (e.g. bold pill badges, neutral `preset-tonal`).
  
  #### Migration
  
  1. Upgrade `@skeletonlabs/skeleton` to 5 and migrate any custom theme with `npx skeleton migrate skeleton-5` (see https://skeleton.dev).
  
  → `jsrepo update 'base' 'primitives' 'auth/lib' 'users/convex' 'users/lib' 'themes'`

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
