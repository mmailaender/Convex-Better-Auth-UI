// modules
import { error, json, redirect } from '@sveltejs/kit';
import { type } from 'arktype';

// lib
import { deleteUser, getUserAndAccounts, updateProfileData } from '$lib/user/api/server';
import {
	addEmail,
	cancelEmailVerification,
	createAndSendVerification,
	deleteEmail,
	setPrimaryEmail,
	verifyEmail
} from '$lib/email/api/server';
import { createPasskeyAccount, deleteAccount } from '$lib/account/api/server';

// types
import {
	addEmailData,
	cancelEmailVerificationData,
	createPasskeyAccountData,
	profileData,
	verifyEmailAndSendVerificationData
} from '$lib/user/api/types';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ parent, cookies }) => {
	const { user: layoutUser } = await parent();
	const layoutUserData = layoutUser ? JSON.parse(layoutUser) : null;

	const accessToken = cookies.get('access_token')!;

	const userWithAccounts = await getUserAndAccounts(accessToken);

	const mergedUser = {
		...layoutUserData,
		...userWithAccounts,
		accounts: userWithAccounts.accounts,
		activeOrganization: layoutUserData?.activeOrganization,
		organizations: layoutUserData?.organizations
	};
	const stringifiedUser = JSON.stringify(mergedUser);

	return { user: stringifiedUser, accessToken };
}) satisfies PageServerLoad;

