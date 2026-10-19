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
import { ConvexError, v } from 'convex/values';
import { mutation, query, type MutationCtx } from './_generated/server';
import { withSystemFields } from 'convex-helpers/validators';
import schema from './schema';
import { containsEveryWord, SEARCH_CANDIDATES } from './adminUsers';
import { type Doc, type Id } from './_generated/dataModel';

const organizationValidator = v.object(
	withSystemFields('organization', schema.tables.organization.validator.fields)
);

/** Better Auth stores a member's roles as a comma-separated string. */
const isOwner = (member: Doc<'member'>) =>
	member.role.split(',').some((role) => role.trim() === 'owner');

/**
 * Organization roles the admin dashboard assigns. Ownership changes hands through the owner
 * leaving the organization (`organizations/members.leaveOrganization`), so it isn't one of them.
 */
const assignableRoleValidator = v.union(v.literal('admin'), v.literal('member'));

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
 * The newest `limit` organizations in the deployment. Unlike
 * `organizations/queries.listOrganizations` (scoped to the caller's
 * memberships), this covers every organization, for the admin dashboard. Pages
 * grow by raising `limit`, like `adminUsers.listUsers`.
 */
export const listAllOrganizations = query({
	args: { limit: v.number() },
	returns: v.object({ organizations: v.array(organizationValidator), hasMore: v.boolean() }),
	handler: async (ctx, args) => {
		const organizations = await ctx.db
			.query('organization')
			.order('desc')
			.take(args.limit + 1);
		return {
			organizations: organizations.slice(0, args.limit),
			hasMore: organizations.length > args.limit
		};
	}
});

/**
 * Organizations whose name or slug contains every word of `search` (each word starting a word
 * there, like `adminUsers.searchUsers`), or the newest ones for an empty `search`. For the
 * organization picker of the admin dashboard.
 */
export const searchOrganizations = query({
	args: { search: v.string(), limit: v.number() },
	returns: v.array(organizationValidator),
	handler: async (ctx, args) => {
		const search = args.search.trim();
		if (!search) {
			return await ctx.db.query('organization').order('desc').take(args.limit);
		}
		const [byName, bySlug] = await Promise.all([
			ctx.db
				.query('organization')
				.withSearchIndex('search_name', (q) => q.search('name', search))
				.take(SEARCH_CANDIDATES),
			ctx.db
				.query('organization')
				.withSearchIndex('search_slug', (q) => q.search('slug', search))
				.take(SEARCH_CANDIDATES)
		]);
		const organizations = new Map<string, Doc<'organization'>>();
		for (const organization of [...byName, ...bySlug]) {
			if (containsEveryWord(`${organization.name} ${organization.slug}`, search)) {
				organizations.set(organization._id, organization);
			}
		}
		return [...organizations.values()].slice(0, args.limit);
	}
});

/**
 * The organizations a user is a member of, with their role in each, oldest membership first.
 * For the user profile of the admin dashboard.
 */
export const listUserMemberships = query({
	args: { userId: v.string() },
	returns: v.array(
		v.object({
			_id: v.id('member'),
			role: v.string(),
			createdAt: v.number(),
			organization: organizationValidator
		})
	),
	handler: async (ctx, args) => {
		const memberships = await ctx.db
			.query('member')
			.withIndex('userId', (q) => q.eq('userId', args.userId))
			.take(100);
		const result = await Promise.all(
			memberships.map(async (membership) => {
				const organization = await ctx.db.get(
					'organization',
					membership.organizationId as Id<'organization'>
				);
				return organization
					? {
							_id: membership._id,
							role: membership.role,
							createdAt: membership.createdAt,
							organization
						}
					: null;
			})
		);
		return result.filter((membership) => membership !== null);
	}
});

/**
 * Change a member's role to `admin` or `member`, regardless of the caller's membership.
 * Owners keep their role: an organization always has its owner.
 */
export const adminUpdateMemberRole = mutation({
	args: { memberId: v.id('member'), role: assignableRoleValidator },
	returns: v.null(),
	handler: async (ctx, args) => {
		const member = await ctx.db.get('member', args.memberId);
		if (!member) {
			throw new ConvexError('Membership not found');
		}
		if (isOwner(member)) {
			throw new ConvexError("The owner's role can't be changed.");
		}
		await ctx.db.patch('member', member._id, { role: args.role });
		return null;
	}
});

/**
 * Remove a member from an organization, regardless of the caller's membership. Owners can't be
 * removed: delete the organization instead. A member who had it active switches to another of
 * their organizations.
 */
export const adminRemoveMember = mutation({
	args: { memberId: v.id('member') },
	returns: v.null(),
	handler: async (ctx, args) => {
		const member = await ctx.db.get('member', args.memberId);
		if (!member) {
			return null;
		}
		if (isOwner(member)) {
			throw new ConvexError(
				"The owner can't be removed. Delete the organization, or have the owner leave it and pick a successor."
			);
		}
		await ctx.db.delete('member', member._id);
		await moveOffOrganization(ctx, member.userId, member.organizationId as Id<'organization'>);
		return null;
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
			organization: organizationValidator,
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
 * invitations, API keys) regardless of the caller's membership.
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

		// Remove its API keys, which would otherwise keep verifying
		const apiKeys = ctx.db
			.query('apikey')
			.withIndex('referenceId', (q) => q.eq('referenceId', args.organizationId));
		for await (const apiKey of apiKeys) {
			await ctx.db.delete('apikey', apiKey._id);
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
