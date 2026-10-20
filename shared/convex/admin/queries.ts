import { query } from '../_generated/server';
import { ConvexError, v } from 'convex/values';
import { APIError } from 'better-auth/api';

import { authComponent, createAuth } from '../auth';
import { components } from '../_generated/api';
import { AUTH_CONSTANTS } from '../auth.constants';
import { getAdminUserIds, getIsAppAdmin, isAppAdminUser, requireAppAdmin } from '../model/admin';

/**
 * Whether the currently authenticated user is an application ("site") admin.
 *
 * Drives UI gating only — every privileged admin function additionally enforces
 * `requireAppAdmin` on the server.
 */
export const isCurrentUserAdmin = query({
	args: {},
	returns: v.boolean(),
	handler: async (ctx) => {
		if (!AUTH_CONSTANTS.admin) return false;
		return getIsAppAdmin(ctx);
	}
});

/**
 * Impersonation state of the current session. Non-null while the caller is
 * being impersonated by an admin (`session.impersonatedBy` is set).
 *
 * Deliberately NOT admin-gated: the impersonated session belongs to a regular
 * user, and the "you are impersonating" banner it drives must render for them.
 * It only ever exposes the caller's own session state.
 */
export const getImpersonationStatus = query({
	args: {},
	returns: v.union(v.null(), v.object({ impersonatedBy: v.string() })),
	handler: async (ctx) => {
		if (!AUTH_CONSTANTS.admin) return null;
		const identity = await ctx.auth.getUserIdentity();
		if (!identity?.sessionId) return null;
		const session: { impersonatedBy?: string | null } | null = await ctx.runQuery(
			components.betterAuth.adapter.findOne,
			{ model: 'session', where: [{ field: '_id', value: identity.sessionId as string }] }
		);
		return session?.impersonatedBy ? { impersonatedBy: session.impersonatedBy } : null;
	}
});

const adminUserValidator = v.object({
	id: v.string(),
	name: v.string(),
	email: v.string(),
	emailVerified: v.boolean(),
	image: v.union(v.null(), v.string()),
	role: v.union(v.null(), v.string()),
	banned: v.boolean(),
	banReason: v.union(v.null(), v.string()),
	/** Epoch ms when a temporary ban ends; `null` for permanent bans and unbanned users */
	banExpires: v.union(v.null(), v.number()),
	createdAt: v.number(),
	/** Admin through its role or the `ADMIN_USER_IDS` env var */
	isAppAdmin: v.boolean(),
	/** Admin through the `ADMIN_USER_IDS` env var, so changing the role has no effect */
	isBootstrapAdmin: v.boolean()
});

/** Most users or organizations a list loads; past that, admins search. */
const LIST_LIMIT = 1000;

const clampLimit = (limit: number) => Math.min(Math.max(Math.floor(limit), 1), LIST_LIMIT);

type UserDoc = {
	_id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	role?: string | null;
	banned?: boolean | null;
	banReason?: string | null;
	banExpires?: number | null;
	createdAt: number;
};

const toMillis = (value: Date | number | string | null | undefined): number | null =>
	value == null ? null : new Date(value).getTime();

/**
 * The admin dashboard's view of a user. Better Auth only lifts an expired ban when the user
 * next signs in, so an expired ban shows as no ban.
 */
const toAdminUser = (user: UserDoc, now: number) => {
	const banned = Boolean(user.banned) && (user.banExpires == null || user.banExpires > now);
	return {
		id: user._id,
		name: user.name,
		email: user.email,
		emailVerified: user.emailVerified,
		image: user.image ?? null,
		role: user.role ?? null,
		banned,
		banReason: banned ? (user.banReason ?? null) : null,
		banExpires: banned ? (user.banExpires ?? null) : null,
		createdAt: user.createdAt,
		isAppAdmin: isAppAdminUser({ id: user._id, role: user.role }),
		isBootstrapAdmin: getAdminUserIds().includes(user._id)
	};
};

/**
 * The newest `limit` users (admin only, at most 1000). "Load more" raises `limit`.
 *
 * With `searchValue`, returns the users whose name or email contains every
 * word of it (each word starting a word there), best matches first, at most
 * `limit` of them and capped at 100. Search results don't grow with `limit`
 * past that: a full list means there may be more, so refine the search.
 */
export const listUsers = query({
	args: {
		limit: v.number(),
		searchValue: v.optional(v.string())
	},
	returns: v.object({ users: v.array(adminUserValidator), hasMore: v.boolean() }),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		const limit = clampLimit(args.limit);
		const search = args.searchValue?.trim();
		const result = search
			? {
					users: await ctx.runQuery(components.betterAuth.adminUsers.searchUsers, {
						search,
						limit: Math.min(limit, 100)
					}),
					hasMore: false
				}
			: await ctx.runQuery(components.betterAuth.adminUsers.listUsers, { limit });
		const now = Date.now();
		return { users: result.users.map((user) => toAdminUser(user, now)), hasMore: result.hasMore };
	}
});

const adminOrganizationValidator = v.object({
	_id: v.string(),
	name: v.string(),
	slug: v.string(),
	logo: v.union(v.null(), v.string()),
	createdAt: v.number()
});

const toAdminOrganization = (organization: {
	_id: string;
	name: string;
	slug: string;
	logo?: string | null;
	createdAt: number;
}) => ({
	_id: organization._id,
	name: organization.name,
	slug: organization.slug,
	logo: organization.logo ?? null,
	createdAt: organization.createdAt
});

/**
 * A single user with their organization memberships (admin only), for the user profile.
 * `null` once the user is deleted. `memberships` is empty while organizations are disabled.
 */
