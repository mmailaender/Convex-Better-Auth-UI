'use client';

import { useConvexAuth, useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';

/**
 * Whether the authenticated user is an application ("site") admin. Used to gate
 * the admin entry point in the UI. Server-side `requireAppAdmin` is the real
 * authorization boundary — this only controls visibility.
 */
export function useIsAppAdmin(): boolean {
	const { isAuthenticated } = useConvexAuth();
	const isAdmin = useQuery(api.admin.queries.isCurrentUserAdmin, isAuthenticated ? {} : 'skip');
	return isAdmin ?? false;
}
