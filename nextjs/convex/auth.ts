import { BetterAuth, type AuthFunctions, type PublicAuthFunctions } from '@convex-dev/better-auth';
import { api, components, internal } from './_generated/api';
import { GenericCtx, query } from './_generated/server';
import type { Id, DataModel } from './_generated/dataModel';

// Typesafe way to pass Convex functions defined in this file
const authFunctions: AuthFunctions = internal.auth;
const publicAuthFunctions: PublicAuthFunctions = api.auth;

// Initialize the component
export const betterAuthComponent = new BetterAuth(components.betterAuth, {
	authFunctions,
	publicAuthFunctions
});

export const withHeaders = async <T extends object>(ctx: GenericCtx, obj: T) => ({
	...obj,
	headers: await betterAuthComponent.getHeaders(ctx)
});

// These are required named exports
export const { createUser, updateUser, deleteUser, createSession, isAuthenticated } =
	betterAuthComponent.createAuthFunctions<DataModel>({
		// Must create a user and return the user id
		onCreateUser: async (ctx, user) => {
			return ctx.db.insert('users', { email: user.email });
		},

		onUpdateUser: async (ctx, user) => {
			return ctx.db.patch(user.userId as Id<'users'>, { email: user.email });
		},

		// Delete the user when they are deleted from Better Auth
		onDeleteUser: async (ctx, userId) => {
			await ctx.db.delete(userId as Id<'users'>);

			// TODO: Add functionality from deleteUserModel
		}
	});

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		// Get user data from Better Auth - email, name, image, etc.
		const userMetadata = await betterAuthComponent.getAuthUser(ctx);
		if (!userMetadata) {
			return null;
		}
		// Get user data from your application's database
		return {
			...userMetadata
		};
	}
});
