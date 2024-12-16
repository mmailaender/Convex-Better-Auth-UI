import { decodeBase64, encodeBase64, encodeHexLowerCase } from "@oslojs/encoding";
import { sClient } from "$lib/db/client";
import { fql } from "fauna";

const challengeBucket = new Set<string>();

export function createWebAuthnChallenge(): Uint8Array {
	const challenge = new Uint8Array(20);
	crypto.getRandomValues(challenge);
	const encoded = encodeHexLowerCase(challenge);
	challengeBucket.add(encoded);
	return challenge;
}

export function verifyWebAuthnChallenge(challenge: Uint8Array): boolean {
	const encoded = encodeHexLowerCase(challenge);
	return challengeBucket.delete(encoded);
}

export async function getPasskeyCredential(credentialId: Uint8Array): Promise<WebAuthnUserCredential | null> {
    const response = await sClient.query<WebAuthnUserCredentialEncoded>(fql`getPasskeyCredential(${encodeBase64(credentialId)})`);

	if (response.data === null) {
		return null;
	}

	console.log("\nserver/webauth.ts - getPasskeyCredential\n", "WebAuthnUserCredentialEncoded: ", response.data);
	
	const responseDecoded = {
		id: decodeBase64(response.data.id),
		userId: response.data.userId,
		algorithmId: response.data.algorithmId,
		publicKey: decodeBase64(response.data.publicKey)
	}

	console.log("\nserver/webauth.ts - getPasskeyCredential\n", "WebAuthnUserCredential: ", responseDecoded);

	return responseDecoded
}

// export function getPasskeyCredentialByToken(userId: number, credentialId: Uint8Array): WebAuthnUserCredential | null {
// 	const row = db.queryOne(
// 		"SELECT id, user_id, name, algorithm, public_key FROM passkey_credential WHERE id = ? AND user_id = ?",
// 		[credentialId, userId]
// 	);
// 	if (row === null) {
// 		return null;
// 	}
// 	const credential: WebAuthnUserCredential = {
// 		id: row.bytes(0),
// 		userId: row.number(1),
// 		name: row.string(2),
// 		algorithmId: row.number(3),
// 		publicKey: row.bytes(4)
// 	};
// 	return credential;
// }

// export function createPasskeyCredential(credential: WebAuthnUserCredential): void {
// 	const credentialId = encodeBase64(credential.id);
// 	const userId = credential.userId;
// 	const algorithmId = credential.algorithmId;
// 	const publicKey = encodeBase64(credential.publicKey);

// 	sClient.query(fql`signUpWithPasskey({ id: ${credentialId}, userId: ${userId}, algorithmId: ${algorithmId}, publicKey: ${publicKey} })`);
// 	// db.execute("INSERT INTO passkey_credential (id, user_id, name, algorithm, public_key) VALUES (?, ?, ?, ?, ?)", [
// 	// 	credential.id,
// 	// 	credential.userId,
// 	// 	credential.name,
// 	// 	credential.algorithmId,
// 	// 	credential.publicKey
// 	// ]);
// }

// export async function deletePasskeyCredential(accessToken: string): Promise<boolean> {
// 	const response = await uClient(accessToken).query<boolean>(fql`Query.identity().accounts.firstWhere(.provider == "Passkey").delete()`);
// 	return response.data;
// }

export interface WebAuthnUserCredential {
	id: Uint8Array;
	// id: string;
	userId: string;
	// name: string;
	algorithmId: number;
	publicKey: Uint8Array;
}

type WebAuthnUserCredentialEncoded = {
	id: string;
	userId: string;
	algorithmId: number;
	publicKey: string;
}