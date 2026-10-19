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
	organizationRoleValidator,
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
 * Throw unless the organization feature is on. Admins can still list organizations while it's
 * off (as empty), but not change them.
 */
const assertOrganizationsEnabled = (): void => {
	if (!AUTH_CONSTANTS.organizations) {
		throw new ConvexError('Organizations are not enabled');
	}
};

/**
 * Create a new user (admin only), optionally as a member of an existing organization. The email
 * counts as verified, since an admin vouches for it, so the user can sign in right away even when
 * email verification is required. New users are never admins: promote them with `setRole`.
 *
 * @returns The new user's id.
 */
export const createUser = mutation({
	args: {
		email: v.string(),
		password: v.string(),
		name: v.string(),
		organizationId: v.optional(v.string()),
		organizationRole: v.optional(organizationRoleValidator)
	},
	returns: v.string(),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		if (args.organizationId) {
			assertOrganizationsEnabled();
		}
		const auth = createAuth(ctx);
		await assertPasswordLength(auth, args.password);
		try {
			const { user } = await auth.api.createUser({
				body: {
					email: args.email,
					password: args.password,
					name: args.name,
					role: 'user',
					data: { emailVerified: true }
				},
				headers: await authComponent.getHeaders(ctx)
			});
			// In the same transaction: if adding the member fails, the user isn't created either
			if (args.organizationId) {
				await auth.api.addMember({
					body: {
						userId: user.id,
						organizationId: args.organizationId,
						role: args.organizationRole ?? 'member'
					}
				});
			}
			return user.id;
		} catch (error) {
			return toConvexError(error);
		}
	}
});

/**
 * Change a user's name and email (admin only). A new email counts as verified, like on
 * `createUser`. Other admins have to lose their admin role first, since a new email would let
 * whoever controls it reset their password.
 */
export const updateUser = mutation({
	args: {
		userId: v.string(),
		name: v.string(),
		email: v.string()
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		if (admin._id !== args.userId) {
			await assertCanManageUser(ctx, args.userId, 'manage');
		}
		const user: { name: string; email: string } | null = await ctx.runQuery(
			components.betterAuth.adapter.findOne,
			{ model: 'user', where: [{ field: '_id', value: args.userId }] }
		);
		if (!user) {
			throw new ConvexError('User not found');
		}
		const name = args.name.trim();
		const email = args.email.trim().toLowerCase();
		if (!name) {
			throw new ConvexError('Name is required.');
		}
		const data: { name?: string; email?: string; emailVerified?: boolean } = {};
		if (name !== user.name) data.name = name;
		if (email !== user.email) {
			data.email = email;
			data.emailVerified = true;
		}
		if (Object.keys(data).length === 0) {
			return null;
		}
		const auth = createAuth(ctx);
		try {
			await auth.api.adminUpdateUser({
				body: { userId: args.userId, data },
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
			// Better Auth leaves banExpires alone for a permanent ban, so an expired earlier ban
			// would lift this one at the next sign-in
			if (args.banExpiresIn === undefined) {
				await ctx.runMutation(components.betterAuth.adapter.updateOne, {
					input: {
						model: 'user',
						where: [{ field: '_id', value: args.userId }],
						update: { banExpires: null }
					}
				});
			}
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
		assertOrganizationsEnabled();
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

/**
 * Add a user to an organization (admin only), whether or not the admin is a member of it.
 */
export const addMember = mutation({
	args: {
		userId: v.string(),
		organizationId: v.string(),
		role: organizationRoleValidator
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		assertOrganizationsEnabled();
		const auth = createAuth(ctx);
		try {
			await auth.api.addMember({
				body: { userId: args.userId, organizationId: args.organizationId, role: args.role }
			});
			return null;
		} catch (error) {
			return toConvexError(error);
		}
	}
});

/**
 * Change a member's role in an organization to `admin` or `member` (admin only). The owner
 * keeps their role.
 */
export const updateMemberRole = mutation({
	args: { memberId: v.string(), role: organizationRoleValidator },
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		assertOrganizationsEnabled();
		await ctx.runMutation(components.betterAuth.adminOrganizations.adminUpdateMemberRole, {
			memberId: args.memberId,
			role: args.role
		});
		return null;
	}
});

/**
 * Remove a member from an organization (admin only). The owner can't be removed.
 */
export const removeMember = mutation({
	args: { memberId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		assertOrganizationsEnabled();
		await ctx.runMutation(components.betterAuth.adminOrganizations.adminRemoveMember, {
			memberId: args.memberId
		});
		return null;
	}
});
