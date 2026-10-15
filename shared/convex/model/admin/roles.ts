// Role helpers kept free of imports from auth.ts, so auth.ts can use them without an import cycle
import { v } from 'convex/values';

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