export const getUser = query({
	args: { userId: v.string() },
	returns: v.union(
		v.null(),
		v.object({
			user: adminUserValidator,
			memberships: v.array(
				v.object({
					_id: v.string(),
					role: v.string(),
					createdAt: v.number(),
					organization: adminOrganizationValidator
				})
			)
		})
	),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		const user = await ctx.runQuery(components.betterAuth.adminUsers.getUser, {
			userId: args.userId
		});
		if (!user) {
			return null;
		}
		const memberships = AUTH_CONSTANTS.organizations
			? await ctx.runQuery(components.betterAuth.adminOrganizations.listUserMemberships, {
					userId: user._id
				})
			: [];
		return {
			user: toAdminUser(user, Date.now()),
			memberships: memberships.map((membership) => ({
				...membership,
				organization: toAdminOrganization(membership.organization)
			}))
		};
	}
});

/**
 * List the active sessions for a given user (admin only), newest first. Session tokens are
 * left out: they are bearer credentials, so they never leave the server.
 * Revoke a session by id with `admin/mutations.revokeUserSession`.
 */
export const listUserSessions = query({
	args: { userId: v.string() },
	returns: v.array(
		v.object({
			id: v.string(),
			createdAt: v.number(),
			expiresAt: v.number(),
			ipAddress: v.union(v.null(), v.string()),
			userAgent: v.union(v.null(), v.string()),
			impersonatedBy: v.union(v.null(), v.string())
		})
	),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		const auth = createAuth(ctx);
		try {
			const { sessions } = await auth.api.listUserSessions({
				body: { userId: args.userId },
				headers: await authComponent.getHeaders(ctx)
			});
			return sessions
				.map((session) => ({
					id: session.id,
					createdAt: toMillis(session.createdAt) ?? 0,
					expiresAt: toMillis(session.expiresAt) ?? 0,
					ipAddress: session.ipAddress ?? null,
					userAgent: session.userAgent ?? null,
					impersonatedBy: (session as { impersonatedBy?: string | null }).impersonatedBy ?? null
				}))
				.sort((a, b) => b.createdAt - a.createdAt);
		} catch (error) {
			if (error instanceof APIError) {
				throw new ConvexError(`${error.statusCode} ${error.status} ${error.message}`);
			}
			throw error;
		}
	}
});

/**
 * The newest `limit` organizations in the deployment (admin only, at most 1000).
 * "Load more" raises `limit`.
 *
 * With `searchValue`, returns the organizations whose name or slug contains every word of it,
 * at most `limit` of them and capped at 100, like `listUsers`.
 *
 * Gated behind both the `admin` and `organizations` feature toggles. Returns an
 * empty list when organizations are disabled so callers can render safely.
 */
export const listAllOrganizations = query({
	args: { limit: v.number(), searchValue: v.optional(v.string()) },
	returns: v.object({
		organizations: v.array(adminOrganizationValidator),
		hasMore: v.boolean()
	}),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		if (!AUTH_CONSTANTS.organizations) {
			return { organizations: [], hasMore: false };
		}
		const limit = clampLimit(args.limit);
		const search = args.searchValue?.trim();
		const result = search
			? {
					organizations: await ctx.runQuery(
						components.betterAuth.adminOrganizations.searchOrganizations,
						{ search, limit: Math.min(limit, 100) }
					),
					hasMore: false
				}
			: await ctx.runQuery(components.betterAuth.adminOrganizations.listAllOrganizations, {
					limit
				});
		return {
			organizations: result.organizations.map(toAdminOrganization),
			hasMore: result.hasMore
		};
	}
});

/**
 * At most 20 organizations whose name or slug contains every word of `search` (each word
 * starting a word there), or the newest ones without `search` (admin only). For the
 * organization picker. Empty while organizations are disabled.
 */
export const searchOrganizations = query({
	args: { search: v.optional(v.string()) },
	returns: v.array(adminOrganizationValidator),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		if (!AUTH_CONSTANTS.organizations) {
			return [];
		}
		const organizations = await ctx.runQuery(
			components.betterAuth.adminOrganizations.searchOrganizations,
			{ search: args.search ?? '', limit: 20 }
		);
		return organizations.map(toAdminOrganization);
	}
});

/**
 * Fetch a single organization with its first 200 members (admin only), the owner first.
 * Members whose user is gone have `user: null`.
 */
export const getOrganizationWithMembers = query({
	args: { organizationId: v.string() },
	returns: v.union(
		v.null(),
		v.object({
			organization: adminOrganizationValidator,
			members: v.array(
				v.object({
					_id: v.string(),
					role: v.string(),
					createdAt: v.number(),
					user: v.union(
						v.null(),
						v.object({
							_id: v.string(),
							name: v.string(),
							email: v.string(),
							image: v.union(v.null(), v.string()),
							banned: v.boolean(),
							isAppAdmin: v.boolean(),
							isBootstrapAdmin: v.boolean()
						})
					)
				})
			)
		})
	),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		if (!AUTH_CONSTANTS.organizations) {
			return null;
		}
		const result = await ctx.runQuery(
			components.betterAuth.adminOrganizations.getOrganizationWithMembers,
			{ organizationId: args.organizationId }
		);
		if (!result) {
			return null;
		}
		const now = Date.now();
		const adminUserIds = getAdminUserIds();
		return {
			organization: toAdminOrganization(result.organization),
			members: result.members.map(({ user, ...member }) => ({
				...member,
				user: user && {
					_id: user._id,
					name: user.name,
					email: user.email,
					image: user.image,
					// An expired ban shows as no ban, like on `toAdminUser`
					banned: Boolean(user.banned) && (user.banExpires == null || user.banExpires > now),
					isAppAdmin: isAppAdminUser({ id: user._id, role: user.role }),
					isBootstrapAdmin: adminUserIds.includes(user._id)
				}
			}))
		};
	}
});
