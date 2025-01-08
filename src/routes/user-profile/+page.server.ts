import { createEmailVerification, getUserAndAccounts, addEmail, updateUser } from '$lib/auth/user';
import type { Actions } from './$types';

import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
	const accessToken = cookies.get('access_token');
	if (!accessToken) {
		return { user: null };
	}
	const user = await getUserAndAccounts(accessToken);
	const stringifiedUser = user ? JSON.stringify(user) : null;
	console.log('user: ', stringifiedUser);
	return { user: stringifiedUser };
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
			return new Response('Invalid fields: must be strings or undefined', { status: 400 });
		}

		const updateData = {
			...(firstName && { firstName }),
			...(lastName && { lastName }),
			...(avatar && { avatar })
		};

		try {
			await updateUser(accessToken, updateData);
			return { success: true, message: 'Profile updated successfully' };
		} catch (error) {
			console.error('Error updating user:', error);
			return { success: false, message: 'Failed to update profile' };
		}
	},

	verifyEmail: async ({ cookies, request, fetch }) => {
		console.log('Starting verifyEmail action');
		const accessToken = cookies.get('access_token');
		if (!accessToken) {
			console.warn('No access token found');
			return { success: false, message: 'Please reload the page' };
		}

		const formData = await request.formData();
		const email = formData.get('email');
		const userId = formData.get('userId');
		if (typeof email !== 'string' || typeof userId !== 'string') {
			console.error('Invalid or missing email in formData');
			return new Response('Invalid or missing email', { status: 400 });
		}

		try {
			console.log(`Attempting to create email verification for: ${email}`);
			await createEmailVerification(accessToken, email, fetch, userId);
			console.log('Email verification created successfully');
			return { success: true, message: 'Email updated successfully', newEmail: email };
		} catch (error) {
			console.error('Error updating user:', error);
			return { success: false, message: 'Failed to update email' };
		}
	},

	addEmail: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		if (!accessToken) {
			return { success: false, message: 'Please reload the page' };
		}

		const formData = await request.formData();
		const email = formData.get('email');
		const verificationOTP = formData.get('verificationOTP');
		if (typeof email !== 'string' || typeof verificationOTP !== 'string') {
			return new Response('Invalid or missing email', { status: 400 });
		}

		try {
			await addEmail(accessToken, email, verificationOTP);
			return { success: true, message: 'Email updated successfully' };
		} catch (error) {
			console.error('Error updating user:', error);
			return { success: false, message: 'Failed to update email' };
		}
	}
} satisfies Actions;
