import { v } from 'convex/values';
import { action, ActionCtx } from '../_generated/server';
import { api } from '../_generated/api';

import { generateVerificationEmail } from '../model/emails/templates/verification';
import {
	generateOrganizationInvitationEmail,
	type OrganizationInvitationParams
} from '../model/emails/templates/organizationInvitation';
import { sendEmail, type SendEmailResponse } from '../model/emails/send';

/**
 * Interface for email verification result
 */
export interface VerifyEmailReturnData {
	valid: boolean;
	exists: boolean;
	email: string;
	reason?: string;
}

/**
 * Function to verify an email address
 * Checks if the email exists and validates format using an external service
 */
export async function verifyEmail(ctx: ActionCtx, email: string): Promise<VerifyEmailReturnData> {
	try {
		// Get the verification token from environment variables
		const verifierToken = process.env.REOON_EMAIL_VERIFIER_TOKEN;

		if (!verifierToken) {
			return {
				valid: false,
				exists: false,
				email,
				reason: 'Email verification configuration missing'
			};
		}

		// Check if user already exists in database
		const exists = await ctx.runQuery(api.users.queries.isUserExisting, { email });

		// If user doesn't exist, verify email validity with external service
		if (!exists) {
			const response = await fetch(
				`https://emailverifier.reoon.com/api/v1/verify?email=${encodeURIComponent(email)}&key=${verifierToken}&mode=quick`
			);

			if (!response.ok) {
				return {
					valid: false,
					exists,
					email,
					reason: 'Email verification service unavailable'
				};
			}

			const result = await response.json();

			if (result.status !== 'valid') {
				return {
					valid: false,
					exists,
					email,
					reason: 'Invalid email'
				};
			}
		}

		return {
			valid: true,
			exists,
			email,
			reason: exists ? 'User with this email already exists' : undefined
		};
	} catch (error) {
		console.error('Error verifying email:', error);

		return {
			valid: false,
			exists: false,
			email,
			reason: 'Error processing email verification'
		};
	}
}

/**
 * Action to send a verification email with OTP
 */
export const sendVerificationEmail = action({
	args: {
		email: v.string(),
		otp: v.string(),
		fromEmail: v.string()
	},
	handler: async (ctx, args): Promise<SendEmailResponse> => {
		const { email, otp, fromEmail } = args;

		try {
			// Generate the email content
			const html = generateVerificationEmail(otp);

			// Send the email
			return await sendEmail({
				from: fromEmail,
				to: email,
				subject: `${otp} is your verification code`,
				html
			});
		} catch (error) {
			console.error(`Error sending verification email to ${email}:`, error);

			if (error instanceof Error) {
				return {
					error: {
						message: error.message,
						statusCode: 500
					}
				};
			}

			return {
				error: {
					message: 'Unknown error sending verification email',
					statusCode: 500
				}
			};
		}
	}
});

/**
 * Sends an organization invitation email
 * @param params Email parameters including recipient, organization, inviter and accept URL
 * @returns Email sending response
 */
export async function sendOrganizationInvitationEmail(params: {
	email: string;
	organizationName: string;
	inviterName: string;
	acceptUrl: string;
	fromEmail: string;
}): Promise<SendEmailResponse> {
	const { email, organizationName, inviterName, acceptUrl, fromEmail } = params;

	try {
		// Generate the invitation email content
		const invitationParams: OrganizationInvitationParams = {
			organizationName,
			inviterName,
			acceptUrl
		};

		const html = generateOrganizationInvitationEmail(invitationParams);

		// Send the email
		return await sendEmail({
			from: fromEmail,
			to: email,
			subject: `Invitation to join ${organizationName}`,
			html
		});
	} catch (error) {
		console.error(`Error sending invitation email to ${email}:`, error);

		if (error instanceof Error) {
			return {
				error: {
					message: error.message,
					statusCode: 500
				}
			};
		}

		return {
			error: {
				message: 'Unknown error sending invitation email',
				statusCode: 500
			}
		};
	}
}
