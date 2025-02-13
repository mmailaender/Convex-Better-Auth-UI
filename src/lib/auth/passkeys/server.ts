// import { decodeBase64, encodeBase64, encodeHexLowerCase } from "@oslojs/encoding";
// import sClient from "$lib/db/serverClient";
// import { fql } from "fauna";
// import type { WebAuthnUserCredential, WebAuthnUserCredentialEncoded } from "../api/types";

// const challengeBucket = new Set<string>();

// /**
//  * Creates a new WebAuthn challenge.
//  * A challenge is a unique random value sent to the client to ensure authenticity. The client signs this challenge using its private key, and the server verifies it.
//  *
//  * @returns {Uint8Array} The generated challenge as a Uint8Array.
//  */
// export function createWebAuthnChallenge(): Uint8Array {
// 	const challenge = new Uint8Array(20);
// 	crypto.getRandomValues(challenge);
// 	const encoded = encodeHexLowerCase(challenge);
// 	challengeBucket.add(encoded);
// 	return challenge;
// }

// /**
//  * Verifies a WebAuthn challenge by checking if it exists in the challenge bucket.
//  * This ensures that the challenge was created and not tampered with.
//  *
//  * @param {Uint8Array} challenge - The challenge to verify.
//  * @returns {boolean} True if the challenge is valid, false otherwise.
//  */
// export function verifyWebAuthnChallenge(challenge: Uint8Array): boolean {
// 	const encoded = encodeHexLowerCase(challenge);
// 	console.log("Verifying WebAuthn challenge:", encoded);
// 	return challengeBucket.delete(encoded);
// }

// /**
//  * Fetches a stored WebAuthn credential by its ID.
//  * Retrieves and decodes the credential from the database for use in WebAuthn operations.
//  *
//  * @param {Uint8Array} credentialId - The ID of the credential to fetch.
//  * @returns {Promise<WebAuthnUserCredential | null>} The credential if found, otherwise null.
//  */
// export async function getPasskeyCredential(credentialId: Uint8Array): Promise<WebAuthnUserCredential | null> {
// 	const response = await sClient.query<WebAuthnUserCredentialEncoded>(fql`getPasskeyCredential(${encodeBase64(credentialId)})`);

// 	if (response.data === null) {
// 		return null;
// 	}

// 	console.log("Fetched WebAuthn credential:", response.data);

// 	return {
// 		id: decodeBase64(response.data.id),
// 		userId: response.data.userId,
// 		algorithmId: response.data.algorithmId,
// 		publicKey: decodeBase64(response.data.publicKey)
// 	};
// }
