import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

interface UseRolesArgs {
	orgId?: Id<'organizations'>;
}

export const useRoles = ({ orgId }: UseRolesArgs = {}) => {
	// TODO: add support to get the user role for a specific organization - custom convex query needed => waiting for better-auth v0.8
	const role = useQuery(api.organizations.queries.getActiveOrganizationRole);

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
