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
import type * as emails_handlers from "../emails/handlers.js";
import type * as emails_process from "../emails/process.js";
import type * as emails_send from "../emails/send.js";
import type * as emails_templates_organizationInvitation from "../emails/templates/organizationInvitation.js";
import type * as emails_templates_verification from "../emails/templates/verification.js";
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
  "emails/handlers": typeof emails_handlers;
  "emails/process": typeof emails_process;
  "emails/send": typeof emails_send;
  "emails/templates/organizationInvitation": typeof emails_templates_organizationInvitation;
  "emails/templates/verification": typeof emails_templates_verification;
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
