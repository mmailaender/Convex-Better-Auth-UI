
import { type TimeStub, type DateStub, type DocumentReference } from 'fauna';
import type { Document, Document_Create, Document_Update, Document_Replace } from './system';

type Account = {
  user: Document<User>;
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

type Account_Replace = {
  user: DocumentReference;
  socialProvider?: { name: "Github" | "Google" | "Facebook"; userId: string; email: string };
  passkey?: { publicKey: string; algorithmId: number; id: string };
};

type Account_Update = Partial<{
  user: DocumentReference;
  socialProvider?: { name: "Github" | "Google" | "Facebook"; userId: string; email: string };
  passkey?: { publicKey: string; algorithmId: number; id: string };
}>;

type User = {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  emails: Array<string>;
  avatar?: string;
  accounts: Array<Document<Account>>;
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

type User_Replace = {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  emails: Array<string>;
  avatar?: string;
  accounts: Array<DocumentReference>;
};

type User_Update = Partial<{
  firstName: string;
  lastName: string;
  primaryEmail: string;
  emails: Array<string>;
  avatar?: string;
  accounts: Array<DocumentReference>;
}>;

type Verification = {
  email: string;
  otp: string;
  user?: Document<User>;
};

type Verification_Create = {
  email: string;
  otp: string;
  user?: DocumentReference;
};

type Verification_Replace = {
  email: string;
  otp: string;
  user?: DocumentReference;
};

type Verification_Update = Partial<{
  email: string;
  otp: string;
  user?: DocumentReference;
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
