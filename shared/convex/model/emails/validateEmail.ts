// Types
import type { ActionCtx } from '../../_generated/server';

/**
 * Interface for email verification result
 */
export interface VerifyEmailReturnData {
	valid: boolean;
	email: string;
	reason?: string;
}

/**
 * How long the check waits for the email verifier. Its answers usually take well under a second;
 * a request that hangs would otherwise keep the sign-in or sign-up screen waiting with no feedback.
 * When the limit passes, the check reports the verification error and the person can try again.
 */
export const EMAIL_VERIFIER_TIME_LIMIT_MS = 8_000;

/**
 * Function to verify an email address
 * Validates format and deliverability using an external service
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
				email,
				reason: 'Email verification configuration missing'
			};
		}

		const response = await fetch(
			`https://emailverifier.reoon.com/api/v1/verify?email=${encodeURIComponent(email)}&key=${verifierToken}&mode=quick`,
			{ signal: AbortSignal.timeout(EMAIL_VERIFIER_TIME_LIMIT_MS) }
		);

		if (!response.ok) {
			return {
				valid: false,
				email,
				reason: 'Email verification service unavailable'
			};
		}

		const result = await response.json();

		if (result.status !== 'valid') {
			return {
				valid: false,
				email,
				reason: 'Invalid email'
			};
		}

		return {
			valid: true,
			email
		};
	} catch (error) {
		console.error('Error verifying email:', error);

		return {
			valid: false,
			email,
			reason: 'Error processing email verification'
		};
	}
}
