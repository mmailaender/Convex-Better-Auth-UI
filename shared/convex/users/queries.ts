import { query } from '../_generated/server';
import { ConvexError } from 'convex/values';
import { authComponent, createAuth } from '../auth';
import { APIError } from 'better-auth/api';

/**
 * Return the currently authenticated user
 */
export const getActiveUser = query({
	args: {},
	handler: async (ctx) => {
		return await authComponent.safeGetAuthUser(ctx);
	}
});

export const listAccounts = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return null;
		}

		try {
			const auth = createAuth(ctx);
			const accounts = await auth.api.listUserAccounts({
				headers: await authComponent.getHeaders(ctx)
			});
			return accounts;
		} catch (error) {
			if (error instanceof APIError) {
				if (error.statusCode === 401) {
					return [];
				}
			}
			throw error;
		}
	}
});

export const listApiKeys = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return null;
		}

		try {
			const auth = createAuth(ctx);
			const apiKeys = await auth.api.listApiKeys({
				headers: await authComponent.getHeaders(ctx)
			});
			return apiKeys;
		} catch (error) {
			if (error instanceof APIError) {
				// Like listAccounts, handle a 401: the api-key plugin can't resolve an admin's impersonation session
				// inside a query, and throwing here takes down every page that shows the user button
				if (error.statusCode === 401) {
					return null;
				}
				throw new ConvexError(`${error.statusCode} ${error.status} ${error.message}`);
			}
			throw error;
		}
	}
});
