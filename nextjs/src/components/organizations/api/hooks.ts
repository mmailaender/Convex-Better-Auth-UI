import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export const useIsOwnerOrAdmin = () => {
	const activeOrganization = useQuery(api.organizations.getActiveOrganization);
	const isOwnerOrAdmin = ['role_organization_owner', 'role_organization_admin'].includes(
		activeOrganization?.role || ''
	);

	return isOwnerOrAdmin;
};

export const useIsOwner = () => {
	const activeOrganization = useQuery(api.organizations.getActiveOrganization);
	const isOwner = activeOrganization?.role === 'role_organization_owner';
	return isOwner;
};

export const useIsAdmin = () => {
	const activeOrganization = useQuery(api.organizations.getActiveOrganization);
	const isAdmin = activeOrganization?.role === 'role_organization_admin';
	return isAdmin;
};
