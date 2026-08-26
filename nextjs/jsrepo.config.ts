import { defineConfig } from 'jsrepo';
import { repository } from 'jsrepo/outputs';
import { fs, jsrepo } from 'jsrepo/providers';
import {
	betterAuthApiKeyDependency,
	betterAuthDependency,
	createConfigItem,
	createConvexBaseFiles,
	createDeviceAuthorizationConvexItem,
	createEmailConvexItem,
	createOrganizationsConvexItem,
	createRegistryMeta,
	createThemesItem,
	createUsersConvexItem
} from '../registry/shared';

const reactSimpleIconsDependency = {
	ecosystem: 'js' as const,
	name: '@icons-pack/react-simple-icons',
	version: '13.7.0'
};

export default defineConfig({
	providers: [fs(), jsrepo()],
	registry: {
		...createRegistryMeta('@auth/nextjs', 'nextjs'),
		defaultPaths: {
			app: '@/app',
			base: './',
			components: '@/components',
			convex: './src/convex',
			lib: '@/lib',
			themes: '@/themes',
			types: '@/types'
		},
		excludeDeps: ['next', 'react', 'react-dom'],
		outputs: [repository({ format: true })],
		items: [
			// ── Base & config ────────────────────────────────────────────────
			createConfigItem(),
			{
				name: 'base',
				add: 'when-added',
				type: 'base',
				dependencyResolution: 'manual',
				registryDependencies: ['config'],
				dependencies: ['@convex-dev/better-auth', 'convex', 'sonner'],
				devDependencies: [
					'@skeletonlabs/skeleton',
					'@tailwindcss/forms',
					'@types/node',
					'tailwindcss',
					'tw-animate-css'
				],
				files: [
					{ path: 'convex.dist.json', target: 'convex.json' },
					{ path: 'components.json' },
					{ path: 'next.config.mjs' },
					{ path: 'postcss.config.mjs' },
					{
						path: 'src',
						files: [
							{ path: 'proxy.ts' },
							{
								path: 'app',
								files: [
									{ path: 'ConvexClientProvider.tsx' },
									{ path: 'globals.css' },
									{ path: 'layout.tsx' },
									{ path: 'page.tsx' }
								]
							},
							{
								path: 'types',
								files: [{ path: 'react-html-attributes.d.ts' }]
							},
							createConvexBaseFiles('convex')
						]
					}
				]
			},
			{
				name: 'primitives',
				add: 'when-needed',
				type: 'components',
				dependencyResolution: 'manual',
				dependencies: [
					'@ark-ui/react',
					'@zxcvbn-ts/core',
					'@zxcvbn-ts/language-common',
					'@zxcvbn-ts/language-en',
					'clsx',
					'convex',
					'lucide-react',
					'path-to-regexp',
					'react-easy-crop',
					'sonner',
					'tailwind-merge'
				],
				files: [
					{
						path: 'src/components/primitives'
					},
					{
						path: 'src/lib/utils.ts',
						target: 'src/lib/utils.ts'
					}
				]
			},
			createThemesItem(),

			// ── Auth ─────────────────────────────────────────────────────────
			{
				name: 'auth/lib',
				add: 'when-added',
				type: 'lib',
				dependencyResolution: 'manual',
				registryDependencies: ['config', 'primitives'],
				dependencies: [
					betterAuthApiKeyDependency,
					'@convex-dev/better-auth',
					reactSimpleIconsDependency,
					betterAuthDependency,
					'convex',
					'lucide-react',
					'sonner'
				],
				files: [
					{
						path: 'src/lib/auth',
						files: [
							{ path: 'hooks.ts' },
							{ path: 'initial-data.tsx' },
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
									},
									{
										path: 'auth.ts',
										dependencyResolution: 'manual',
										registryDependencies: ['config']
									},
									{
										path: 'server.ts',
										dependencyResolution: 'manual',
										dependencies: ['@convex-dev/better-auth']
									}
								]
							},
							{
								path: 'utils',
								files: [{ path: 'safeRedirect.ts' }, { path: 'signInRedirect.ts' }]
							}
						]
					},
					{
						path: 'src/components/auth',
						target: 'src/components/auth'
					}
				]
			},
			{
				name: 'auth/routes',
				add: 'when-added',
				type: 'routes',
				dependencyResolution: 'manual',
				registryDependencies: ['auth/lib'],
				files: [
					{
						path: 'src/app/api/auth/[[]...all[]]/route.ts',
						target: 'src/app/api/auth/[...all]/route.ts'
					},
					{
						path: 'src/app/signin/page.tsx',
						target: 'src/app/signin/page.tsx'
					},
					{
						path: 'src/app/reset-password/page.tsx',
						target: 'src/app/reset-password/page.tsx'
					}
				]
			},

			// ── Users ────────────────────────────────────────────────────────
			createUsersConvexItem(),
			{
				name: 'users/lib',
				add: 'when-added',
				type: 'components',
				dependencyResolution: 'manual',
				registryDependencies: ['auth/lib', 'primitives'],
				dependencies: [
					'@ark-ui/react',
					'@convex-dev/better-auth',
					reactSimpleIconsDependency,
					betterAuthDependency,
					'convex',
					'lucide-react',
					'sonner'
				],
				files: [
					{
						path: 'src/components/users'
					}
				]
			},

			// ── Organizations ────────────────────────────────────────────────
			createOrganizationsConvexItem(),
			{
				name: 'organizations/lib',
				add: 'when-added',
				type: 'components',
				dependencyResolution: 'manual',
				registryDependencies: ['auth/lib', 'primitives'],
				dependencies: [
					'@ark-ui/react',
					'@convex-dev/better-auth',
					betterAuthDependency,
					'convex',
					'lucide-react',
					'sonner'
				],
				files: [
					{
						path: 'src/components/organizations'
					}
				]
			},
			{
				name: 'organizations/routes',
				add: 'when-added',
				type: 'routes',
				dependencyResolution: 'manual',
				registryDependencies: ['auth/lib', 'organizations/lib', 'organizations/convex'],
				files: [
					{
						path: 'src/app/active-organization/[[][[]...all[]][]]/page.tsx',
						target: 'src/app/active-organization/[[...all]]/page.tsx'
					},
					{
						path: 'src/app/api/organization/accept-invitation/[[]invitationId[]]/page.tsx',
						target: 'src/app/api/organization/accept-invitation/[invitationId]/page.tsx'
					},
					{
						path: 'src/app/organization/create/page.tsx',
						target: 'src/app/organization/create/page.tsx'
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
						path: 'src/app/device-authorization/[[]code[]]/page.tsx',
						target: 'src/app/device-authorization/[code]/page.tsx',
						dependencyResolution: 'manual',
						registryDependencies: ['auth/lib', 'config']
					}
				]
			}
		]
	}
});
