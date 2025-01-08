export interface WebAuthnUserCredential {
	id: Uint8Array;
	userId: string;
	algorithmId: number;
	publicKey: Uint8Array;
	otp?: string;
}

export type WebAuthnUserCredentialEncoded = {
	id: string;
	userId: string;
	algorithmId: number;
	publicKey: string;
	otp?: string;
}