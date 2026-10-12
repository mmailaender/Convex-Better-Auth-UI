import { mutation } from '../_generated/server';
import { ConvexError, v } from 'convex/values';
import { APIError } from 'better-auth/api';

import { authComponent, createAuth } from '../auth';
import { components } from '../_generated/api';
import { AUTH_CONSTANTS } from '../auth.constants';
import {
	appRoleValidator,
	assertCanManageUser,
	assertNotSelf,
	requireAppAdmin
} from '../model/admin';

// Types
import type { Id } from '../_generated/dataModel';

/**
 * Translate Better Auth `APIError`s into `ConvexError`s, mirroring the
 * convention used across the other Convex wrappers.
 */
const toConvexError = (error: unknown): never => {
	if (error instanceof APIError) {
		throw new ConvexError(`${error.statusCode} ${error.status} ${error.message}`);
	}
	throw error;
};

/**
 * Better Auth checks the password length on `setUserPassword` but not on
 * `createUser` or when linking a password account, so do it here.
 */
const assertPasswordLength = async (
	auth: ReturnType<typeof createAuth>,
	password: string
): Promise<void> => {
	const { minPasswordLength, maxPasswordLength } = (await auth.$context).password.config;
	if (password.length < minPasswordLength || password.length > maxPasswordLength) {
		throw new ConvexError(
			`Password must be between ${minPasswordLength} and ${maxPasswordLength} characters.`
		);
	}
};

/**
 * Create a new user (admin only). The email counts as verified, since an admin
 * vouches for it, so the user can sign in right away even when email
 * verification is required.
 */
export const createUser = mutation({
	args: {
		email: v.string(),
		password: v.string(),
		name: v.string(),
		role: v.optional(appRoleValidator)
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		const auth = createAuth(ctx);
		await assertPasswordLength(auth, args.password);
		try {
			await auth.api.createUser({
				body: {
					email: args.email,
					password: args.password,
					name: args.name,
					role: args.role ?? 'user',
					data: { emailVerified: true }
				},
				headers: await authComponent.getHeaders(ctx)
			});
			return null;
		} catch (error) {
			return toConvexError(error);
		}
	}
});

/**
 * Set a user's application role (admin only). An admin cannot change their own
 * role to avoid self-lockout, nor that of an `ADMIN_USER_IDS` admin.
 */
export const setRole = mutation({
	args: {
		userId: v.string(),
		role: appRoleValidator
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		assertNotSelf(admin._id, args.userId, 'change the role of');
		await assertCanManageUser(ctx, args.userId, 'set-role');
		const auth = createAuth(ctx);
		try {
			await auth.api.setRole({
				body: { userId: args.userId, role: args.role },
				headers: await authComponent.getHeaders(ctx)
			});
			return null;
		} catch (error) {
			return toConvexError(error);
		}
	}
});

/**
 * Ban a user (admin only). `banExpiresIn` is a duration in seconds; omit for a
 * permanent ban.
 */
export const banUser = mutation({
	args: {
		userId: v.string(),
		banReason: v.optional(v.string()),
		banExpiresIn: v.optional(v.number())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		assertNotSelf(admin._id, args.userId, 'ban');
		await assertCanManageUser(ctx, args.userId, 'manage');
		const auth = createAuth(ctx);
		try {
			await auth.api.banUser({
				body: {
					userId: args.userId,
					banReason: args.banReason,
					banExpiresIn: args.banExpiresIn
				},
				headers: await authComponent.getHeaders(ctx)
			});
			return null;
		} catch (error) {
			return toConvexError(error);
		}
	}
});

/**
 * Lift a user's ban (admin only).
 */
export const unbanUser = mutation({
	args: { userId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		const auth = createAuth(ctx);
		try {
			await auth.api.unbanUser({
				body: { userId: args.userId },
				headers: await authComponent.getHeaders(ctx)
			});
			return null;
		} catch (error) {
			return toConvexError(error);
		}
	}
});

/**
 * Permanently remove a user (admin only). An admin cannot remove themselves or
 * another admin, and a user who owns an organization with other members has to
 * give it up first.
 */
