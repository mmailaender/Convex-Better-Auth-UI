import { defineConfig } from 'jsrepo';
import { repository } from 'jsrepo/outputs';
import { fs, jsrepo } from 'jsrepo/providers';
import {
	betterAuthApiKeyDependency,
	betterAuthDependency,
	createAdminConvexItem,
	createConfigItem,
	createConvexBaseFiles,
	createDeviceAuthorizationConvexItem,
	createEmailConvexItem,
	createOrganizationsConvexItem,
	createRegistryMeta,
	createThemesItem,
	createUsersConvexItem
} from '../registry/shared';

export default defineConfig({
	providers: [fs(), jsrepo()],
	registry: {
		...createRegistryMeta('@auth/svelte', 'svelte'),
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
			// ── Base & config ────────────────────────────────────────────────
			createConfigItem(),
			{
				name: 'base',
				add: 'when-added',
				type: 'base',
				files: [
					{ path: 'convex.dist.json', target: 'convex.json' },
					{
						path: 'vite.config.dist.ts',
						target: 'vite.config.ts'
					},
					{
						path: 'src',
						files: [
							{ path: 'app.html' },
							{ path: 'app.d.ts' },
							{ path: 'env.ts' },
							{ path: 'hooks.ts' },
							{
								path: 'routes',
								files: [
									{
										path: '+layout.svelte',
										dependencyResolution: 'manual',
										dependencies: ['@mmailaender/convex-better-auth-svelte']
									},
									{
										path: 'layout.css',
										dependencyResolution: 'manual',
										devDependencies: [
											'@skeletonlabs/skeleton',
											'tw-animate-css',
											'@types/node',
											'svelte-sonner'
										]
									}
								]
							},
							{
								path: 'lib',
								files: [
									{
										path: 'assets'
									}
								]
							},
							createConvexBaseFiles('convex')
						]
					}
				]
			},
			{
				name: 'base/ssr',
				add: 'when-added',
				type: 'base',
				files: [
					{
						path: 'src',
						files: [
							{ path: 'hooks.server.ts' },
							{
								path: 'routes',
								files: [
									{
										path: '+layout.server.ts',
										dependencyResolution: 'manual',
										dependencies: ['@mmailaender/convex-better-auth-svelte']
									}
								]
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
						path: 'src/lib/primitives',
						files: [
							{ path: 'hooks' },
							{ path: 'ui' },
							{ path: 'utils.ts' },
							{
								path: 'utils',
								files: [
									{ path: 'dragState.svelte.ts' },
									{ path: 'focusScroll.ts' },
									{ path: 'mobileState.svelte.ts' },
									{ path: 'navigation.ts' },
									{ path: 'navigation.test.ts', role: 'test' },
									{ path: 'optimizeImage.ts' },
									{ path: 'routeMatcher.ts' }
								]
							}
						]
					}
				]
			},
			createThemesItem(),

			// ── Auth ─────────────────────────────────────────────────────────
			{
				name: 'auth/lib',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/auth',
						files: [
							{ path: 'context.svelte.ts' },
							{
								path: 'types.ts',
								dependencyResolution: 'manual',
								dependencies: ['convex']
							},
							{
								path: 'api',
								files: [
									{
										path: 'auth-client.ts',
										dependencyResolution: 'manual',
										registryDependencies: ['config'],
										dependencies: [
											betterAuthApiKeyDependency,
											'@convex-dev/better-auth',
											betterAuthDependency
										]
									}
								]
							},
							{
								path: 'ui'
							},
							{
								path: 'utils',
								files: [{ path: 'safeRedirect.ts' }, { path: 'signInRedirect.ts' }]
							}
						]
					}
				]
			},
			{
				name: 'auth/routes',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/**/auth/*/+server.ts'
					},
					{
						path: 'src/routes/*/signin/+page.svelte'
					},
					{
						path: 'src/routes/*/reset-password/+page.svelte'
					}
				]
			},

			// ── Users ────────────────────────────────────────────────────────
			createUsersConvexItem(),
			{
				name: 'users/lib',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/users'
					}
				]
			},

			// ── Organizations ────────────────────────────────────────────────
			createOrganizationsConvexItem(),
			{
				name: 'organizations/lib',
				add: 'when-added',
				type: 'lib',
				files: [
					{
						path: 'src/lib/organizations'
					}
				]
			},
			{
				name: 'organizations/routes',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/**/accept-invitation/*/+page.svelte'
					}
				]
			},

			// ── Admin ────────────────────────────────────────────────────────
			createAdminConvexItem(),
			{
				name: 'admin/lib',
				add: 'when-added',
				type: 'lib',
				registryDependencies: ['config', 'auth/lib', 'primitives', 'users/lib', 'admin/convex'],
				files: [
					{
						path: 'src/lib/admin',
						files: [
							{ path: 'api' },
							{
								path: 'types.ts',
								dependencyResolution: 'manual',
								dependencies: ['convex']
							},
							{ path: 'ui' },
							{ path: 'utils' }
						]
					}
				]
			},
			{
				name: 'admin/routes',
				add: 'when-added',
				type: 'routes',
				registryDependencies: ['config', 'auth/lib', 'admin/lib'],
				files: [
					{
						path: 'src/routes/admin/+page.svelte'
					}
				]
			},

			// ── Email ────────────────────────────────────────────────────────
			createEmailConvexItem(),

			// ── Device Authorization ─────────────────────────────────────────
			createDeviceAuthorizationConvexItem(),
			{
				name: 'device-authorization/routes',
				add: 'when-added',
				type: 'routes',
				files: [
					{
						path: 'src/routes/*/device/+page.svelte',
						dependencyResolution: 'manual',
						registryDependencies: ['auth/lib', 'config']
					}
				]
			}
		]
	}
});
