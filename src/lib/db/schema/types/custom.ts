import { type TimeStub, type DateStub, type DocumentReference } from 'fauna';

type Account = {
	user: User;
	socialProvider?: { name: "Github" | "Google" | "Facebook"; userId: string; email: string };
	passkey?: { publicKey: string; algorithmId: number; id: string };
};

type Account_Create = {
	user: User | DocumentReference;
	socialProvider?: { name: "Github" | "Google" | "Facebook"; userId: string; email: string };
	passkey?: { publicKey: string; algorithmId: number; id: string };
};
type Account_Replace = Account_Create;
type Account_Update = Partial<Account_Create>;

type Account_FaunaCreate = {
	user: DocumentReference;
	socialProvider?: { name: "Github" | "Google" | "Facebook"; userId: string; email: string };
	passkey?: { publicKey: string; algorithmId: number; id: string };
};
type Account_FaunaReplace = Account_FaunaCreate;
type Account_FaunaUpdate = Partial<Account_FaunaCreate>;

type User = {
	firstName: string;
	lastName: string;
	primaryEmail: string;
	emails: Array<string>;
	avatar?: string;
	accounts: Array<Account>;
	activeVerifications: Array<string>;
};

type User_Create = {
	firstName: string;
	lastName: string;
	primaryEmail: string;
	emails: Array<string>;
	avatar?: string;
	accounts: Array<Account | DocumentReference>;
};
type User_Replace = User_Create;
type User_Update = Partial<User_Create>;

type User_FaunaCreate = {
	firstName: string;
	lastName: string;
	primaryEmail: string;
	emails: Array<string>;
	avatar?: string;
	accounts: Array<DocumentReference>;
};
type User_FaunaReplace = User_FaunaCreate;
type User_FaunaUpdate = Partial<User_FaunaCreate>;

type Verification = {
	email: string;
	otp: string;
	user?: User;
};

type Verification_Create = {
	email: string;
	otp: string;
	user?: User | DocumentReference;
};
type Verification_Replace = Verification_Create;
type Verification_Update = Partial<Verification_Create>;

type Verification_FaunaCreate = {
	email: string;
	otp: string;
	user?: DocumentReference;
};
type Verification_FaunaReplace = Verification_FaunaCreate;
type Verification_FaunaUpdate = Partial<Verification_FaunaCreate>;

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
	Account_FaunaCreate,
	Account_FaunaUpdate,
	Account_FaunaReplace,
	User,
	User_Create,
	User_Update,
	User_Replace,
	User_FaunaCreate,
	User_FaunaUpdate,
	User_FaunaReplace,
	Verification,
	Verification_Create,
	Verification_Update,
	Verification_Replace,
	Verification_FaunaCreate,
	Verification_FaunaUpdate,
	Verification_FaunaReplace,
	UserCollectionsTypeMapping
};
