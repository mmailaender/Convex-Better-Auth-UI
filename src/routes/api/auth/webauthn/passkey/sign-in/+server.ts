/**
 * Handles the WebAuthn sign-in process by verifying the provided client and authenticator data.
 * Validates user credentials, checks the challenge, and verifies the signature.
 *
 * @param {RequestEvent} context - The incoming request event.
 * @returns {Promise<Response>} A response indicating success (204) or the specific error (400 or 500).
 */
import {
	parseClientDataJSON,
	coseAlgorithmES256,
	ClientDataType,
	parseAuthenticatorData,
	createAssertionSignatureMessage,
	coseAlgorithmRS256
} from '@oslojs/webauthn';
import {
	decodePKIXECDSASignature,
	decodeSEC1PublicKey,
	p256,
	verifyECDSASignature
} from '@oslojs/crypto/ecdsa';
import { ObjectParser } from '@pilcrowjs/object-parser';
import { decodeBase64, encodeBase64 } from '@oslojs/encoding';
import { verifyWebAuthnChallenge, getPasskeyCredential } from '$lib/auth/passkeys/server';
import { sha256 } from '@oslojs/crypto/sha2';
import {
	decodePKCS1RSAPublicKey,
	sha256ObjectIdentifier,
	verifyRSASSAPKCS1v15Signature
} from '@oslojs/crypto/rsa';

import type { RequestEvent } from './$types';
import type { ClientData, AuthenticatorData } from '@oslojs/webauthn';

import { env } from '$env/dynamic/private';
import { setAccessTokenCookie, setRefreshTokenCookie } from '$lib/auth/session';
import { signInWithPasskey } from '$lib/auth/user';

const allowedUrls = [] as string[];
if (env.VERCEL_URL) {
	allowedUrls.push(`https://${env.VERCEL_URL}`);
}
if (env.VERCEL_BRANCH_URL) {
	allowedUrls.push(`https://${env.VERCEL_BRANCH_URL}`);
}
if (env.CUSTOM_DOMAINS) {
	const customDomains = env.CUSTOM_DOMAINS.split(',').map((domain) =>
		'https://'.concat(domain.trim())
	);
	allowedUrls.push(...customDomains);
}

export async function POST(context: RequestEvent): Promise<Response> {
	console.log('POST request received for sign-in');

	const data: unknown = await context.request.json();
	const parser = new ObjectParser(data);
	let encodedAuthenticatorData: string;
	let encodedClientDataJSON: string;
	let encodedCredentialId: string;
	let encodedSignature: string;
	try {
		encodedAuthenticatorData = parser.getString('authenticator_data');
		encodedClientDataJSON = parser.getString('client_data_json');
		encodedCredentialId = parser.getString('credential_id');
		encodedSignature = parser.getString('signature');
		console.log('Parsed request payload successfully');
	} catch (error) {
		console.error('Invalid or missing fields in request payload:', error);
		return new Response('Invalid or missing fields', { status: 400 });
	}

	let authenticatorDataBytes: Uint8Array;
	let clientDataJSON: Uint8Array;
	let credentialId: Uint8Array;
	let signatureBytes: Uint8Array;
	try {
		authenticatorDataBytes = decodeBase64(encodedAuthenticatorData);
		clientDataJSON = decodeBase64(encodedClientDataJSON);
		credentialId = decodeBase64(encodedCredentialId);
		signatureBytes = decodeBase64(encodedSignature);
		console.log('Decoded request fields successfully');
	} catch (error) {
		console.error('Error decoding request fields:', error);
		return new Response('Invalid or missing fields', { status: 400 });
	}

	let authenticatorData: AuthenticatorData;
	try {
		authenticatorData = parseAuthenticatorData(authenticatorDataBytes);
		console.log('Parsed authenticator data successfully');
	} catch (error) {
		console.error('Error parsing authenticator data:', error);
		return new Response('Invalid data', { status: 400 });
	}

	if (
		!allowedUrls.some((url) => authenticatorData.verifyRelyingPartyIdHash(new URL(url).hostname))
	) {
		console.error('Relying party ID hash verification failed');
		return new Response('Invalid data', { status: 400 });
	}

	if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
		console.error('User not present or verified');
		return new Response('Invalid data', { status: 400 });
	}

	let clientData: ClientData;
	try {
		clientData = parseClientDataJSON(clientDataJSON);
		console.log('Parsed client data JSON successfully');
	} catch (error) {
		console.error('Error parsing client data JSON:', error);
		return new Response('Invalid data', { status: 400 });
	}

	if (clientData.type !== ClientDataType.Get) {
		console.error('Invalid client data type:', clientData.type);
		return new Response('Invalid data', { status: 400 });
	}

	if (!verifyWebAuthnChallenge(clientData.challenge)) {
		console.error('WebAuthn challenge verification failed');
		return new Response('Invalid data', { status: 400 });
	}

	if (!allowedUrls.includes(clientData.origin)) {
		console.error('Client data origin not allowed:', clientData.origin);
		return new Response('Invalid data', { status: 400 });
	}

	if (clientData.crossOrigin !== null && clientData.crossOrigin) {
		console.error('Cross-origin requests are not allowed');
		return new Response('Invalid data', { status: 400 });
	}

	const credential = await getPasskeyCredential(credentialId);
	if (credential === null) {
		console.error('Credential not found');
		return new Response('Invalid credential', { status: 400 });
	}

	let validSignature: boolean;
	if (credential.algorithmId === coseAlgorithmES256) {
		const ecdsaSignature = decodePKIXECDSASignature(signatureBytes);
		const ecdsaPublicKey = decodeSEC1PublicKey(p256, credential.publicKey);
		const hash = sha256(createAssertionSignatureMessage(authenticatorDataBytes, clientDataJSON));
		validSignature = verifyECDSASignature(ecdsaPublicKey, hash, ecdsaSignature);
	} else if (credential.algorithmId === coseAlgorithmRS256) {
		const rsaPublicKey = decodePKCS1RSAPublicKey(credential.publicKey);
		const hash = sha256(createAssertionSignatureMessage(authenticatorDataBytes, clientDataJSON));
		validSignature = verifyRSASSAPKCS1v15Signature(
			rsaPublicKey,
			sha256ObjectIdentifier,
			hash,
			signatureBytes
		);
	} else {
		console.error('Unsupported credential algorithm');
		return new Response('Internal error', { status: 500 });
	}

	if (!validSignature) {
		console.error('Invalid signature');
		return new Response('Invalid signature', { status: 400 });
	}

	try {
		const { access, refresh } = await signInWithPasskey(encodeBase64(credential.id!));
		console.log('Sign-in with passkey succeeded');
		setAccessTokenCookie(context, access.secret!, access.ttl!.toDate());
		setRefreshTokenCookie(context, refresh.secret!, refresh.ttl!.toDate());
	} catch (error) {
		console.error('Error during sign-in with passkey:', error);
		return new Response('Internal error', { status: 500 });
	}

	console.log('POST request for sign-in completed successfully');
	return new Response(null, { status: 204 });
}
