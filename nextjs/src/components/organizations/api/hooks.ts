import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export const useRoles = ({
	orgId
}: {
	orgId?: string;
} = {}) => {
	const role = useQuery(api.organizations.queries.getOrganizationRole, {
		organizationId: orgId
	});

	return {
		get hasOwnerRole() {
			return role === 'owner';
		},
		get hasAdminRole() {
			return role === 'admin';
		},
		get hasOwnerOrAdminRole() {
			return ['owner', 'admin'].includes(role ?? '');
		},
		get isMember() {
			return role != null;
		}
	};
};
