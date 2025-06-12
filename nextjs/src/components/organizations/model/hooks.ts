import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

export const useIsOwnerOrAdmin = () => {
	const activeOrganization = useQuery(api.organizations.getActiveOrganization);
	const isOwnerOrAdmin = ['role_organization_owner', 'role_organization_admin'].includes(
		activeOrganization?.role || ''
	);

	return isOwnerOrAdmin;
};
