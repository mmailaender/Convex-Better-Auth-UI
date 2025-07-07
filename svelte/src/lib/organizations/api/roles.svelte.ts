// API
import { useQuery } from 'convex-svelte';
import { api } from '$convex/_generated/api';

// Types
import type { FunctionReturnType } from 'convex/server';
import type { Id } from '$convex/_generated/dataModel';
type Role = FunctionReturnType<typeof api.organizations.queries.getOrganizationRole>;

export function createRoles(args: { orgId?: Id<'organizations'>; initialData?: Role } = {}) {
	const role = useQuery(
		api.organizations.queries.getOrganizationRole,
		{ organizationId: args.orgId },
		{ initialData: args.initialData }
	);

	return {
		get hasOwnerRole() {
			return role.data === 'role_organization_owner';
		},
		get hasAdminRole() {
			return role.data === 'role_organization_admin';
		},
		get hasOwnerOrAdminRole() {
			return ['role_organization_owner', 'role_organization_admin'].includes(role.data ?? '');
		},
		get isMember() {
			return role.data != null;
		}
	};
}
