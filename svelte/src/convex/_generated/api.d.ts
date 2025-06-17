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
import type * as emails_actions from "../emails/actions.js";
import type * as http from "../http.js";
import type * as model_emails_send from "../model/emails/send.js";
import type * as model_emails_templates_organizationInvitation from "../model/emails/templates/organizationInvitation.js";
import type * as model_emails_templates_verification from "../model/emails/templates/verification.js";
import type * as model_organizations_index from "../model/organizations/index.js";
import type * as organizations_invitations_actions from "../organizations/invitations/actions.js";
import type * as organizations_invitations_mutations from "../organizations/invitations/mutations.js";
import type * as organizations_invitations_queries from "../organizations/invitations/queries.js";
import type * as organizations_members_mutations from "../organizations/members/mutations.js";
import type * as organizations_members_queries from "../organizations/members/queries.js";
import type * as organizations_mutations from "../organizations/mutations.js";
import type * as organizations_queries from "../organizations/queries.js";
import type * as storage from "../storage.js";
import type * as tests from "../tests.js";
import type * as users_actions from "../users/actions.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

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
  "emails/actions": typeof emails_actions;
  http: typeof http;
  "model/emails/send": typeof model_emails_send;
  "model/emails/templates/organizationInvitation": typeof model_emails_templates_organizationInvitation;
  "model/emails/templates/verification": typeof model_emails_templates_verification;
  "model/organizations/index": typeof model_organizations_index;
  "organizations/invitations/actions": typeof organizations_invitations_actions;
  "organizations/invitations/mutations": typeof organizations_invitations_mutations;
  "organizations/invitations/queries": typeof organizations_invitations_queries;
  "organizations/members/mutations": typeof organizations_members_mutations;
  "organizations/members/queries": typeof organizations_members_queries;
  "organizations/mutations": typeof organizations_mutations;
  "organizations/queries": typeof organizations_queries;
  storage: typeof storage;
  tests: typeof tests;
  "users/actions": typeof users_actions;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
