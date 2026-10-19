---
'@auth/svelte': minor
'@auth/nextjs': minor
---

fix: Redesign the transactional emails (verify email, verification code, magic link, password reset, email change, invitation). Each one now shows the brand name above a white card with a heading, one sentence, a button, the raw link as a fallback and the "you can ignore this" note at the bottom. Every value interpolated into the HTML is escaped, so a user's display name or an organization name can no longer put markup or links into an invitation. The body font stack no longer cuts off its own `style` attribute, the footer keeps the tagline's capitalization, muted text meets WCAG AA contrast, and the invitation no longer relies on flexbox, which Outlook and Gmail ignore. The email-change message goes to the current address, so it now asks the user to confirm the change (subject "Confirm your email address change"); the magic-link subject names the brand.

**BREAKING:** The emails take the brand name and tagline from `brandName` and `brandTagline` in `auth.constants.ts`, the same values the sign-in screen shows, and no longer read the `BRAND_NAME` and `BRAND_TAGLINE` environment variables. If you set those variables, move their values into `AUTH_CONSTANTS` and remove them. `BRAND_LOGO_URL` stays an environment variable.
