import {
	parseAttestationObject,
	AttestationStatementFormat,
	parseClientDataJSON,
	coseAlgorithmES256,
	coseEllipticCurveP256,
	ClientDataType,
	coseAlgorithmRS256
} from '@oslojs/webauthn';
import type {
	AttestationStatement,
	AuthenticatorData,
	ClientData,
	COSEEC2PublicKey,
	COSERSAPublicKey
} from '@oslojs/webauthn';
import { ECDSAPublicKey, p256 } from '@oslojs/crypto/ecdsa';
import { decodeBase64 } from '@oslojs/encoding';
import { verifyWebAuthnChallenge } from '$lib/auth/passkeys/server';
import { RSAPublicKey } from '@oslojs/crypto/rsa';
import { env } from '$env/dynamic/private';
import type { WebAuthnUserCredential } from '$lib/auth/passkeys/types';

/**
 * Validates the passkey data provided during sign-up.
 *
 * @param {{
 *     otp?: string,
 *     userId: string,
 *     encodedAttestationObject: string,
 *     encodedClientDataJSON: string
 * }} data - The JSON payload from the sign-up request.
 * @returns {Promise<WebAuthnUserCredential>} The validated user credential.
 * @throws {Error} If any validation fails.
 */
export async function validatePasskeyData(data: {
	otp?: string;
	userId: string;
	encodedAttestationObject: string;
	encodedClientDataJSON: string;
}): Promise<WebAuthnUserCredential> {
	const { otp, userId, encodedAttestationObject, encodedClientDataJSON } = data;

	// Construct allowed URLs from environment variables
	const allowedUrls: string[] = [];
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

	let attestationObjectBytes: Uint8Array, clientDataJSON: Uint8Array;
	try {
		attestationObjectBytes = decodeBase64(encodedAttestationObject);
		clientDataJSON = decodeBase64(encodedClientDataJSON);
	} catch {
		throw new Error('Invalid or missing fields');
	}

	let attestationStatement: AttestationStatement, authenticatorData: AuthenticatorData;
	try {
		const attestationObject = parseAttestationObject(attestationObjectBytes);
		attestationStatement = attestationObject.attestationStatement;
		authenticatorData = attestationObject.authenticatorData;
	} catch {
		throw new Error('Invalid data');
	}

	// Validate attestation statement format
	if (attestationStatement.format !== AttestationStatementFormat.None) {
		throw new Error('Invalid attestation format');
	}

	// Verify relying party ID hash against allowed URLs
	if (
		!allowedUrls.some((url) => authenticatorData.verifyRelyingPartyIdHash(new URL(url).hostname))
	) {
		throw new Error('Relying party ID hash verification failed');
	}

	// Check user presence and verification
	if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
		throw new Error('User not present or not verified');
	}

	// Ensure credential is not null
	if (authenticatorData.credential === null) {
		throw new Error('Authenticator data credential is null');
	}

	let clientData: ClientData;
	try {
		clientData = parseClientDataJSON(clientDataJSON);
	} catch {
		throw new Error('Invalid data');
	}

	// Validate client data type
	if (clientData.type !== ClientDataType.Create) {
		throw new Error('Invalid client data type');
	}

	// Verify WebAuthn challenge
	if (!verifyWebAuthnChallenge(clientData.challenge)) {
		throw new Error('WebAuthn challenge verification failed');
	}

	// Check if origin is allowed
	if (!allowedUrls.includes(clientData.origin)) {
		throw new Error('Client data origin not allowed');
	}

	// Disallow cross-origin requests
	if (clientData.crossOrigin !== null && clientData.crossOrigin) {
		throw new Error('Cross-origin requests are not allowed');
	}

	let credential: WebAuthnUserCredential;

	// Handle EC2 Public Key
	if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmES256) {
		let cosePublicKey: COSEEC2PublicKey;
		try {
			cosePublicKey = authenticatorData.credential.publicKey.ec2();
		} catch {
			throw new Error('Invalid data');
		}

		// Validate elliptic curve
		if (cosePublicKey.curve !== coseEllipticCurveP256) {
			throw new Error('Unsupported EC2 curve');
		}

		// Encode public key
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
	}
	// Handle RSA Public Key
	else if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmRS256) {
		let cosePublicKey: COSERSAPublicKey;
		try {
			cosePublicKey = authenticatorData.credential.publicKey.rsa();
		} catch {
			throw new Error('Invalid data');
		}

		// Encode public key
		const encodedPublicKey = new RSAPublicKey(cosePublicKey.n, cosePublicKey.e).encodePKCS1();

		credential = {
			id: authenticatorData.credential.id,
			userId: userId,
			algorithmId: coseAlgorithmRS256,
			publicKey: encodedPublicKey,
			otp: otp
		};
	}
	// Unsupported algorithm
	else {
		throw new Error('Unsupported public key algorithm');
	}

	return credential;
}

