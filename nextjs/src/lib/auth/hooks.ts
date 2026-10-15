'use client';

import { useConvexAuth, useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import { preferInitialData, useInitialAuthData } from '@/lib/auth/initial-data';

export function useActiveUserData() {
	const { isAuthenticated } = useConvexAuth();
	const initialData = useInitialAuthData();
	const activeUser = useQuery(api.users.queries.getActiveUser, isAuthenticated ? {} : 'skip');

	return preferInitialData(activeUser, initialData?.activeUser);
}

export function useAccountListData() {
	const { isAuthenticated } = useConvexAuth();
	const initialData = useInitialAuthData();
	const accountList = useQuery(api.users.queries.listAccounts, isAuthenticated ? {} : 'skip');

	return preferInitialData(accountList, initialData?.accountList);
}

export function useActiveOrganizationData() {
	const { isAuthenticated } = useConvexAuth();
	const initialData = useInitialAuthData();
	const activeOrganization = useQuery(
		api.organizations.queries.getActiveOrganization,
		isAuthenticated ? {} : 'skip'
	);

	return preferInitialData(activeOrganization, initialData?.activeOrganization);
}

export function useOrganizationListData() {
	const { isAuthenticated } = useConvexAuth();
	const initialData = useInitialAuthData();
	const organizationList = useQuery(
		api.organizations.queries.listOrganizations,
		isAuthenticated ? {} : 'skip'
	);

	return preferInitialData(organizationList, initialData?.organizationList);
}

export function useInvitationListData() {
	const { isAuthenticated } = useConvexAuth();
	const initialData = useInitialAuthData();
	const invitationList = useQuery(
		api.organizations.invitations.queries.listInvitations,
		isAuthenticated ? {} : 'skip'
	);

	return preferInitialData(invitationList, initialData?.invitationList);
}

export function useOrganizationRoleData(orgId?: string) {
	const { isAuthenticated } = useConvexAuth();
	const initialData = useInitialAuthData();
	const role = useQuery(
		api.organizations.queries.getOrganizationRole,
		isAuthenticated ? { organizationId: orgId } : 'skip'
	);

	return preferInitialData(role, orgId ? undefined : initialData?.role);
}
