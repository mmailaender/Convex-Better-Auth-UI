---
'@auth/nextjs': minor
---

chore: Upgrade Convex to 1.46, `@convex-dev/better-auth` to 0.12.5, `@convex-dev/resend` to 0.2.9, `@convex-dev/migrations` to 0.3.7 and `convex-helpers` to 0.1.128; `updateUser` now uses the validator's built-in `.partial()` instead of the deprecated `convex-helpers` helper (shared backend kept in lockstep with the SvelteKit registry)

chore: Upgrade `@icons-pack/react-simple-icons` to 13.15; Slack and Salesforce, which Simple Icons removed in v16, now ship as local `primitives/ui/brand-icons` components (CC0 paths from Simple Icons 15)

chore: Upgrade Next.js to 16.4, React to 19.3, `lucide-react` to 1.x, `@ark-ui/react` to 5.39, `react-easy-crop` to 6, `@zxcvbn-ts/core` to 4.2, `sonner`, `tailwind-merge`, Tailwind CSS 4.3, Prettier 3.9 and ESLint 10

fix: The header brand link in the `base` layout is readable in light mode (`text-surface-950-50` instead of `text-white`)

**BREAKING:** Upgrade to Skeleton 5. The `auth` theme uses the Skeleton 5 token names (`--typo-*`, `--color-root-bg-*`, brand/outline/corner-shape tokens) and no longer ships a copy of the Skeleton 4 component styles; it restores the pointer cursor on buttons, checkboxes and radios that Skeleton 5 dropped, and keeps badge text at `text-xs` (Skeleton 5 shrinks it to 0.8 × `text-xs`). The API key dialog uses `field-group` instead of the removed `input-group`/`ig-*` classes. Components now follow Skeleton 5's defaults (e.g. bold pill badges, neutral `preset-tonal`).

#### Migration

1. Upgrade `@skeletonlabs/skeleton` to 5 and migrate any custom theme with `npx skeleton migrate skeleton-5` (see https://skeleton.dev).

→ `jsrepo update 'base' 'primitives' 'auth/lib' 'users/convex' 'users/lib' 'themes'`
