// API
import { useQuery } from 'convex-svelte';
import { api } from '$convex/_generated/api';
import { authClient } from '$lib/auth/api/auth-client';
import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

// Types
type Role = typeof authClient.$Infer.Member.role;

type UseRolesArgs = {
	orgId?: string;
	initialData?: Role;
};

export function useRoles(args: UseRolesArgs = {}) {
	const auth = useAuth();

	const roleResponse = useQuery(
		api.organizations.queries.getOrganizationRole,
		() => (auth.isAuthenticated ? { organizationId: args.orgId } : 'skip'),
		{ initialData: args.initialData }
	);

	const role = $derived(roleResponse?.data ?? args.initialData);

	return {
		get hasOwnerRole() {
			return role === 'owner';
		},
		get hasAdminRole() {
			return role === 'admin';
		},
		get hasOwnerOrAdminRole() {
			return role === 'owner' || role === 'admin';
		},
		get isMember() {
			return role != null;
		},
		get role() {
			return role;
		}
	};
}