export const actions = {
	updateProfileData: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const data = profileData.partial()({
			firstName: formData.get('firstName') || undefined,
			lastName: formData.get('lastName') || undefined,
			avatar: formData.get('avatar') || undefined
		});
		if (data instanceof type.errors) {
			console.error(data.summary);
			return error(400, { message: data.summary });
		} else {
			try {
				await updateProfileData(accessToken!, data);
				return { message: 'Profile updated successfully' };
			} catch (err) {
				console.error('Error updating user:', err);
				return error(400, { message: 'Failed to update profile' });
			}
		}
	},

	setPrimaryEmail: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const email = type('string')(formData.get('email'));

		if (email instanceof type.errors) {
			console.error('email ', email.summary);
			return error(400, { message: `email ${email.summary}` });
		} else {
			try {
				const user = await setPrimaryEmail(accessToken!, email);
				return JSON.stringify(user);
			} catch (err) {
				console.error('Error setting primary email:', err);
				return error(400, { message: `Failed to set primary email "${email}"` });
			}
		}
	},

	deleteEmail: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const email = type('string')(formData.get('email'));

		if (email instanceof type.errors) {
			console.error('email ', email.summary);
			return error(400, { message: `email ${email.summary}` });
		} else {
			try {
				const user = await deleteEmail(accessToken!, email);
				return JSON.stringify(user);
			} catch (err) {
				console.error('Error deleting email:', err);
				return error(400, { message: `Failed to delete email "${email}"` });
			}
		}
	},

	verifyEmail: async ({ request }) => {
		const formData = await request.formData();

		const email = type('string.email')(formData.get('email'));

		if (email instanceof type.errors) {
			console.error('email ', email.summary);
			return error(400, { message: `email ${email.summary}` });
		} else {
			try {
				const verificationResult = await verifyEmail(email);
				return JSON.stringify(verificationResult);
			} catch (err) {
				console.error('Error verifying email:', err);
				return error(400, { message: `Failed to verify email "${email}"` });
			}
		}
	},

	verifyEmailAndSendVerification: async ({ request }) => {
		const formData = await request.formData();

		const data = verifyEmailAndSendVerificationData({
			email: formData.get('email'),
			userId: formData.get('userId') ?? undefined
		});
		if (data instanceof type.errors) {
			console.error(data.summary);
			return error(400, { message: data.summary });
		} else {
			try {
				console.log(`Verifying email: ${data.email}`);

				const verificationResult = await verifyEmail(data.email);

				console.log(`Verification result: `, verificationResult);

				if (!verificationResult.valid) {
					console.error(`Email ${data.email} is not valid: ${verificationResult.reason}`);
					return JSON.stringify(verificationResult);
				}

				if (verificationResult.exists) {
					console.error(`Email ${data.email} already exists: ${verificationResult.reason}`);
					return JSON.stringify(verificationResult);
				}

				await createAndSendVerification(data.email, data.userId);

				console.log(`Email ${data.email} successfully verified and send verification.`);

				return JSON.stringify(verificationResult);
			} catch (err) {
				console.error(`Failed to verify email ${data.email}:`, err);
				return error(400, { message: `Failed to verify email ${data.email}` });
			}
		}
	},

	resendVerification: async ({ request }) => {
		const formData = await request.formData();

		const email = type('string.email')(formData.get('email'));
		const userId = type('string.numeric > 0 | undefined')(formData.get('userId'));

		if (email instanceof type.errors) {
			console.error('email ', email.summary);
			return error(400, { message: `email ${email.summary}` });
		} else if (userId instanceof type.errors) {
			console.error('userId ', userId.summary);
			return error(400, { message: `userId ${userId.summary}` });
		}

		try {
			await createAndSendVerification(email, userId);
			return { success: 'true' };
		} catch (err) {
			console.error(`Error resending verification for email ${email}: `, err);
			return error(400, { message: 'Failed to resend verification' });
		}
	},

	cancelEmailVerification: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const data = cancelEmailVerificationData(formData.get('emailVerification'));
		if (data instanceof type.errors) {
			console.log(data.message);
			return error(400, { message: data.summary });
		} else {
			try {
				await cancelEmailVerification(accessToken!, data);
				return { success: 'true' };
			} catch (err) {
				console.error('Error canceling confirmation: ', err);
				return error(400, { message: 'Failed to cancel confirmation' });
			}
		}
	},

	addEmail: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const out = addEmailData({
			email: formData.get('email'),
			verificationOTP: formData.get('verificationOTP')
		});
		if (out instanceof type.errors) {
			console.error(out.summary);
			return error(400, { message: out.summary });
		} else {
			try {
				const res = await addEmail(accessToken!, out);
				return JSON.stringify(res);
			} catch (err) {
				console.error('Error updating user:', err);
				return error(400, { message: 'Failed to update email' });
			}
		}
	},

	createPasskeyAccount: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');

		const formData = await request.formData();
		const out = createPasskeyAccountData({
			userId: formData.get('userId'),
			encodedAttestationObject: formData.get('encodedAttestationObject'),
			encodedClientDataJSON: formData.get('encodedClientDataJSON')
		});

		if (out instanceof type.errors) {
			console.error(out.summary);
			return error(400, { message: out.summary });
		} else {
			try {
				const response = await createPasskeyAccount(accessToken!, out);

				console.log('Passkey account created successfully');
				return JSON.stringify(response);
			} catch (err) {
				console.error('Error creating passkey account:', err);
				return error(400, { message: 'Failed to create passkey account' });
			}
		}
	},

	deleteAccount: async ({ cookies, request }) => {
		const accessToken = cookies.get('access_token');
		const formData = await request.formData();

		const accountId = type('string.numeric > 0')(formData.get('accountId'));

		if (accountId instanceof type.errors) {
			console.error('accountId ', accountId.summary);
			return error(400, { message: `accountId ${accountId.summary}` });
		} else {
			try {
				await deleteAccount(accessToken!, accountId);
				console.log(`Account ${accountId} deleted successfully.`);
				return { success: true };
			} catch (err) {
				console.error(`Error deleting account ${accountId}: `, err);
				return error(400, { message: 'Failed to delete account' });
			}
		}
	},

	deleteUser: async (event) => {
		const formData = await event.request.formData();
		const userId = type('string')(formData.get('userId'));

		if (userId instanceof type.errors) {
			console.error('userId ', userId.summary);
			return error(400, { message: `userId ${userId.summary}` });
		} else {
			try {
				await deleteUser(event, userId);
			} catch (err) {
				console.error('Failed to delete user:', err);
				return error(400, { message: 'Failed to delete user' });
			}
			redirect(303, '/sign-in');
		}
	}
} satisfies Actions;
