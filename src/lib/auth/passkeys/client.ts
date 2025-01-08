/**
 * Creates a WebAuthn challenge by making a request to the server.
 * A challenge is a unique value sent to the client to ensure the authenticity of a WebAuthn request.
 * The client signs this challenge using its private key, and the server verifies it to complete authentication.
 *
 * @returns {Promise<Uint8Array>} The challenge as a Uint8Array.
 * @throws {Error} If the request fails or the response is invalid.
 */
import { decodeBase64 } from '@oslojs/encoding';
import { ObjectParser } from '@pilcrowjs/object-parser';

export async function createChallenge(): Promise<Uint8Array> {
	const response = await fetch('/api/auth/webauthn/challenge', { method: 'POST' });
	if (!response.ok) {
		throw new Error('Failed to create challenge');
	}
	const result = await response.json();
	const parser = new ObjectParser(result);
	return decodeBase64(parser.getString('challenge'));
}
