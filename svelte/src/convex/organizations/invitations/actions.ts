import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, v } from 'convex/values';
import { action } from '../../_generated/server';
import { api, internal } from '../../_generated/api';
import { sendOrganizationInvitationEmailModel, verifyEmail } from '../../model/emails';
import { roleValidator } from '../../schema';

// Types
import type { Id } from '../../_generated/dataModel';

/**
 * Creates an invitation and sends an invitation email
 */
export const inviteMember = action({
	args: {
		email: v.string(),
		role: roleValidator
	},
	handler: async (ctx, args): Promise<{ _id: Id<'invitations'>; email: string; role: string }> => {
		const { email, role } = args;

		// Get the authenticated user
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}
		// Get the user's active organization
		const user = await ctx.runQuery(api.users.queries.getUser, {});
		if (!user || !user.activeOrganizationId) {
			throw new ConvexError('User has no active organization');
		}

		const organizationId = user.activeOrganizationId;

		// Check if the user is authorized to send invitations
		const isAuthorized = await ctx.runQuery(api.organizations.members.queries.isOwnerOrAdmin, {
			organizationId
		});
		if (!isAuthorized) {
			throw new ConvexError('Not authorized to send invitations');
		}

		// Verify the email address
		const verificationResult = await verifyEmail(ctx, email);

		if (!verificationResult.valid) {
			throw new ConvexError(`Email ${email} is not valid: ${verificationResult.reason}`);
		}

		const invitation = await ctx.runMutation(
			internal.organizations.invitations.mutations._createInvitation,
			{
				email,
				role
			}
		);

		if (!invitation) {
			throw new ConvexError('Failed to create invitation');
		}

		const baseUrl = process.env.SITE_URL;
		const fromEmail = process.env.EMAIL_SEND_FROM;

		if (!baseUrl || !fromEmail) {
			throw new ConvexError('Missing environment variables');
		}

		// Generate the acceptance URL
		const acceptUrl = `${baseUrl}/api/invitations/accept?invitationId=${invitation._id}`;

		// Send the invitation email
		const emailResult = await sendOrganizationInvitationEmailModel(ctx, {
			from: fromEmail,
			to: email,
			organizationName: invitation.organizationName,
			inviterName: invitation.invitedByName,
			acceptUrl
		});

		if (!emailResult.success) {
			// If email fails, we still return the invitation but log the error
			console.error(`Error sending invitation email to ${email}:`, emailResult.error);
		}

		return {
			_id: invitation._id,
			email,
			role
		};
	}
});

/**
 * Creates multiple invitations and sends invitation emails in bulk
 */
export const inviteMembers = action({
	args: {
		emails: v.array(v.string()),
		role: roleValidator
	},
	handler: async (
		ctx,
		args
	): Promise<
		Array<{
			_id: Id<'invitations'> | null;
			email: string;
			role: string;
			success: boolean;
			error?: string;
		}>
	> => {
		const { emails, role } = args;

		// Get the authenticated user
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new ConvexError('Not authenticated');
		}

		// Get the user's active organization
		const user = await ctx.runQuery(api.users.queries.getUser, {});
		if (!user || !user.activeOrganizationId) {
			throw new ConvexError('User has no active organization');
		}

		const organizationId = user.activeOrganizationId;

		// Check if the user is authorized to send invitations
		const isAuthorized = await ctx.runQuery(api.organizations.members.queries.isOwnerOrAdmin, {
			organizationId
		});
		if (!isAuthorized) {
			throw new ConvexError('Not authorized to send invitations');
		}

		const baseUrl = process.env.SITE_URL;
		const fromEmail = process.env.EMAIL_SEND_FROM;

		if (!baseUrl || !fromEmail) {
			throw new ConvexError('Missing environment variables');
		}

		// Process each email and create invitations
		const results = await Promise.all(
			emails.map(async (email) => {
				try {
					// Verify the email address
					const verificationResult = await verifyEmail(ctx, email);

					if (!verificationResult.valid) {
						return {
							_id: null,
							email,
							role,
							success: false,
							error: `Email is not valid: ${verificationResult.reason}`
						};
					}

					// Create invitation in database
					const invitation = await ctx.runMutation(
						internal.organizations.invitations.mutations._createInvitation,
						{
							email,
							role
						}
					);

					if (!invitation) {
						return {
							_id: null,
							email,
							role,
							success: false,
							error: 'Failed to create invitation'
						};
					}

					// Generate the acceptance URL
					const acceptUrl = `${baseUrl}/api/invitations/accept?invitationId=${invitation._id}`;

					// Send the invitation email
					const emailResult = await sendOrganizationInvitationEmailModel(ctx, {
						from: fromEmail,
						to: email,
						organizationName: invitation.organizationName,
						inviterName: invitation.invitedByName,
						acceptUrl
					});

					if (!emailResult.success) {
						// If email fails, we still mark the invitation as successful but log the error
						console.error(`Error sending invitation email to ${email}:`, emailResult.error);
						return {
							_id: invitation._id,
							email,
							role,
							success: true,
							error: `Invitation created but email failed: ${emailResult.error}`
						};
					}

					return {
						_id: invitation._id,
						email,
						role,
						success: true
					};
				} catch (err) {
					return {
						_id: null,
						email,
						role,
						success: false,
						error: err instanceof Error ? err.message : 'Unknown error'
					};
				}
			})
		);

		return results;
	}
});
