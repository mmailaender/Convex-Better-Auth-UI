import { useQuery } from 'convex-svelte';
import { api } from '$convex/_generated/api';

export function createRoles() {
	const activeOrganization = useQuery(api.organizations.getActiveOrganization, {});

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
