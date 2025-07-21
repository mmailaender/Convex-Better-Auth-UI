import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';

interface UseRolesArgs {
	orgId?: Id<'organizations'>;
}

export const useRoles = ({ orgId }: UseRolesArgs = {}) => {
	const role = useQuery(api.organizations.queries.getOrganizationRole, { organizationId: orgId });

	return {
		get hasOwnerRole() {
			return role === 'role_organization_owner';
		},
		get hasAdminRole() {
			return role === 'role_organization_admin';
		},
		get hasOwnerOrAdminRole() {
			return ['role_organization_owner', 'role_organization_admin'].includes(role ?? '');
		},
		get isMember() {
			return role != null;
		}
	};
};
