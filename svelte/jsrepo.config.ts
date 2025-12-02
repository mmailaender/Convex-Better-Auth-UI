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
			convex: './src/convex',
			lib: './src/lib',
			routes: './src/routes',
			themes: './src/themes'
		},
		excludeDeps: ['svelte', '@sveltejs/kit'],
		outputs: [repository({ format: true })],
		items: [
			{
				name: 'convex/users',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/users'
					},
					{
						path: 'src/convex/betterAuth/user.ts'
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
						path: 'src/convex/model/organizations'
					},
					{
						path: 'src/convex/betterAuth/organization.ts'
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
						path: 'src/convex/model/emails'
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
				name: 'convex/config',
				add: 'when-added',
				type: 'convex',
				files: [
					{
						path: 'src/convex/auth.ts'
					},
					{
						path: 'src/convex/storage.ts'
					},
					{
						path: 'src/convex/auth.constants.types.ts'
					},
					// From here all paths are mainly set-up and then never updated from us.
					{
						path: 'src/convex/auth.constants.ts'
					},
					{
						path: 'src/convex/tsconfig.json'
					},
					{
						path: 'src/convex/auth.config.ts'
					},
					{
						path: 'src/convex/convex.config.ts'
					},
					{
						path: 'src/convex/http.ts'
					},
					{
						path: 'src/convex/polyfills.ts'
					},
					{
						path: 'src/convex/schema.ts'
					},
					{
						path: 'src/convex/betterAuth',
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
					},
					{
						path: 'src/convex/_generated'
					}
				]
			},

			{
				name: 'auth',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/auth'
					}
				]
			},
			{
				name: 'organizations',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/organizations'
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
				name: 'users',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/users'
					}
				]
			},
			{
				name: 'api',
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
				name: 'device-authorization',
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
				name: 'reset-password',
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
				name: 'signin',
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
				name: 'auth-theme',
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
