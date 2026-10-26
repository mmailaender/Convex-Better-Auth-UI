---
'@auth/nextjs': patch
'@auth/svelte': patch
---

fix: `globals.css` (Next.js) and `layout.css` (SvelteKit) list `@plugin '@tailwindcss/forms'` after the `@import`s. Between them, a Vite build that inlines imports with PostCSS, such as vinext for Next.js on Cloudflare Workers, stopped at the `@plugin` line and dropped `tw-animate-css`, Skeleton and the `auth` theme. The built CSS is unchanged for Next.js and SvelteKit.
