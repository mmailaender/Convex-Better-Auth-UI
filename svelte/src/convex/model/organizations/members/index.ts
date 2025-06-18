import { Id, Doc } from '../../../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../../../_generated/server';
import { ConvexError } from 'convex/values';

/**
 * Business-logic helpers for the Organization → Members sub-domain.
 *
 * IMPORTANT: These helpers do NOT perform authentication. Callers must pass the
 * already-authenticated user id (actor).
 */

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type MemberRole = Doc<'organizationMembers'>['role'];

/* -------------------------------------------------------------------------- */
/*                                  QUERIES                                   */
/* -------------------------------------------------------------------------- */

/**
 * Fetch all members of the specified organization.
 */
export const getOrganizationMembersModel = async (
	ctx: QueryCtx,
	args: { organizationId: Id<'organizations'> }
) => {
	const { organizationId } = args;

	const memberships = await ctx.db
		.query('organizationMembers')
		.withIndex('orgId', (q) => q.eq('organizationId', organizationId))
		.collect();

	const members = await Promise.all(
		memberships.map(async (membership) => {
			const memberUser = await ctx.db.get(membership.userId);
			if (!memberUser) return undefined;

			if (memberUser.imageId) {
				memberUser.image = (await ctx.storage.getUrl(memberUser.imageId)) ?? undefined;
			}

			return {
				_id: membership._id,
				user: {
					_id: memberUser._id,
					name: memberUser.name,
					email: memberUser.email,
					image: memberUser.image
				},
				role: membership.role
			};
		})
	);

	return members.filter((member) => member !== undefined);
};

/**
 * Returns true if the provided user is owner or admin of the organization.
 */
export const isOwnerOrAdminModel = async (
	ctx: QueryCtx,
	args: { userId: Id<'users'>; organizationId: Id<'organizations'> }
): Promise<boolean> => {
	const { userId, organizationId } = args;

	const membership = await ctx.db
		.query('organizationMembers')
		.withIndex('orgId_and_userId', (q) =>
			q.eq('organizationId', organizationId).eq('userId', userId)
		)
		.first();

	return (
		!!membership && ['role_organization_owner', 'role_organization_admin'].includes(membership.role)
	);
};

/* -------------------------------------------------------------------------- */
/*                                 MUTATIONS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Update another member's role within the actor's active organization.
 */
export const updateMemberRoleModel = async (
	ctx: MutationCtx,
	args: {
		actorId: Id<'users'>;
		organizationId: Id<'organizations'>;
		targetUserId: Id<'users'>;
		newRole: MemberRole;
	}
): Promise<boolean> => {
	const { actorId, organizationId, targetUserId, newRole } = args;

	if (actorId.toString() === targetUserId.toString()) {
		throw new ConvexError('Cannot change your own role');
	}

	// Permissions check for actor.
	const actorMembership = await ctx.db
		.query('organizationMembers')
		.withIndex('orgId_and_userId', (q) =>
			q.eq('organizationId', organizationId).eq('userId', actorId)
		)
		.first();
	if (!actorMembership) throw new ConvexError('Not a member of this organization');
	if (!['role_organization_owner', 'role_organization_admin'].includes(actorMembership.role)) {
		throw new ConvexError('Insufficient permissions to update member roles');
	}

	// Target membership.
	const targetMembership = await ctx.db
		.query('organizationMembers')
		.withIndex('orgId_and_userId', (q) =>
			q.eq('organizationId', organizationId).eq('userId', targetUserId)
		)
		.first();
	if (!targetMembership) throw new ConvexError('Target user is not a member of this organization');
	if (targetMembership.role === 'role_organization_owner') {
		throw new ConvexError('Cannot change the role of an organization owner');
	}

	await ctx.db.patch(targetMembership._id, { role: newRole });
	return true;
};

/**
 * Remove a user from the actor's active organization.
 */
export const removeMemberModel = async (
	ctx: MutationCtx,
	args: { actorId: Id<'users'>; targetUserId: Id<'users'> }
): Promise<boolean> => {
	const { actorId, targetUserId } = args;

	const actor = await ctx.db.get(actorId);
	if (!actor || !actor.activeOrganizationId) {
		throw new ConvexError('No active organization');
	}
	const organizationId = actor.activeOrganizationId;

	const actorMembership = await ctx.db
		.query('organizationMembers')
		.withIndex('orgId_and_userId', (q) =>
			q.eq('organizationId', organizationId).eq('userId', actorId)
		)
		.first();
	if (!actorMembership) throw new ConvexError('Not a member of this organization');
	if (!['role_organization_owner', 'role_organization_admin'].includes(actorMembership.role)) {
		throw new ConvexError('Insufficient permissions to remove members');
	}

	const targetMembership = await ctx.db
		.query('organizationMembers')
		.withIndex('orgId_and_userId', (q) =>
			q.eq('organizationId', organizationId).eq('userId', targetUserId)
		)
		.first();
	if (!targetMembership) throw new ConvexError('Target user is not a member of this organization');
	if (targetMembership.role === 'role_organization_owner') {
		throw new ConvexError('Cannot remove an organization owner');
	}

	await ctx.db.delete(targetMembership._id);
	return true;
};

/**
 * Allows a user to leave an organization, taking ownership edge-cases into account.
 */
export const leaveOrganizationModel = async (
	ctx: MutationCtx,
	args: { userId: Id<'users'>; organizationId: Id<'organizations'>; successorId?: Id<'users'> }
): Promise<boolean> => {
	const { userId, organizationId, successorId } = args;

	const membership = await ctx.db
		.query('organizationMembers')
		.withIndex('orgId_and_userId', (q) =>
			q.eq('organizationId', organizationId).eq('userId', userId)
		)
		.first();
	if (!membership) throw new ConvexError('Not a member of this organization');

	if (membership.role === 'role_organization_owner') {
		if (!successorId) {
			throw new ConvexError(
				'As the organization owner, you must select a successor before leaving'
			);
		}

		const successorMembership = await ctx.db
			.query('organizationMembers')
			.withIndex('orgId_and_userId', (q) =>
				q.eq('organizationId', organizationId).eq('userId', successorId)
			)
			.first();
		if (!successorMembership) {
			throw new ConvexError('Selected successor is not a member of this organization');
		}

		await ctx.db.patch(successorMembership._id, { role: 'role_organization_owner' });
	}

	await ctx.db.delete(membership._id);

	// Update activeOrganizationId.
	const user = await ctx.db.get(userId);
	if (user && user.activeOrganizationId === organizationId) {
		const otherMemberships = await ctx.db
			.query('organizationMembers')
			.withIndex('userId', (q) => q.eq('userId', userId))
			.collect();

		await ctx.db.patch(userId, {
			activeOrganizationId: otherMemberships[0]?.organizationId
		});
	}

	return true;
};
