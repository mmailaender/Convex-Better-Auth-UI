import type { FunctionReturnType } from 'convex/server';
import type { api } from '@/convex/_generated/api';

export type AdminUser = FunctionReturnType<typeof api.admin.queries.listUsers>['users'][number];
export type AdminOrganization = FunctionReturnType<
	typeof api.admin.queries.listAllOrganizations
>['organizations'][number];
export type AdminUserDetails = NonNullable<FunctionReturnType<typeof api.admin.queries.getUser>>;
export type AdminMembership = AdminUserDetails['memberships'][number];
export type AdminOrganizationDetails = NonNullable<
	FunctionReturnType<typeof api.admin.queries.getOrganizationWithMembers>
>;
export type AdminMember = AdminOrganizationDetails['members'][number];
export type AppRole = 'user' | 'admin';
/** Organization roles an admin can give a member; ownership changes hands elsewhere. */
export type OrganizationRole = 'admin' | 'member';
/** What the previous owner becomes when ownership changes hands: a role, or no member. */
export type PreviousOwner = OrganizationRole | 'remove';
/** Dialogs of the user actions, opened from the row menu or the user profile. */
export type UserDialog = 'ban' | 'delete' | 'password' | 'make-admin';
