import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, type Plugin, type UserConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const projectRoot = process.cwd();
const sharedConvexRoot = path.resolve(projectRoot, '../shared/convex');
const symlinkedConvexRoot = path.resolve(projectRoot, 'src/convex');

function isBareImport(source: string): boolean {
	return !source.startsWith('.') && !source.startsWith('/') && !source.startsWith('\0');
}

type VitestConfig = UserConfig & {
	test?: {
		include?: string[];
	};
};

const resolveSharedConvexDepsPlugin: Plugin = {
	name: 'resolve-shared-convex-deps',
	enforce: 'pre',
	async resolveId(source, importer) {
		if (!importer || !isBareImport(source)) {
			return null;
		}

		const normalizedImporter = path.normalize(importer);
		if (!normalizedImporter.startsWith(sharedConvexRoot + path.sep)) {
			return null;
		}

		const remappedImporter = path.join(
			symlinkedConvexRoot,
			path.relative(sharedConvexRoot, normalizedImporter)
		);

		return this.resolve(source, remappedImporter, { skipSelf: true });
	}
};

const config: VitestConfig = {
	plugins: [
		resolveSharedConvexDepsPlugin,
		tailwindcss(),
		sveltekit({
			// Consult https://svelte.dev/docs/kit/integrations
			// for more information about preprocessors
			preprocess: vitePreprocess(),

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	],
	server: {
		fs: {
			// Allow serving files from one level up from the project root (includes node_modules)
			allow: ['..']
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
};

export default defineConfig(config);
