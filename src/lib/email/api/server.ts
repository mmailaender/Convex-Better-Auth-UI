import { fql } from 'fauna';

// lib
import client from '$lib/db/client';
import { createVerification, verifyUserExists } from '$lib/auth/api/verification.server';
import { getVerificationEmail, sendEmail } from '../templates';

// env
import { REOON_EMAIL_VERIFIER_TOKEN } from '$env/static/private';

// types
import type { User } from '$lib/db/schema/types/custom';
import type { AddEmailData } from '$lib/user/api/types';

/**
 * Verifies the existence of a user's email address and sends a verification email if it doesn't exist.
 *
 * @param {string} email - The email address to verify.
 * @param {string} [userId] - Optional user ID associated with the email address.
 * @returns {Promise<boolean>} - Returns true if the email already exists, otherwise false after sending a verification email.
 * @throws {Error} - Throws an error if the email is invalid or if there's an issue with sending the verification email.
 */
export async function verifyEmail(email: string, userId?: string): Promise<boolean> {
	const exists = await verifyUserExists(email);
	console.log(`verify-email: Email ${email} exists: ${exists}`);

	if (exists == false) {
		try {
			const response = await fetch(
				`https://emailverifier.reoon.com/api/v1/verify?email=${email}&key=${REOON_EMAIL_VERIFIER_TOKEN}&mode=quick`
			);
			const verificationResult = await response.json();

			if (verificationResult.status !== 'valid') {
				console.warn(`verify-email: Email ${email} is not valid`);
				throw new Error('Invalid email');
			}

			const otp = await createVerification(email, userId ? userId : undefined);
			const { html } = await getVerificationEmail(otp);

			const { data, error: err } = await sendEmail({
				from: 'verifications@etesie.dev',
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
			return false;
		} catch (err) {
			console.error(`verify-email: Error verifying email ${email}`, err);
			throw new Error('Internal Server Error');
		}
	}

	return true;
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
