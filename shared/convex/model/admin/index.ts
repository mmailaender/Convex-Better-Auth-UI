import { ConvexError, v } from 'convex/values';
import { authComponent } from '../../auth';
import { components } from '../../_generated/api';
import { AUTH_CONSTANTS } from '../../auth.constants';

import { getAdminUserIds, isAppAdminUser } from './roles';

// Types
import type { MutationCtx, QueryCtx } from '../../_generated/server';

export { appRoleValidator, getAdminUserIds, isAppAdminUser } from './roles';

/**
 * Organization roles an admin can give a member. Ownership changes hands through the owner
 * leaving the organization, so `owner` isn't one of them.
 */
export const organizationRoleValidator = v.union(v.literal('admin'), v.literal('member'));

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
 * admin feature is off or the caller is not an application admin.
 *
 * @returns The authenticated admin user document.
 */
export const requireAppAdmin = async (ctx: QueryCtx | MutationCtx) => {
	// Admins keep their role when the feature is turned off, so check the toggle here too
	if (!AUTH_CONSTANTS.admin) {
		throw new ConvexError('The admin feature is disabled');
	}
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
	const target: { _id: string; role?: string | null } | null = await ctx.runQuery(
		components.betterAuth.adapter.findOne,
		{ model: 'user', where: [{ field: '_id', value: targetUserId }] }
	);
	// The user may have been deleted meanwhile, and some Better Auth calls, like linking a
	// password account, don't check
	if (!target) {
		throw new ConvexError('User not found');
	}
	if (action === 'manage' && isAppAdminUser({ id: target._id, role: target.role })) {
		throw new ConvexError('Remove their admin role first.');
	}
};
