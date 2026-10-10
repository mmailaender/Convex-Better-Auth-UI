// Publishes every registry whose package.json version is not on jsrepo.com yet,
// then tags the release commit. Run by changesets/action once the version PR is merged.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const registries = ['svelte', 'nextjs'];

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });

async function isPublished(name, version) {
	const url = `https://www.jsrepo.com/api/scopes/${name}/v/${version}/files/registry.json`;
	const res = await fetch(url);
	if (res.ok) return true;
	if (res.status === 404) return false;
	throw new Error(`Failed to check ${name}@${version} on jsrepo.com: ${res.status} ${res.statusText}`);
}

for (const dir of registries) {
	// The package name is the jsrepo registry name, e.g. @auth/svelte.
	const { name, version } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));

	if (await isPublished(name, version)) {
		console.log(`${name}@${version} is already published to jsrepo.com, skipping.`);
		continue;
	}

	console.log(`Publishing ${name}@${version} to jsrepo.com...`);
	run('pnpm', ['install', '--frozen-lockfile'], dir);
	run('pnpm', ['exec', 'jsrepo', 'publish'], dir);

	const tag = `${name}@${version}`;
	run('git', ['tag', tag]);
	run('git', ['push', 'origin', tag]);
	// changesets/action picks up this line to create the GitHub release.
	console.log(`New tag: ${tag}`);
}
