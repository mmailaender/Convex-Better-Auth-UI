import { paraglide } from '@inlang/paraglide-sveltekit/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'fs';

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglide({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],
	server: {
        https: {
            key: fs.readFileSync(`${__dirname}/cert/key.pem`),
            cert: fs.readFileSync(`${__dirname}/cert/cert.pem`)
        },
        proxy: {}
    },
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
