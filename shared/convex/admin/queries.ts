import { query } from '../_generated/server';
import { ConvexError, v, type Validator } from 'convex/values';
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

const paginatedValidator = <T extends Validator<unknown, 'required', string>>(item: T) =>
	v.object({
		page: v.array(item),
		isDone: v.boolean(),
		continueCursor: v.string(),
		splitCursor: v.optional(v.union(v.string(), v.null())),
		pageStatus: v.optional(
			v.union(v.literal('SplitRecommended'), v.literal('SplitRequired'), v.null())
		)
	});

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
 * List users, newest first (admin only), in pages for `usePaginatedQuery`.
 *
 * With `searchValue`, returns the users whose name or email contains every
 * word of it (each word starting a word there) as a single page of at most
 * `paginationOpts.numItems` (capped at 100), best matches first. Search results
 * don't page, so a full page means there may be more: refine the search.
 */
export const listUsers = query({
	args: {
		paginationOpts: paginationOptsValidator,
		searchValue: v.optional(v.string())
	},
	returns: paginatedValidator(adminUserValidator),
	handler: async (ctx, args) => {
		await requireAppAdmin(ctx);
		const search = args.searchValue?.trim();
		const result = search
			? {
					page: await ctx.runQuery(components.betterAuth.adminUsers.searchUsers, {
						search,
						limit: Math.min(args.paginationOpts.numItems, 100)
					}),
					isDone: true,
					continueCursor: ''
				}
			: await ctx.runQuery(components.betterAuth.adminUsers.listUsers, {
					paginationOpts: args.paginationOpts
				});

		const bootstrapAdminIds = getAdminUserIds();
		const now = Date.now();
		const toAdminUser = (user: UserDoc) => {
			// Better Auth only lifts an expired ban when the user next signs in
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
				isBootstrapAdmin: bootstrapAdminIds.includes(user._id)
			};
		};
		return { ...result, page: result.page.map(toAdminUser) };
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
	returns: paginatedValidator(adminOrganizationValidator),
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
