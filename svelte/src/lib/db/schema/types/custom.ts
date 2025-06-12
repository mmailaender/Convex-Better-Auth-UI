import { type TimeStub, type DateStub } from 'fauna';
import { v } from './system';

import { scope, type } from 'arktype';

const types = scope({
	account: [
		v.document.read,
		'&',
		{
			user: 'user',
			'socialProvider?': {
				name: "'Github' | 'Google' | 'Facebook'",
				userId: 'string',
				email: 'string'
			},
			'passkey?': { publicKey: 'string', algorithmId: 'number', id: 'string' },
			'_socialProviderName?': 'string',
			'_passkeyId?': 'string'
		}
	],
	user: [
		v.document.read,
		'&',
		{
			firstName: 'string',
			lastName: 'string',
			primaryEmail: 'string',
			emails: 'string[]',
			'avatar?': 'string',
			'activeOrganization?': 'organization',
			'organizations?': 'organization[]',
			accounts: 'account[]',
			'emailVerification?': 'string',
			roles: 'string[]'
		}
	],
	verification: [
		v.document.read,
		'&',
		{
			email: 'string',
			otp: 'string',
			'user?': 'user'
		}
	],
	organization: [
		v.document.read,
		'&',
		{
			name: 'string',
			'logo?': 'string',
			slug: 'string',
			members: [
				{
					user: 'user',
					role: "'role_organization_member' | 'role_organization_admin' | 'role_organization_owner'"
				},
				'[]'
			],
			plan: "'Free' | 'Pro' | 'Enterprise'",
			invitations: 'invitation[]'
		}
	],
	invitation: [
		v.document.read,
		'&',
		{
			invitedBy: 'user',
			organization: 'organization',
			email: 'string',
			role: "'role_organization_member' | 'role_organization_admin' | 'role_organization_owner'"
		}
	],
	roleCheck: [
		v.document.read,
		'&',
		{
			name: 'string'
		}
	]
}).export();

const types_create = scope({
	account: [
		v.document.create,
		'&',
		{
			user: v.createRef(type("'User'")),
			'socialProvider?': {
				name: "'Github' | 'Google' | 'Facebook'",
				userId: 'string',
				email: 'string'
			},
			'passkey?': { publicKey: 'string', algorithmId: 'number', id: 'string' }
		}
	],
	user: [
		v.document.create,
		'&',
		{
			firstName: 'string',
			lastName: 'string',
			primaryEmail: 'string',
			emails: 'string[]',
			'avatar?': 'string',
			'activeOrganization?': v.createRef(type("'Organization'")),
			'organizations?': v.createRef(type("'Organization'")).array(),
			accounts: v.createRef(type("'Account'")).array()
		}
	],
	verification: [
		v.document.create,
		'&',
		{
			email: 'string',
			otp: 'string',
			'user?': v.createRef(type("'User'"))
		}
	],
	organization: [
		v.document.create,
		'&',
		{
			name: 'string',
			'logo?': 'string',
			slug: 'string',
			members: [
				{
					user: v.createRef(type("'User'")),
					role: "'role_organization_member' | 'role_organization_admin' | 'role_organization_owner'"
				},
				'[]'
			],
			plan: "'Free' | 'Pro' | 'Enterprise'"
		}
	],
	invitation: [
		v.document.create,
		'&',
		{
			invitedBy: v.createRef(type("'User'")),
			organization: v.createRef(type("'Organization'")),
			email: 'string',
			role: "'role_organization_member' | 'role_organization_admin' | 'role_organization_owner'"
		}
	],
	roleCheck: [
		v.document.create,
		'&',
		{
			name: 'string'
		}
	]
}).export();

const types_update = scope({
	account: [
		v.document.update,
		'&',
		{
			'user?': v.createRef(type("'User'")),
			'socialProvider?': {
				name: "'Github' | 'Google' | 'Facebook'",
				userId: 'string',
				email: 'string'
			},
			'passkey?': { publicKey: 'string', algorithmId: 'number', id: 'string' }
		}
	],
	user: [
		v.document.update,
		'&',
		{
			'firstName?': 'string',
			'lastName?': 'string',
			'primaryEmail?': 'string',
			'emails?': 'string[]',
			'avatar?': 'string',
			'activeOrganization?': v.createRef(type("'Organization'")),
			'organizations?': v.createRef(type("'Organization'")).array(),
			'accounts?': v.createRef(type("'Account'")).array()
		}
	],
	verification: [
		v.document.update,
		'&',
		{
			'email?': 'string',
			'otp?': 'string',
			'user?': v.createRef(type("'User'"))
		}
	],
	organization: [
		v.document.update,
		'&',
		{
			'name?': 'string',
			'logo?': 'string',
			'slug?': 'string',
			'members?': [
				{
					user: v.createRef(type("'User'")),
					role: "'role_organization_member' | 'role_organization_admin' | 'role_organization_owner'"
				},
				'[]'
			],
			'plan?': "'Free' | 'Pro' | 'Enterprise'"
		}
	],
	invitation: [
		v.document.update,
		'&',
		{
			'invitedBy?': v.createRef(type("'User'")),
			'organization?': v.createRef(type("'Organization'")),
			'email?': 'string',
			'role?': "'role_organization_member' | 'role_organization_admin' | 'role_organization_owner'"
		}
	],
	roleCheck: [
		v.document.update,
		'&',
		{
			'name?': 'string'
		}
	]
}).export();

