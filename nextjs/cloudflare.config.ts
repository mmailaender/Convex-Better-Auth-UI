import { bindings, defineConfig, defineWorker } from 'cf/config';

export default defineConfig({
	worker: defineWorker({
		name: 'convex-better-auth-ui-nextjs',
		entrypoint: 'vinext/server/fetch-handler',
		compatibilityDate: '2026-10-28',
		compatibilityFlags: ['nodejs_compat'],
		assets: {
			htmlHandling: 'none',
			notFoundHandling: 'none',
			runWorkerFirst: ['/*', '!/_next/static/*', '!/*/_next/static/*']
		},
		env: {
			ASSETS: bindings.assets()
		}
	})
});
