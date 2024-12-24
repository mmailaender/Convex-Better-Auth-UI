import { goto } from '$app/navigation';
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import { ObjectParser } from '@pilcrowjs/object-parser';

export async function createChallenge(): Promise<Uint8Array> {
	const response = await fetch('/api/auth/webauthn/challenge', {
		method: 'POST'
	});
	if (!response.ok) {
		throw new Error('Failed to create challenge');
	}
	const result = await response.json();
	const parser = new ObjectParser(result);
	return decodeBase64(parser.getString('challenge'));
}

export async function signInWithPasskey(errorMessage: string) {
	const challenge = await createChallenge();

	const credential = await navigator.credentials.get({
		publicKey: {
			challenge,
			userVerification: 'required'
		}
	});

	if (!(credential instanceof PublicKeyCredential)) {
		errorMessage = 'Failed to retrieve credential.';
		return;
	}
	if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
		errorMessage = 'Unexpected error: invalid credential response.';
		return;
	}

	const response = await fetch('/sign-in/passkey', {
		method: 'POST',
		body: JSON.stringify({
			credential_id: encodeBase64(new Uint8Array(credential.rawId)),
			signature: encodeBase64(new Uint8Array(credential.response.signature)),
			authenticator_data: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
			client_data_json: encodeBase64(new Uint8Array(credential.response.clientDataJSON))
		})
	});

	if (response.ok) {
		goto('/');
	} else {
		errorMessage = await response.text();
	}
}
