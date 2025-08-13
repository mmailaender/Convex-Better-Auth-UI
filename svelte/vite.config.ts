import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
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
