import { useQuery } from 'convex-svelte';
import { api } from '$convex/_generated/api';

const activeOrganization = useQuery(api.organizations.getActiveOrganization, {});

export const isOwner = $derived(activeOrganization?.data?.role === 'role_organization_owner');

export const isAdmin = $derived(activeOrganization?.data?.role === 'role_organization_admin');

export const isOwnerOrAdmin = $derived(
	['role_organization_owner', 'role_organization_admin'].includes(
		activeOrganization?.data?.role ?? ''
	)
);