const types_replace = scope({
	account: [
		v.document.replace,
		'&',
		{
			user: v.createRef(type("'User'")),
			'socialProvider?': {
				name: "'Github' | 'Google' | 'Facebook'",
				userId: 'string',
				email: 'string'
			},
			'passkey?': { publicKey: 'string', algorithmId: 'number', id: 'string' }
		}
	],
	user: [
		v.document.replace,
		'&',
		{
			firstName: 'string',
			lastName: 'string',
			primaryEmail: 'string',
			emails: 'string[]',
			'avatar?': 'string',
			'activeOrganization?': v.createRef(type("'Organization'")),
			'organizations?': v.createRef(type("'Organization'")).array(),
			accounts: v.createRef(type("'Account'")).array()
		}
	],
	verification: [
		v.document.replace,
		'&',
		{
			email: 'string',
			otp: 'string',
			'user?': v.createRef(type("'User'"))
		}
	],
	organization: [
		v.document.replace,
		'&',
		{
			name: 'string',
			'logo?': 'string',
			slug: 'string',
			members: [
				{
					user: v.createRef(type("'User'")),
					role: "'role_organization_member' | 'role_organization_admin' | 'role_organization_owner'"
				},
				'[]'
			],
			plan: "'Free' | 'Pro' | 'Enterprise'"
		}
	],
	invitation: [
		v.document.replace,
		'&',
		{
			invitedBy: v.createRef(type("'User'")),
			organization: v.createRef(type("'Organization'")),
			email: 'string',
			role: "'role_organization_member' | 'role_organization_admin' | 'role_organization_owner'"
		}
	],
	roleCheck: [
		v.document.replace,
		'&',
		{
			name: 'string'
		}
	]
}).export();

type Account = typeof types.account.infer;
type Account_Create = typeof types_create.account.infer;
type Account_Update = typeof types_update.account.infer;
type Account_Replace = typeof types_replace.account.infer;

type User = typeof types.user.infer;
type User_Create = typeof types_create.user.infer;
type User_Update = typeof types_update.user.infer;
type User_Replace = typeof types_replace.user.infer;

type Verification = typeof types.verification.infer;
type Verification_Create = typeof types_create.verification.infer;
type Verification_Update = typeof types_update.verification.infer;
type Verification_Replace = typeof types_replace.verification.infer;

type Organization = typeof types.organization.infer;
type Organization_Create = typeof types_create.organization.infer;
type Organization_Update = typeof types_update.organization.infer;
type Organization_Replace = typeof types_replace.organization.infer;

type Invitation = typeof types.invitation.infer;
type Invitation_Create = typeof types_create.invitation.infer;
type Invitation_Update = typeof types_update.invitation.infer;
type Invitation_Replace = typeof types_replace.invitation.infer;

type RoleCheck = typeof types.roleCheck.infer;
type RoleCheck_Create = typeof types_create.roleCheck.infer;
type RoleCheck_Update = typeof types_update.roleCheck.infer;
type RoleCheck_Replace = typeof types_replace.roleCheck.infer;

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

	Organization: {
		main: Organization;
		create: Organization_Create;
		replace: Organization_Replace;
		update: Organization_Update;
	};

	Invitation: {
		main: Invitation;
		create: Invitation_Create;
		replace: Invitation_Replace;
		update: Invitation_Update;
	};

	RoleCheck: {
		main: RoleCheck;
		create: RoleCheck_Create;
		replace: RoleCheck_Replace;
		update: RoleCheck_Update;
	};
}

const validator = {
	account: {
		read: types.account,
		create: types_create.account,
		update: types_update.account,
		replace: types_replace.account
	},
	user: {
		read: types.user,
		create: types_create.user,
		update: types_update.user,
		replace: types_replace.user
	},
	verification: {
		read: types.verification,
		create: types_create.verification,
		update: types_update.verification,
		replace: types_replace.verification
	},
	organization: {
		read: types.organization,
		create: types_create.organization,
		update: types_update.organization,
		replace: types_replace.organization
	},
	invitation: {
		read: types.invitation,
		create: types_create.invitation,
		update: types_update.invitation,
		replace: types_replace.invitation
	},
	roleCheck: {
		read: types.roleCheck,
		create: types_create.roleCheck,
		update: types_update.roleCheck,
		replace: types_replace.roleCheck
	}
};

export type {
	validator,
	validator as v,
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
	Organization,
	Organization_Create,
	Organization_Replace,
	Organization_Update,
	Invitation,
	Invitation_Create,
	Invitation_Replace,
	Invitation_Update,
	RoleCheck,
	RoleCheck_Create,
	RoleCheck_Replace,
	RoleCheck_Update,
	UserCollectionsTypeMapping
};
