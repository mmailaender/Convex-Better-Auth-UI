import { scope, type } from 'arktype';

import type { Organization } from '$lib/db/schema/types/custom';

export const createOrganizationData = type({
	name: 'string',
	'avatar?': 'URL',
	slug: 'string'
});
export type CreateOrganizationData = typeof createOrganizationData.infer;

export const updateOrganizationProfileData = type({
	'name?': 'string',
	'avatar?': 'string.url',
	'slug?': 'string'
});
export type UpdateOrganizationData = typeof updateOrganizationProfileData.infer;

export const updateMemberRoleData = type({
	userId: 'string.numeric > 0',
	newRole: "'role_organization_owner' | 'role_organization_admin' | 'role_organization_member'"
});
export type UpdateMemberRoleData = typeof updateMemberRoleData.infer;

export type UsersOrganizations = {
	userId: string;
	activeOrganization: Organization;
	organizations: Organization[];
};

export const role = type(
	"'role_organization_owner' | 'role_organization_admin' | 'role_organization_member'"
);
export type Role = typeof role.infer;

export const member = type({
	user: {
		id: 'string.numeric > 0',
		firstName: 'string',
		lastName: 'string',
		primaryEmail: 'string',
		'avatar?': 'string.url'
	},
	role: role
});
export type Member = typeof member.infer;

export const invitation = type({
	id: 'string.numeric > 0',
	invitedBy: {
		id: 'string.numeric > 0',
		firstName: 'string',
		lastName: 'string'
	},
	email: 'string',
	role: role
});
export type Invitation = typeof invitation.infer;

export const membersAndInvitations = type({
	members: member.array(),
	invitations: invitation.array()
});
export type MembersAndInvitations = typeof membersAndInvitations.infer;
