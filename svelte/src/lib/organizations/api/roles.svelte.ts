// API
import { useQuery } from 'convex-svelte';
import { api } from '$convex/_generated/api';
import { authClient } from '$lib/auth/api/auth-client';

// Types
type Role = typeof authClient.$Infer.Member.role;

type UseRolesArgs = {
	orgId?: string;
	initialData?: Role;
	isAuthenticated?: boolean;
};

export function useRoles(args: UseRolesArgs = {}) {
	const role = $derived(
		useQuery(
			api.organizations.queries.getOrganizationRole,
			args.isAuthenticated ? { organizationId: args.orgId } : 'skip',
			{ initialData: args.initialData }
		)
	);

	return {
		get hasOwnerRole() {
			return role.data === 'owner';
		},
		get hasAdminRole() {
			return role.data === 'admin';
		},
		get hasOwnerOrAdminRole() {
			return ['owner', 'admin'].includes(role.data ?? '');
		},
		get isMember() {
			return role.data != null;
		},
		get role() {
			return role.data;
		}
	};
}
