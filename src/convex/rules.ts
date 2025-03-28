import { addEntRules } from 'convex-ents';
import { entDefinitions } from './schema';
import { QueryCtx } from './types';
import { Id } from './_generated/dataModel';

export function getEntDefinitionsWithRules(ctx: QueryCtx): typeof entDefinitions {
	return addEntRules(entDefinitions, {
		// User rules and constraints
		users: {
			// Access rules - who can read user data
			read: async (user) => {
				// Only the viewer can see their data
				const viewer = await ctx.viewer();
				return viewer?._id === user._id;
			},

			// Write rules for User constraints from Fauna
			write: async ({ operation, ent, value }) => {
				const viewer = await ctx.viewer();
				if (!viewer) {
					throw new Error('Viewer not found');
				}

				if (operation === 'delete') {
					// Allow delete operations
					return true;
				}

				// Check if primaryEmail is part of emails array (isPrimaryEmailPartOfEmails)
				if (value.primaryEmail && value.emails) {
					if (!value.emails.includes(value.primaryEmail)) {
						throw new Error('Primary email must be included in the emails array');
					}
				}

				// Check if the viewer is a member of the active organization (isActiveOrganizationPartOfOrganizations)
				if (value.activeOrganizationId) {
					const orgId = value.activeOrganizationId;
					const userOrganization = await ctx.skipRules
						.table('organizationMembers', 'by_org_and_user', (q) =>
							q.eq('organizationId', orgId).eq('userId', viewer._id)
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
							const existingUsers = (await ctx.skipRules.table('users', 'by_emails')).filter(
								(user) => user.emails.includes(email)
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
		},

		// Account unique constraints
		accounts: {
			write: async ({ operation, ent, value }) => {
				if (operation === 'delete') {
					return true;
				}

				// For new accounts or when updating social provider or passkey info
				if (
					operation === 'create' ||
					(operation === 'update' && (value.socialProvider || value.passkey))
				) {
					const userId = value.userId || (ent && ent.userId);
					const providerName = value.socialProvider?.name || (ent && ent.socialProvider?.name);
					const providerId = value.socialProvider?.userId || (ent && ent.socialProvider?.userId);
					const passkeyId = value.passkey?.id || (ent && ent.passkey?.id);

					// Check: unique [.user, .socialProvider.name, .passkey]
					// Ensures that only one social account per social provider and one passkey exists per user
					if (userId && providerName) {
						const existingAccounts = await ctx.skipRules
							.table('accounts')
							.filter((q) =>
								q.and(
									q.eq(q.field('userId'), userId),
									q.eq(q.field('socialProvider.name'), providerName)
								)
							);

						for (const existingAccount of existingAccounts) {
							if (operation === 'update' && ent._id === existingAccount._id) {
								continue; // Skip the current account during updates
							}
							throw new Error(`User already has an account with ${providerName}`);
						}
					}

					// Check: unique [.passkey.id]
					// Ensures that a passkey is associated only with one user
					if (passkeyId) {
						const existingWithPasskey = await ctx.skipRules
							.table('accounts')
							.filter((q) => q.eq(q.field('passkey.id'), passkeyId));

						for (const existingAccount of existingWithPasskey) {
							if (operation === 'update' && ent._id === existingAccount._id) {
								continue; // Skip the current account during updates
							}
							throw new Error('This passkey is already registered to an account');
						}
					}

					// Check: unique [.socialProvider.name, .socialProvider.userId]
					// Ensures that a social account is associated only with one user
					if (providerName && providerId) {
						const existingWithSocialId = await ctx.skipRules
							.table('accounts')
							.filter((q) =>
								q.and(
									q.eq(q.field('socialProvider.name'), providerName),
									q.eq(q.field('socialProvider.userId'), providerId)
								)
							);

						for (const existingAccount of existingWithSocialId) {
							if (operation === 'update' && ent._id === existingAccount._id) {
								continue; // Skip the current account during updates
							}
							throw new Error(`This ${providerName} account is already registered`);
						}
					}
				}

				return true;
			}
		},

		// Invitation unique constraints and checks
		invitations: {
			write: async ({ operation, ent, value }) => {
				if (operation === 'delete') {
					return true;
				}

				// Ensure only one active invitation per email per organization
				// Check: unique [.organization, .email]
				if (
					(operation === 'create' || operation === 'update') &&
					value.email &&
					value.organizationId
				) {
					const existingInvitations = await ctx.skipRules
						.table('invitations')
						.filter((q) =>
							q.and(
								q.eq(q.field('email'), value.email),
								q.eq(q.field('organizationId'), value.organizationId)
							)
						);

					for (const existing of existingInvitations) {
						if (operation === 'update' && ent._id === existing._id) {
							continue; // Skip the current invitation during updates
						}
						throw new Error('An invitation already exists for this email in this organization');
					}
				}

				// Email validation check
				// Check: isEmail
				if ((operation === 'create' || (operation === 'update' && value.email)) && value.email) {
					const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
					if (!emailRegex.test(value.email)) {
						throw new Error('Invalid email format');
					}
				}

				return true;
			}
		},

		// Verification constraints
		verifications: {
			write: async ({ operation, ent, value }) => {
				if (operation === 'delete') {
					return true;
				}

				// Email validation check
				// Check: isEmail
				if ((operation === 'create' || (operation === 'update' && value.email)) && value.email) {
					const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
					if (!emailRegex.test(value.email)) {
						throw new Error('Invalid email format');
					}
				}

				// Check: isNotVerified - ensures that no verification will be started for an already verified email
				if (operation === 'create' && value.email) {
					const allUsers = await ctx.skipRules.table('users');
					for (const user of allUsers) {
						if (user.emails.includes(value.email)) {
							throw new Error('Cannot create verification for an already verified email');
						}
					}
				}

				// Check unique [.email] - A verification must exist only once for an email
				if (operation === 'create' && value.email) {
					const existingVerifications = await ctx.skipRules.table(
						'verifications',
						'by_email',
						(q) => q.eq('email', value.email)
					);

					if (existingVerifications.length > 0) {
						throw new Error('A verification already exists for this email');
					}
				}

				return true;
			}
		},

		// Organization member uniqueness
		organizationMembers: {
			write: async ({ operation, ent, value }) => {
				if (operation === 'delete') {
					return true;
				}

				// Ensure only one membership per user per organization
				if (
					(operation === 'create' || operation === 'update') &&
					value.userId &&
					value.organizationId
				) {
					const existingMembers = await ctx.skipRules
						.table('organizationMembers')
						.filter((q) =>
							q.and(
								q.eq(q.field('userId'), value.userId),
								q.eq(q.field('organizationId'), value.organizationId)
							)
						);

					for (const existing of existingMembers) {
						if (operation === 'update' && ent._id === existing._id) {
							continue; // Skip the current membership during updates
						}
						throw new Error('User is already a member of this organization');
					}
				}

				return true;
			}
		}
	});
}

// Retrieve viewer ID using ctx.auth
export async function getViewerId(
	ctx: Omit<QueryCtx, 'table' | 'viewerId' | 'viewer' | 'viewerX'>
): Promise<Id<'users'> | null> {
	const user = await ctx.auth.getUserIdentity();
	if (user === null) {
		return null;
	}
	const viewer = await ctx.skipRules.table('users').get(user.subject as Id<'users'>);
	return viewer?._id ?? null;
}
