import { QueryCtx } from '../types';
import { WriteType } from './types';

/**
 * Gets the rules for the account entity
 * Following the exact Convex Ents typing pattern from addEntRules
 */
export function getAccountRules(ctx: QueryCtx) {
	return {
		write: async ({ operation, ent, value }: WriteType<'accounts'>) => {
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
	};
}
