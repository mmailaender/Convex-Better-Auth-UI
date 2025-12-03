// API
import { useQuery } from 'convex-svelte';
import { api } from '$convex/_generated/api';
import { authClient } from '$lib/auth/api/auth-client';
import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

// Types
type Role = typeof authClient.$Infer.Member.role;

type UseRolesArgs = {
	orgId?: string;
};

type UseRolesOptions =
	| {
			initialData?: Role;
	  }
	| (() => { initialData?: Role });

export function useRoles(args: UseRolesArgs = {}, options?: UseRolesOptions) {
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
