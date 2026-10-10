# @auth/nextjs

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
