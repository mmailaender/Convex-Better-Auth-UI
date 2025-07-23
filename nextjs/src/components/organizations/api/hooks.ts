// import { api } from '@/convex/_generated/api';
// import { useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { authClient } from '@/components/auth/lib/auth-client';

interface UseRolesArgs {
	orgId?: Id<'organizations'>;
}

export const useRoles = ({ orgId }: UseRolesArgs = {}) => {
	const activeMember = authClient.useActiveMember();
	// TODO: add support to get the user role for a specific organization - custom convex query needed => waiting for better-auth v0.8
	// const role = useQuery(api.organizations.queries.getOrganizationRole, { organizationId: orgId });

	const role = activeMember.data?.role;

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
