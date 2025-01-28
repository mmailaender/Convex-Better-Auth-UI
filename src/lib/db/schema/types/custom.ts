import { type TimeStub, type DateStub, type DocumentReference } from 'fauna';

type Account = {
	user: User;
	socialProvider?: { name: "Github" | "Google" | "Facebook"; userId: string; email: string };
	passkey?: { publicKey: string; algorithmId: number; id: string };
	_socialProviderName?: string;
	_passkeyId?: string;
};

type Account_Create = {
	user: DocumentReference;
	socialProvider?: { name: "Github" | "Google" | "Facebook"; userId: string; email: string };
	passkey?: { publicKey: string; algorithmId: number; id: string };
};
type Account_Replace = Account_Create;
type Account_Update = Partial<Account_Create>;

type User = {
	firstName: string;
	lastName: string;
	primaryEmail: string;
	emails: Array<string>;
	avatar?: string;
	accounts: Array<Account>;
	emailVerification?: string;
};

type User_Create = {
	firstName: string;
	lastName: string;
	primaryEmail: string;
	emails: Array<string>;
	avatar?: string;
	accounts: Array<DocumentReference>;
};
type User_Replace = User_Create;
type User_Update = Partial<User_Create>;

type Verification = {
	email: string;
	otp: string;
	user?: User;
};

type Verification_Create = {
	email: string;
	otp: string;
	user?: DocumentReference;
};
type Verification_Replace = Verification_Create;
type Verification_Update = Partial<Verification_Create>;

interface UserCollectionsTypeMapping {
	Account: {
		main: Account;
		create: Account_Create;
		replace: Account_Replace;
		update: Account_Update;
	};
	User: {
		main: User;
		create: User_Create;
		replace: User_Replace;
		update: User_Update;
	};
	Verification: {
		main: Verification;
		create: Verification_Create;
		replace: Verification_Replace;
		update: Verification_Update;
	};
}

export type {
	Account,
	Account_Create,
	Account_Update,
	Account_Replace,
	User,
	User_Create,
	User_Update,
	User_Replace,
	Verification,
	Verification_Create,
	Verification_Update,
	Verification_Replace,
	UserCollectionsTypeMapping
};
