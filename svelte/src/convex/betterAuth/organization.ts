import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { withSystemFields } from 'convex-helpers/validators';
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
					.withIndex('organizationId_userId', (q) =>
						q.eq('organizationId', membership.organizationId)
					)
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
			.withIndex('email_organizationId_status', (q) => q.eq('email', args.email))
			.collect();

		for (const invitation of invitations) {
			await ctx.db.delete(invitation._id);
		}

		return null;
	}
});
