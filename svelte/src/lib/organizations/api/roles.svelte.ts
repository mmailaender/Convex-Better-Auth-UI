// API
import { useQuery } from 'convex-svelte';
import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
import { getAuthContext } from '$lib/auth/context.svelte';

// Types
import type { Role } from '$lib/auth/types';

type UseRolesArgs = {
	orgId?: string;
};

type UseRolesOptions =
	| {
			initialData?: Role;
	  }
	| (() => { initialData?: Role });

export function useRoles(args: UseRolesArgs = {}, options?: UseRolesOptions) {
	const { api } = getAuthContext();
	const auth = useAuth();

	const getOptions = typeof options === 'function' ? options : () => options;
	const initialRole = getOptions()?.initialData;

	const roleResponse = useQuery(
		api.organizations.queries.getOrganizationRole,
		() => (auth.isAuthenticated ? { organizationId: args.orgId } : 'skip'),
		() => ({
			initialData: initialRole
		})
	);

	const role = $derived(roleResponse?.data ?? initialRole);

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
