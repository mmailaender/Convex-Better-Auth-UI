import { query } from '../_generated/server';
import { ConvexError, v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
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

type BetterAuthUser = {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	role?: string | null;
	banned?: boolean | null;
	banReason?: string | null;
	banExpires?: Date | number | string | null;
	createdAt: Date | number | string;
};

const toMillis = (value: Date | number | string | null | undefined): number | null =>
	value == null ? null : new Date(value).getTime();

/**
 * List users in the deployment, newest first (admin only). Wraps the Better Auth
 * admin `listUsers` endpoint.
 *
 * `searchValue` matches users whose name or email contains it. The Convex
 * adapter compares case-sensitively and only supports one search field per
 * call, so this runs one search on the name as typed and one on the lowercased
 * email (Better Auth stores emails lowercased) and merges the results.
 *
 * Page by raising `limit` (capped at 1000): the Convex adapter doesn't support
 * offsets.
 */
export const listUsers = query({
	args: {
		searchValue: v.optional(v.string()),
		limit: v.optional(v.number())
	},
	returns: v.object({
		users: v.array(adminUserValidator),
		/** Number of matching users; a lower bound while `hasMore` is set during a search */
		total: v.number(),
		hasMore: v.boolean()
	}),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		const auth = createAuth(ctx);
		const headers = await authComponent.getHeaders(ctx);
		const limit = Math.min(Math.max(args.limit ?? 50, 1), 1000);
		const search = args.searchValue?.trim();

		const list = async (where?: { field: 'name' | 'email'; value: string }) => {
			const result = await auth.api.listUsers({
				query: {
					...(where
						? { searchField: where.field, searchOperator: 'contains', searchValue: where.value }
						: {}),
					limit,
					sortBy: 'createdAt',
					sortDirection: 'desc'
				},
				headers
			});
			return { users: result.users as BetterAuthUser[], total: result.total };
		};

		try {
			let users: BetterAuthUser[];
			let total: number;
			let hasMore: boolean;

			if (search) {
				const [byName, byEmail] = await Promise.all([
					list({ field: 'name', value: search }),
					list({ field: 'email', value: search.toLowerCase() })
				]);
				const merged = new Map<string, BetterAuthUser>();
				for (const user of [...byName.users, ...byEmail.users]) merged.set(user.id, user);
				users = [...merged.values()]
					.sort((a, b) => (toMillis(b.createdAt) ?? 0) - (toMillis(a.createdAt) ?? 0))
					.slice(0, limit);
				hasMore = merged.size > limit || byName.total > limit || byEmail.total > limit;
				total = Math.max(merged.size, byName.total, byEmail.total);
			} else {
				({ users, total } = await list());
				hasMore = total > users.length;
			}

			const bootstrapAdminIds = getAdminUserIds();
			const now = Date.now();
			return {
				users: users.map((user) => {
					const banExpires = toMillis(user.banExpires);
					// Better Auth only lifts an expired ban when the user next signs in
					const banned = Boolean(user.banned) && (banExpires === null || banExpires > now);
					return {
						id: user.id,
						name: user.name,
						email: user.email,
						emailVerified: Boolean(user.emailVerified),
						image: user.image ?? null,
						role: user.role ?? null,
						banned,
						banReason: banned ? (user.banReason ?? null) : null,
						banExpires: banned ? banExpires : null,
						createdAt: toMillis(user.createdAt) ?? 0,
						isAppAdmin: isAppAdminUser({ id: user.id, role: user.role }),
						isBootstrapAdmin: bootstrapAdminIds.includes(user.id)
					};
				}),
				total,
				hasMore
			};
		} catch (error) {
			if (error instanceof APIError) {
				throw new ConvexError(`${error.statusCode} ${error.status} ${error.message}`);
			}
			throw error;
		}
	}
});

/**
 * List the active sessions for a given user (admin only). Session tokens are
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
			return sessions.map((session) => ({
				id: session.id,
				createdAt: toMillis(session.createdAt) ?? 0,
				expiresAt: toMillis(session.expiresAt) ?? 0,
				ipAddress: session.ipAddress ?? null,
				userAgent: session.userAgent ?? null,
				impersonatedBy: (session as { impersonatedBy?: string | null }).impersonatedBy ?? null
			}));
		} catch (error) {
			if (error instanceof APIError) {
				throw new ConvexError(`${error.statusCode} ${error.status} ${error.message}`);
			}
			throw error;
		}
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
 * List every organization in the deployment, newest first (admin only).
 *
 * Gated behind both the `admin` and `organizations` feature toggles. Returns an
 * empty page when organizations are disabled so callers can render safely.
 */
export const listAllOrganizations = query({
	args: { paginationOpts: paginationOptsValidator },
	returns: v.object({
		page: v.array(adminOrganizationValidator),
		isDone: v.boolean(),
		continueCursor: v.string(),
		splitCursor: v.optional(v.union(v.string(), v.null())),
		pageStatus: v.optional(
			v.union(v.literal('SplitRecommended'), v.literal('SplitRequired'), v.null())
		)
	}),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		if (!AUTH_CONSTANTS.organizations) {
			return { page: [], isDone: true, continueCursor: '' };
		}
		const result = await ctx.runQuery(
			components.betterAuth.adminOrganizations.listAllOrganizations,
			{ paginationOpts: args.paginationOpts }
		);
		return { ...result, page: result.page.map(toAdminOrganization) };
	}
});

/**
 * Fetch a single organization with its members (admin only).
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
							image: v.union(v.null(), v.string())
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
		return result && { ...result, organization: toAdminOrganization(result.organization) };
	}
});
