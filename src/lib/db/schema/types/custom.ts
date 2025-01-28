import type { TimeStub, DateStub, DocumentReference } from 'fauna';
import type { Document, Document_Create, Document_Replace, Document_Update } from './system';

type Account = {
  user: Document<User>;
  socialProvider: { name: "Github" | "Google" | "Facebook"; userId: string; email: string } | null;
  passkey: { publicKey: string; algorithmId: number; id: string } | null;
  _socialProviderName: string | null;
  _passkeyId: string | null;
};

type Account_Create = {
  user: Document_Create<User_Create>;
  socialProvider: { name: "Github" | "Google" | "Facebook"; userId: string; email: string } | null;
  passkey: { publicKey: string; algorithmId: number; id: string } | null;
};

type Account_Replace = {
  user: Document_Replace<User_Replace>;
  socialProvider: { name: "Github" | "Google" | "Facebook"; userId: string; email: string } | null;
  passkey: { publicKey: string; algorithmId: number; id: string } | null;
};

type Account_Update = Partial<{
  user: Document_Update<User_Update>;
  socialProvider: { name: "Github" | "Google" | "Facebook"; userId: string; email: string } | null;
  passkey: { publicKey: string; algorithmId: number; id: string } | null;
}>;

type User = {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  emails: Array<string>;
  avatar: string | null;
  accounts: Array<Document<Account>>;
  emailVerification: string | null;
};

type User_Create = {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  emails: Array<string>;
  avatar: string | null;
  accounts: Array<Document_Create<Account_Create>>;
};

type User_Replace = {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  emails: Array<string>;
  avatar: string | null;
  accounts: Array<Document_Replace<Account_Replace>>;
};

type User_Update = Partial<{
  firstName: string;
  lastName: string;
  primaryEmail: string;
  emails: Array<string>;
  avatar: string | null;
  accounts: Array<Document_Update<Account_Update>>;
}>;

type Verification = {
  email: string;
  otp: string;
  user: Document<User> | undefined;
};

type Verification_Create = {
  email: string;
  otp: string;
  user: Document_Create<User_Create> | undefined;
};

type Verification_Replace = {
  email: string;
  otp: string;
  user: Document_Replace<User_Replace> | undefined;
};

type Verification_Update = Partial<{
  email: string;
  otp: string;
  user: Document_Update<User_Update> | undefined;
}>;

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
  Account_Replace,
  Account_Update,
  User,
  User_Create,
  User_Replace,
  User_Update,
  Verification,
  Verification_Create,
  Verification_Replace,
  Verification_Update,
  UserCollectionsTypeMapping
};
