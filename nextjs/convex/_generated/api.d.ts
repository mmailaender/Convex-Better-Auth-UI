/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as emails_actions from "../emails/actions.js";
import type * as http from "../http.js";
import type * as model_emails_index from "../model/emails/index.js";
import type * as model_emails_templates_organizationInvitation from "../model/emails/templates/organizationInvitation.js";
import type * as model_emails_templates_verification from "../model/emails/templates/verification.js";
import type * as model_organizations_index from "../model/organizations/index.js";
import type * as model_organizations_invitations_index from "../model/organizations/invitations/index.js";
import type * as model_organizations_members_index from "../model/organizations/members/index.js";
import type * as model_users_index from "../model/users/index.js";
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

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

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
  "model/emails/index": typeof model_emails_index;
  "model/emails/templates/organizationInvitation": typeof model_emails_templates_organizationInvitation;
  "model/emails/templates/verification": typeof model_emails_templates_verification;
  "model/organizations/index": typeof model_organizations_index;
  "model/organizations/invitations/index": typeof model_organizations_invitations_index;
  "model/organizations/members/index": typeof model_organizations_members_index;
  "model/users/index": typeof model_users_index;
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
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  resend: {
    lib: {
      cancelEmail: FunctionReference<
        "mutation",
        "internal",
        { emailId: string },
        null
      >;
      get: FunctionReference<"query", "internal", { emailId: string }, any>;
      getStatus: FunctionReference<
        "query",
        "internal",
        { emailId: string },
        {
          complained: boolean;
          errorMessage: string | null;
          opened: boolean;
          status:
            | "waiting"
            | "queued"
            | "cancelled"
            | "sent"
            | "delivered"
            | "delivery_delayed"
            | "bounced";
        }
      >;
      handleEmailEvent: FunctionReference<
        "mutation",
        "internal",
        { event: any },
        null
      >;
      sendEmail: FunctionReference<
        "mutation",
        "internal",
        {
          from: string;
          headers?: Array<{ name: string; value: string }>;
          html?: string;
          options: {
            apiKey: string;
            initialBackoffMs: number;
            onEmailEvent?: { fnHandle: string };
            retryAttempts: number;
            testMode: boolean;
          };
          replyTo?: Array<string>;
          subject: string;
          text?: string;
          to: string;
        },
        string
      >;
    };
  };
};
