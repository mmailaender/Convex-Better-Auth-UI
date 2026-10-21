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
	previousOwnerValidator,
	requireAppAdmin
} from '../model/admin';

// Types
import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

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
 * Throw unless the admin may change `userId`'s profile or memberships: their own, or another
 * user's once that user isn't an admin anymore (see `assertCanManageUser`).
 */
const assertCanChangeUser = async (
	ctx: MutationCtx,
	adminId: string,
	userId: string,
	{ allowDeleted = false }: { allowDeleted?: boolean } = {}
): Promise<void> => {
	if (adminId === userId) return;
	// A deleted account has no admin left to protect
	if (allowDeleted) {
		const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'user',
			where: [{ field: '_id', value: userId }]
		});
		if (!user) return;
	}
	await assertCanManageUser(ctx, userId, 'manage');
};

/**
 * The user a membership belongs to, for the checks of `assertCanChangeUser`. `null` once the
 * membership is gone.
 */
const getMemberUserId = async (ctx: MutationCtx, memberId: string): Promise<string | null> => {
	const member: { userId: string } | null = await ctx.runQuery(
		components.betterAuth.adapter.findOne,
		{ model: 'member', where: [{ field: '_id', value: memberId }] }
	);
	return member?.userId ?? null;
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
 * Change a user's name, email or both (admin only); leave out what stays. A new email counts as
 * verified, like on `createUser`. Other admins have to lose their admin role first, since a new
 * email would let whoever controls it reset their password.
 */
export const updateUser = mutation({
	args: {
		userId: v.string(),
		name: v.optional(v.string()),
		email: v.optional(v.string())
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		await assertCanChangeUser(ctx, admin._id, args.userId);
		const user: { name: string; email: string } | null = await ctx.runQuery(
			components.betterAuth.adapter.findOne,
			{ model: 'user', where: [{ field: '_id', value: args.userId }] }
		);
		if (!user) {
			throw new ConvexError('User not found');
		}
		const name = args.name?.trim();
		const email = args.email?.trim().toLowerCase();
		if (name === '') {
			throw new ConvexError('Name is required.');
		}
		const data: { name?: string; email?: string; emailVerified?: boolean } = {};
		if (name !== undefined && name !== user.name) data.name = name;
		if (email !== undefined && email !== user.email) {
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
		if (
			args.banExpiresIn !== undefined &&
			!(Number.isSafeInteger(args.banExpiresIn) && args.banExpiresIn > 0)
		) {
			throw new ConvexError('The ban duration has to be a positive number of seconds.');
		}
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
 * feature toggle in addition to `admin`. An organization owned by another admin
 * can only be deleted once they're no longer an admin.
 */
export const deleteOrganizationAsAdmin = mutation({
	args: { organizationId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		assertOrganizationsEnabled();
		// Like taking its ownership: another admin's organization stays until they lose their admin
		// role. One whose owner's account is gone can always be deleted
		const ownerUserIds = await ctx.runQuery(
			components.betterAuth.adminOrganizations.listOwnerUserIds,
			{ organizationId: args.organizationId }
		);
		for (const userId of ownerUserIds) {
			try {
				await assertCanChangeUser(ctx, admin._id, userId, { allowDeleted: true });
			} catch (error) {
				if (!(error instanceof ConvexError)) throw error;
				throw new ConvexError(
					"This organization's owner is an admin. It can be deleted once they're no longer one."
				);
			}
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

/**
 * Add a user to an organization (admin only), whether or not the admin is a member of it. Other
 * admins have to lose their admin role first, like for `updateUser`.
 */
export const addMember = mutation({
	args: {
		userId: v.string(),
		organizationId: v.string(),
		role: organizationRoleValidator
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		assertOrganizationsEnabled();
		await assertCanChangeUser(ctx, admin._id, args.userId);
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
 * keeps their role, and other admins have to lose their admin role first.
 */
export const updateMemberRole = mutation({
	args: { memberId: v.string(), role: organizationRoleValidator },
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		assertOrganizationsEnabled();
		const userId = await getMemberUserId(ctx, args.memberId);
		if (!userId) {
			throw new ConvexError('Membership not found');
		}
		await assertCanChangeUser(ctx, admin._id, userId);
		await ctx.runMutation(components.betterAuth.adminOrganizations.adminUpdateMemberRole, {
			memberId: args.memberId,
			role: args.role
		});
		return null;
	}
});

/**
 * Remove a member from an organization (admin only). The owner can't be removed, and other
 * admins have to lose their admin role first.
 */
export const removeMember = mutation({
	args: { memberId: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		assertOrganizationsEnabled();
		const userId = await getMemberUserId(ctx, args.memberId);
		if (!userId) {
			return null;
		}
		// The membership of a deleted account can always go
		await assertCanChangeUser(ctx, admin._id, userId, { allowDeleted: true });
		await ctx.runMutation(components.betterAuth.adminOrganizations.adminRemoveMember, {
			memberId: args.memberId
		});
		return null;
	}
});

/**
 * Change an organization's name, slug or logo (admin only), whether or not the admin is a member
 * of it; leave out what stays. `logoId` takes a file uploaded through `storage.generateUploadUrl`,
 * or `null` to remove the logo. The replaced logo's file is deleted. Once the organization is
 * deleted, it changes nothing, and deletes the logo uploaded for it.
 */
export const updateOrganization = mutation({
	args: {
		organizationId: v.string(),
		name: v.optional(v.string()),
		slug: v.optional(v.string()),
		logoId: v.optional(v.union(v.null(), v.id('_storage')))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		assertOrganizationsEnabled();
		// Deleted meanwhile, say by another admin: throwing would keep the logo uploaded for it,
		// with nothing pointing at the file
		const organization = await ctx.runQuery(components.betterAuth.adapter.findOne, {
			model: 'organization',
			where: [{ field: '_id', value: args.organizationId }]
		});
		if (!organization) {
			if (args.logoId) await ctx.storage.delete(args.logoId);
			return null;
		}
		let logo: { url: string; storageId: string } | null | undefined;
		if (args.logoId === null) {
			logo = null;
		} else if (args.logoId) {
			const url = await ctx.storage.getUrl(args.logoId);
			if (!url) {
				throw new ConvexError('The uploaded logo is missing. Upload it again.');
			}
			logo = { url, storageId: args.logoId };
		}
		const replacedLogoId = await ctx.runMutation(
			components.betterAuth.adminOrganizations.adminUpdateOrganization,
			{ organizationId: args.organizationId, name: args.name, slug: args.slug, logo }
		);
		if (replacedLogoId) {
			await ctx.storage.delete(replacedLogoId as Id<'_storage'>);
		}
		return null;
	}
});

/**
 * Make a member the owner of their organization (admin only). The previous owner stays as an
 * admin or member, or leaves the organization. Like the other membership changes, it needs the
 * new and the previous owner to be the admin themself or not admins.
 */
export const transferOwnership = mutation({
	args: { memberId: v.string(), previousOwner: previousOwnerValidator },
	returns: v.null(),
	handler: async (ctx, args) => {
		const admin = await requireAppAdmin(ctx);
		assertOrganizationsEnabled();
		const member: { userId: string; organizationId: string } | null = await ctx.runQuery(
			components.betterAuth.adapter.findOne,
			{ model: 'member', where: [{ field: '_id', value: args.memberId }] }
		);
		if (!member) {
			throw new ConvexError('Membership not found');
		}
		const ownerUserIds = await ctx.runQuery(
			components.betterAuth.adminOrganizations.listOwnerUserIds,
			{ organizationId: member.organizationId }
		);
		// The new owner needs an account; a previous owner's may be gone
		await assertCanChangeUser(ctx, admin._id, member.userId);
		for (const userId of ownerUserIds) {
			if (userId !== member.userId) {
				await assertCanChangeUser(ctx, admin._id, userId, { allowDeleted: true });
			}
		}
		await ctx.runMutation(components.betterAuth.adminOrganizations.adminTransferOwnership, {
			memberId: args.memberId,
			previousOwner: args.previousOwner
		});
		return null;
	}
});
