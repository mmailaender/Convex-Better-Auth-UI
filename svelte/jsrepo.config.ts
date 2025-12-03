import { defineConfig } from 'jsrepo';
import { repository } from 'jsrepo/outputs';
import { fs } from 'jsrepo/providers';

export default defineConfig({
	providers: [fs()],
	registry: {
		name: '@auth/svelte',
		description: 'Plug & Play Auth Widgets for your application',
		homepage: 'https://etesie.dev/docs/auth',
		authors: undefined,
		bugs: 'https://github.com/mmailaender/auth/issues',
		repository: 'https://github.com/mmailaender/auth',
		tags: ['auth', 'svelte', 'ui', 'convex', 'better-auth'],
		version: 'package',
		access: undefined,
		defaultPaths: {
			base: './',
			convex: './src/convex',
			lib: './src/lib',
			routes: './src/routes',
			themes: './src/themes'
		},
		excludeDeps: ['svelte', '@sveltejs/kit'],
		outputs: [repository({ format: true })],
		items: [
			{
				name: 'base',
				add: 'when-added',
				type: 'base',
				files: [
					{ path: 'convex.json', target: 'convex.json' },
					{ path: 'svelte.config.js', target: 'svelte.config.js' },
					{
						path: 'src',
						files: [
							{
								path: 'app.css',
								dependencyResolution: 'manual',
								devDependencies: ['@skeletonlabs/skeleton', 'tw-animate-css', '@types/node']
							},
							{ path: 'app.html' },
							{ path: 'app.d.ts' },
							{ path: 'hooks.server.ts' },
							{
								path: 'routes',
								files: [{ path: '+layout.svelte' }, { path: '+layout.server.ts' }]
							},
							{
								path: 'convex',
								files: [
									{
										path: 'auth.constants.ts'
									},
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
										path: 'http.ts'
									},
									{
										path: 'polyfills.ts'
									},
									{
										path: 'schema.ts'
									},
									{
										path: '_generated'
									},
									{
										path: 'betterAuth',
										files: [
											{
												path: '_generated'
											},
											{
												path: 'adapter.ts'
											},
											{
												path: 'auth.ts'
											},
											{
												path: 'convex.config.ts'
											},
											{
												path: 'schema.ts'
											}
										]
									}
								]
							}
						]
					}
				]
			},
			{
				name: 'config',
				add: 'when-added',
				type: 'base',
				files: [
					{
						path: 'src',
						files: [
							{
								path: 'convex',
								files: [
									{ path: 'auth.ts' },
									{ path: 'storage.ts' },
									{ path: 'auth.constants.types.ts' }
								]
							}
						]
					}
				]
			},
			{
				name: 'routes/api',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/api',
						files: [
							{
								path: 'auth/[...all]/+server.ts'
							},
							{
								path: 'organization/accept-invitation/[invitationId]/+page.svelte'
							}
						]
					}
				]
			},
			{
				name: 'lib/auth',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/auth'
					}
				]
			},
			{
				name: 'routes/reset-password',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/reset-password',
						files: [
							{
								path: '+page.svelte'
							}
						]
					}
				]
			},
			{
				name: 'routes/signin',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/signin',
						files: [
							{
								path: '+page.svelte'
							}
						]
					}
				]
			},

			{
				name: 'convex/users',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/users'
					},
					{
						path: 'src/convex/betterAuth',
						files: [
							{
								path: 'user.ts'
							}
						]
					}
				]
			},
			{
				name: 'lib/users',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/users'
					}
				]
			},
			{
				name: 'convex/email',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/email.ts'
					},
					{
						path: 'src/convex/model',
						files: [
							{
								path: 'emails'
							}
						]
					}
				]
			},
			{
				name: 'convex/organizations',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/organizations'
					},
					{
						path: 'src/convex/model',
						files: [
							{
								path: 'organizations'
							}
						]
					},
					{
						path: 'src/convex/betterAuth',
						files: [
							{
								path: 'organization.ts'
							}
						]
					}
				]
			},
			{
				name: 'lib/organizations',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/organizations'
					}
				]
			},

			{
				name: 'convex/deviceAuthorization',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/deviceAuthorization.ts'
					}
				]
			},
			{
				name: 'routes/device-authorization',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/device-authorization',
						files: [
							{
								path: '[code]/+page.svelte'
							}
						]
					}
				]
			},

			{
				name: 'primitives',
				add: 'when-needed',
				type: 'lib',
				files: [
					{
						path: 'src/lib/primitives'
					}
				]
			},

			{
				name: 'themes',
				add: 'when-added',
				type: 'themes',
				files: [
					{
						path: 'src/themes/auth.css'
					}
				]
			}
		]
	}
});
