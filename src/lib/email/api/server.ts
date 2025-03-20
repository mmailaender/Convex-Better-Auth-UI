import { fql } from 'fauna';

// lib
import client from '$lib/db/client';
import { createVerification, verifyUserExists } from '$lib/auth/api/verification.server';
import { getVerificationEmail, sendEmail } from '../templates';

// env
import { EMAIL_SEND_FROM, REOON_EMAIL_VERIFIER_TOKEN } from '$env/static/private';

// types
import type { User } from '$lib/db/schema/types/custom';
import type { AddEmailData, VerifyEmailReturnData } from '$lib/user/api/types';

/**
 * Enhanced email verification function that checks:
 * 1. If the email already exists in Fauna
 * 2. If the email is valid using Reoon's API (not disposable, properly formatted, etc.)
 *
 * @param email Email address to verify
 * @returns Object with validation results and reason if invalid
 */
export async function verifyEmail(email: string): Promise<VerifyEmailReturnData> {
	try {
		// First check if user already exists in Fauna
		const exists = await verifyUserExists(email);

		// If user doesn't exist, verify email validity with Reoon
		if (!exists) {
			const response = await fetch(
				`https://emailverifier.reoon.com/api/v1/verify?email=${encodeURIComponent(email)}&key=${REOON_EMAIL_VERIFIER_TOKEN}&mode=quick`
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
			reason: 'User with this email already exists'
		};
	} catch (err) {
		console.error('Error verifying email:', err);
		return {
			valid: false,
			exists: false,
			email,
			reason: 'Error processing email verification'
		};
	}
}

export async function createAndSendVerification(email: string, userId?: string): Promise<void> {
	try {
		const otp = await createVerification(email, userId ? userId : undefined);
		const { html } = await getVerificationEmail(otp);

		const { data, error: err } = await sendEmail({
			from: EMAIL_SEND_FROM,
			to: email,
			subject: `${otp} is your verification code`,
			html: html
		});

		if (err) {
			throw new Error(err.message);
		}

		console.log(
			`verify-email: Successfully send verification email to ${email}, email id: ${data?.id}`
		);
	} catch (err) {
		console.error(`verify-email: Error verifying email ${email}`, err);
		throw new Error('Internal Server Error');
	}
}

export async function addEmail(accessToken: string, addEmailData: AddEmailData): Promise<User> {
	try {
		const response = await client(accessToken).query<User>(fql`addEmail(${addEmailData})`);
		if (!response.data) {
			throw new Error(response.summary);
		}
		return response.data;
	} catch (err: unknown) {
		console.log('addEmail() error: ', err);
		if (err instanceof Error) {
			throw new Error(err.message);
		}
		throw new Error('Error updating email.');
	}
}

export async function deleteEmail(accessToken: string, email: string): Promise<User> {
	try {
		const response = await client(accessToken).query<User>(fql`deleteEmail(${email})`);
		return response.data;
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw new Error(err.message);
		}
		throw new Error('Error updating email.');
	}
}

export async function setPrimaryEmail(accessToken: string, email: string): Promise<User> {
	try {
		const response = await client(accessToken).query<User>(
			fql`Query.identity()!.update({ primaryEmail: ${email} })`
		);
		return response.data;
	} catch (err: unknown) {
		if (err instanceof Error) {
			throw new Error(err.message);
		}
		throw new Error('Error updating email.');
	}
}

export async function cancelEmailVerification(
	accessToken: string,
	email: string
): Promise<boolean> {
	const response = await client(accessToken).query<boolean>(fql`deleteEmailVerification(${email})`);
	if (!response.data) {
		throw new Error(response.summary);
	}
	return response.data;
}
