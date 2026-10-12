import { ConvexError, v } from 'convex/values';
import { authComponent } from '../../auth';
import { components } from '../../_generated/api';

// Types
import type { MutationCtx, QueryCtx } from '../../_generated/server';

/**
 * Roles that are treated as application-level ("site") admins.
 *
 * This must stay in sync with the `adminRoles` option passed to the Better Auth
 * `admin()` plugin in `auth.ts` (the plugin defaults to `['admin']`). It is
 * deliberately separate from the per-organization `owner` / `admin` / `member`
 * roles managed by the `organization` plugin.
 */
const APP_ADMIN_ROLES = ['admin'];

/**
 * Application roles an admin can assign. These are the Better Auth admin
 * plugin's default roles; extend both together if you configure custom roles.
 */
export const appRoleValidator = v.union(v.literal('user'), v.literal('admin'));

/**
 * Better Auth user ids listed in the `ADMIN_USER_IDS` env var. These users are
 * admins regardless of their `role` field, which is how the first admin is
 * bootstrapped.
 */
export const getAdminUserIds = (): string[] =>
	(process.env.ADMIN_USER_IDS ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);

/**
 * Returns `true` when the given Better Auth user is an application-level admin,
 * either because they hold an admin role or because their id is listed in the
 * `ADMIN_USER_IDS` bootstrap env var.
 *
 * Better Auth stores the `role` field as a (potentially comma-separated) string.
 */
export const isAppAdminUser = (user: { id: string; role?: string | null } | null): boolean => {
	if (!user) return false;
	if (getAdminUserIds().includes(user.id)) return true;
	const roles = (user.role ?? '')
		.split(',')
		.map((role) => role.trim())
		.filter(Boolean);
	return roles.some((role) => APP_ADMIN_ROLES.includes(role));
};

/**
 * Resolve the current user and return whether they are an app admin. Safe to use
 * from UI-facing queries (does not throw for anonymous users).
 */
export const getIsAppAdmin = async (ctx: QueryCtx | MutationCtx): Promise<boolean> => {
	const user = await authComponent.safeGetAuthUser(ctx);
	return user ? isAppAdminUser({ id: user._id, role: user.role }) : false;
};

/**
 * Defense-in-depth guard used by **every** admin Convex function. UI gating only
 * hides the surface; this is the real authorization boundary. Throws if the
 * caller is not an application admin.
 *
 * @returns The authenticated admin user document.
 */
export const requireAppAdmin = async (ctx: QueryCtx | MutationCtx) => {
	const user = await authComponent.safeGetAuthUser(ctx);
	if (!user) {
		throw new ConvexError('Not authenticated');
	}
	if (!isAppAdminUser({ id: user._id, role: user.role })) {
		throw new ConvexError('Forbidden: application admin role required');
	}
	return user;
};

/**
 * Guard against an admin performing a destructive action on their own account
 * (e.g. self-ban, self-delete, self-demotion), which would risk locking
 * themselves out.
 */
export const assertNotSelf = (adminUserId: string, targetUserId: string, action: string): void => {
	if (adminUserId === targetUserId) {
		throw new ConvexError(`You cannot ${action} your own account.`);
	}
};

/**
 * Guard for admin actions on another admin, so one admin can't lock out, take
 * over or quietly sign in as another:
 * - admins from `ADMIN_USER_IDS` can't be changed from the dashboard at all
 * - other admins have to lose their admin role (`setRole`) before they can be
 *   banned, deleted, signed out or given a new password
 */
export const assertCanManageUser = async (
	ctx: QueryCtx | MutationCtx,
	targetUserId: string,
	action: 'set-role' | 'manage'
): Promise<void> => {
	if (getAdminUserIds().includes(targetUserId)) {
		throw new ConvexError(
			'This admin is set in the ADMIN_USER_IDS environment variable and can only be changed there.'
		);
	}
	if (action === 'set-role') return;
	const target: { _id: string; role?: string | null } | null = await ctx.runQuery(
		components.betterAuth.adapter.findOne,
		{ model: 'user', where: [{ field: '_id', value: targetUserId }] }
	);
	if (target && isAppAdminUser({ id: target._id, role: target.role })) {
		throw new ConvexError('Remove their admin role first.');
	}
};
