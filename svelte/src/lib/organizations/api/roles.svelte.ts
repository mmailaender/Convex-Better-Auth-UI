// API
import { useQuery } from 'convex-svelte';
import { api } from '$convex/_generated/api';

// Types
import type { FunctionReturnType } from 'convex/server';
type ActiveOrganizationResponse = FunctionReturnType<
	typeof api.organizations.getActiveOrganization
>;

export function createRoles(initialData?: ActiveOrganizationResponse) {
	const activeOrganization = useQuery(api.organizations.getActiveOrganization, {}, { initialData });

	const _isOwner = $derived(activeOrganization?.data?.role === 'role_organization_owner');
	const _isAdmin = $derived(activeOrganization?.data?.role === 'role_organization_admin');
	const _isOwnerOrAdmin = $derived(
		['role_organization_owner', 'role_organization_admin'].includes(
			activeOrganization?.data?.role ?? ''
		)
	);

	return {
		get isOwner() {
			return _isOwner;
		},
		get isAdmin() {
			return _isAdmin;
		},
		get isOwnerOrAdmin() {
			return _isOwnerOrAdmin;
		},
		get activeOrganization() {
			return activeOrganization;
		}
	};
}
