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
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import { withSystemFields } from 'convex-helpers/validators';
import schema from './schema';
import { containsEveryWord, SEARCH_CANDIDATES } from './adminUsers';
import { type Doc, type Id } from './_generated/dataModel';

const organizationValidator = v.object(
	withSystemFields('organization', schema.tables.organization.validator.fields)
);

/** Better Auth stores a member's roles as a comma-separated string. */
const isOwner = (member: { role: string }) =>
	member.role.split(',').some((role) => role.trim() === 'owner');

/**
 * Organization roles the admin dashboard assigns. Ownership changes hands through
 * `adminTransferOwnership`, so it isn't one of them.
 */
const assignableRoleValidator = v.union(v.literal('admin'), v.literal('member'));

/** Lowercase letters, numbers and hyphens, like `model/organizations` accepts. */
const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** The owners of an organization: one, unless roles were changed outside the dashboard. */
async function getOwners(
	ctx: QueryCtx,
	organizationId: Id<'organization'>
): Promise<Doc<'member'>[]> {
	const owners: Doc<'member'>[] = [];
	const members = ctx.db
		.query('member')
		.withIndex('organizationId', (q) => q.eq('organizationId', organizationId));
	for await (const member of members) {
		if (isOwner(member)) owners.push(member);
	}
	return owners;
}

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
 * removed: transfer the ownership (`adminTransferOwnership`) or delete the organization instead. A member who had it active switches to another of
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
				"The owner can't be removed. Make another member the owner first, or delete the organization."
			);
		}
		await ctx.db.delete('member', member._id);
		await moveOffOrganization(ctx, member.userId, member.organizationId as Id<'organization'>);
		return null;
	}
});

/**
 * The user ids of an organization's owners, for the admin dashboard's checks before
 * `adminTransferOwnership`.
 */
export const listOwnerUserIds = query({
	args: { organizationId: v.id('organization') },
	returns: v.array(v.string()),
	handler: async (ctx, args) => {
		const owners = await getOwners(ctx, args.organizationId);
		return owners.map((owner) => owner.userId);
	}
});

/**
 * Make a member the owner of their organization, regardless of the caller's membership. The
 * previous owner stays as `admin` or `member`, or leaves the organization with `remove`, and
 * switches to another of their organizations if they had this one active.
 */
export const adminTransferOwnership = mutation({
	args: {
		memberId: v.id('member'),
		previousOwner: v.union(v.literal('admin'), v.literal('member'), v.literal('remove'))
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const member = await ctx.db.get('member', args.memberId);
		if (!member) {
			throw new ConvexError('Membership not found');
		}
		if (isOwner(member)) {
			throw new ConvexError('They already own this organization.');
		}
		const organizationId = member.organizationId as Id<'organization'>;
		const owners = await getOwners(ctx, organizationId);
		await ctx.db.patch('member', member._id, { role: 'owner' });
		for (const owner of owners) {
			if (args.previousOwner === 'remove') {
				await ctx.db.delete('member', owner._id);
				await moveOffOrganization(ctx, owner.userId, organizationId);
			} else {
				await ctx.db.patch('member', owner._id, { role: args.previousOwner });
			}
		}
		return null;
	}
});

/**
 * Change an organization's name, slug or logo, regardless of the caller's membership; leave out
 * what stays. `logo: null` removes the logo.
 *
 * Returns the storage id of the logo it replaced or removed, for the caller to delete: logos
 * live in the app's file storage, which this component can't reach.
 */
export const adminUpdateOrganization = mutation({
	args: {
		organizationId: v.id('organization'),
		name: v.optional(v.string()),
		slug: v.optional(v.string()),
		logo: v.optional(v.union(v.null(), v.object({ url: v.string(), storageId: v.string() })))
	},
	returns: v.union(v.null(), v.string()),
	handler: async (ctx, args) => {
		const organization = await ctx.db.get('organization', args.organizationId);
		if (!organization) {
			throw new ConvexError('Organization not found');
		}
		const patch: Partial<Doc<'organization'>> = {};
		if (args.name !== undefined) {
			const name = args.name.trim();
			if (!name) {
				throw new ConvexError('Name is required.');
			}
			if (name !== organization.name) patch.name = name;
		}
		if (args.slug !== undefined) {
			const slug = args.slug.trim();
			if (!SLUG_PATTERN.test(slug)) {
				throw new ConvexError('The slug can only contain lowercase letters, numbers and hyphens.');
			}
			if (slug !== organization.slug) {
				const taken = await ctx.db
					.query('organization')
					.withIndex('slug', (q) => q.eq('slug', slug))
					.first();
				if (taken) {
					throw new ConvexError('Another organization already uses this slug.');
				}
				patch.slug = slug;
			}
		}
		let replacedLogoId: string | null = null;
		// Removing also clears a logo set as a URL, through Better Auth, without a file of ours
		if (
			args.logo === null
				? Boolean(organization.logo || organization.logoId)
				: args.logo !== undefined && args.logo.storageId !== organization.logoId
		) {
			replacedLogoId = organization.logoId ?? null;
			patch.logo = args.logo?.url ?? null;
			patch.logoId = args.logo?.storageId ?? null;
		}
		if (Object.keys(patch).length > 0) {
			await ctx.db.patch('organization', organization._id, patch);
		}
		return replacedLogoId;
	}
});

/**
 * Return a single organization together with its first 200 members (each joined to a
 * lightweight user summary), the owner first. Used by the admin organization view. `null`
 * when it doesn't exist, also for an id that isn't one, like from an edited URL.
 */
export const getOrganizationWithMembers = query({
	args: { organizationId: v.string() },
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
							image: v.union(v.null(), v.string()),
							role: v.union(v.null(), v.string()),
							banned: v.union(v.null(), v.boolean()),
							banExpires: v.union(v.null(), v.number())
						})
					)
				})
			)
		})
	),
	handler: async (ctx, args) => {
		const organizationId = ctx.db.normalizeId('organization', args.organizationId);
		const organization = organizationId && (await ctx.db.get('organization', organizationId));
		if (!organization) {
			return null;
		}

		const members = await ctx.db
			.query('member')
			.withIndex('organizationId', (q) => q.eq('organizationId', organization._id))
			.take(200);
		// Owners may have joined after the first 200 members
		for (const owner of await getOwners(ctx, organization._id)) {
			if (!members.some((member) => member._id === owner._id)) members.push(owner);
		}

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
								image: user.image ?? null,
								role: user.role ?? null,
								banned: user.banned ?? null,
								banExpires: user.banExpires ?? null
							}
						: null
				};
			})
		);

		// The owner first, then everyone else in the order they joined
		membersWithUsers.sort(
			(a, b) => Number(isOwner(b)) - Number(isOwner(a)) || a.createdAt - b.createdAt
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
			if (!isOwner(membership)) continue;
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
