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
import type * as auth from "../auth.js";
import type * as email_handlers from "../email/handlers.js";
import type * as email_process from "../email/process.js";
import type * as email_send from "../email/send.js";
import type * as email_templates_organizationInvitation from "../email/templates/organizationInvitation.js";
import type * as email_templates_verification from "../email/templates/verification.js";
import type * as http from "../http.js";
import type * as organizations_invitations from "../organizations/invitations.js";
import type * as organizations_members from "../organizations/members.js";
import type * as organizations from "../organizations.js";
import type * as storage from "../storage.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "email/handlers": typeof email_handlers;
  "email/process": typeof email_process;
  "email/send": typeof email_send;
  "email/templates/organizationInvitation": typeof email_templates_organizationInvitation;
  "email/templates/verification": typeof email_templates_verification;
  http: typeof http;
  "organizations/invitations": typeof organizations_invitations;
  "organizations/members": typeof organizations_members;
  organizations: typeof organizations;
  storage: typeof storage;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
