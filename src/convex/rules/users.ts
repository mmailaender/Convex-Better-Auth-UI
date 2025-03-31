import { Ent, QueryCtx } from '../types';
import { WriteType } from './types';

/**
 * Gets the rules for the user entity
 * Following the exact Convex Ents typing pattern from addEntRules
 */
export function getUserRules(ctx: QueryCtx) {
	return {
		read: async (ent: Ent<'users'>) => {
			// Only the viewer can see their own data
			const viewer = await ctx.viewer();
			return viewer?._id === ent._id;
		},

		write: async ({ operation, ent, value }: WriteType<'users'>) => {
			const viewer = await ctx.viewer();

			if (!viewer) {
				throw new Error('Viewer not found');
			}

			// Allow delete operations without additional checks
			if (operation === 'delete') {
				return true;
			}

			// Check if primaryEmail is part of emails array
			if (value.primaryEmail && value.emails) {
				if (!value.emails.includes(value.primaryEmail)) {
					throw new Error('Primary email must be included in the emails array');
				}
			}

			// Check if the viewer is a member of the active organization
			if (value.activeOrganizationId) {
				const activeOrganizationId = value.activeOrganizationId;
				const userOrganization = await ctx.skipRules
					.table('organizationMembers', 'by_org_and_user', (q) =>
						q.eq('organizationId', activeOrganizationId).eq('userId', viewer._id)
					)
					.first();
				if (!userOrganization) {
					throw new Error('User is not a member of the active organization');
				}
			}

			// Check for unique emails in the emails array (uniqueEmails)
			if (value.emails) {
				const uniqueEmails = [...new Set(value.emails)];
				if (uniqueEmails.length !== value.emails.length) {
					throw new Error('Emails array must not contain duplicates');
				}

				// Check that emails are unique across all users
				if (operation === 'create' || (operation === 'update' && value.emails !== undefined)) {
					for (const email of value.emails) {
						const existingUsers = (await ctx.skipRules.table('users', 'by_emails')).filter((user) =>
							user.emails.includes(email)
						);

						for (const existingUser of existingUsers) {
							if (operation === 'update' && ent._id === existingUser._id) {
								continue; // Skip the current user during updates
							}
							throw new Error(`Email ${email} is already associated with another user`);
						}
					}
				}
			}

			return true;
		}
	};
}
