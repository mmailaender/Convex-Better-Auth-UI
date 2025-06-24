import { EmailId } from '@convex-dev/resend';
import { api } from '../../_generated/api';
import { ActionCtx } from '../../_generated/server';
import { Resend } from '@convex-dev/resend';
import { components } from '../../_generated/api';
import {
	generateOrganizationInvitationEmail,
	OrganizationInvitationParams
} from './templates/organizationInvitation';
import { generateVerificationEmail } from './templates/verification';

/**
 * Interface for email verification result
 */
export interface VerifyEmailReturnData {
	valid: boolean;
	exists: boolean;
	email: string;
	reason?: string;
}

export const resend: Resend = new Resend(components.resend, {
	testMode: false
});

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

export async function sendVerificationEmailModel(
	ctx: ActionCtx,
	args: {
		from: string;
		to: string;
		otp: string;
	}
) {
	const { from, to, otp } = args;

	try {
		// Generate the email content
		const html = generateVerificationEmail(otp);

		return resend.sendEmail(ctx, from, to, `${otp} is your verification code`, html);
	} catch (error) {
		console.error(`Error sending verification email to ${to}:`, error);

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

/**
 * Sends an organization invitation email
 * @param args Email parameters including recipient, organization, inviter and accept URL
 * @returns Email sending response
 */
export async function sendOrganizationInvitationEmailModel(
	ctx: ActionCtx,
	args: {
		from: string;
		to: string;
		organizationName: string;
		inviterName: string;
		acceptUrl: string;
	}
): Promise<
	| { success: true; emailId: EmailId }
	| { success: false; error: { message: string; statusCode: number } }
> {
	const { from, to, organizationName, inviterName, acceptUrl } = args;

	try {
		// Generate the invitation email content
		const invitationParams: OrganizationInvitationParams = {
			organizationName,
			inviterName,
			acceptUrl
		};

		const html = generateOrganizationInvitationEmail(invitationParams);

		const emailId = await resend.sendEmail(
			ctx,
			from,
			to,
			`Invitation to join ${organizationName}`,
			html
		);
		return { success: true, emailId };
	} catch (error) {
		console.error(`Error sending invitation email to ${to}:`, error);

		if (error instanceof Error) {
			return {
				success: false,
				error: {
					message: error.message,
					statusCode: 500
				}
			};
		}

		return {
			success: false,
			error: {
				message: 'Unknown error sending invitation email',
				statusCode: 500
			}
		};
	}
}
