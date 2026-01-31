import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { partial, withSystemFields } from 'convex-helpers/validators';
import { omit } from 'convex-helpers';
import schema from './schema';
import { type Id } from './_generated/dataModel';
import { ConvexError } from 'convex/values';

/**
 * Deletes all organization data associated with a user.
 * * Delete Organizations membership where the user role is not owner
 * * Delete Invitations where the user is the invitee
 * * Delete Organizations where the user is the owner and only member (If there are other members, throw error)
 */
export const deleteUser = mutation({
	args: v.object(withSystemFields('user', schema.tables.user.validator.fields)),
	returns: v.null(),
	handler: async (ctx, args) => {
		// 1) Delete organization memberships where the user is NOT the owner.
		const memberships = await ctx.db
			.query('member')
			.withIndex('userId', (q) => q.eq('userId', args._id))
			.collect();

		for (const membership of memberships) {
			if (membership.role !== 'owner') {
				await ctx.db.delete(membership._id);
			}
		}

		// 2) For organizations where the user IS the owner, only delete the organization
		//    if they are the sole member. Otherwise, throw an error.
		for (const membership of memberships) {
			if (membership.role === 'owner') {
				// Count members in this organization.
				const orgMembers = await ctx.db
					.query('member')
					.withIndex('organizationId', (q) => q.eq('organizationId', membership.organizationId))
					.collect();

				if (orgMembers.length > 1) {
					// User owns an org that has other members. Abort with a helpful error.
					throw new ConvexError(
						'Cannot delete user: You are the owner of an organization that has other members. Transfer ownership or remove other members first.'
					);
				}

				// Safe to delete: first delete the owner's membership, then the organization.
				await ctx.db.delete(membership._id);

				const orgId = membership.organizationId as Id<'organization'>;
				const org = await ctx.db.get(orgId);
				if (org) {
					if (org.logoId) {
						await ctx.storage.delete(org.logoId);
					}
					await ctx.db.delete(orgId);
				}
			}
		}

		// 3) Delete invitations where the user is the invitee (by email).
		const invitations = await ctx.db
			.query('invitation')
			.withIndex('email', (q) => q.eq('email', args.email))
			.collect();

		for (const invitation of invitations) {
			await ctx.db.delete(invitation._id);
		}

		return null;
	}
});

/**
 * Sets the active organization for a user in a session.
 * If the user has no active organization, it will set the first organization they are a member of.
 */
export const setActiveOrganization = mutation({
	args: { userId: v.id('user'), sessionId: v.id('session') },
	returns: v.null(),
	handler: async (ctx, { userId, sessionId }) => {
		const user = await ctx.db.get(userId);
		if (!user) return null;

		// 2) Decide the activeOrgId: prefer the user's current one; otherwise first membership.
		let activeOrgId = user.activeOrganizationId;

		if (!activeOrgId) {
			const membership = await ctx.db
				.query('member')
				.withIndex('userId', (q) => q.eq('userId', userId))
				.first(); // Note: no guaranteed ordering; see note below.
			if (!membership) return null;
			activeOrgId = membership.organizationId;
		}

		// 3) Only patch the session if needed and if the session belongs to this user.
		const session = await ctx.db.get(sessionId);
		if (!session || session.userId !== userId) return null;

		if (session.activeOrganizationId !== activeOrgId) {
			await ctx.db.patch(sessionId, { activeOrganizationId: activeOrgId });
		}

		return null;
	}
});

/**
 * Dedicated updateOrganization mutation as auth.api.updateOrganization needs an authenticated user.
 */
export const updateOrganization = mutation({
	args: {
		organizationId: v.id('organization'),
		data: v.object(partial(omit(schema.tables.organization.validator.fields, ['createdAt'])))
	},
	returns: v.null(),
	handler: async (ctx, { organizationId, data }) => {
		await ctx.db.patch(organizationId, data);
		return null;
	}
});
