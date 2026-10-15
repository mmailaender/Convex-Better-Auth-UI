const packageVersion = 'package' as const;
const whenAdded = 'when-added' as const;
const manual = 'manual' as const;

export const betterAuthApiKeyDependency = {
	ecosystem: 'js' as const,
	name: '@better-auth/api-key',
	version: '1.6.16'
};

export const betterAuthDependency = {
	ecosystem: 'js' as const,
	name: 'better-auth',
	version: '1.6.16'
};

const sharedMeta = {
	description: 'Plug & Play Auth Widgets for your application',
	homepage: 'https://etesie.dev/docs/auth',
	bugs: 'https://github.com/mmailaender/Convex-Better-Auth-UI/issues',
	repository: 'https://github.com/mmailaender/Convex-Better-Auth-UI',
	version: packageVersion
};

export function createRegistryMeta(name: string, frameworkTag: string) {
	return {
		name,
		...sharedMeta,
		tags: ['auth', frameworkTag, 'ui', 'convex', 'better-auth']
	};
}

export function createConfigItem() {
	return {
		name: 'config',
		add: whenAdded,
		type: 'convex',
		files: [
			{
				path: 'src/convex/auth.ts',
				dependencyResolution: manual,
				dependencies: ['@convex-dev/better-auth', betterAuthDependency]
			},
			{
				path: 'src/convex/url.ts',
				dependencyResolution: manual,
				dependencies: [betterAuthDependency]
			},
			{
				path: 'src/convex/storage.ts',
				dependencyResolution: manual
			},
			{
				path: 'src/convex/auth.constants.dist.ts',
				target: 'src/convex/auth.constants.ts'
			},
			{
				path: 'src/convex/auth.constants.types.ts'
			}
		]
	};
}

export function createConvexBaseFiles(path = 'src/convex') {
	return {
		path,
		files: [
			{
				path: 'tsconfig.json'
			},
			{
				path: 'auth.config.ts'
			},
			{
				path: 'convex.config.ts'
			},
			{
				path: 'http.ts',
				dependencyResolution: manual
			},
			{
				path: 'polyfills.ts'
			},
			{
				path: 'schema.ts'
			},
			{
				path: 'migrations.ts',
				dependencyResolution: manual,
				dependencies: ['@convex-dev/migrations']
			},
			{
				path: 'betterAuth',
				files: [
					{
						path: 'adapter.ts'
					},
					{
						path: 'convex.config.ts'
					},
					{
						path: 'generatedSchema.ts'
					},
					{
						path: 'schema.ts'
					}
				]
			}
		]
	};
}

export function createThemesItem() {
	return {
		name: 'themes',
		add: whenAdded,
		type: 'themes',
		files: [
			{
				path: 'src/themes/auth.css'
			}
		]
	};
}

export function createUsersConvexItem() {
	return {
		name: 'users/convex',
		add: whenAdded,
		type: 'convex',
		files: [
			{
				path: 'src/convex/users',
				files: [
					{
						path: 'actions.ts',
						dependencyResolution: manual,
						dependencies: ['convex']
					},
					{
						path: 'mutations.ts',
						dependencyResolution: manual,
						dependencies: ['convex', betterAuthDependency]
					},
					{
						path: 'queries.ts',
						dependencyResolution: manual,
						dependencies: ['convex', betterAuthDependency]
					}
				]
			},
			{
				path: 'src/convex/betterAuth',
				files: [
					{
						path: 'user.ts',
						dependencyResolution: manual,
						dependencies: ['convex', 'convex-helpers']
					}
				]
			}
		]
	};
}

export function createOrganizationsConvexItem() {
	return {
		name: 'organizations/convex',
		add: whenAdded,
		type: 'convex',
		files: [
			{
				path: 'src/convex/organizations',
				files: [
					{
						path: 'mutations.ts',
						dependencyResolution: manual,
						dependencies: ['convex', betterAuthDependency]
					},
					{
						path: 'queries.ts',
						dependencyResolution: manual,
						dependencies: ['convex']
					},
					{
						path: 'invitations',
						files: [{ path: 'queries.ts', dependencyResolution: manual }]
					},
					{
						path: 'members',
						files: [
							{
								path: 'mutations.ts',
								dependencyResolution: manual,
								dependencies: ['convex', betterAuthDependency]
							}
						]
					}
				]
			},
			{
				path: 'src/convex/model',
				files: [
					{
						path: 'organizations',
						files: [
							{
								path: 'index.ts',
								dependencyResolution: manual,
								dependencies: ['convex', betterAuthDependency]
							}
						]
					}
				]
			},
			{
				path: 'src/convex/betterAuth',
				files: [
					{
						path: 'organization.ts',
						dependencyResolution: manual,
						dependencies: ['convex', 'convex-helpers']
					}
				]
			}
		]
	};
}

export function createAdminConvexItem() {
	return {
		name: 'admin/convex',
		add: whenAdded,
		type: 'convex',
		files: [
			{
				path: 'src/convex/admin',
				files: [
					{
						path: 'queries.ts',
						dependencyResolution: manual,
						dependencies: ['convex', betterAuthDependency]
					},
					{
						path: 'mutations.ts',
						dependencyResolution: manual,
						dependencies: ['convex', betterAuthDependency]
					}
				]
			},
			{
				path: 'src/convex/model',
				files: [
					{
						path: 'admin',
						files: [
							{
								path: 'index.ts',
								dependencyResolution: manual,
								dependencies: ['convex']
							}
						]
					}
				]
			},
			{
				path: 'src/convex/betterAuth',
				files: [
					{
						path: 'adminOrganizations.ts',
						dependencyResolution: manual,
						dependencies: ['convex', 'convex-helpers']
					}
				]
			}
		]
	};
}

export function createEmailConvexItem() {
	return {
		name: 'email/convex',
		add: whenAdded,
		type: 'convex',
		files: [
			{
				path: 'src/convex/email.ts',
				dependencyResolution: manual,
				dependencies: ['@convex-dev/resend']
			},
			{
				path: 'src/convex/model',
				files: [
					{
						path: 'emails',
						files: [
							{ path: 'validateEmail.ts', dependencyResolution: manual },
							{
								path: 'templates',
								files: [{ path: 'baseEmail.ts' }, { path: 'emailTemplates.ts' }]
							}
						]
					}
				]
			}
		]
	};
}

export function createDeviceAuthorizationConvexItem() {
	return {
		name: 'device-authorization/convex',
		add: whenAdded,
		type: 'convex',
		files: [
			{
				path: 'src/convex/deviceAuthorization.ts',
				dependencyResolution: manual,
				dependencies: ['convex', betterAuthDependency]
			}
		]
	};
}
