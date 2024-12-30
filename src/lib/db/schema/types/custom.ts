import { type TimeStub, type DateStub, type DocumentReference } from 'fauna';

type Account = {
	user: User;
	provider: "Github" | "Google" | "Facebook" | "Passkey";
	providerAccountId: string | null;
	publicKey: string | null;
	algorithmId: number | null;
	passkeyId: string | null;
};

type Account_Create = {
	user: User | DocumentReference;
	provider: "Github" | "Google" | "Facebook" | "Passkey";
	providerAccountId: string | null;
	publicKey: string | null;
	algorithmId: number | null;
	passkeyId: string | null;
};
type Account_Replace = Account_Create;
type Account_Update = Partial<Account_Create>;

type Account_FaunaCreate = {
	user: DocumentReference;
	provider: "Github" | "Google" | "Facebook" | "Passkey";
	providerAccountId: string | null;
	publicKey: string | null;
	algorithmId: number | null;
	passkeyId: string | null;
};
type Account_FaunaReplace = Account_FaunaCreate;
type Account_FaunaUpdate = Partial<Account_FaunaCreate>;

type User = {
	firstName: string;
	lastName: string;
	email: string;
	image: string | null;
	accounts: Array<Account>;
};

type User_Create = {
	firstName: string;
	lastName: string;
	email: string;
	image: string | null;
	accounts: Array<Account | DocumentReference>;
};
type User_Replace = User_Create;
type User_Update = Partial<User_Create>;

type User_FaunaCreate = {
	firstName: string;
	lastName: string;
	email: string;
	image: string | null;
	accounts: Array<DocumentReference>;
};
type User_FaunaReplace = User_FaunaCreate;
type User_FaunaUpdate = Partial<User_FaunaCreate>;

type Registration = {
	email: string;
	otp: string;
};

type Registration_Create = {
	email: string;
	otp: string;
};
type Registration_Replace = Registration_Create;
type Registration_Update = Partial<Registration_Create>;

type Registration_FaunaCreate = {
	email: string;
	otp: string;
};
type Registration_FaunaReplace = Registration_FaunaCreate;
type Registration_FaunaUpdate = Partial<Registration_FaunaCreate>;

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
	Registration: {
		main: Registration;
		create: Registration_Create;
		replace: Registration_Replace;
		update: Registration_Update;
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
	Registration,
	Registration_Create,
	Registration_Update,
	Registration_Replace,
	Registration_FaunaCreate,
	Registration_FaunaUpdate,
	Registration_FaunaReplace,
	UserCollectionsTypeMapping
};
