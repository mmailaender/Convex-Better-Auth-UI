import { type } from 'arktype';

import type { Organization } from '$lib/db/schema/types/custom';

export const createOrganizationData = type({
	name: 'string',
	'avatar?': 'URL',
	slug: 'string'
});
export type CreateOrganizationData = typeof createOrganizationData.infer;

export const updateOrganizationProfileData = type({
	'name?': 'string',
	'avatar?': 'URL',
	'slug?': 'string'
});
export type UpdateOrganizationData = typeof updateOrganizationProfileData.infer;

export const updateUserRoleData = type({
	userId: 'string.numeric > 0',
	newRole: "'role_organization_owner' | 'role_organization_admin' | 'role_organization_member'"
});
export type UpdateUserRoleData = typeof updateUserRoleData.infer;

export type UsersOrganizations = {
	userId: string;
	activeOrganization: Organization;
	organizations: Organization[];
};
