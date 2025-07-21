import type { MutationCtx, QueryCtx } from '../../../_generated/server';
import { ConvexError } from 'convex/values';

// Types
import type { Id } from '../../../_generated/dataModel';

/**
 * Creates or returns an existing organization invitation.
 * Extracted from the previous `_createInvitation` internal mutation.
 */
export const createInvitationModel = async (
	ctx: MutationCtx,
	args: {
		userId: Id<'users'>;
		email: string;
		role: 'role_organization_member' | 'role_organization_admin' | 'role_organization_owner';
	}
): Promise<{
	_id: Id<'invitations'>;
	invitedByUserId: Id<'users'>;
	invitedByName: string;
	organizationId: Id<'organizations'>;
	organizationName: string;
}> => {
	const { userId, email, role } = args;

	// Determine expiry (7 days)
	const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

	// Get the user's active organization
	const user = await ctx.db.get(userId);
	if (!user || !user.activeOrganizationId) {
		throw new ConvexError('User has no active organization');
	}

	const organization = await ctx.db.get(user.activeOrganizationId);
	if (!organization) throw new ConvexError('Organization not found');

	// Return existing invitation if present
	const existingInvitation = await ctx.db
		.query('invitations')
		.withIndex('by_org_and_email', (q) =>
			q.eq('organizationId', organization._id).eq('email', email)
		)
		.first();

	if (existingInvitation) {
		return {
			_id: existingInvitation._id,
			invitedByUserId: userId,
			invitedByName: user.name,
			organizationId: organization._id,
			organizationName: organization.name
		};
	}

	const invitationId = await ctx.db.insert('invitations', {
		email,
		role,
		invitedByUserId: userId,
		organizationId: organization._id,
		expiresAt
	});

	return {
		_id: invitationId,
		invitedByUserId: userId,
		invitedByName: user.name,
		organizationId: organization._id,
		organizationName: organization.name
	};
};

/**
 * Revokes an invitation. Only basic DB deletion – security checks live in API layer.
 */
export const revokeInvitationModel = async (
	ctx: MutationCtx,
	args: { invitationId: Id<'invitations'> }
): Promise<boolean> => {
	const { invitationId } = args;
	const invitation = await ctx.db.get(invitationId);
	if (!invitation) throw new ConvexError('Invitation not found');

	await ctx.db.delete(invitationId);
	return true;
};

/**
 * Accept an invitation – add membership, set active org, delete invitation.
 */
export const acceptInvitationModel = async (
	ctx: MutationCtx,
	args: { userId: Id<'users'>; invitationId: string }
): Promise<boolean> => {
	const { userId, invitationId } = args;

	const user = await ctx.db.get(userId);
	if (!user) throw new ConvexError('User not found');

	const invitation = await ctx.db
		.query('invitations')
		.filter((q) => q.eq(q.field('_id'), invitationId))
		.first();
	if (!invitation) throw new ConvexError('Invitation not found');

	if (invitation.expiresAt < Date.now()) {
		throw new ConvexError('Invitation has expired');
	}

	if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
		throw new ConvexError('This invitation was not sent to your email address');
	}

	const existingMembership = await ctx.db
		.query('organizationMembers')
		.withIndex('orgId_and_userId', (q) =>
			q.eq('organizationId', invitation.organizationId).eq('userId', userId)
		)
		.first();

	if (!existingMembership) {
		// create membership with invitation role
		await ctx.db.insert('organizationMembers', {
			organizationId: invitation.organizationId,
			userId,
			role: invitation.role
		});
	}

	// set active org
	await ctx.db.patch(userId, { activeOrganizationId: invitation.organizationId });

	// delete invitation
	await ctx.db.delete(invitation._id);

	return true;
};

/**
 * Get pending invitations for a user’s active organization (authorization handled outside).
 */
export const getInvitationsModel = async (
	ctx: QueryCtx,
	args: { organizationId: Id<'organizations'> }
) => {
	const { organizationId } = args;

	const invitations = await ctx.db
		.query('invitations')
		.withIndex('by_org_and_email', (q) => q.eq('organizationId', organizationId))
		.collect();

	return Promise.all(
		invitations.map(async (invitation) => {
			const invitedByUser = await ctx.db.get(invitation.invitedByUserId);
			return {
				_id: invitation._id,
				email: invitation.email,
				role: invitation.role,
				invitedBy: {
					_id: invitedByUser?._id,
					name: invitedByUser?.name || 'Unknown'
				},
				expiresAt: invitation.expiresAt
			};
		})
	);
};