export const removeUser = mutation({
	args: { userId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		assertNotSelf(admin._id, args.userId, 'delete');
		await assertCanManageUser(ctx, args.userId, 'manage');
		if (AUTH_CONSTANTS.organizations) {
			const sharedOrganizations = await ctx.runQuery(
				components.betterAuth.adminOrganizations.listSharedOwnedOrganizations,
				{ userId: args.userId }
			);
			if (sharedOrganizations.length > 0) {
				throw new ConvexError(
					`This user owns ${sharedOrganizations.join(', ')}, which still ${
						sharedOrganizations.length === 1 ? 'has' : 'have'
					} other members. Delete ${
						sharedOrganizations.length === 1 ? 'it' : 'them'
					} or make another member the owner first.`
				);
			}
		}
		const auth = createAuth(ctx);
		try {
			await auth.api.removeUser({
				body: { userId: args.userId },
				headers: await authComponent.getHeaders(ctx)
			});
			return null;
		} catch (error) {
			return toConvexError(error);
		}
	}
});

/**
 * Set a user's password (admin only). A user who signs in without a password
 * (social, magic link or email code) gets a password account, so they can sign
 * in with their email and this password too.
 */
export const setUserPassword = mutation({
	args: {
		userId: v.string(),
		newPassword: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		if (admin._id !== args.userId) {
			await assertCanManageUser(ctx, args.userId, 'manage');
		}
		const auth = createAuth(ctx);
		const credentialAccount = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'account',
			where: [
				{ field: 'userId', value: args.userId },
				{ field: 'providerId', value: 'credential' }
			]
		});
		if (!credentialAccount) {
			await assertPasswordLength(auth, args.newPassword);
			const authContext = await auth.$context;
			await authContext.internalAdapter.linkAccount({
				userId: args.userId,
				providerId: 'credential',
				accountId: args.userId,
				password: await authContext.password.hash(args.newPassword)
			});
			return null;
		}
		try {
			await auth.api.setUserPassword({
				body: { userId: args.userId, newPassword: args.newPassword },
				headers: await authComponent.getHeaders(ctx)
			});
			return null;
		} catch (error) {
			return toConvexError(error);
		}
	}
});

/**
 * Revoke a single user session by id (admin only). Takes the id from
 * `admin/queries.listUserSessions` and looks the token up here, so session
 * tokens never reach the client.
 */
export const revokeUserSession = mutation({
	args: { sessionId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		const session: { token: string; userId: string } | null = await ctx.runQuery(
			components.betterAuth.adapter.findOne,
			{ model: 'session', where: [{ field: '_id', value: args.sessionId }] }
		);
		if (!session) {
			throw new ConvexError('Session not found');
		}
		if (session.userId !== admin._id) {
			await assertCanManageUser(ctx, session.userId, 'manage');
		}
		const auth = createAuth(ctx);
		try {
			await auth.api.revokeUserSession({
				body: { sessionToken: session.token },
				headers: await authComponent.getHeaders(ctx)
			});
			return null;
		} catch (error) {
			return toConvexError(error);
		}
	}
});

/**
 * Revoke all of a user's sessions (admin only).
 */
export const revokeUserSessions = mutation({
	args: { userId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		if (admin._id !== args.userId) {
			await assertCanManageUser(ctx, args.userId, 'manage');
		}
		const auth = createAuth(ctx);
		try {
			await auth.api.revokeUserSessions({
				body: { userId: args.userId },
				headers: await authComponent.getHeaders(ctx)
			});
			return null;
		} catch (error) {
			return toConvexError(error);
		}
	}
});

/**
 * Force-delete an organization (admin only). Gated behind the `organizations`
 * feature toggle in addition to `admin`.
 */
export const deleteOrganizationAsAdmin = mutation({
	args: { organizationId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		if (!AUTH_CONSTANTS.organizations) {
			throw new ConvexError('Organizations are not enabled');
		}
		const logoId = await ctx.runMutation(
			components.betterAuth.adminOrganizations.adminDeleteOrganization,
			{ organizationId: args.organizationId }
		);
		if (logoId) {
			await ctx.storage.delete(logoId as Id<'_storage'>);
		}
		return null;
	}
});
