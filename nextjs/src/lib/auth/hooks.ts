'use client';

import { useMemo } from 'react';
import { useConvexAuth, useQueries, useQuery } from 'convex/react';
import {
	getFunctionName,
	makeFunctionReference,
	type FunctionReference,
	type FunctionReturnType
} from 'convex/server';

import { api } from '@/convex/_generated/api';
import { preferInitialData, useInitialAuthData } from '@/lib/auth/initial-data';

/**
 * A query's answer, or `undefined` while it loads or after its lookup failed. The organization
 * queries throw on a failed lookup, so a caller can tell it from a confirmed absence (`null`,
 * `[]`); `useQuery` would rethrow it into the nearest error boundary, while these widgets show it
 * as loading or keep what they show.
 */
function useQueryUnlessFailed<
	Query extends FunctionReference<'query', 'public', Record<string, never>>
>(query: Query, skip: boolean): FunctionReturnType<Query> | undefined {
	/* Keyed by the function's name, as `useQuery` does: `api.x.y` is a proxy that hands out a new
	   reference on every access, and a new request on every render makes `useQueries` set state
	   during render, which React stops as an infinite loop. */
	const name = getFunctionName(query);
	const queries = useMemo(
		(): Parameters<typeof useQueries>[0] =>
			skip ? {} : { answer: { query: makeFunctionReference<'query'>(name), args: {} } },
		[name, skip]
	);
	const answer: unknown = useQueries(queries).answer;
	return answer instanceof Error ? undefined : (answer as FunctionReturnType<Query> | undefined);
}

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
	const activeOrganization = useQueryUnlessFailed(
		api.organizations.queries.getActiveOrganization,
		!isAuthenticated
	);

	return preferInitialData(activeOrganization, initialData?.activeOrganization);
}

export function useOrganizationListData() {
	const { isAuthenticated } = useConvexAuth();
	const initialData = useInitialAuthData();
	const organizationList = useQueryUnlessFailed(
		api.organizations.queries.listOrganizations,
		!isAuthenticated
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
