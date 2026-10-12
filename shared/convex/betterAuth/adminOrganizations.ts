/**
 * Component-side organization functions used exclusively by the application
 * admin dashboard. These live in their own file (rather than `organization.ts`)
 * so the `admin/convex` registry item can be installed independently of the
 * `organizations` capability — the `organization`/`member`/`invitation` tables
 * always exist in the Better Auth schema, even when the organization plugin is
 * disabled (they are simply empty).
 *
 * Authorization is enforced by the public `admin/*` wrappers via
 * `requireAppAdmin` before any of these functions are reached.
 */
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { mutation, query, type MutationCtx } from './_generated/server';
import { withSystemFields } from 'convex-helpers/validators';
import { paginator } from 'convex-helpers/server/pagination';
import schema from './schema';
import { type Id } from './_generated/dataModel';

/**
 * Points a user's active organization, and that of each of their sessions, away
 * from `organizationId` when it is the active one: to another organization they
 * are a member of, or to none.
 */
async function moveOffOrganization(
	ctx: MutationCtx,
	userId: string,
	organizationId: Id<'organization'>
): Promise<void> {
	const nextMembership = (
		await ctx.db
			.query('member')
			.withIndex('userId', (q) => q.eq('userId', userId))
			.take(2)
	).find((membership) => membership.organizationId !== organizationId);
	const nextOrganizationId = nextMembership?.organizationId ?? null;

	const user = await ctx.db.get('user', userId as Id<'user'>);
	if (user?.activeOrganizationId === organizationId) {
		await ctx.db.patch('user', user._id, { activeOrganizationId: nextOrganizationId });
	}

	const sessions = ctx.db.query('session').withIndex('userId', (q) => q.eq('userId', userId));
	for await (const session of sessions) {
		if (session.activeOrganizationId === organizationId) {
			await ctx.db.patch('session', session._id, { activeOrganizationId: nextOrganizationId });
		}
	}
}

/**
 * List every organization in the deployment, newest first. Unlike
 * `organizations/queries.listOrganizations` (scoped to the caller's
 * memberships), this returns all organizations for the admin dashboard.
 */
export const listAllOrganizations = query({
	args: { paginationOpts: paginationOptsValidator },
	returns: v.object({
		page: v.array(
			v.object(withSystemFields('organization', schema.tables.organization.validator.fields))
		),
		isDone: v.boolean(),
		continueCursor: v.string(),
		splitCursor: v.optional(v.union(v.string(), v.null())),
		pageStatus: v.optional(
			v.union(v.literal('SplitRecommended'), v.literal('SplitRequired'), v.null())
		)
	}),
	handler: async (ctx, args) => {
		// Components can't use the built-in `.paginate()`, so page with convex-helpers' stream reader
		return await paginator(ctx.db, schema)
			.query('organization')
			.order('desc')
			.paginate(args.paginationOpts);
	}
});

/**
 * Return a single organization together with its members (each joined to a
 * lightweight user summary). Used by the admin organization detail view.
 */
export const getOrganizationWithMembers = query({
	args: { organizationId: v.id('organization') },
	returns: v.union(
		v.null(),
		v.object({
			organization: v.object(
				withSystemFields('organization', schema.tables.organization.validator.fields)
			),
			members: v.array(
				v.object({
					_id: v.id('member'),
					role: v.string(),
					createdAt: v.number(),
					user: v.union(
						v.null(),
						v.object({
							_id: v.id('user'),
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
		const organization = await ctx.db.get('organization', args.organizationId);
		if (!organization) {
			return null;
		}

		const members = await ctx.db
			.query('member')
			.withIndex('organizationId', (q) => q.eq('organizationId', args.organizationId))
			.take(200);

		const membersWithUsers = await Promise.all(
			members.map(async (member) => {
				const user = await ctx.db.get('user', member.userId as Id<'user'>);
				return {
					_id: member._id,
					role: member.role,
					createdAt: member.createdAt,
					user: user
						? {
								_id: user._id,
								name: user.name,
								email: user.email,
								image: user.image ?? null
							}
						: null
				};
			})
		);

		return { organization, members: membersWithUsers };
	}
});

/**
 * Force-delete an organization and all of its dependent records (members,
 * invitations) regardless of the caller's membership.
 *
 * Members whose active organization this was switch to another organization
 * they belong to (or none), on their user record and on their sessions, so
 * nobody is left pointing at a deleted organization.
 *
 * Returns the organization's `logoId` for the caller to delete: logos live in
 * the app's file storage, which this component can't reach.
 */
export const adminDeleteOrganization = mutation({
	args: { organizationId: v.id('organization') },
	returns: v.union(v.null(), v.string()),
	handler: async (ctx, args) => {
		const organization = await ctx.db.get('organization', args.organizationId);
		if (!organization) {
			return null;
		}

		// Remove memberships, moving members off this organization first.
		const members = ctx.db
			.query('member')
			.withIndex('organizationId', (q) => q.eq('organizationId', args.organizationId));
		for await (const member of members) {
			await moveOffOrganization(ctx, member.userId, args.organizationId);
			await ctx.db.delete('member', member._id);
		}

		// Remove pending invitations.
		const invitations = ctx.db
			.query('invitation')
			.withIndex('organizationId', (q) => q.eq('organizationId', args.organizationId));
		for await (const invitation of invitations) {
			await ctx.db.delete('invitation', invitation._id);
		}

		await ctx.db.delete('organization', args.organizationId);
		return organization.logoId ?? null;
	}
});

/**
 * Names of the organizations a user owns that still have other members.
 * Deleting such a user fails (see `organization.deleteUser`), so the admin
 * dashboard checks first to explain why.
 */
export const listSharedOwnedOrganizations = query({
	args: { userId: v.string() },
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		const names: string[] = [];
		const memberships = ctx.db
			.query('member')
			.withIndex('userId', (q) => q.eq('userId', args.userId));
		for await (const membership of memberships) {
			if (membership.role !== 'owner') continue;
			const members = await ctx.db
				.query('member')
				.withIndex('organizationId', (q) => q.eq('organizationId', membership.organizationId))
				.take(2);
			if (members.length < 2) continue;
			const organization = await ctx.db.get(
				'organization',
				membership.organizationId as Id<'organization'>
			);
			if (organization) names.push(organization.name);
		}
		return names;
	}
});
