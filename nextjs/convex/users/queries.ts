import { isUserExistingModel } from '../model/users';
import { query } from '../_generated/server';
import { v } from 'convex/values';
import { createAuth } from '../../src/components/auth/api/auth';
import { betterAuthComponent } from '../auth';
import { APIError } from 'better-auth/api';

/**
 * Check if a user with the given email exists.
 */
export const isUserExisting = query({
	args: {
		email: v.string()
	},
	handler: async (ctx, args) => {
		return await isUserExistingModel(ctx, args);
	}
});

/**
 * Return the currently authenticated user
 */
export const getActiveUser = query({
	handler: async (ctx) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const auth = createAuth(ctx);
		const session = await auth.api.getSession({
			headers: await betterAuthComponent.getHeaders(ctx)
		});
		return session?.user;
	}
});

export const listAccounts = query({
	handler: async (ctx) => {
		const userId = await betterAuthComponent.getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		try {
			const auth = createAuth(ctx);
			const accounts = await auth.api.listUserAccounts({
				headers: await betterAuthComponent.getHeaders(ctx)
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
