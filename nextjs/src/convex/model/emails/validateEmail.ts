import { api } from '../../_generated/api';

// Types
import type { ActionCtx } from '../../_generated/server';

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
export default async function validateEmail(
	ctx: ActionCtx,
	email: string
): Promise<VerifyEmailReturnData> {
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
