import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import mkcert from 'vite-plugin-mkcert';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [sveltekit(), mkcert(), tailwindcss()],
	server: {
		fs: {
			// Allow serving files from one level up from the project root (includes node_modules)
			allow: ['..', '../../convex-auth']
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
