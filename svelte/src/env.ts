import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_CONVEX_URL: {
		description: 'Convex deployment URL (`*.convex.cloud`)',
		public: true,
		static: true
	},
	PUBLIC_CONVEX_SITE_URL: {
		description: 'Convex HTTP actions URL (`*.convex.site`) that serves the Better Auth routes',
		public: true,
		static: true
	}
});
