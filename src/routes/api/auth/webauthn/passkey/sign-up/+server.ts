/**
 * Handles the WebAuthn sign-up process by verifying the provided attestation and client data.
 * Validates user credentials, parses attestation data, and ensures the challenge matches expectations.
 *
 * @param {RequestEvent} event - The incoming request event.
 * @returns {Promise<Response>} A response indicating success (204) or the specific error (400).
 */
import {
	parseAttestationObject,
	AttestationStatementFormat,
	parseClientDataJSON,
	coseAlgorithmES256,
	coseEllipticCurveP256,
	ClientDataType,
	coseAlgorithmRS256
} from '@oslojs/webauthn';
import { ECDSAPublicKey, p256 } from '@oslojs/crypto/ecdsa';
import { decodeBase64 } from '@oslojs/encoding';
import { verifyWebAuthnChallenge } from '$lib/auth/passkeys/server';
import { RSAPublicKey } from '@oslojs/crypto/rsa';

import { env } from '$env/dynamic/private';

import type {
	AttestationStatement,
	AuthenticatorData,
	ClientData,
	COSEEC2PublicKey,
	COSERSAPublicKey
} from '@oslojs/webauthn';
import type { RequestEvent } from './$types';
import { signUpWithPasskey } from '$lib/auth/user.server';
import { setAccessTokenCookie, setRefreshTokenCookie } from '$lib/auth/session';
import type { WebAuthnUserCredential } from '$lib/auth/passkeys/types';

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

export async function POST(event: RequestEvent) {
	console.log('POST request received');

	const {
		firstName,
		lastName,
		email,
		otp,
		userId,
		encodedAttestationObject,
		encodedClientDataJSON
	} = await event.request.json();
	console.log('Request payload:', { firstName, lastName, email, userId });

	if (
		typeof firstName !== 'string' ||
		typeof lastName !== 'string' ||
		typeof email !== 'string' ||
		typeof otp !== 'string' ||
		typeof userId !== 'string' ||
		typeof encodedAttestationObject !== 'string' ||
		typeof encodedClientDataJSON !== 'string'
	) {
		console.error('Invalid or missing fields');
		return new Response('Invalid or missing fields', { status: 400 });
	}

	let attestationObjectBytes: Uint8Array, clientDataJSON: Uint8Array;
	try {
		attestationObjectBytes = decodeBase64(encodedAttestationObject);
		clientDataJSON = decodeBase64(encodedClientDataJSON);
	} catch (error) {
		console.error('Error decoding attestation or client data JSON:', error);
		return new Response('Invalid or missing fields', { status: 400 });
	}

	let attestationStatement: AttestationStatement, authenticatorData: AuthenticatorData;
	try {
		const attestationObject = parseAttestationObject(attestationObjectBytes);
		attestationStatement = attestationObject.attestationStatement;
		authenticatorData = attestationObject.authenticatorData;
		console.log('Parsed attestation object successfully');
	} catch (error) {
		console.error('Error parsing attestation object:', error);
		return new Response('Invalid data', { status: 400 });
	}

	if (attestationStatement.format !== AttestationStatementFormat.None) {
		console.error('Invalid attestation format');
		return new Response('Invalid data', { status: 400 });
	}

	if (
		!allowedUrls.some((url) => authenticatorData.verifyRelyingPartyIdHash(new URL(url).hostname))
	) {
		console.error('Relying party ID hash verification failed');
		return new Response('Invalid data', { status: 400 });
	}

	if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
		console.error('User not present or not verified');
		return new Response('Invalid data', { status: 400 });
	}

	if (authenticatorData.credential === null) {
		console.error('Authenticator data credential is null');
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

	if (clientData.type !== ClientDataType.Create) {
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

	let credential: WebAuthnUserCredential;
	if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmES256) {
		let cosePublicKey: COSEEC2PublicKey;
		try {
			cosePublicKey = authenticatorData.credential.publicKey.ec2();
			console.log('Parsed EC2 public key successfully');
		} catch (error) {
			console.error('Error parsing EC2 public key:', error);
			return new Response('Invalid data', { status: 400 });
		}
		if (cosePublicKey.curve !== coseEllipticCurveP256) {
			console.error('Unsupported EC2 curve:', cosePublicKey.curve);
			return new Response('Unsupported algorithm', { status: 400 });
		}
		const encodedPublicKey = new ECDSAPublicKey(
			p256,
			cosePublicKey.x,
			cosePublicKey.y
		).encodeSEC1Uncompressed();
		credential = {
			id: authenticatorData.credential.id,
			userId: userId,
			algorithmId: coseAlgorithmES256,
			publicKey: encodedPublicKey,
			otp: otp
		};
	} else if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmRS256) {
		let cosePublicKey: COSERSAPublicKey;
		try {
			cosePublicKey = authenticatorData.credential.publicKey.rsa();
			console.log('Parsed RSA public key successfully');
		} catch (error) {
			console.error('Error parsing RSA public key:', error);
			return new Response('Invalid data', { status: 400 });
		}
		const encodedPublicKey = new RSAPublicKey(cosePublicKey.n, cosePublicKey.e).encodePKCS1();
		credential = {
			id: authenticatorData.credential.id,
			userId: userId,
			algorithmId: coseAlgorithmRS256,
			publicKey: encodedPublicKey,
			otp: otp
		};
	} else {
		console.error('Unsupported public key algorithm');
		return new Response('Unsupported algorithm', { status: 400 });
	}

	try {
		const { access, refresh } = await signUpWithPasskey(credential, firstName, lastName, email);
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
