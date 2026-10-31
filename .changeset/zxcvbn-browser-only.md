---
'@auth/svelte': patch
'@auth/nextjs': patch
---

perf: The password strength checker (zxcvbn and its word lists, about 1.7 MB) now loads in the browser only, when a strength meter mounts or, in Next.js, when a password field with a `minScore` above 0 mounts. It used to be imported at the top of the password primitive, so it was part of the server bundle and loaded with every page that imports the primitive, such as `/signin`. In a SvelteKit Cloudflare Worker this cuts the bundle from 3830 KiB (1215 KiB gzip) to 2116 KiB (385 KiB gzip). While the checker loads, the meter shows its empty state and a non-empty password stays invalid with "Checking password strength…", so a weak password can't pass with `minScore` above 0. The components' props, exports and types are unchanged.
