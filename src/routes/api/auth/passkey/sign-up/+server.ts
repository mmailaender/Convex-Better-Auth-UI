import type { RequestEvent } from './$types';
import { signUpWithPasskey } from '$lib/auth/user.server';
import { setAccessTokenCookie, setRefreshTokenCookie } from '$lib/auth/session';
import type { WebAuthnUserCredential } from '$lib/auth/passkeys/types';
import { validatePasskeyData } from '$lib/auth/passkeys/server/validatePasskey';

/**
 * Handles the WebAuthn sign-up process by verifying the provided attestation and client data.
 * Utilizes the validatePasskeyData function for data validation.
 *
 * @param {RequestEvent} event - The incoming request event.
 * @returns {Promise<Response>} A response indicating success (204) or the specific error (400).
 */
export async function POST(event: RequestEvent) {
	console.log('POST request received');

	const payload = await event.request.json();
	console.log('Request payload:', {
		firstName: payload.firstName,
		lastName: payload.lastName,
		email: payload.email,
		userId: payload.userId
	});

	if (
		typeof payload.firstName !== 'string' ||
		typeof payload.lastName !== 'string' ||
		typeof payload.email !== 'string' ||
		typeof payload.otp !== 'string' ||
		typeof payload.userId !== 'string' ||
		typeof payload.encodedAttestationObject !== 'string' ||
		typeof payload.encodedClientDataJSON !== 'string'
	) {
		console.error('Invalid or missing fields');
		return new Response('Invalid or missing fields', { status: 400 });
	}

	let credential: WebAuthnUserCredential;
	try {
		credential = await validatePasskeyData({
			otp: payload.otp,
			userId: payload.userId,
			encodedAttestationObject: payload.encodedAttestationObject,
			encodedClientDataJSON: payload.encodedClientDataJSON
		});
		console.log('Passkey data validated successfully');
	} catch (error: unknown) {
		console.error('Validation error:', error);
		let message = 'Invalid data';
		if (error instanceof Error) {
		  message = error.message;
		}
		return new Response(message, { status: 400 });
	  }

	try {
		const { access, refresh } = await signUpWithPasskey(
			credential,
			payload.firstName,
			payload.lastName,
			payload.email
		);
		console.log('Sign-up with passkey succeeded');
		setAccessTokenCookie(event, access.secret!, access.ttl!.toDate());
		setRefreshTokenCookie(event, refresh.secret!, refresh.ttl!.toDate());
	} catch (error) {
		console.error('Error during sign-up with passkey:', error);
		return new Response('Invalid data', { status: 400 });
	}

	console.log('POST request completed successfully');
	return new Response(null, { status: 204 });
}
