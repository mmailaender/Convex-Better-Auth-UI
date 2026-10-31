---
'@auth/svelte': patch
'@auth/nextjs': patch
---

fix: `deviceAuthorization.requestDeviceCode` no longer asks for the hard-coded scopes `read:orgs read:themes`, which were left over from the app this registry came from. It takes an optional `scope` argument instead, the space-separated scopes your device client requests, and sends none when you leave it out.
