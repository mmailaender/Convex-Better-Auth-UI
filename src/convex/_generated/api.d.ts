/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth_environment from "../auth/environment.js";
import type * as auth_jwtAuth from "../auth/jwtAuth.js";
import type * as auth_tokens from "../auth/tokens.js";
import type * as cleanups from "../cleanups.js";
import type * as crons from "../crons.js";
import type * as functions from "../functions.js";
import type * as rules_accounts from "../rules/accounts.js";
import type * as rules_invitations from "../rules/invitations.js";
import type * as rules_organizationMembers from "../rules/organizationMembers.js";
import type * as rules_types from "../rules/types.js";
import type * as rules_users from "../rules/users.js";
import type * as rules_verifications from "../rules/verifications.js";
import type * as rules from "../rules.js";
import type * as types from "../types.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "auth/environment": typeof auth_environment;
  "auth/jwtAuth": typeof auth_jwtAuth;
  "auth/tokens": typeof auth_tokens;
  cleanups: typeof cleanups;
  crons: typeof crons;
  functions: typeof functions;
  "rules/accounts": typeof rules_accounts;
  "rules/invitations": typeof rules_invitations;
  "rules/organizationMembers": typeof rules_organizationMembers;
  "rules/types": typeof rules_types;
  "rules/users": typeof rules_users;
  "rules/verifications": typeof rules_verifications;
  rules: typeof rules;
  types: typeof types;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
