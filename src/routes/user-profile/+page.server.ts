import { validatePasskeyData } from '$lib/auth/passkeys/server/validatePasskey';
import type { WebAuthnUserCredentialEncoded } from '$lib/auth/passkeys/types';
import { getUserAndAccounts, addEmail, updateUser, createPasskeyAccount } from '$lib/auth/user';
import { createEmailVerification } from '$lib/auth/user.server';
import { encodeBase64 } from '@oslojs/encoding';
import type { Actions } from './$types';

import type { PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load = (async ({ cookies }) => {
	const accessToken = cookies.get('access_token');
	if (!accessToken) {
		return { user: null };
	}
	const user = await getUserAndAccounts(accessToken);
	const stringifiedUser = user ? JSON.stringify(user) : null;
	console.log('user: ', stringifiedUser);
	console.log('accessToken load function: ', accessToken);
	return { user: stringifiedUser, accessToken };
}) satisfies PageServerLoad;

export const actions = {
	profileData: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		if (!accessToken) {
			return;
		}

		const formData = await request.formData();
		const firstName = formData.get('firstName') || undefined;
		const lastName = formData.get('lastName') || undefined;
		const avatar = formData.get('avatar') || undefined;

		if (
			(firstName !== undefined && typeof firstName !== 'string') ||
			(lastName !== undefined && typeof lastName !== 'string') ||
			(avatar !== undefined && typeof avatar !== 'string')
		) {
			console.error('Invalid fields: must be strings or undefined');
			return { message: 'Invalid fields: must be strings or undefined' };
		}

		const updateData = {
			...(firstName && { firstName }),
			...(lastName && { lastName }),
			...(avatar && { avatar })
		};

		try {
			await updateUser(accessToken, updateData);
			return { message: 'Profile updated successfully' };
		} catch (error) {
			console.error('Error updating user:', error);
			return { message: 'Failed to update profile' };
		}
	},

	verifyEmail: async ({ cookies, request, fetch }) => {
		console.log('Starting verifyEmail action');
		const accessToken = cookies.get('access_token');
		if (!accessToken) {
			console.warn('No access token found');
			return { message: 'Please reload the page' };
		}

		const formData = await request.formData();
		const email = formData.get('email');
		const userId = formData.get('userId');
		if (typeof email !== 'string' || typeof userId !== 'string') {
			console.error('Invalid or missing email in formData');
			return fail(400, { message: 'Invalid or missing email' });
		}

		try {
			console.log(`Attempting to create email verification for: ${email}`);
			await createEmailVerification(accessToken, email, fetch, userId);
			console.log('Email verification created successfully');
			return { message: 'Email updated successfully', newEmail: email };
		} catch (error) {
			console.error('Error updating user:', error);
			return { message: 'Failed to update email' };
		}
	},

	addEmail: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		if (!accessToken) {
			return { message: 'Please reload the page' };
		}

		const formData = await request.formData();
		const email = formData.get('email');
		const verificationOTP = formData.get('verificationOTP');
		if (typeof email !== 'string' || typeof verificationOTP !== 'string') {
			return fail(400, { message: 'Invalid or missing email' });
		}

		try {
			await addEmail(accessToken, email, verificationOTP);
			return { message: 'Email updated successfully' };
		} catch (error) {
			console.error('Error updating user:', error);
			return { message: 'Failed to update email' };
		}
	},

	createPasskeyAccount: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		if (!accessToken) {
			return fail(400, { message: 'Please reload the page' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId');
		const encodedAttestationObject = formData.get('encodedAttestationObject');
		const encodedClientDataJSON = formData.get('encodedClientDataJSON');

		if (
			typeof userId !== 'string' ||
			typeof encodedAttestationObject !== 'string' ||
			typeof encodedClientDataJSON !== 'string'
		) {
			console.error('Invalid or missing fields');
			return fail(400, { message: 'Invalid or missing fields' });
		}

		try {
			console.log(
				`Attempting to create passkey account for user: ${userId} with data:`,
				{
					encodedAttestationObject,
					encodedClientDataJSON
				}
			);

			const credential = await validatePasskeyData({
				userId,
				encodedAttestationObject,
				encodedClientDataJSON
			});

			const encodedCredential: WebAuthnUserCredentialEncoded = {
				id: encodeBase64(credential.id),
				userId,
				algorithmId: credential.algorithmId,
				publicKey: encodeBase64(credential.publicKey)
			};

			console.log(`Attempting to create passkey account with credential:`, encodedCredential);

			const response = await createPasskeyAccount(accessToken, encodedCredential);

			console.log('Passkey account created successfully');

			const account = JSON.stringify(response);

			return { message: 'Passkey account created successfully', account };
		} catch (error) {
			console.error('Error creating passkey account:', error);
			return fail(400, { message: 'Failed to create passkey account' });
		}
	}
} satisfies Actions;
