import prettier from 'eslint-config-prettier';
import convexPlugin from '@convex-dev/eslint-plugin';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
	{
		ignores: [
			'src/convex/_generated/',
			'src/convex/betterAuth/_generated',
			'.vercel',
			'.svelte-kit'
		]
	},
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...convexPlugin.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.js', '**/*.svelte.ts'],

		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		}
	},
	{
		files: ['**/*.{js,ts,svelte}'],
		rules: {
			// Allow unused variables if they are prefixed with _
			'no-unused-vars': 'off', // Turn off the base rule
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			]
		}
	}
);
