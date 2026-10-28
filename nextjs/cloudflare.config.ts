import { bindings, defineConfig, defineWorker } from 'cf/config';

export default defineConfig({
	worker: defineWorker({
		name: 'convex-better-auth-ui-nextjs',
		entrypoint: 'vinext/server/fetch-handler',
		compatibilityDate: '2026-10-28',
		compatibilityFlags: ['nodejs_compat'],
		workersDev: true,
		// Per-branch Preview URLs (`<branch>-convex-better-auth-ui-nextjs.<subdomain>.workers.dev`); set here
		// so a production deploy cannot switch them off
		previewUrls: true,
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
