// API
import { useQuery } from 'convex-svelte';
import { api } from '$convex/_generated/api';
import { authClient } from '$lib/auth/api/auth-client';

// Types
type Role = typeof authClient.$Infer.Member.role;

export function useRoles(
	args: { orgId?: string; initialData?: Role; isAuthenticated?: boolean } = {}
) {
	const role = $derived(
		args.isAuthenticated
			? useQuery(
					api.organizations.queries.getOrganizationRole,
					{ organizationId: args.orgId },
					{ initialData: args.initialData }
				)
			: { data: args.initialData }
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
