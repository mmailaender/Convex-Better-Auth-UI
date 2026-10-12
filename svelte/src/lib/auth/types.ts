import type { FunctionReturnType } from 'convex/server';
import type { api } from '$convex/_generated/api';
import type { authClient } from '#lib/auth/api/auth-client.js';
import type { AuthConstants } from '$convex/auth.constants.types';

// Re-export for convenience
export type { AuthConstants } from '$convex/auth.constants.types';

// ── User types ──────────────────────────────────────────────────────────────
export type GetActiveUserType = FunctionReturnType<typeof api.users.queries.getActiveUser>;
export type ListAccountsType = FunctionReturnType<typeof api.users.queries.listAccounts>;
export type ListApiKeysType = FunctionReturnType<typeof api.users.queries.listApiKeys>;

// ── Organization types ──────────────────────────────────────────────────────
export type GetActiveOrganizationType = FunctionReturnType<
	typeof api.organizations.queries.getActiveOrganization
>;
export type ListOrganizationsType = FunctionReturnType<
	typeof api.organizations.queries.listOrganizations
>;
export type ListInvitationsType = FunctionReturnType<
	typeof api.organizations.invitations.queries.listInvitations
>;

// ── Auth client inferred types ──────────────────────────────────────────────
export type Role = typeof authClient.$Infer.Member.role;
export type Member = typeof authClient.$Infer.Member;

// ── Context shape ───────────────────────────────────────────────────────────
export interface AuthContext {
	api: typeof api;
	authClient: typeof authClient;
	authConstants: AuthConstants;
}
