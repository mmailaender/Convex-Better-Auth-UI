/**
 * Creates a WebAuthn challenge by making a request to the server.
 * A challenge is a unique value sent to the client to ensure the authenticity of a WebAuthn request.
 * The client signs this challenge using its private key, and the server verifies it to complete authentication.
 *
 * @returns {Promise<Uint8Array>} The challenge as a Uint8Array.
 * @throws {Error} If the request fails or the response is invalid.
 */
import { goto } from '$app/navigation';
import { callForm } from '$lib/primitives/api/callForm';
import { bigEndian } from '@oslojs/binary';
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import { ObjectParser } from '@pilcrowjs/object-parser';

function getFriendlyErrorMessage(error: Error): string {
	switch (error.name) {
		case 'NotAllowedError':
			return 'Authentication was canceled or timed out. Please try again.';
		case 'InvalidStateError':
			return 'There was an issue with the authentication state. Please refresh the page and try again.';
		case 'AbortError':
			return 'Authentication was aborted. Please try again.';
		default:
			return error.message || 'An unexpected error occurred. Please try again.';
	}
}

export async function createChallenge(): Promise<Uint8Array> {
	const response = await fetch('/api/auth/passkey/challenge', { method: 'POST' });
	if (!response.ok) {
		throw new Error('Failed to create challenge');
	}
	const result = await response.json();
	const parser = new ObjectParser(result);
	return decodeBase64(parser.getString('challenge'));
}

export async function signInWithPasskey() {
	try {
		const challenge = await createChallenge();
		const credential = await navigator.credentials.get({
			publicKey: {
				challenge,
				userVerification: 'required'
			}
		});

		if (!(credential instanceof PublicKeyCredential)) {
			throw new Error('Failed to retrieve credential.');
		}
		if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
			throw new Error('Unexpected error: invalid credential response.');
		}

		const response = await fetch('/api/auth/passkey/sign-in', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				credential_id: encodeBase64(new Uint8Array(credential.rawId)),
				signature: encodeBase64(new Uint8Array(credential.response.signature)),
				authenticator_data: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
				client_data_json: encodeBase64(new Uint8Array(credential.response.clientDataJSON))
			})
		});

		if (response.ok) {
			const urlParams = new URLSearchParams(window.location.search);
			const redirectUrl = urlParams.get('redirect_url') ?? '/';
			goto(redirectUrl);
		} else {
			const errorText = await response.text();
			throw new Error(errorText);
		}
	} catch (err) {
		throw new Error(getFriendlyErrorMessage(err as Error));
	}
}

export async function createCredentials(
	firstName: string,
	lastName: string,
	email: string,
	credentialUserId: Uint8Array
): Promise<AuthenticatorAttestationResponse> {
	const challenge = await createChallenge();
	const credential = await navigator.credentials.create({
		publicKey: {
			challenge,
			user: {
				displayName: firstName + ' ' + lastName,
				id: credentialUserId,
				name: email
			},
			rp: {
				name: 'Your App Name'
			},
			pubKeyCredParams: [
				{
					alg: -7,
					type: 'public-key'
				},
				{
					alg: -257,
					type: 'public-key'
				}
			],
			attestation: 'none',
			authenticatorSelection: {
				userVerification: 'required',
				residentKey: 'required',
				requireResidentKey: true
			}
		}
	});

	if (!(credential instanceof PublicKeyCredential)) {
		throw new Error('Failed to create credential.');
	}

	const response = credential.response;
	if (!(response instanceof AuthenticatorAttestationResponse)) {
		throw new Error('Unexpected response type.');
	}

	return response;
}

export async function signUpWithPasskey(data: {
	firstName: string;
	lastName: string;
	email: string;
	otp: string;
	// userId: string;
}): Promise<void> {
	const userId = await callForm<string>({
		url: '/user-profile?/newId'
	});

	const credentialUserId = new Uint8Array(8);
	bigEndian.putUint64(credentialUserId, BigInt(userId), 0);

	const response = await createCredentials(
		data.firstName,
		data.lastName,
		data.email,
		credentialUserId
	);

	const attestationObject = encodeBase64(new Uint8Array(response.attestationObject));
	const clientDataJSON = encodeBase64(new Uint8Array(response.clientDataJSON));

	const apiResponse = await fetch('/api/auth/passkey/sign-up', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			firstName: data.firstName,
			lastName: data.lastName,
			email: data.email,
			otp: data.otp,
			userId,
			encodedAttestationObject: attestationObject,
			encodedClientDataJSON: clientDataJSON
		})
	});

	if (!apiResponse.ok) {
		const msg = await apiResponse.text();
		throw new Error(msg || 'Failed to sign up with passkey.');
	}

	const urlParams = new URLSearchParams(window.location.search);
	const redirectUrl = urlParams.get('redirect_url') ?? '/';
	goto(redirectUrl);
}
