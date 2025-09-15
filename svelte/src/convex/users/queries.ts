import { query } from '../_generated/server';
import { v } from 'convex/values';
import { authComponent, createAuth } from '../auth';
import { APIError } from 'better-auth/api';
import { components } from '../_generated/api';

/**
 * Check if a user with the given email exists. Works also in a non-authenticated context.
 */
export const isUserExisting = query({
	args: {
		email: v.string()
	},
	handler: async (ctx, args) => {
		const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'user',
			where: [{ field: 'email', operator: 'eq', value: args.email }]
		});
		return user !== null;
	}
});

/**
 * Return the currently authenticated user
 */
export const getActiveUser = query({
	handler: async (ctx) => {
		const user = await authComponent.safeGetAuthUser(ctx);
		if (!user) {
			return null;
		}

		const auth = createAuth(ctx);
		const session = await auth.api.getSession({
			headers: await authComponent.getHeaders(ctx)
		});
		return session?.user;
	}
});

export const listAccounts = query({
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
