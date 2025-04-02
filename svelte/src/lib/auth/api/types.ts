import type { User } from "$lib/db/schema/types/custom";
import type { DocumentT } from "$lib/db/schema/types/system";

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

export type Tokens = {
	access: DocumentT<AccessToken>;
	refresh: DocumentT<RefreshToken>;
};

export type AccessToken = {
	document: User;
	secret: string | null;
	data: {
		type: 'access';
		refresh: RefreshToken;
	};
};

export type RefreshToken = {
	document: User;
	secret: string | null;
	data: {
		type: 'refresh';
	};
};