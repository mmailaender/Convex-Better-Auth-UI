---
'@auth/nextjs': patch
---

fix: The device authorization page now lives at `/device` and reads the code from `?user_code=`, the URL Better Auth hands to the device (`verification_uri_complete`). It used to live at `/device-authorization/[code]`, so the link a CLI printed opened a 404. Update it with `jsrepo update device-authorization/routes` and delete `src/app/device-authorization/[code]/page.tsx`.
