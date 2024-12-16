import { fail, redirect } from '@sveltejs/kit';
// import { get2FARedirect } from "$lib/server/2fa";
import { bigEndian } from '@oslojs/binary';
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
import { verifyWebAuthnChallenge } from '$lib/auth/server/webauthn';
import { RSAPublicKey } from '@oslojs/crypto/rsa';

import { env } from '$env/dynamic/private';
// import { PUBLIC_APP_NAME } from '$env/static/public'

import type { WebAuthnUserCredential } from '$lib/auth/server/webauthn';
import type {
	AttestationStatement,
	AuthenticatorData,
	ClientData,
	COSEEC2PublicKey,
	COSERSAPublicKey
} from '@oslojs/webauthn';
import type { Actions, RequestEvent } from './$types';
import { signUpWithPasskey } from '$lib/auth/user';
import { sClient } from '$lib/db/client';
import { fql } from 'fauna';
import { setAccessTokenCookie, setRefreshTokenCookie } from '$lib/auth/sign-in/session';

const allowedUrls = [] as string[];
if (env.VERCEL_URL) {
	allowedUrls.push(`${env.VERCEL_URL}`);
}
if (env.VERCEL_BRANCH_URL) {
	allowedUrls.push(`${env.VERCEL_BRANCH_URL}`);
}
if (env.CUSTOM_DOMAINS) {
	const customDomains = env.CUSTOM_DOMAINS.split(',').map((domain) => domain.trim());
	allowedUrls.push(...customDomains);
}

console.log('\nsign-in/passkey/register/+page.server.ts \n', 'allowedUrls: ', allowedUrls);

export async function load(event: RequestEvent) {
	// 	if (event.locals.session === null || event.locals.user === null) {
	// 		return redirect(302, "/login");
	// 	}
	// 	if (!event.locals.user.emailVerified) {
	// 		return redirect(302, "/verify-email");
	// 	}
	// 	if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
	// 		return redirect(302, get2FARedirect(event.locals.user));
	// 	}

	// 	const credentials = getUserPasskeyCredentials(event.locals.user.id);

	const userId = (await sClient.query<string>(fql`newId()`)).data;
	const credentialUserId = new Uint8Array(8);
	bigEndian.putUint64(credentialUserId, BigInt(userId), 0);

	console.log('\nsign-in/passkey/register/+page.server.ts \n', 'newId: ', userId);
	console.log(
		'\nsign-in/passkey/register/+page.server.ts \n',
		'credentialUserId: ',
		credentialUserId
	);
	console.log(
		'\nsign-in/passkey/register/+page.server.ts \n',
		'credentialUserId: ',
		bigEndian.uint64(credentialUserId, 0).toString()
	);

	return {
		// credentials,
		userId,
		credentialUserId
		// user: event.locals.user
	};
}

export const actions: Actions = {
	default: action
};

