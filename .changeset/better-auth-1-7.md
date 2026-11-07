---
'@auth/svelte': minor
'@auth/nextjs': minor
---

Better Auth 1.7 with `@convex-dev/better-auth` 0.13. The registry now installs `better-auth` and `@better-auth/api-key` 1.7.17 and component 0.13.0, which supports only Better Auth 1.7. Before, a new install got the component's latest release, 0.13.0, next to Better Auth 1.6.16, outside the component's peer range.

`config` follows the component's upgrade guide: `betterAuth/adapter.ts` exports the new atomic adapter operations `consumeOne` and `incrementOne`, which Better Auth 1.7 uses for single-use verification values, and `betterAuth/generatedSchema.ts` declares 1.7's `account` index, which Better Auth reads when a user sets, changes or resets a password, and the `jwks` fields `alg` and `crv`. Both are additive, so existing data stays valid.

`users/lib`: unlinking an account on the Accounts page sends the account's Better Auth id, which Better Auth 1.7's `unlinkAccount` takes instead of the provider id and the provider's account id. The unlink button now also shows its busy state, which it compared with that id.
