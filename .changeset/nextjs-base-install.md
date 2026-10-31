---
'@auth/nextjs': patch
---

fix: The `base` item installs into a fresh Next.js app again. Its `next.config.mjs` no longer sets `turbopack.root` to the parent folder, which only this repository's monorepo layout needs, and `@tailwindcss/postcss`, which `postcss.config.mjs` loads, is now a declared dev dependency.