async function action(event: RequestEvent) {
	// if (event.locals.session === null || event.locals.user === null) {
	// 	return fail(401, {
	// 		message: "Not authenticated"
	// 	});
	// }
	// if (!event.locals.user.emailVerified) {
	// 	return fail(403, {
	// 		message: "Forbidden"
	// 	});
	// }
	// if (event.locals.user.registered2FA && !event.locals.session.twoFactorVerified) {
	// 	return fail(403, {
	// 		message: "Forbidden"
	// 	});
	// }

	const formData = await event.request.formData();
	const firstName = formData.get('firstName');
	const lastName = formData.get('lastName');
	const email = formData.get('email');
	const userId = formData.get('userId');
	const encodedAttestationObject = formData.get('attestationObject');
	const encodedClientDataJSON = formData.get('clientDataJSON');
	if (
		typeof firstName !== 'string' ||
		typeof lastName !== 'string' ||
		typeof email !== 'string' ||
		typeof userId !== 'string' ||
		typeof encodedAttestationObject !== 'string' ||
		typeof encodedClientDataJSON !== 'string'
	) {
		return fail(400, {
			message: 'Invalid or missing fields'
		});
	}

	let attestationObjectBytes: Uint8Array, clientDataJSON: Uint8Array;
	try {
		attestationObjectBytes = decodeBase64(encodedAttestationObject);
		clientDataJSON = decodeBase64(encodedClientDataJSON);
	} catch {
		return fail(400, {
			message: 'Invalid or missing fields'
		});
	}

	let attestationStatement: AttestationStatement;
	let authenticatorData: AuthenticatorData;
	try {
		const attestationObject = parseAttestationObject(attestationObjectBytes);
		attestationStatement = attestationObject.attestationStatement;
		authenticatorData = attestationObject.authenticatorData;
	} catch {
		return fail(400, {
			message: 'Invalid data'
		});
	}
	if (attestationStatement.format !== AttestationStatementFormat.None) {
		return fail(400, {
			message: 'Invalid data'
		});
	}
	if (
		!allowedUrls.some((url) => authenticatorData.verifyRelyingPartyIdHash(url))
		// REMOVE !authenticatorData.verifyRelyingPartyIdHash(env.VERCEL_URL ? env.VERCEL_URL : 'localhost')) {
	) {
		console.log('\nsign-in/passkey/register/+page.server.ts\n', 'verifyRelyingPartyIdHash failed:');
		return fail(400, {
			message: 'Invalid data'
		});
	}
	if (!authenticatorData.userPresent || !authenticatorData.userVerified) {
		return fail(400, {
			message: 'Invalid data'
		});
	}
	if (authenticatorData.credential === null) {
		return fail(400, {
			message: 'Invalid data'
		});
	}

	let clientData: ClientData;
	try {
		clientData = parseClientDataJSON(clientDataJSON);
	} catch {
		return fail(400, {
			message: 'Invalid data'
		});
	}
	if (clientData.type !== ClientDataType.Create) {
		return fail(400, {
			message: 'Invalid data'
		});
	}

	if (!verifyWebAuthnChallenge(clientData.challenge)) {
		return fail(400, {
			message: 'Invalid data'
		});
	}
	if (
		!allowedUrls.includes(clientData.origin)
		// clientData.origin !== (env.VERCEL_URL ? 'https://' + env.VERCEL_URL : 'http://localhost:5173')
	) {
		console.log(
			'\nsign-in/passkey/register/+page.server.ts\n',
			'clientData.origin failed: ',
			clientData.origin
		);
		return fail(400, {
			message: 'Invalid data'
		});
	}
	if (clientData.crossOrigin !== null && clientData.crossOrigin) {
		return fail(400, {
			message: 'Invalid data'
		});
	}

	let credential: WebAuthnUserCredential;
	if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmES256) {
		let cosePublicKey: COSEEC2PublicKey;
		try {
			cosePublicKey = authenticatorData.credential.publicKey.ec2();
		} catch {
			return fail(400, {
				message: 'Invalid data'
			});
		}
		if (cosePublicKey.curve !== coseEllipticCurveP256) {
			return fail(400, {
				message: 'Unsupported algorithm'
			});
		}
		const encodedPublicKey = new ECDSAPublicKey(
			p256,
			cosePublicKey.x,
			cosePublicKey.y
		).encodeSEC1Uncompressed();
		console.log(
			'\nsign-in/passkey/register/+page.server.ts\n',
			'authenticatorData.credential.id: ',
			authenticatorData.credential.id
		);
		console.log(
			'\nsign-in/passkey/register/+page.server.ts\n',
			'bigEndian.uint64(authenticatorData.credential.id,0).toString(): ',
			bigEndian.uint64(authenticatorData.credential.id, 0).toString()
		);
		credential = {
			// id: bigEndian.uint64(authenticatorData.credential.id,0).toString(),
			id: authenticatorData.credential.id,
			userId: userId,
			algorithmId: coseAlgorithmES256,
			// name: PUBLIC_APP_NAME + "-Passkey",
			publicKey: encodedPublicKey
		};
	} else if (authenticatorData.credential.publicKey.algorithm() === coseAlgorithmRS256) {
		let cosePublicKey: COSERSAPublicKey;
		try {
			cosePublicKey = authenticatorData.credential.publicKey.rsa();
		} catch {
			return fail(400, {
				message: 'Invalid data'
			});
		}
		const encodedPublicKey = new RSAPublicKey(cosePublicKey.n, cosePublicKey.e).encodePKCS1();
		credential = {
			id: authenticatorData.credential.id,
			userId: userId,
			algorithmId: coseAlgorithmRS256,
			// name: PUBLIC_APP_NAME + "-Passkey",
			publicKey: encodedPublicKey
		};
	} else {
		return fail(400, {
			message: 'Unsupported algorithm'
		});
	}

	// We don't have to worry about race conditions since queries are synchronous
	// const credentials = getUserPasskeyCredentials(event.locals.user.id);
	// if (credentials.length >= 5) {
	// 	return fail(400, {
	// 		message: "Too many credentials"
	// 	});
	// }

	console.log('sign-in/passkey/register/+page.server.ts \n credential: ', credential);

	try {
		const { access, refresh } = await signUpWithPasskey(credential, firstName, lastName, email);
		setAccessTokenCookie(event, access.secret!, access.ttl!.toDate());
		setRefreshTokenCookie(event, refresh.secret!, refresh.ttl!.toDate());
	} catch (error) {
		console.log('sign-in/passkey/register/+page.server.ts \n error: ', error);
		return fail(400, {
			message: 'Invalid data'
		});
	}
	// try {
	// 	createPasskeyCredential(credential);
	// } catch (e) {
	// 	if (e instanceof SqliteError && e.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
	// 		return fail(400, {
	// 			message: "Invalid data"
	// 		});
	// 	}
	// 	return fail(500, {
	// 		message: "Internal error"
	// 	});
	// }

	// if (!event.locals.session.twoFactorVerified) {
	// 	setSessionAs2FAVerified(event.locals.session.id);
	// }

	// if (!event.locals.user.registered2FA) {
	// 	return redirect(302, "/recovery-code");
	// }
	return redirect(302, '/');
}
